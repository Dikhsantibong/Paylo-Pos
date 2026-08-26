import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const tones: Record<StatusTone, string> = {
    neutral: 'bg-muted text-muted-foreground ring-border',
    brand: 'bg-primary-soft text-primary ring-brand-200 dark:ring-transparent',
    success: 'bg-success-soft text-success ring-success/20',
    warning: 'bg-warning-soft text-warning ring-warning/25',
    danger: 'bg-destructive/10 text-destructive ring-destructive/20',
};

/**
 * Status is text + shape, never colour alone — design.md §12 and §19.
 * The dot gives a second, non-colour cue for the same state.
 */
export function StatusBadge({
    children,
    tone = 'neutral',
    dot = true,
    className,
}: {
    children: ReactNode;
    tone?: StatusTone;
    dot?: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs leading-5 font-medium whitespace-nowrap ring-1 ring-inset',
                tones[tone],
                className,
            )}
        >
            {dot && (
                <span
                    className="size-1.5 rounded-full bg-current"
                    aria-hidden
                />
            )}
            {children}
        </span>
    );
}
