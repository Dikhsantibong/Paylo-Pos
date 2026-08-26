import { CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { percent, rupiah } from '@/lib/format';
import type { Receipt } from '@/types';

const TEMPERATURE_LABEL: Record<string, string> = {
    hot: 'Panas',
    iced: 'Dingin',
};
const SUGAR_LABEL: Record<string, string> = {
    normal: 'Gula normal',
    less: 'Gula sedikit',
    more: 'Gula manis',
    none: 'Tanpa gula',
};

/**
 * Post-sale confirmation and printable receipt.
 *
 * Printing uses the browser dialog — the `print:` utilities in app.css hide the
 * app shell so only this panel reaches the paper.
 */
export function ReceiptDialog({
    receipt,
    onClose,
}: {
    receipt: Receipt | null;
    onClose: () => void;
}) {
    if (!receipt) {
        return null;
    }

    const issued = new Date(receipt.created_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-sm">
                <DialogHeader className="items-center border-b bg-success-soft px-5 py-4 text-center print:hidden">
                    <span className="flex size-10 items-center justify-center rounded-full bg-success text-white">
                        <CheckCircle2 className="size-5" aria-hidden />
                    </span>
                    <DialogTitle className="text-base">
                        Transaksi tersimpan
                    </DialogTitle>
                    <DialogDescription className="tabular font-semibold text-success">
                        {receipt.number}
                    </DialogDescription>
                </DialogHeader>

                <div
                    id="paylo-receipt"
                    className="max-h-[58vh] overflow-y-auto px-5 py-4 text-sm"
                >
                    <header className="border-b border-dashed pb-3 text-center">
                        <p className="text-base leading-6 font-bold">
                            {receipt.shop.name}
                        </p>
                        {receipt.shop.tagline && (
                            <p className="text-xs text-muted-foreground">
                                {receipt.shop.tagline}
                            </p>
                        )}
                        {receipt.shop.address && (
                            <p className="text-xs text-muted-foreground">
                                {receipt.shop.address}
                            </p>
                        )}
                        {receipt.shop.phone && (
                            <p className="text-xs text-muted-foreground">
                                Telp {receipt.shop.phone}
                            </p>
                        )}

                        <p className="tabular mt-2 text-xs text-muted-foreground">
                            {receipt.number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {issued}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Kasir {receipt.cashier ?? '—'}
                            {receipt.customer ? ` · ${receipt.customer}` : ''}
                        </p>
                    </header>

                    <ul className="flex flex-col gap-2.5 border-b border-dashed py-3">
                        {receipt.items.map((item, index) => (
                            <li key={index}>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="min-w-0 flex-1">
                                        <span className="tabular font-medium">
                                            {item.quantity}×{' '}
                                        </span>
                                        {item.name}
                                        {item.variant && (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                {item.variant}
                                            </span>
                                        )}
                                    </span>
                                    <span className="tabular shrink-0 font-medium">
                                        {rupiah(item.subtotal)}
                                    </span>
                                </div>

                                {(item.temperature ||
                                    item.sugar_level ||
                                    item.addons.length > 0 ||
                                    item.notes) && (
                                    <p className="mt-0.5 pl-5 text-xs leading-4 text-muted-foreground">
                                        {[
                                            item.temperature
                                                ? TEMPERATURE_LABEL[
                                                      item.temperature
                                                  ]
                                                : null,
                                            item.sugar_level
                                                ? SUGAR_LABEL[item.sugar_level]
                                                : null,
                                            ...item.addons.map((addon) =>
                                                addon.quantity > 1
                                                    ? `${addon.name} ×${addon.quantity}`
                                                    : addon.name,
                                            ),
                                            item.notes
                                                ? `“${item.notes}”`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>

                    <dl className="flex flex-col gap-1 py-3 text-sm">
                        <Line
                            label="Subtotal"
                            value={rupiah(receipt.subtotal)}
                        />
                        {receipt.discount > 0 && (
                            <Line
                                label="Diskon"
                                value={`− ${rupiah(receipt.discount)}`}
                            />
                        )}
                        {receipt.tax_amount > 0 && (
                            <Line
                                label={`${receipt.tax_label} ${percent(receipt.tax_rate, 0)}`}
                                value={rupiah(receipt.tax_amount)}
                            />
                        )}
                        <div className="mt-1 flex items-baseline justify-between border-t border-dashed pt-2">
                            <dt className="font-semibold">Total</dt>
                            <dd className="tabular text-base font-bold">
                                {rupiah(receipt.total)}
                            </dd>
                        </div>
                        <Line
                            label={receipt.payment_method_label}
                            value={rupiah(receipt.payment_amount)}
                        />
                        {receipt.change_amount > 0 && (
                            <Line
                                label="Kembalian"
                                value={rupiah(receipt.change_amount)}
                            />
                        )}
                    </dl>

                    {receipt.notes && (
                        <p className="border-t border-dashed pt-3 text-xs text-muted-foreground italic">
                            Catatan: {receipt.notes}
                        </p>
                    )}

                    {receipt.footer && (
                        <p className="border-t border-dashed pt-3 text-center text-xs text-muted-foreground">
                            {receipt.footer}
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2 border-t px-5 py-4 sm:justify-between print:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-4" aria-hidden />
                        Cetak struk
                    </Button>
                    <Button
                        type="button"
                        onClick={onClose}
                        className="flex-1 sm:flex-none"
                    >
                        Transaksi berikutnya
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular">{value}</dd>
        </div>
    );
}
