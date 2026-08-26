import { useCallback, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** True when the page is running as an installed app rather than in a tab. */
function isStandalone(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        // iOS Safari reports standalone on navigator, not matchMedia.
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
            true
    );
}

/**
 * Registers the service worker and exposes the install prompt.
 *
 * Chrome fires `beforeinstallprompt` once and expects the page to stash it, so
 * the "Install" affordance can be shown at a moment that makes sense rather
 * than whenever the browser decides.
 */
export function usePwa() {
    const [installEvent, setInstallEvent] =
        useState<BeforeInstallPromptEvent | null>(null);
    // Whether the app is already running from the home screen is known before
    // the first paint, so it is read during initialisation rather than in an
    // effect — no cascading render on load.
    const [installed, setInstalled] = useState(isStandalone);
    const [updateReady, setUpdateReady] = useState(false);

    useEffect(() => {
        const onPrompt = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as BeforeInstallPromptEvent);
        };

        const onInstalled = () => {
            setInstalled(true);
            setInstallEvent(null);
        };

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
            return;
        }

        let cancelled = false;

        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                if (cancelled) {
                    return;
                }

                registration.addEventListener('updatefound', () => {
                    const worker = registration.installing;

                    if (!worker) {
                        return;
                    }

                    worker.addEventListener('statechange', () => {
                        if (
                            worker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            setUpdateReady(true);
                        }
                    });
                });
            })
            .catch(() => {
                // Registration failing must never break the app.
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const install = useCallback(async () => {
        if (!installEvent) {
            return false;
        }

        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        setInstallEvent(null);

        return choice.outcome === 'accepted';
    }, [installEvent]);

    const applyUpdate = useCallback(async () => {
        const registration = await navigator.serviceWorker?.getRegistration();
        await registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }, []);

    return {
        canInstall: installEvent !== null && !installed,
        installed,
        install,
        updateReady,
        applyUpdate,
    };
}
