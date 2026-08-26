import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Standard page header: title, supporting line, and a slot for actions.
 * Every screen opens with one so headings never drift between modules.
 */
export function PageHeader({
    title,
    description,
    actions,
    icon: Icon,
    className,
}: {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
                className,
            )}
        >
            <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <Icon className="size-5" />
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="truncate text-2xl leading-8 font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
