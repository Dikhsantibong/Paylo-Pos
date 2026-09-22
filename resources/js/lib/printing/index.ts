/** Public surface of the printing layer. */

export { COLUMNS, EscPos, type PaperWidth } from './escpos';
export {
    BROWSER_FALLBACK,
    configure,
    connect,
    connectToNative,
    DEFAULT_SETTINGS,
    diagnostics,
    disconnect,
    effectiveTransport,
    getState,
    nativeAvailable,
    nativeDevices,
    printReceipt,
    printTestPage,
    restore,
    subscribe,
    transportOptions,
    type Diagnostic,
    type PrinterSettings,
    type PrinterState,
    type PrinterStatus,
    type PrintOutcome,
    type TransportChoice,
} from './manager';
export { renderReceipt, renderTestPage, type RenderOptions } from './receipt';
export { bluetoothProbe, type BluetoothProbe } from './transport-bluetooth';
export { RAWBT_PLAY_URL } from './transport-rawbt';
export { PrintError, type PrinterDevice, type TransportId } from './types';
