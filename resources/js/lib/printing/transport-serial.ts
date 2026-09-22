/**
 * Web Serial transport — printers on a COM port.
 *
 * Covers RS-232 printers, USB printers exposed by the OS as a serial device
 * (CH340/CP210x cable), and Bluetooth Classic printers that Windows has
 * already bound to an outgoing COM port. That last case matters: on a Windows
 * terminal, pairing a Classic SPP printer creates a COM port, and this is the
 * only way a browser can reach it.
 */

import { isSecureContextAvailable, PrintError } from './types';
import type { PrinterDevice, Transport, TransportSupport } from './types';

// ── Minimal Web Serial typings (not in lib.dom) ───────

type SerialPortInfo = { usbVendorId?: number; usbProductId?: number };

type SerialPort = {
    readonly writable: WritableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
    open(options: {
        baudRate: number;
        dataBits?: number;
        stopBits?: number;
        parity?: 'none' | 'even' | 'odd';
        flowControl?: 'none' | 'hardware';
        bufferSize?: number;
    }): Promise<void>;
    close(): Promise<void>;
    addEventListener(type: string, listener: () => void): void;
};

type SerialApi = {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: {
        filters?: { usbVendorId?: number }[];
    }): Promise<SerialPort>;
};

function api(): SerialApi | null {
    return (navigator as Navigator & { serial?: SerialApi }).serial ?? null;
}

/** 9600 is the default on virtually every ESC/POS serial printer. */
const BAUD_RATE = 9600;

let port: SerialPort | null = null;
let lostHandler: (() => void) | null = null;

function describe(target: SerialPort): PrinterDevice {
    const info = target.getInfo();
    const id =
        info.usbVendorId !== undefined
            ? `serial:${info.usbVendorId}:${info.usbProductId ?? 0}`
            : 'serial:port';

    return { id, name: 'Printer serial / COM', transport: 'serial' };
}

async function open(target: SerialPort): Promise<PrinterDevice> {
    if (!target.writable) {
        await target.open({
            baudRate: BAUD_RATE,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none',
        });
    }

    target.addEventListener('disconnect', () => {
        port = null;
        lostHandler?.();
    });

    port = target;

    return describe(target);
}

export const serialTransport: Transport = {
    id: 'serial',
    label: 'Serial / COM',
    description:
        'Printer di port COM. Di Windows, printer Bluetooth Classic yang sudah dipasangkan juga muncul di sini sebagai COM keluar.',

    support(): TransportSupport {
        if (!isSecureContextAvailable()) {
            return {
                usable: false,
                reason: 'Butuh HTTPS. Web Serial dimatikan browser pada koneksi http biasa.',
            };
        }

        if (!api()) {
            return {
                usable: false,
                reason: 'Browser ini tidak punya Web Serial. Tersedia di Chrome/Edge desktop, tidak di Android.',
            };
        }

        return { usable: true, reason: null };
    },

    connected(): boolean {
        return port !== null && port.writable !== null;
    },

    device(): PrinterDevice | null {
        return port ? describe(port) : null;
    },

    async connect(): Promise<PrinterDevice> {
        const serial = api();

        if (!serial) {
            throw new PrintError(
                serialTransport.support().reason ??
                    'Web Serial tidak tersedia.',
            );
        }

        return open(await serial.requestPort());
    },

    async restore(saved: PrinterDevice | null): Promise<PrinterDevice | null> {
        const serial = api();

        if (!serial || !saved) {
            return null;
        }

        let ports: SerialPort[] = [];

        try {
            ports = await serial.getPorts();
        } catch {
            return null;
        }

        const match =
            ports.find((candidate) => describe(candidate).id === saved.id) ??
            ports[0];

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
            await port?.close();
        } catch {
            // Already gone.
        } finally {
            port = null;
        }
    },

    async write(bytes: Uint8Array): Promise<void> {
        if (!port?.writable) {
            throw new PrintError('Port printer belum terbuka.');
        }

        const writer = port.writable.getWriter();

        try {
            await writer.write(bytes);
        } finally {
            writer.releaseLock();
        }
    },

    onLost(handler: () => void): void {
        lostHandler = handler;
    },
};
