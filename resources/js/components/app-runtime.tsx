import { Check, Copy, Download, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { usePwa } from '@/hooks/use-pwa';
import { useSessionKeepAlive } from '@/hooks/use-session-keepalive';

/**
 * Cross-cutting runtime behaviour, mounted once for the whole app:
 *
 *  - keeps a standby terminal signed in (see useSessionKeepAlive),
 *  - registers the service worker and offers the install prompt,
 *  - tells the operator when a new version is ready.
 *
 * Renders nothing until it has something to say.
 */
export function AppRuntime() {
    useSessionKeepAlive();

    const { canInstall, install, updateReady, applyUpdate } = usePwa();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!updateReady) {
            return;
        }

        toast('Versi baru Paylo tersedia', {
            description: 'Muat ulang untuk memakai versi terbaru.',
            duration: Infinity,
            action: {
                label: 'Muat ulang',
                onClick: () => void applyUpdate(),
            },
        });
    }, [updateReady, applyUpdate]);

    if (!canInstall || dismissed) {
        return null;
    }

    return (
        <div className="pwa-safe-bottom fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 print:hidden">
            <div className="flex w-full max-w-md items-center gap-3 rounded-xl border bg-card p-3 shadow-lg">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Download className="size-4" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 font-semibold text-foreground">
                        Pasang Paylo di perangkat ini
                    </p>
                    <p className="text-xs leading-4 text-muted-foreground">
                        Buka layar kasir langsung dari home screen, tanpa bar
                        browser.
                    </p>
                </div>

                <Button size="sm" onClick={() => void install()}>
                    Pasang
                </Button>

                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    aria-label="Tutup ajakan pemasangan"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" aria-hidden />
                </button>
            </div>
        </div>
    );
}

/**
 * Standalone button for the settings screen, so the app can still be installed
 * after the inline prompt has been dismissed.
 */
export function InstallAppButton() {
    const { canInstall, installed, install } = usePwa();
    const [copied, copy] = useClipboard();

    const shareUrl =
        typeof window === 'undefined'
            ? '/install'
            : `${window.location.origin}/install`;

    return (
        <div className="flex flex-col gap-4">
            {installed ? (
                <p className="text-sm text-muted-foreground">
                    Paylo sudah terpasang di perangkat ini.
                </p>
            ) : canInstall ? (
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void install()}
                    >
                        <Download className="size-4" aria-hidden />
                        Pasang di perangkat ini
                    </Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Browser ini belum menawarkan pemasangan otomatis. Di
                    Chrome/Edge gunakan menu ⋮ → “Install app”, di Safari iOS
                    gunakan Bagikan → “Add to Home Screen”.
                </p>
            )}

            {/* The shareable guide — see routes/web.php and pages/install.tsx. */}
            <div className="flex flex-col gap-2 border-t pt-4">
                <p className="text-sm leading-5 font-medium">
                    Tautan panduan pemasangan
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                    Halaman publik berisi langkah pemasangan untuk Android, iOS,
                    dan desktop. Bagikan ke staf atau calon pengguna — tidak
                    perlu login untuk membukanya.
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <code className="rounded-md border bg-muted px-2.5 py-1.5 font-mono text-xs break-all">
                        {shareUrl}
                    </code>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copy(shareUrl)}
                    >
                        {copied === shareUrl ? (
                            <>
                                <Check className="size-4" aria-hidden />
                                Disalin
                            </>
                        ) : (
                            <>
                                <Copy className="size-4" aria-hidden />
                                Salin
                            </>
                        )}
                    </Button>

                    <Button asChild variant="ghost" size="sm">
                        <a href="/install" target="_blank" rel="noopener">
                            <ExternalLink className="size-4" aria-hidden />
                            Buka
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
