/**
 * The printer manager — one connection per browser, shared by every screen.
 *
 * It lives at module scope on purpose: an Inertia visit remounts React
 * components, and a BLE/USB handle must survive that or the cashier would have
 * to re-pair after every navigation.
 *
 * Responsibilities:
 *  - pick a transport (explicit setting, or the best one this device supports);
 *  - remember the granted device so later loads reconnect without a prompt;
 *  - serialise writes, because a thermal printer has one buffer;
 *  - never block the sale — a print failure is reported, not thrown at the UI.
 */

import type { Receipt } from '@/types';
import type { PaperWidth } from './escpos';
import { printThroughBrowser } from './fallback-browser';
import {
    DEFAULT_RENDER_OPTIONS,
    renderReceipt,
    renderTestPage,
} from './receipt';
import type { RenderOptions } from './receipt';
import { bluetoothTransport } from './transport-bluetooth';
import { rawbtTransport } from './transport-rawbt';
import { serialTransport } from './transport-serial';
import { usbTransport } from './transport-usb';
import { PrintError } from './types';
import type {
    PrinterDevice,
    Transport,
    TransportId,
    TransportSupport,
} from './types';

export type PrinterStatus =
    | 'idle'
    | 'connecting'
    | 'ready'
    | 'printing'
    | 'error';

export type TransportChoice = 'auto' | TransportId;

/** Behaviour that comes from the server settings screen. */
export type PrinterSettings = {
    transport: TransportChoice;
    paper: PaperWidth;
    /** Print the moment a sale is saved, without the cashier asking. */
    autoPrint: boolean;
    copies: number;
    cut: boolean;
    beep: boolean;
    /** Operator's label for the printer; also used to match on reconnect. */
    name: string;
};

export const DEFAULT_SETTINGS: PrinterSettings = {
    transport: 'auto',
    paper: 58,
    autoPrint: false,
    copies: 1,
    cut: true,
    beep: false,
    name: '',
};

export type PrinterState = {
    status: PrinterStatus;
    /** The transport actually in use, once resolved. */
    transport: TransportId | null;
    device: PrinterDevice | null;
    /** Last failure, cleared on the next successful action. */
    error: string | null;
    hint: string | null;
    settings: PrinterSettings;
};

// ── Transport registry ────────────────────────────────

/**
 * Preference order for `auto`. Wired transports first (nothing to pair), then
 * BLE, then the RawBT bridge, and the OS print dialog only as a fallback.
 */
const TRANSPORTS: Transport[] = [
    usbTransport,
    serialTransport,
    bluetoothTransport,
    rawbtTransport,
];

/** The browser fallback is not a byte transport, so it is described here. */
export const BROWSER_FALLBACK = {
    id: 'browser' as const,
    label: 'Printer sistem (dialog cetak)',
    description:
        'Memakai printer yang sudah dikenal sistem operasi. Satu-satunya mode yang masih memunculkan dialog cetak — dipakai kalau tidak ada jalur langsung.',
};

export function transportOptions(): {
    id: TransportId;
    label: string;
    description: string;
    support: TransportSupport;
}[] {
    return [
        ...TRANSPORTS.map((transport) => ({
            id: transport.id,
            label: transport.label,
            description: transport.description,
            support: transport.support(),
        })),
        {
            ...BROWSER_FALLBACK,
            support: { usable: true, reason: null } as TransportSupport,
        },
    ];
}

function find(id: TransportId): Transport | null {
    return TRANSPORTS.find((transport) => transport.id === id) ?? null;
}

// ── Persisted device binding ──────────────────────────

const STORAGE_KEY = 'paylo.printer.device';

function readSaved(): PrinterDevice | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        return raw ? (JSON.parse(raw) as PrinterDevice) : null;
    } catch {
        return null;
    }
}

function writeSaved(device: PrinterDevice | null): void {
    try {
        if (device) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(device));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Private mode — the session still works, it just will not reconnect.
    }
}

// ── State ─────────────────────────────────────────────

let state: PrinterState = {
    status: 'idle',
    transport: null,
    device: null,
    error: null,
    hint: null,
    settings: DEFAULT_SETTINGS,
};

const listeners = new Set<() => void>();

function emit(patch: Partial<PrinterState>): void {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
}

function message(error: unknown): { error: string; hint: string | null } {
    if (error instanceof PrintError) {
        return { error: error.message, hint: error.hint ?? null };
    }

    if (error instanceof DOMException) {
        // `NotFoundError` is what Chrome throws when the chooser is dismissed.
        if (error.name === 'NotFoundError') {
            return {
                error: 'Tidak ada printer yang dipilih.',
                hint: 'Nyalakan printer, lalu coba lagi. Printer harus dalam mode siap (lampu tidak berkedip cepat).',
            };
        }

        if (error.name === 'SecurityError') {
            return {
                error: 'Browser menolak akses perangkat.',
                hint: 'Buka Paylo lewat HTTPS, lalu izinkan akses saat diminta.',
            };
        }

        if (error.name === 'NetworkError') {
            return {
                error: 'Koneksi ke printer terputus.',
                hint: 'Printer mungkin mati, kehabisan baterai, atau sedang dipegang aplikasi lain. Tutup aplikasi printer lain lalu hubungkan ulang.',
            };
        }

        return { error: error.message || error.name, hint: null };
    }

    return {
        error: error instanceof Error ? error.message : 'Gagal mencetak.',
        hint: null,
    };
}

// ── Public API ────────────────────────────────────────

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function getState(): PrinterState {
    return state;
}

/** Called by every screen that knows the server settings. */
export function configure(settings: Partial<PrinterSettings>): void {
    const next = { ...state.settings, ...settings };

    if (
        next.transport === state.settings.transport &&
        next.paper === state.settings.paper &&
        next.autoPrint === state.settings.autoPrint &&
        next.copies === state.settings.copies &&
        next.cut === state.settings.cut &&
        next.beep === state.settings.beep &&
        next.name === state.settings.name
    ) {
        return;
    }

    emit({ settings: next });
}

function renderOptions(label?: string): RenderOptions {
    return {
        ...DEFAULT_RENDER_OPTIONS,
        paper: state.settings.paper,
        cut: state.settings.cut,
        beep: state.settings.beep,
        label,
    };
}

/**
 * The transport to use, given the setting and what this device supports.
 * A saved device wins over the generic order so a paired printer keeps working.
 */
function resolveTransport(): Transport | 'browser' {
    if (state.settings.transport !== 'auto') {
        if (state.settings.transport === 'browser') {
            return 'browser';
        }

        return find(state.settings.transport) ?? 'browser';
    }

    const saved = readSaved();

    if (saved) {
        const preferred = find(saved.transport);

        if (preferred?.support().usable) {
            return preferred;
        }
    }

    return (
        TRANSPORTS.find((transport) => transport.support().usable) ?? 'browser'
    );
}

/** What `auto` would choose right now — shown in the settings screen. */
export function effectiveTransport(): TransportId {
    const resolved = resolveTransport();

    return resolved === 'browser' ? 'browser' : resolved.id;
}

function watchLoss(transport: Transport): void {
    transport.onLost(() => {
        emit({
            status: 'idle',
            device: null,
            error: 'Printer terputus.',
            hint: 'Paylo akan menyambung ulang otomatis saat struk berikutnya dicetak.',
        });
    });
}

/**
 * Open the device chooser. Must be called from a click — browsers reject a
 * device request that did not come from a user gesture.
 */
export async function connect(
    override?: TransportChoice,
): Promise<PrinterDevice | null> {
    const choice = override ?? state.settings.transport;
    const resolved =
        choice === 'auto'
            ? resolveTransport()
            : choice === 'browser'
              ? 'browser'
              : (find(choice) ?? 'browser');

    if (resolved === 'browser') {
        emit({
            status: 'ready',
            transport: 'browser',
            device: null,
            error: null,
            hint: null,
        });
        writeSaved(null);

        return null;
    }

    const support = resolved.support();

    if (!support.usable) {
        emit({
            status: 'error',
            transport: resolved.id,
            error: 'Transport ini tidak bisa dipakai di perangkat/browser ini.',
            hint: support.reason,
        });

        return null;
    }

    emit({
        status: 'connecting',
        transport: resolved.id,
        error: null,
        hint: null,
    });

    try {
        const device = await resolved.connect();

        watchLoss(resolved);
        writeSaved(device);
        emit({
            status: 'ready',
            transport: resolved.id,
            device,
            error: null,
            hint: null,
        });

        return device;
    } catch (error) {
        emit({ status: 'error', ...message(error) });

        return null;
    }
}

/**
 * Silent reconnect on page load. Never opens a chooser, never reports an
 * error — a printer that is simply switched off is not a problem yet.
 */
export async function restore(): Promise<void> {
    const resolved = resolveTransport();

    if (resolved === 'browser') {
        emit({ status: 'ready', transport: 'browser' });

        return;
    }

    if (!resolved.support().usable) {
        emit({ status: 'idle', transport: resolved.id });

        return;
    }

    if (resolved.connected()) {
        watchLoss(resolved);
        emit({
            status: 'ready',
            transport: resolved.id,
            device: resolved.device(),
        });

        return;
    }

    const device = await resolved.restore(readSaved());

    if (device) {
        watchLoss(resolved);
        writeSaved(device);
    }

    emit({
        status: device ? 'ready' : 'idle',
        transport: resolved.id,
        device,
    });
}

export async function disconnect(): Promise<void> {
    for (const transport of TRANSPORTS) {
        if (transport.connected()) {
            await transport.disconnect();
        }
    }

    writeSaved(null);
    emit({ status: 'idle', device: null, error: null, hint: null });
}

// ── Printing ──────────────────────────────────────────

/**
 * Prints are serialised: a thermal printer has a single buffer, and two
 * overlapping BLE writes come out as interleaved garbage.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = queue.then(job, job);

    queue = run.catch(() => undefined);

    return run;
}

async function send(bytes: Uint8Array): Promise<void> {
    const resolved = resolveTransport();

    if (resolved === 'browser') {
        throw new PrintError(
            'Mode printer sistem tidak bisa mengirim ESC/POS langsung.',
        );
    }

    const support = resolved.support();

    if (!support.usable) {
        throw new PrintError(
            'Transport printer tidak tersedia di perangkat ini.',
            support.reason ?? undefined,
        );
    }

    if (!resolved.connected()) {
        // Try the silent path first so a printer that came back on its own
        // does not force the cashier through the chooser again.
        const device = await resolved.restore(readSaved());

        if (!device) {
            throw new PrintError(
                'Printer belum terhubung.',
                'Buka Pengaturan → Struk & printer, lalu tekan "Hubungkan printer".',
            );
        }

        watchLoss(resolved);
        emit({ device, transport: resolved.id });
    }

    await resolved.write(bytes);
}

export type PrintOutcome = {
    ok: boolean;
    transport: TransportId;
    error?: string;
    hint?: string;
};

/**
 * Print a sale. Resolves with an outcome instead of throwing — the sale is
 * already saved, so a printer problem must never look like a failed checkout.
 */
export function printReceipt(receipt: Receipt): Promise<PrintOutcome> {
    return enqueue(async () => {
        const resolved = resolveTransport();
        const transport: TransportId =
            resolved === 'browser' ? 'browser' : resolved.id;

        emit({ status: 'printing', transport, error: null, hint: null });

        try {
            if (transport === 'browser') {
                await printThroughBrowser(receipt, state.settings.paper);
            } else {
                const copies = Math.max(1, Math.min(state.settings.copies, 5));

                for (let copy = 0; copy < copies; copy += 1) {
                    await send(
                        renderReceipt(
                            receipt,
                            renderOptions(
                                copy > 0 ? '-- SALINAN --' : undefined,
                            ),
                        ),
                    );
                }
            }

            emit({ status: 'ready', error: null, hint: null });

            return { ok: true, transport };
        } catch (error) {
            const reported = message(error);

            emit({ status: 'error', ...reported });

            return {
                ok: false,
                transport,
                error: reported.error,
                hint: reported.hint ?? undefined,
            };
        }
    });
}

/** Self-test from the settings screen. */
export function printTestPage(shopName: string): Promise<PrintOutcome> {
    return enqueue(async () => {
        const transport = effectiveTransport();

        emit({ status: 'printing', transport, error: null, hint: null });

        try {
            if (transport === 'browser') {
                throw new PrintError(
                    'Mode printer sistem tidak punya tes cetak.',
                    'Selesaikan satu transaksi lalu tekan "Cetak struk" untuk mengujinya.',
                );
            }

            await send(renderTestPage(shopName, renderOptions()));
            emit({ status: 'ready', error: null, hint: null });

            return { ok: true, transport };
        } catch (error) {
            const reported = message(error);

            emit({ status: 'error', ...reported });

            return {
                ok: false,
                transport,
                error: reported.error,
                hint: reported.hint ?? undefined,
            };
        }
    });
}

// ── Diagnostics ───────────────────────────────────────

export type Diagnostic = {
    label: string;
    ok: boolean;
    detail: string;
};

/**
 * Everything an operator needs to see why a printer will not connect, in the
 * order the browser checks it.
 */
export function diagnostics(): Diagnostic[] {
    const secure = window.isSecureContext;
    const bluetooth = bluetoothTransport.support();
    const usb = usbTransport.support();
    const serial = serialTransport.support();
    const rawbt = rawbtTransport.support();
    const saved = readSaved();

    return [
        {
            label: 'Koneksi aman (HTTPS)',
            ok: secure,
            detail: secure
                ? `Halaman dibuka di ${window.location.protocol}//${window.location.host} — aman.`
                : `Halaman dibuka di ${window.location.protocol}//${window.location.host}. Browser hanya mengizinkan Bluetooth/USB/Serial pada https atau localhost.`,
        },
        {
            label: 'Web Bluetooth (BLE)',
            ok: bluetooth.usable,
            detail:
                bluetooth.reason ??
                'Tersedia. Hanya menjangkau printer BLE, bukan Bluetooth Classic.',
        },
        {
            label: 'WebUSB',
            ok: usb.usable,
            detail: usb.reason ?? 'Tersedia untuk printer kabel USB.',
        },
        {
            label: 'Web Serial',
            ok: serial.usable,
            detail:
                serial.reason ??
                'Tersedia. Di Windows, printer Bluetooth Classic yang dipasangkan muncul sebagai port COM.',
        },
        {
            label: 'Jembatan RawBT',
            ok: rawbt.usable,
            detail:
                rawbt.reason ??
                'Perangkat Android terdeteksi. Pasang aplikasi RawBT agar printer Bluetooth Classic bisa dipakai.',
        },
        {
            label: 'Printer tersimpan di perangkat ini',
            ok: saved !== null,
            detail: saved
                ? `${saved.name} (${saved.transport}). Paylo menyambung ulang otomatis saat halaman dibuka.`
                : 'Belum ada. Tekan "Hubungkan printer" sekali; izin disimpan browser untuk pemakaian berikutnya.',
        },
    ];
}
