/** Shared shapes for the printing transports. */

export type TransportId =
    | 'native'
    | 'bluetooth'
    | 'usb'
    | 'serial'
    | 'rawbt'
    | 'browser';

export type PrinterDevice = {
    /** Stable per-browser identifier, used to reconnect without a prompt. */
    id: string;
    name: string;
    transport: TransportId;
};

export type TransportSupport = {
    /** The API exists and the page may use it. */
    usable: boolean;
    /** Why not, in Indonesian, ready to show in the UI. */
    reason: string | null;
};

/**
 * One way of getting bytes to a printer.
 *
 * `connect` always needs a user gesture (the browser shows a device chooser).
 * `restore` is the silent path used on page load for a device the operator
 * already granted — it must never open a chooser.
 */
export type Transport = {
    id: TransportId;
    label: string;
    /** One line explaining what this transport is for. */
    description: string;
    support(): TransportSupport;
    /** Bytes can be written right now. */
    connected(): boolean;
    device(): PrinterDevice | null;
    connect(): Promise<PrinterDevice>;
    restore(saved: PrinterDevice | null): Promise<PrinterDevice | null>;
    disconnect(): Promise<void>;
    write(bytes: Uint8Array): Promise<void>;
    /** Called when the printer drops the link on its own. */
    onLost(handler: () => void): void;

    /**
     * Transports that can enumerate devices themselves instead of relying on
     * a browser chooser — the native shell lists the printers Android has
     * already paired. Paylo renders that list and calls `connectTo`.
     */
    list?(): Promise<PrinterDevice[]>;
    connectTo?(id: string): Promise<PrinterDevice>;
};

export class PrintError extends Error {
    constructor(
        message: string,
        readonly hint?: string,
    ) {
        super(message);
        this.name = 'PrintError';
    }
}

export function isSecureContextAvailable(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext === true;
}

/** Split a payload so a slow printer's buffer is never overrun. */
export function chunk(bytes: Uint8Array, size: number): Uint8Array[] {
    const parts: Uint8Array[] = [];

    for (let offset = 0; offset < bytes.length; offset += size) {
        parts.push(bytes.slice(offset, offset + size));
    }

    return parts;
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
