import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
    configure,
    connect,
    connectToNative,
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
} from '@/lib/printing';
import type {
    PrinterSettings,
    PrintOutcome,
    TransportChoice,
} from '@/lib/printing';
import type { Receipt } from '@/types';

/**
 * React view of the module-level printer manager.
 *
 * The connection itself is not React state — it has to outlive the component,
 * because an Inertia visit remounts the page and a re-pair per navigation
 * would be unusable at a till. This hook only subscribes to it.
 *
 * Pass the printer settings from the server so every screen agrees on the
 * paper size and behaviour.
 */
export function usePrinter(settings?: Partial<PrinterSettings>) {
    const state = useSyncExternalStore(subscribe, getState, getState);

    // Keep the manager in step with the server settings. `configure` ignores
    // an unchanged payload, so this cannot loop.
    useEffect(() => {
        if (settings) {
            configure(settings);
        }
    }, [settings]);

    // One silent reconnect attempt per page load.
    useEffect(() => {
        void restore();
    }, []);

    return {
        state,
        /** What `auto` resolves to on this device right now. */
        resolved: effectiveTransport(),
        connect: useCallback(
            (override?: TransportChoice) => connect(override),
            [],
        ),
        disconnect: useCallback(() => disconnect(), []),
        /** Paylo is running as its own app and can open any paired printer. */
        nativeAvailable: nativeAvailable(),
        nativeDevices: useCallback(() => nativeDevices(), []),
        connectToNative: useCallback((id: string) => connectToNative(id), []),
        print: useCallback(
            (receipt: Receipt): Promise<PrintOutcome> => printReceipt(receipt),
            [],
        ),
        test: useCallback((shopName: string) => printTestPage(shopName), []),
        diagnostics: useCallback(() => diagnostics(), []),
    };
}
