import {
    Banknote,
    CheckCircle2,
    CreditCard,
    Landmark,
    QrCode,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { rupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentMethodOption } from '@/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    cash: Banknote,
    qris: QrCode,
    bank_transfer: Landmark,
    debit_card: CreditCard,
    credit_card: CreditCard,
};

/**
 * Charge screen.
 *
 * Cash is the only method that asks for anything: the amount tendered, so the
 * cashier can hand back change. Every other method is a *label* — Paylo does
 * not process the payment, it records how the customer paid — so the dialog
 * simply confirms the amount and closes. No QR code is generated or shown.
 */
export function PaymentDialog({
    open,
    total,
    methods,
    processing,
    onClose,
    onConfirm,
}: {
    open: boolean;
    total: number;
    methods: PaymentMethodOption[];
    processing: boolean;
    onClose: () => void;
    onConfirm: (method: string, tendered: number) => void;
}) {
    // Keyed on `open` by the caller: each time the dialog is opened it mounts
    // fresh, so the first enabled method and an empty tender are simply the
    // initial state — no reset effect needed.
    const [method, setMethod] = useState<PaymentMethodOption | null>(
        () => methods[0] ?? null,
    );
    const [tendered, setTendered] = useState<number | ''>('');

    const tenderedValue = tendered || 0;
    const needsTender = method?.requires_tender ?? false;
    const change = Math.max(0, tenderedValue - total);
    const shortfall = Math.max(0, total - tenderedValue);
    const canConfirm =
        !!method && !processing && (!needsTender || tenderedValue >= total);

    const quickAmounts = useMemo(() => suggestTender(total), [total]);

    const confirm = () => {
        if (!method || !canConfirm) {
            return;
        }

        onConfirm(method.value, needsTender ? tenderedValue : total);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => !next && !processing && onClose()}
        >
            <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="text-lg">
                        Selesaikan pembayaran
                    </DialogTitle>
                    <DialogDescription>
                        Pilih metode yang digunakan pelanggan.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 py-4">
                    {/* Amount due */}
                    <div className="rounded-lg border bg-muted/50 px-4 py-3 text-center">
                        <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                            Total tagihan
                        </p>
                        <p className="tabular mt-1 text-3xl leading-9 font-bold tracking-tight">
                            {rupiah(total)}
                        </p>
                    </div>

                    {/* Methods */}
                    <div>
                        <Label className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                            Metode pembayaran
                        </Label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            {methods.map((option) => {
                                const Icon = ICONS[option.value] ?? Wallet;
                                const active = method?.value === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setMethod(option)}
                                        aria-pressed={active}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
                                            active
                                                ? 'border-primary bg-primary-soft'
                                                : 'bg-card hover:bg-muted',
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'size-4 shrink-0',
                                                active
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground',
                                            )}
                                            aria-hidden
                                        />
                                        <span
                                            className={cn(
                                                'truncate text-sm leading-5 font-medium',
                                                active && 'text-primary',
                                            )}
                                        >
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cash: tendered + change. Non-cash: a confirmation line. */}
                    {needsTender ? (
                        <div className="flex flex-col gap-3">
                            <div>
                                <Label
                                    htmlFor="tendered"
                                    className="text-xs leading-4 font-medium text-muted-foreground"
                                >
                                    Uang diterima
                                </Label>
                                <CurrencyInput
                                    id="tendered"
                                    autoFocus
                                    value={tendered}
                                    onChange={setTendered}
                                    onKeyDown={(event) =>
                                        event.key === 'Enter' && confirm()
                                    }
                                    placeholder="0"
                                    className="tabular mt-1.5 h-12 text-lg font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTendered(total)}
                                >
                                    Pas
                                </Button>
                                {quickAmounts.map((amount) => (
                                    <Button
                                        key={amount}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="tabular"
                                        onClick={() => setTendered(amount)}
                                    >
                                        {compact(amount)}
                                    </Button>
                                ))}
                            </div>

                            <div
                                className={cn(
                                    'flex items-baseline justify-between rounded-lg border px-4 py-3',
                                    shortfall > 0
                                        ? 'border-destructive/30 bg-destructive/5'
                                        : 'border-success/30 bg-success-soft',
                                )}
                            >
                                <span className="text-sm leading-5 font-medium">
                                    {shortfall > 0 ? 'Kurang' : 'Kembalian'}
                                </span>
                                <span
                                    className={cn(
                                        'tabular text-xl leading-7 font-bold',
                                        shortfall > 0
                                            ? 'text-destructive'
                                            : 'text-success',
                                    )}
                                >
                                    {rupiah(shortfall > 0 ? shortfall : change)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        method && (
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                                <CheckCircle2
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                    aria-hidden
                                />
                                <div>
                                    <p className="text-sm leading-5 font-medium">
                                        Dibayar dengan {method.label}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                                        {method.description}. Pastikan
                                        pembayaran sudah berhasil di perangkat
                                        pembayaran, lalu simpan transaksi —
                                        Paylo hanya mencatat metodenya.
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <DialogFooter className="pwa-safe-bottom gap-2 border-t px-5 py-4 sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={confirm}
                        disabled={!canConfirm}
                        className="h-11 flex-1 sm:flex-none"
                    >
                        {processing
                            ? 'Menyimpan…'
                            : `Simpan transaksi · ${rupiah(total)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Realistic notes a customer would hand over: the next few round amounts above
 * the total, in Indonesian denominations.
 */
function suggestTender(total: number): number[] {
    const steps = [5_000, 10_000, 20_000, 50_000, 100_000];
    const suggestions = new Set<number>();

    for (const step of steps) {
        const rounded = Math.ceil(total / step) * step;

        if (rounded > total) {
            suggestions.add(rounded);
        }
    }

    return [...suggestions].sort((a, b) => a - b).slice(0, 3);
}

function compact(amount: number): string {
    return amount >= 1_000 ? `${Math.round(amount / 1_000)}rb` : String(amount);
}
