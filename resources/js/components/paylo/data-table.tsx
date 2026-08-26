import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Compact enterprise table — design.md §9.
 *
 * Sticky header, hairline rows, right-aligned numbers, and its own horizontal
 * scroll container so a wide table never scrolls the page body.
 */
export function DataTable({
    children,
    className,
    maxHeight,
}: {
    children: ReactNode;
    className?: string;
    maxHeight?: string;
}) {
    return (
        <div
            className={cn('scroll-x w-full', className)}
            style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
        >
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    );
}

export function Th({
    children,
    numeric = false,
    className,
    ...props
}: React.ComponentProps<'th'> & { numeric?: boolean }) {
    return (
        <th
            data-numeric={numeric || undefined}
            className={cn(
                'sticky top-0 z-10 border-b bg-card px-3 py-2.5 text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase',
                numeric ? 'text-right' : 'text-left',
                className,
            )}
            {...props}
        >
            {children}
        </th>
    );
}

export function Td({
    children,
    numeric = false,
    muted = false,
    className,
    ...props
}: React.ComponentProps<'td'> & { numeric?: boolean; muted?: boolean }) {
    return (
        <td
            data-numeric={numeric || undefined}
            className={cn(
                'border-b px-3 py-2.5 align-middle',
                numeric && 'text-right',
                muted && 'text-muted-foreground',
                className,
            )}
            {...props}
        >
            {children}
        </td>
    );
}

export function Tr({ className, ...props }: React.ComponentProps<'tr'>) {
    return (
        <tr
            className={cn('transition-colors hover:bg-muted/50', className)}
            {...props}
        />
    );
}
