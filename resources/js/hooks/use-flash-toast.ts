import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

/**
 * Surfaces the server's `flash` prop as a toast.
 *
 * Inertia re-sends shared props on every visit, so the message is keyed by its
 * content to avoid re-firing the same toast on an unrelated partial reload.
 */
export function useFlashToast(): void {
    const flash = usePage().props.flash as FlashToast | null | undefined;
    const lastShown = useRef<string | null>(null);

    useEffect(() => {
        if (!flash?.message) {
            lastShown.current = null;

            return;
        }

        const key = `${flash.type}:${flash.message}`;

        if (lastShown.current === key) {
            return;
        }

        lastShown.current = key;

        const notify = toast[flash.type] ?? toast;
        notify(flash.message);
    }, [flash]);
}
