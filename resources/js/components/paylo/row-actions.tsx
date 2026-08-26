import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Edit / delete controls for a table row — design.md §9 ("use row actions
 * instead of excessive buttons").
 *
 * `onDelete` is omitted for records that must not be removed, so a disabled
 * bin icon never sits there teasing the operator.
 */
export function RowActions({
    label,
    onEdit,
    onDelete,
    deleteHint,
}: {
    /** What is being acted on, e.g. the category name — used for the a11y label. */
    label: string;
    onEdit: () => void;
    onDelete?: () => void;
    /** Shown as a tooltip when deletion is blocked. */
    deleteHint?: string;
}) {
    return (
        <span className="flex justify-end gap-1">
            <Button
                size="icon"
                variant="ghost"
                onClick={onEdit}
                aria-label={`Ubah ${label}`}
            >
                <Pencil className="size-4" aria-hidden />
            </Button>

            {onDelete && (
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onDelete}
                    aria-label={`Hapus ${label}`}
                    title={deleteHint}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 className="size-4" aria-hidden />
                </Button>
            )}
        </span>
    );
}
