import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Empty states explain the next action — design.md §16.
 * Never render a bare "No data found".
 */
export function EmptyState({
    title,
    description,
    action,
    icon: Icon,
    compact = false,
    className,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    compact?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-lg border border-dashed text-center',
                compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12',
                className,
            )}
        >
            {Icon && (
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-5" aria-hidden />
                </span>
            )}
            <div>
                <p className="text-sm leading-5 font-semibold text-foreground">
                    {title}
                </p>
                {description && (
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
