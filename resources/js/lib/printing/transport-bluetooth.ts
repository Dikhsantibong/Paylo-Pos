/**
 * Web Bluetooth (BLE / GATT) transport.
 *
 * IMPORTANT — what this can and cannot reach:
 *
 * Browsers only speak Bluetooth *Low Energy*. There is no web API for
 * Bluetooth Classic (SPP/RFCOMM), which is what the cheapest thermal printers
 * and the "printer app" on the Play Store use. So a printer that is already
 * paired in Android settings is invisible here on purpose — that pairing lives
 * with the operating system and only native apps can open an SPP socket.
 *
 * Printers that DO work here advertise a BLE serial service. The UUIDs below
 * cover the usual chipsets (Jieli, Microchip RN487x, Nordic UART, Zjiang,
 * Goojprt, Xprinter). A printer that advertises none of them cannot be driven
 * from a browser at all — use the RawBT bridge instead.
 */

import { chunk, delay, isSecureContextAvailable, PrintError } from './types';
import type { PrinterDevice, Transport, TransportSupport } from './types';

// ── Minimal Web Bluetooth typings (not in lib.dom) ────

type GattCharacteristic = {
    uuid: string;
    properties: { write: boolean; writeWithoutResponse: boolean };
    writeValue(value: Uint8Array): Promise<void>;
    writeValueWithoutResponse?: (value: Uint8Array) => Promise<void>;
};

type GattService = {
    uuid: string;
    getCharacteristics(): Promise<GattCharacteristic[]>;
};

type GattServer = {
    connected: boolean;
    connect(): Promise<GattServer>;
    disconnect(): void;
    getPrimaryServices(): Promise<GattService[]>;
};

type BleDevice = {
    id: string;
    name?: string;
    gatt?: GattServer;
    addEventListener(type: string, listener: () => void): void;
};

type BluetoothApi = {
    getAvailability?: () => Promise<boolean>;
    getDevices?: () => Promise<BleDevice[]>;
    requestDevice(options: {
        filters?: { services?: string[]; namePrefix?: string }[];
        optionalServices?: string[];
        acceptAllDevices?: boolean;
    }): Promise<BleDevice>;
};

function api(): BluetoothApi | null {
    return (
        (navigator as Navigator & { bluetooth?: BluetoothApi }).bluetooth ??
        null
    );
}

// ── Known printer services ────────────────────────────

/**
 * Declared as optional services so they can be read after the operator picks
 * a device. Anything writable is accepted in the end, so an unlisted clone
 * still works.
 */
const PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Jieli / most POS-58 clones
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip transparent UART
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Zjiang
    '0000ff00-0000-1000-8000-00805f9b34fb', // Goojprt / Xprinter
    '0000fee7-0000-1000-8000-00805f9b34fb', // Telink
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 style modules
    '00001101-0000-1000-8000-00805f9b34fb', // SPP, in case a bridge exposes it
];

const PREFERRED_CHARACTERISTICS = [
    '00002af1-0000-1000-8000-00805f9b34fb',
    '49535343-8841-43f4-a8d4-ecbe34729bb3',
    '49535343-aca3-481c-91ec-d85e28a60318',
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
    '0000ff02-0000-1000-8000-00805f9b34fb',
    '0000fec7-0000-1000-8000-00805f9b34fb',
    '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    '0000ffe1-0000-1000-8000-00805f9b34fb',
];

/**
 * BLE writes are capped by the negotiated MTU. 180 works on printers that
 * negotiated a large MTU; 20 is the guaranteed floor. A failed write retries
 * at the floor before giving up.
 */
const CHUNK_LARGE = 180;
const CHUNK_SAFE = 20;

let device: BleDevice | null = null;
let characteristic: GattCharacteristic | null = null;
let chunkSize = CHUNK_LARGE;
let lostHandler: (() => void) | null = null;

/**
 * What the last connection attempt actually found on the device. The settings
 * screen shows this, because it answers the one question that decides which
 * route a shop has to take: does this printer speak BLE at all, or is it
 * Classic-only?
 */
export type BluetoothProbe = {
    deviceName: string;
    services: string[];
    writable: number;
    characteristic: string | null;
};

let probe: BluetoothProbe | null = null;

export function bluetoothProbe(): BluetoothProbe | null {
    return probe;
}

function describe(d: BleDevice): PrinterDevice {
    return {
        id: d.id,
        name: d.name?.trim() || 'Printer Bluetooth',
        transport: 'bluetooth',
    };
}

/** Walk every service on the device and pick something writable. */
async function findWriteCharacteristic(
    server: GattServer,
    deviceName: string,
): Promise<GattCharacteristic> {
    const services = await server.getPrimaryServices();
    const writable: GattCharacteristic[] = [];

    probe = {
        deviceName,
        services: services.map((service) => service.uuid),
        writable: 0,
        characteristic: null,
    };

    for (const service of services) {
        let characteristics: GattCharacteristic[] = [];

        try {
            characteristics = await service.getCharacteristics();
        } catch {
            // A service can refuse enumeration; the next one may still work.
            continue;
        }

        for (const candidate of characteristics) {
            if (
                candidate.properties.write ||
                candidate.properties.writeWithoutResponse
            ) {
                writable.push(candidate);
            }
        }
    }

    probe.writable = writable.length;

    if (writable.length === 0) {
        throw new PrintError(
            'Printer ini tidak punya jalur tulis BLE.',
            'Berarti printernya Bluetooth Classic (SPP) saja. Browser tidak bisa membukanya sama sekali — jalankan Paylo sebagai aplikasi Android sendiri (lihat panduan di bawah), atau sambungkan printer lewat USB OTG.',
        );
    }

    const preferred = writable.find((candidate) =>
        PREFERRED_CHARACTERISTICS.includes(candidate.uuid.toLowerCase()),
    );

    const chosen = preferred ?? writable[0];

    probe.characteristic = chosen.uuid;

    return chosen;
}

async function open(target: BleDevice): Promise<PrinterDevice> {
    if (!target.gatt) {
        throw new PrintError('Perangkat ini tidak mendukung GATT.');
    }

    const server = target.gatt.connected
        ? target.gatt
        : await target.gatt.connect();

    characteristic = await findWriteCharacteristic(
        server,
        target.name?.trim() || 'Printer Bluetooth',
    );
    chunkSize = CHUNK_LARGE;

    if (device !== target) {
        target.addEventListener('gattserverdisconnected', () => {
            characteristic = null;
            lostHandler?.();
        });
    }

    device = target;

    return describe(target);
}

async function writeChunks(bytes: Uint8Array, size: number): Promise<void> {
    if (!characteristic) {
        throw new PrintError('Printer belum terhubung.');
    }

    const withoutResponse =
        characteristic.properties.writeWithoutResponse &&
        typeof characteristic.writeValueWithoutResponse === 'function';

    for (const part of chunk(bytes, size)) {
        if (withoutResponse) {
            await characteristic.writeValueWithoutResponse!(part);
            // Unacknowledged writes need pacing or the printer drops bytes.
            await delay(20);
        } else {
            await characteristic.writeValue(part);
        }
    }
}

export const bluetoothTransport: Transport = {
    id: 'bluetooth',
    label: 'Bluetooth (BLE)',
    description:
        'Langsung dari browser ke printer BLE. Tidak butuh aplikasi lain, tapi printer harus mendukung BLE — bukan Bluetooth Classic.',

    support(): TransportSupport {
        if (!isSecureContextAvailable()) {
            return {
                usable: false,
                reason: 'Butuh HTTPS. Browser mematikan Web Bluetooth pada koneksi http biasa — buka Paylo lewat https atau localhost.',
            };
        }

        if (!api()) {
            return {
                usable: false,
                reason: 'Browser ini tidak punya Web Bluetooth. Pakai Chrome atau Edge di Android/desktop — Safari dan Firefox tidak mendukungnya.',
            };
        }

        return { usable: true, reason: null };
    },

    connected(): boolean {
        return characteristic !== null && device?.gatt?.connected === true;
    },

    device(): PrinterDevice | null {
        return device ? describe(device) : null;
    },

    async connect(): Promise<PrinterDevice> {
        const bluetooth = api();

        if (!bluetooth) {
            throw new PrintError(
                bluetoothTransport.support().reason ??
                    'Bluetooth tidak tersedia.',
            );
        }

        const picked = await bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: PRINTER_SERVICES,
        });

        return open(picked);
    },

    async restore(saved: PrinterDevice | null): Promise<PrinterDevice | null> {
        const bluetooth = api();

        if (
            !bluetooth ||
            !saved ||
            typeof bluetooth.getDevices !== 'function'
        ) {
            return null;
        }

        let granted: BleDevice[] = [];

        try {
            granted = await bluetooth.getDevices();
        } catch {
            return null;
        }

        const match =
            granted.find((candidate) => candidate.id === saved.id) ??
            granted.find((candidate) => candidate.name === saved.name);

        if (!match) {
            return null;
        }

        try {
            return await open(match);
        } catch {
            // The printer is simply off or out of range — not worth surfacing
            // on a page load.
            return null;
        }
    },

    async disconnect(): Promise<void> {
        try {
            device?.gatt?.disconnect();
        } finally {
            characteristic = null;
            device = null;
        }
    },

    async write(bytes: Uint8Array): Promise<void> {
        if (!bluetoothTransport.connected()) {
            // The link may have dropped between sales; one silent retry.
            if (!device) {
                throw new PrintError('Printer belum terhubung.');
            }

            await open(device);
        }

        try {
            await writeChunks(bytes, chunkSize);
        } catch (error) {
            if (chunkSize === CHUNK_SAFE) {
                throw error;
            }

            // Large MTU rejected — fall back for the rest of the session.
            chunkSize = CHUNK_SAFE;
            await writeChunks(bytes, chunkSize);
        }
    },

    onLost(handler: () => void): void {
        lostHandler = handler;
    },
};
