import { usePage } from '@inertiajs/react';
import type { Brand } from '@/types/auth';

/**
 * Shop identity in the sidebar. Falls back to a monogram when no logo has
 * been uploaded in Settings — design.md §22.
 */
export default function AppLogo() {
    const brand = usePage().props.brand as Brand | undefined;

    const name = brand?.name || 'Paylo';
    const logo = brand?.logo;

    return (
        <>
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-card">
                {logo ? (
                    <img
                        src={logo}
                        alt={name}
                        className="size-full object-contain p-0.5"
                    />
                ) : (
                    <span className="flex size-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                        {name.slice(0, 1).toUpperCase()}
                    </span>
                )}
            </div>

            <div className="ml-2 grid min-w-0 flex-1 text-left">
                <span className="truncate text-sm leading-5 font-semibold text-foreground">
                    {name}
                </span>
                <span className="truncate text-xs leading-4 text-muted-foreground">
                    {brand?.tagline || 'Point of sale'}
                </span>
            </div>
        </>
    );
}
