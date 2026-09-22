/**
 * RawBT bridge transport — the way to reach a *Bluetooth Classic* printer
 * from a browser on Android.
 *
 * Why this exists: almost every cheap thermal printer (POS-58, RPP02N, Panda,
 * Eppos) only speaks Bluetooth Classic SPP. Android keeps that pairing to
 * itself; no web API can open an SPP socket, which is exactly why the printer
 * works from an app installed from the Play Store but not from a browser tab.
 *
 * RawBT is a free Play Store app that holds the SPP socket and accepts ESC/POS
 * through the `rawbt:` URL scheme. Paylo hands the same bytes it would have
 * written over BLE to RawBT, so the receipt still never goes through a print
 * dialog and the app never navigates to a print page — Android switches to
 * RawBT for a moment and comes straight back.
 *
 * Install: https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter
 */

import { PrintError } from './types';
import type { PrinterDevice, Transport, TransportSupport } from './types';

export const RAWBT_PACKAGE = 'ru.a402d.rawbtprinter';
export const RAWBT_PLAY_URL = `https://play.google.com/store/apps/details?id=${RAWBT_PACKAGE}`;

const DEVICE: PrinterDevice = {
    id: 'rawbt',
    name: 'RawBT (Bluetooth Classic)',
    transport: 'rawbt',
};

function isAndroid(): boolean {
    return /android/i.test(navigator.userAgent);
}

/** Base64 without spreading a huge array into `String.fromCharCode`. */
function toBase64(bytes: Uint8Array): string {
    let binary = '';

    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }

    return btoa(binary);
}

/**
 * Hands the URL to Android without replacing the current document. A
 * programmatic anchor click keeps the page intact — `location.href` on a
 * custom scheme can leave the tab on an error page when the app is missing.
 */
function handOff(url: string): void {
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

export const rawbtTransport: Transport = {
    id: 'rawbt',
    label: 'RawBT (aplikasi pihak ketiga)',
    description:
        'Jalan pintas lama: Paylo menitipkan ESC/POS ke aplikasi RawBT. Butuh aplikasi terpisah dengan lisensinya sendiri — pakai hanya kalau jalur mandiri di atas tidak memungkinkan.',

    support(): TransportSupport {
        if (!isAndroid()) {
            return {
                usable: false,
                reason: 'Jembatan RawBT hanya berjalan di Android. Di desktop pakai USB atau Serial/COM.',
            };
        }

        return { usable: true, reason: null };
    },

    // There is no handshake to make — if RawBT is installed, it is ready. The
    // operator confirms with a test print.
    connected(): boolean {
        return isAndroid();
    },

    device(): PrinterDevice | null {
        return isAndroid() ? DEVICE : null;
    },

    async connect(): Promise<PrinterDevice> {
        if (!isAndroid()) {
            throw new PrintError(
                rawbtTransport.support().reason ?? 'RawBT tidak tersedia.',
            );
        }

        return DEVICE;
    },

    async restore(): Promise<PrinterDevice | null> {
        return isAndroid() ? DEVICE : null;
    },

    async disconnect(): Promise<void> {
        // Nothing is held open.
    },

    async write(bytes: Uint8Array): Promise<void> {
        if (!isAndroid()) {
            throw new PrintError(
                'Jembatan RawBT hanya berjalan di Android.',
                'Pilih transport USB atau Serial/COM di pengaturan printer.',
            );
        }

        handOff(`rawbt:base64,${toBase64(bytes)}`);
    },

    onLost(): void {
        // No link to lose.
    },
};
