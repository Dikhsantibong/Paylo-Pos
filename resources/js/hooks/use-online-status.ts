import { useEffect, useState } from 'react';

/**
 * Whether the browser currently has a network connection.
 *
 * On a POS terminal this is operational information, not a nicety: the cashier
 * needs to know before they try to charge a customer.
 */
export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine,
    );

    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return online;
}
