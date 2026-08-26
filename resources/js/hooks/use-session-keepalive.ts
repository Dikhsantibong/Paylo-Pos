import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import type { SessionInfo } from '@/types/auth';

/** How often the terminal pings the server, in milliseconds. */
const DEFAULT_INTERVAL = 5 * 60 * 1000;

/**
 * Keeps a standby cashier terminal signed in.
 *
 * A POS is left open for a whole shift. Without this, a session configured with
 * an idle limit would silently expire and the next checkout would bounce to the
 * login screen mid-order. The ping touches the session, refreshes the CSRF
 * token in the DOM, and does nothing at all while the tab is hidden or the
 * device is offline — so it never wakes a sleeping laptop for no reason.
 *
 * The owner controls the idle limit in Settings; 0 means "never expire".
 */
export function useSessionKeepAlive(): void {
    const session = usePage().props.session as SessionInfo | undefined;
    const enabled = session?.keepAlive ?? true;
    const lifetimeMinutes = session?.lifetimeMinutes ?? 0;

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Ping at a third of the idle window so a missed beat is not fatal,
        // clamped to a sane range.
        const interval =
            lifetimeMinutes > 0
                ? Math.min(
                      Math.max((lifetimeMinutes / 3) * 60 * 1000, 60_000),
                      15 * 60 * 1000,
                  )
                : DEFAULT_INTERVAL;

        let timer: number | undefined;

        const ping = async () => {
            if (document.visibilityState !== 'visible' || !navigator.onLine) {
                return;
            }

            try {
                const response = await fetch('/session/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': readCsrfToken() ?? '',
                    },
                    credentials: 'same-origin',
                    body: '{}',
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as {
                    csrf_token?: string;
                };

                if (payload.csrf_token) {
                    writeCsrfToken(payload.csrf_token);
                }
            } catch {
                // A failed heartbeat is not worth surfacing — the next beat retries.
            }
        };

        const start = () => {
            window.clearInterval(timer);
            timer = window.setInterval(ping, interval);
        };

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void ping();
            }
        };

        start();
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('online', onVisible);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('online', onVisible);
        };
    }, [enabled, lifetimeMinutes]);
}

function readCsrfToken(): string | null {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? null
    );
}

function writeCsrfToken(token: string): void {
    const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    if (meta) {
        meta.content = token;
    }
}
