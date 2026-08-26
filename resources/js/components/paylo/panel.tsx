import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The surface every dashboard/report block sits on — design.md §13.
 * White, hairline border, 12px radius, minimal shadow.
 */
export function Panel({
    title,
    description,
    actions,
    footer,
    children,
    className,
    bodyClassName,
    padded = true,
}: {
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
    padded?: boolean;
}) {
    return (
        <section
            className={cn(
                'flex flex-col rounded-xl border bg-card shadow-xs',
                className,
            )}
        >
            {(title || actions) && (
                <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="truncate text-base leading-6 font-semibold text-foreground">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex shrink-0 items-center gap-2">
                            {actions}
                        </div>
                    )}
                </header>
            )}

            <div className={cn('flex-1', padded && 'p-5', bodyClassName)}>
                {children}
            </div>

            {footer && (
                <footer className="border-t px-5 py-3 text-xs text-muted-foreground">
                    {footer}
                </footer>
            )}
        </section>
    );
}
