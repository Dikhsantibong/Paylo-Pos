import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Labelled form control — design.md §11.
 *
 * Label above the field, helper text below, and the error replacing the helper
 * so the two never fight for the same line.
 */
export function Field({
    label,
    help,
    error,
    htmlFor,
    children,
    className,
}: {
    label: string;
    help?: ReactNode;
    error?: string;
    htmlFor?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <Label htmlFor={htmlFor} className="text-sm leading-5 font-medium">
                {label}
            </Label>

            {children}

            {error ? (
                <p className="text-xs leading-4 text-destructive">{error}</p>
            ) : help ? (
                <p className="text-xs leading-5 text-muted-foreground">
                    {help}
                </p>
            ) : null}
        </div>
    );
}

/**
 * A switch with its explanation, laid out as one row.
 *
 * Used for every on/off setting so toggles read identically everywhere.
 */
export function SwitchRow({
    label,
    help,
    checked,
    onChange,
    disabled,
    className,
}: {
    label: string;
    help?: ReactNode;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-6 py-3.5',
                className,
            )}
        >
            <div className="min-w-0">
                <p className="text-sm leading-5 font-medium">{label}</p>
                {help && (
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {help}
                    </p>
                )}
            </div>

            <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                aria-label={label}
                className="mt-0.5 shrink-0"
            />
        </div>
    );
}
