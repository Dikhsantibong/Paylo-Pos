import { Minus, Plus, ShoppingCart, Trash2, UserRound, X } from 'lucide-react';
import { EmptyState, StatusBadge } from '@/components/paylo';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { number, percent, rupiah } from '@/lib/format';
import type { CartItem, Customer, PosConfig } from '@/types';

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
 * The order panel — always visible, total always visible (design.md §8).
 */
export function CartPanel({
    items,
    totals,
    config,
    customers,
    customerId,
    onCustomerChange,
    discount,
    onDiscountChange,
    notes,
    onNotesChange,
    onQuantityChange,
    onRemove,
    onClear,
    onCharge,
    disabled,
}: {
    items: CartItem[];
    totals: {
        subtotal: number;
        discount: number;
        tax: number;
        total: number;
        quantity: number;
    };
    config: PosConfig;
    customers: Customer[];
    customerId: number | null;
    onCustomerChange: (id: number | null) => void;
    discount: number;
    onDiscountChange: (value: number) => void;
    notes: string;
    onNotesChange: (value: string) => void;
    onQuantityChange: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
    onCharge: () => void;
    disabled: boolean;
}) {
    const isEmpty = items.length === 0;

    return (
        <aside className="flex h-full min-h-0 w-full flex-col border-l bg-card">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-5">
                <div className="flex items-center gap-2">
                    <h2 className="text-base leading-6 font-semibold">
                        Pesanan
                    </h2>
                    {!isEmpty && (
                        <StatusBadge tone="brand" dot={false}>
                            {number(totals.quantity)} item
                        </StatusBadge>
                    )}
                </div>

                {!isEmpty && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-muted-foreground"
                    >
                        <Trash2 className="size-4" aria-hidden />
                        Kosongkan
                    </Button>
                )}
            </header>

            {/* Lines */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {isEmpty ? (
                    <div className="p-5">
                        <EmptyState
                            icon={ShoppingCart}
                            title="Keranjang kosong"
                            description="Pilih produk di sebelah kiri untuk memulai transaksi."
                        />
                    </div>
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li key={item.id} className="px-4 py-3 md:px-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm leading-5 font-medium text-foreground">
                                            {item.product_name}
                                            {item.variant_name && (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    · {item.variant_name}
                                                </span>
                                            )}
                                        </p>

                                        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                                            {[
                                                item.temperature
                                                    ? TEMPERATURE_LABEL[
                                                          item.temperature
                                                      ]
                                                    : null,
                                                item.sugar_level
                                                    ? SUGAR_LABEL[
                                                          item.sugar_level
                                                      ]
                                                    : null,
                                                ...item.addons.map((addon) =>
                                                    addon.quantity > 1
                                                        ? `${addon.name} ×${addon.quantity}`
                                                        : addon.name,
                                                ),
                                            ]
                                                .filter(Boolean)
                                                .join(' · ') ||
                                                rupiah(item.unit_price) +
                                                    ' / item'}
                                        </p>

                                        {item.notes && (
                                            <p className="mt-1 text-xs leading-4 text-warning italic">
                                                “{item.notes}”
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.id)}
                                        aria-label={`Hapus ${item.product_name}`}
                                        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="size-4" aria-hidden />
                                    </button>
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="size-8"
                                            onClick={() =>
                                                onQuantityChange(
                                                    item.id,
                                                    item.quantity - 1,
                                                )
                                            }
                                            aria-label="Kurangi jumlah"
                                        >
                                            <Minus
                                                className="size-3.5"
                                                aria-hidden
                                            />
                                        </Button>
                                        <span className="tabular w-8 text-center text-sm font-semibold">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="size-8"
                                            onClick={() =>
                                                onQuantityChange(
                                                    item.id,
                                                    item.quantity + 1,
                                                )
                                            }
                                            aria-label="Tambah jumlah"
                                        >
                                            <Plus
                                                className="size-3.5"
                                                aria-hidden
                                            />
                                        </Button>
                                    </div>

                                    <span className="tabular text-sm leading-5 font-semibold">
                                        {rupiah(item.subtotal)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Order-level fields */}
            {!isEmpty &&
                (config.customer_enabled ||
                    config.discount_enabled ||
                    config.order_note_enabled) && (
                    <div className="flex flex-col gap-3 border-t px-4 py-3 md:px-5">
                        {config.customer_enabled && (
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs leading-4 font-medium text-muted-foreground">
                                    Pelanggan
                                </Label>
                                <Select
                                    value={
                                        customerId
                                            ? String(customerId)
                                            : 'walkin'
                                    }
                                    onValueChange={(value) =>
                                        onCustomerChange(
                                            value === 'walkin'
                                                ? null
                                                : Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-10 w-full">
                                        <UserRound
                                            className="size-4 text-muted-foreground"
                                            aria-hidden
                                        />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="walkin">
                                            Walk-in (tanpa pelanggan)
                                        </SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem
                                                key={customer.id}
                                                value={String(customer.id)}
                                            >
                                                {customer.name}
                                                {customer.phone
                                                    ? ` · ${customer.phone}`
                                                    : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {config.discount_enabled && (
                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="cart-discount"
                                    className="text-xs leading-4 font-medium text-muted-foreground"
                                >
                                    Diskon (Rp)
                                </Label>
                                <CurrencyInput
                                    id="cart-discount"
                                    value={discount === 0 ? '' : discount}
                                    onChange={(val) => onDiscountChange(Number(val))}
                                    placeholder="0"
                                    className="tabular h-10"
                                />
                            </div>
                        )}

                        {config.order_note_enabled && (
                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="cart-notes"
                                    className="text-xs leading-4 font-medium text-muted-foreground"
                                >
                                    Catatan pesanan
                                </Label>
                                <Textarea
                                    id="cart-notes"
                                    value={notes}
                                    onChange={(event) =>
                                        onNotesChange(event.target.value)
                                    }
                                    rows={2}
                                    placeholder="Catatan untuk transaksi ini"
                                    className="resize-none"
                                />
                            </div>
                        )}
                    </div>
                )}

            {/* Totals + charge */}
            <footer className="pwa-safe-bottom border-t px-4 py-4 md:px-5">
                <dl className="flex flex-col gap-1.5 text-sm">
                    <Row label="Subtotal" value={rupiah(totals.subtotal)} />
                    {totals.discount > 0 && (
                        <Row
                            label="Diskon"
                            value={`− ${rupiah(totals.discount)}`}
                            tone="success"
                        />
                    )}
                    {config.tax_enabled && (
                        <Row
                            label={`${config.tax_label} (${percent(config.tax_rate, 0)})`}
                            value={rupiah(totals.tax)}
                        />
                    )}
                    <div className="mt-1.5 flex items-baseline justify-between border-t pt-2.5">
                        <dt className="text-sm leading-5 font-semibold">
                            Total
                        </dt>
                        <dd className="tabular text-2xl leading-8 font-bold tracking-tight">
                            {rupiah(totals.total)}
                        </dd>
                    </div>
                </dl>

                <Button
                    type="button"
                    size="lg"
                    className="mt-4 h-12 w-full text-base"
                    disabled={isEmpty || disabled}
                    onClick={onCharge}
                >
                    Bayar {!isEmpty && `· ${rupiah(totals.total)}`}
                </Button>

                <p className="mt-2 text-center text-xs leading-4 text-muted-foreground">
                    F2 cari produk · F4 bayar · Esc tutup dialog
                </p>
            </footer>
        </aside>
    );
}

function Row({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone?: 'success';
}) {
    return (
        <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
                className={`tabular ${tone === 'success' ? 'text-success' : 'text-foreground'}`}
            >
                {value}
            </dd>
        </div>
    );
}
