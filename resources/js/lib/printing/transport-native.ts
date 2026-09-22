/**
 * Native shell transport — Paylo's own Android app talking to the printer.
 *
 * This is the only way to reach a *Bluetooth Classic* (SPP) printer without a
 * third-party helper app, because no browser API can open an SPP socket. When
 * Paylo is wrapped as its own APK (Capacitor), the shell injects the bridge
 * described below and this transport uses it: the printers Android has already
 * paired show up in a list, Paylo connects to one directly, and ESC/POS bytes
 * go straight down the socket.
 *
 * The bridge contract Paylo expects — see docs/PRINTER.md for the shell side:
 *
 *   window.PayloPrinter = {
 *     list():        Promise<{id, name}[] | {devices: {id, name}[]}>
 *     connect({id}): Promise<{id, name} | void>
 *     write({data}): Promise<void>     // data = base64 ESC/POS
 *     disconnect():  Promise<void>
 *     isConnected(): Promise<boolean | {connected: boolean}>
 *   }
 *
 * Capacitor's own `window.Capacitor.Plugins.PayloPrinter` is checked too, so a
 * registered plugin works with no extra glue. Return shapes are normalised
 * both ways, because Capacitor plugins wrap scalars in an object.
 */

import { PrintError } from './types';
import type { PrinterDevice, Transport, TransportSupport } from './types';

type BridgeDevice = { id?: string; address?: string; name?: string };

type Bridge = {
    list(): Promise<BridgeDevice[] | { devices?: BridgeDevice[] }>;
    connect(options: {
        id: string;
    }): Promise<BridgeDevice | { device?: BridgeDevice } | void>;
    write(options: { data: string }): Promise<void>;
    disconnect(): Promise<void>;
    isConnected?: () => Promise<boolean | { connected?: boolean }>;
};

type CapacitorGlobal = { Plugins?: Record<string, unknown> };

function bridge(): Bridge | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const direct = (window as Window & { PayloPrinter?: Bridge }).PayloPrinter;

    if (direct && typeof direct.write === 'function') {
        return direct;
    }

    const plugin = (window as Window & { Capacitor?: CapacitorGlobal })
        .Capacitor?.Plugins?.PayloPrinter as Bridge | undefined;

    return plugin && typeof plugin.write === 'function' ? plugin : null;
}

/** The shell may return an address instead of an id; either identifies it. */
function normalise(device: BridgeDevice): PrinterDevice {
    const id = device.id ?? device.address ?? '';

    return {
        id,
        name: device.name?.trim() || id || 'Printer terpasang',
        transport: 'native',
    };
}

function base64(bytes: Uint8Array): string {
    let binary = '';

    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    return btoa(binary);
}

let device: PrinterDevice | null = null;
let lostHandler: (() => void) | null = null;

export const nativeTransport: Transport = {
    id: 'native',
    label: 'Printer terpasang (aplikasi Paylo)',
    description:
        'Paylo menghubungi printer Bluetooth yang sudah dipasangkan di perangkat, tanpa aplikasi pihak ketiga. Aktif hanya kalau Paylo dijalankan sebagai aplikasi Android sendiri.',

    support(): TransportSupport {
        if (bridge()) {
            return { usable: true, reason: null };
        }

        return {
            usable: false,
            reason: 'Paylo sedang berjalan di browser, bukan sebagai aplikasi Android sendiri. Browser tidak punya izin membuka Bluetooth Classic — lihat panduan di bawah untuk membangun APK Paylo.',
        };
    },

    connected(): boolean {
        return bridge() !== null && device !== null;
    },

    device(): PrinterDevice | null {
        return device;
    },

    /** No chooser to open — the picker is Paylo's own list in the settings. */
    async connect(): Promise<PrinterDevice> {
        const devices = await nativeTransport.list!();

        if (devices.length === 0) {
            throw new PrintError(
                'Tidak ada printer yang dipasangkan di perangkat ini.',
                'Pasangkan printer dulu di Pengaturan Android → Bluetooth, lalu buka halaman ini kembali.',
            );
        }

        if (devices.length > 1) {
            throw new PrintError(
                'Ada lebih dari satu printer terpasang.',
                'Pilih salah satu pada daftar "Printer terpasang di perangkat" di atas.',
            );
        }

        return nativeTransport.connectTo!(devices[0].id);
    },

    async list(): Promise<PrinterDevice[]> {
        const api = bridge();

        if (!api) {
            return [];
        }

        const result = await api.list();
        const raw = Array.isArray(result) ? result : (result.devices ?? []);

        return raw.map(normalise).filter((candidate) => candidate.id !== '');
    },

    async connectTo(id: string): Promise<PrinterDevice> {
        const api = bridge();

        if (!api) {
            throw new PrintError(
                nativeTransport.support().reason ??
                    'Jembatan native tidak ada.',
            );
        }

        const result = await api.connect({ id });
        const returned =
            result && typeof result === 'object'
                ? ((result as { device?: BridgeDevice }).device ??
                  (result as BridgeDevice))
                : null;

        // A shell that returns nothing still connected; fall back to the id.
        device =
            returned?.name || returned?.id || returned?.address
                ? normalise(returned as BridgeDevice)
                : { id, name: id, transport: 'native' };

        return device;
    },

    async restore(saved: PrinterDevice | null): Promise<PrinterDevice | null> {
        const api = bridge();

        if (!api || !saved || saved.transport !== 'native') {
            return null;
        }

        // The socket may still be open from before the page reloaded.
        if (api.isConnected) {
            try {
                const state = await api.isConnected();
                const connected =
                    typeof state === 'boolean'
                        ? state
                        : (state?.connected ?? false);

                if (connected) {
                    device = saved;

                    return saved;
                }
            } catch {
                // Fall through to a fresh connect.
            }
        }

        try {
            return await nativeTransport.connectTo!(saved.id);
        } catch {
            // Printer switched off — not worth reporting on a page load.
            return null;
        }
    },

    async disconnect(): Promise<void> {
        const api = bridge();

        try {
            await api?.disconnect();
        } catch {
            // Already gone.
        } finally {
            device = null;
        }
    },

    async write(bytes: Uint8Array): Promise<void> {
        const api = bridge();

        if (!api) {
            throw new PrintError(
                nativeTransport.support().reason ??
                    'Jembatan native tidak ada.',
            );
        }

        if (!device) {
            throw new PrintError(
                'Printer belum dipilih.',
                'Pilih printer pada daftar "Printer terpasang di perangkat".',
            );
        }

        try {
            await api.write({ data: base64(bytes) });
        } catch (error) {
            device = null;
            lostHandler?.();

            throw error;
        }
    },

    onLost(handler: () => void): void {
        lostHandler = handler;
    },
};
