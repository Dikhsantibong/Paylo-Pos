/**
 * WebUSB transport — a thermal printer plugged in by cable.
 *
 * USB printers expose interface class 0x07 (printer) with a bulk OUT endpoint.
 * Writing raw ESC/POS to that endpoint is exactly what a driver would do, so
 * no OS driver needs to be installed on the terminal.
 *
 * On Windows the printer must NOT be claimed by the system spooler, or
 * `claimInterface` fails with "Access denied" — Zadig/WinUSB is the usual fix.
 * That is noted in the settings screen rather than hidden here.
 */

import { isSecureContextAvailable, PrintError } from './types';
import type { PrinterDevice, Transport, TransportSupport } from './types';

// ── Minimal WebUSB typings (not in lib.dom) ───────────

type UsbEndpoint = {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous';
};

type UsbAlternate = {
    alternateSetting: number;
    interfaceClass: number;
    endpoints: UsbEndpoint[];
};

type UsbInterface = {
    interfaceNumber: number;
    claimed: boolean;
    alternate: UsbAlternate;
    alternates: UsbAlternate[];
};

type UsbConfiguration = { interfaces: UsbInterface[] };

type UsbDevice = {
    serialNumber?: string;
    productName?: string;
    manufacturerName?: string;
    vendorId: number;
    productId: number;
    opened: boolean;
    configuration: UsbConfiguration | null;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(value: number): Promise<void>;
    claimInterface(value: number): Promise<void>;
    releaseInterface(value: number): Promise<void>;
    transferOut(
        endpointNumber: number,
        data: Uint8Array,
    ): Promise<{ status: string; bytesWritten: number }>;
};

type UsbApi = {
    getDevices(): Promise<UsbDevice[]>;
    requestDevice(options: {
        filters: { vendorId?: number; classCode?: number }[];
    }): Promise<UsbDevice>;
};

function api(): UsbApi | null {
    return (navigator as Navigator & { usb?: UsbApi }).usb ?? null;
}

const PRINTER_CLASS = 0x07;

let device: UsbDevice | null = null;
let interfaceNumber: number | null = null;
let endpointNumber: number | null = null;
let lostHandler: (() => void) | null = null;

function describe(d: UsbDevice): PrinterDevice {
    const label =
        d.productName?.trim() ||
        [d.manufacturerName, 'Printer USB'].filter(Boolean).join(' ');

    return {
        // Vendor/product plus serial is the closest thing USB gives us to a
        // stable id across reloads.
        id: `${d.vendorId}:${d.productId}:${d.serialNumber ?? ''}`,
        name: label,
        transport: 'usb',
    };
}

/** First bulk OUT endpoint on a printer-class interface. */
function findEndpoint(
    d: UsbDevice,
): { interfaceNumber: number; endpointNumber: number } | null {
    const interfaces = d.configuration?.interfaces ?? [];
    const ranked = [
        ...interfaces.filter(
            (candidate) => candidate.alternate.interfaceClass === PRINTER_CLASS,
        ),
        ...interfaces,
    ];

    for (const candidate of ranked) {
        for (const endpoint of candidate.alternate.endpoints) {
            if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
                return {
                    interfaceNumber: candidate.interfaceNumber,
                    endpointNumber: endpoint.endpointNumber,
                };
            }
        }
    }

    return null;
}

async function open(target: UsbDevice): Promise<PrinterDevice> {
    if (!target.opened) {
        await target.open();
    }

    if (!target.configuration) {
        await target.selectConfiguration(1);
    }

    const found = findEndpoint(target);

    if (!found) {
        throw new PrintError(
            'Perangkat USB ini tidak punya endpoint printer.',
            'Pastikan yang dipilih adalah printer struk, bukan hub atau adaptor.',
        );
    }

    await target.claimInterface(found.interfaceNumber);

    device = target;
    interfaceNumber = found.interfaceNumber;
    endpointNumber = found.endpointNumber;

    return describe(target);
}

export const usbTransport: Transport = {
    id: 'usb',
    label: 'USB',
    description:
        'Printer struk yang tersambung kabel ke terminal kasir. Paling stabil, tidak perlu pairing.',

    support(): TransportSupport {
        if (!isSecureContextAvailable()) {
            return {
                usable: false,
                reason: 'Butuh HTTPS. WebUSB dimatikan browser pada koneksi http biasa.',
            };
        }

        if (!api()) {
            return {
                usable: false,
                reason: 'Browser ini tidak punya WebUSB. Pakai Chrome atau Edge.',
            };
        }

        return { usable: true, reason: null };
    },

    connected(): boolean {
        return device !== null && device.opened && endpointNumber !== null;
    },

    device(): PrinterDevice | null {
        return device ? describe(device) : null;
    },

    async connect(): Promise<PrinterDevice> {
        const usb = api();

        if (!usb) {
            throw new PrintError(
                usbTransport.support().reason ?? 'WebUSB tidak tersedia.',
            );
        }

        // Printer class first; an empty filter list would be rejected, and
        // plain `{}` lets a non-standard clone through too.
        const picked = await usb.requestDevice({
            filters: [{ classCode: PRINTER_CLASS }, {}],
        });

        return open(picked);
    },

    async restore(saved: PrinterDevice | null): Promise<PrinterDevice | null> {
        const usb = api();

        if (!usb || !saved) {
            return null;
        }

        let granted: UsbDevice[] = [];

        try {
            granted = await usb.getDevices();
        } catch {
            return null;
        }

        const match = granted.find(
            (candidate) => describe(candidate).id === saved.id,
        );

        if (!match) {
            return null;
        }

        try {
            return await open(match);
        } catch {
            return null;
        }
    },

    async disconnect(): Promise<void> {
        try {
            if (device && interfaceNumber !== null) {
                await device.releaseInterface(interfaceNumber);
            }

            await device?.close();
        } catch {
            // The cable may already be out; nothing left to release.
        } finally {
            device = null;
            interfaceNumber = null;
            endpointNumber = null;
        }
    },

    async write(bytes: Uint8Array): Promise<void> {
        if (!device || endpointNumber === null) {
            throw new PrintError('Printer USB belum terhubung.');
        }

        const result = await device.transferOut(endpointNumber, bytes);

        if (result.status !== 'ok') {
            lostHandler?.();

            throw new PrintError(
                `Pengiriman ke printer gagal (${result.status}).`,
            );
        }
    },

    onLost(handler: () => void): void {
        lostHandler = handler;
    },
};
