import { cn } from '@/lib/utils';

/**
 * A single horizontal bar for ranked lists (top products, category mix).
 *
 * Cheaper and more legible than a chart when the label and value matter more
 * than the shape — design.md §14.
 */
export function MetricBar({
    label,
    value,
    caption,
    ratio,
    tone = 'brand',
    rank,
    className,
}: {
    label: string;
    value: string;
    caption?: string;
    /** 0–1 share of the widest row. */
    ratio: number;
    tone?: 'brand' | 'success' | 'warning' | 'danger';
    rank?: number;
    className?: string;
}) {
    const tones = {
        brand: 'bg-brand-600',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-destructive',
    } as const;

    const width = `${Math.max(2, Math.min(100, ratio * 100))}%`;

    return (
        <div className={cn('group', className)}>
            <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                    {rank !== undefined && (
                        <span className="tabular w-4 shrink-0 text-xs font-semibold text-muted-foreground">
                            {rank}
                        </span>
                    )}
                    <span className="truncate text-sm leading-5 font-medium text-foreground">
                        {label}
                    </span>
                </span>
                <span className="tabular shrink-0 text-sm leading-5 font-semibold text-foreground">
                    {value}
                </span>
            </div>

            <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn('h-full rounded-full', tones[tone])}
                        style={{ width }}
                    />
                </div>
                {caption && (
                    <span className="tabular shrink-0 text-xs leading-4 text-muted-foreground">
                        {caption}
                    </span>
                )}
            </div>
        </div>
    );
}
