import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { signedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export type TrendDirection = 'up' | 'down' | 'flat';

/**
 * Percentage change against the previous period.
 *
 * `invert` flips the colour logic for metrics where up is bad (cost, waste).
 */
export function TrendPill({
    value,
    label = 'vs kemarin',
    invert = false,
    className,
}: {
    value: number;
    label?: string;
    invert?: boolean;
    className?: string;
}) {
    const direction: TrendDirection =
        value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    const good = invert ? direction === 'down' : direction === 'up';

    const Icon =
        direction === 'up'
            ? ArrowUpRight
            : direction === 'down'
              ? ArrowDownRight
              : Minus;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 text-xs leading-5 font-medium',
                direction === 'flat'
                    ? 'text-muted-foreground'
                    : good
                      ? 'text-success'
                      : 'text-destructive',
                className,
            )}
        >
            <Icon className="size-3.5" aria-hidden />
            <span className="tabular">
                {direction === 'flat' ? 'Tidak berubah' : signedPercent(value)}
            </span>
            <span className="font-normal text-muted-foreground">{label}</span>
        </span>
    );
}

/**
 * A KPI card — design.md §7. One number, one label, one comparison.
 * Deliberately never contains a chart.
 */
export function KpiCard({
    label,
    value,
    trend,
    trendLabel,
    invertTrend,
    hint,
    icon: Icon,
    accent = 'neutral',
    className,
}: {
    label: string;
    value: ReactNode;
    trend?: number;
    trendLabel?: string;
    invertTrend?: boolean;
    hint?: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    accent?: 'neutral' | 'brand' | 'success' | 'warning';
    className?: string;
}) {
    const accents = {
        neutral: 'bg-muted text-muted-foreground',
        brand: 'bg-primary-soft text-primary',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
    } as const;

    return (
        <div
            className={cn(
                'flex flex-col justify-between gap-3 rounded-xl border bg-card p-5 shadow-xs',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                {Icon && (
                    <span
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg',
                            accents[accent],
                        )}
                    >
                        <Icon className="size-4" aria-hidden />
                    </span>
                )}
            </div>

            <div>
                <p className="tabular text-2xl leading-8 font-bold tracking-tight text-foreground">
                    {value}
                </p>

                {trend !== undefined ? (
                    <TrendPill
                        value={trend}
                        label={trendLabel}
                        invert={invertTrend}
                        className="mt-1"
                    />
                ) : hint ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {hint}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
