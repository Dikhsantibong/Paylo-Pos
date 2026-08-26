import { Minus, Plus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { rupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    CartItemAddon,
    PosConfig,
    Product,
    ProductAddon,
    ProductVariant,
    SugarLevel,
    Temperature,
} from '@/types';
import type { CartDraft } from './use-cart';

const TEMPERATURES: { value: Temperature; label: string }[] = [
    { value: 'hot', label: 'Panas' },
    { value: 'iced', label: 'Dingin' },
];

const SUGAR_LEVELS: { value: SugarLevel; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'less', label: 'Sedikit' },
    { value: 'more', label: 'Manis' },
    { value: 'none', label: 'Tanpa gula' },
];

/**
 * Configures one line before it enters the cart: size, temperature, sweetness,
 * add-ons and a note.
 *
 * The add-on block disappears entirely when the owner switches add-ons off in
 * Settings — there is no disabled-but-visible state to distract the cashier.
 */
export function ItemOptionsDialog({
    product,
    addons,
    config,
    onClose,
    onConfirm,
}: {
    product: Product | null;
    addons: ProductAddon[];
    config: PosConfig;
    onClose: () => void;
    onConfirm: (draft: CartDraft) => void;
}) {
    if (!product) {
        return null;
    }

    // Keyed on the product by the caller, so every open mounts a fresh form
    // and the defaults below are simply the initial state.
    return (
        <ItemOptionsForm
            product={product}
            addons={addons}
            config={config}
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}

function ItemOptionsForm({
    product,
    addons,
    config,
    onClose,
    onConfirm,
}: {
    product: Product;
    addons: ProductAddon[];
    config: PosConfig;
    onClose: () => void;
    onConfirm: (draft: CartDraft) => void;
}) {
    const variants = useMemo<ProductVariant[]>(
        () => product.active_variants ?? product.variants ?? [],
        [product],
    );

    // Medium is the usual default when a product has sizes.
    const [variant, setVariant] = useState<ProductVariant | null>(
        () => variants[Math.min(1, variants.length - 1)] ?? null,
    );
    const [temperature, setTemperature] = useState<Temperature | null>(
        product.has_temperature ? 'iced' : null,
    );
    const [sugarLevel, setSugarLevel] = useState<SugarLevel | null>(
        product.has_sugar_level ? 'normal' : null,
    );
    const [selectedAddons, setSelectedAddons] = useState<
        Record<number, number>
    >({});
    const [notes, setNotes] = useState('');
    const [quantity, setQuantity] = useState(1);

    const addonLines = useMemo<CartItemAddon[]>(
        () =>
            Object.entries(selectedAddons)
                .filter(([, qty]) => qty > 0)
                .map(([id, qty]) => {
                    const addon = addons.find((a) => a.id === Number(id))!;

                    return {
                        product_addon_id: addon.id,
                        name: addon.name,
                        price: addon.price,
                        quantity: qty,
                    };
                }),
        [selectedAddons, addons],
    );

    const addonTotal = addonLines.reduce(
        (sum, addon) => sum + addon.price * addon.quantity,
        0,
    );
    const unitPrice =
        product.base_price + (variant?.price_adjustment ?? 0) + addonTotal;
    const lineTotal = unitPrice * quantity;

    const toggleAddon = (addon: ProductAddon, delta: number) => {
        setSelectedAddons((current) => {
            const next = Math.max(0, (current[addon.id] ?? 0) + delta);
            const updated = { ...current };

            if (next === 0) {
                delete updated[addon.id];
            } else {
                updated[addon.id] = next;
            }

            return updated;
        });
    };

    const confirm = () => {
        onConfirm({
            product,
            variant,
            quantity,
            temperature,
            sugarLevel,
            notes: notes.trim(),
            addons: addonLines,
        });
        onClose();
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle className="text-lg">
                        {product.name}
                    </DialogTitle>
                    <DialogDescription>
                        {product.category?.name
                            ? `${product.category.name} · `
                            : ''}
                        Harga dasar {rupiah(product.base_price)}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex max-h-[52vh] flex-col gap-5 overflow-y-auto px-5 py-4">
                    {variants.length > 0 && (
                        <OptionGroup label="Ukuran">
                            {variants.map((option) => (
                                <OptionChip
                                    key={option.id}
                                    active={variant?.id === option.id}
                                    onClick={() => setVariant(option)}
                                    label={option.name}
                                    hint={
                                        option.price_adjustment === 0
                                            ? undefined
                                            : `${option.price_adjustment > 0 ? '+' : '−'}${rupiah(Math.abs(option.price_adjustment))}`
                                    }
                                />
                            ))}
                        </OptionGroup>
                    )}

                    {product.has_temperature && (
                        <OptionGroup label="Suhu">
                            {TEMPERATURES.map((option) => (
                                <OptionChip
                                    key={option.value}
                                    active={temperature === option.value}
                                    onClick={() => setTemperature(option.value)}
                                    label={option.label}
                                />
                            ))}
                        </OptionGroup>
                    )}

                    {product.has_sugar_level && (
                        <OptionGroup label="Tingkat gula">
                            {SUGAR_LEVELS.map((option) => (
                                <OptionChip
                                    key={option.value}
                                    active={sugarLevel === option.value}
                                    onClick={() => setSugarLevel(option.value)}
                                    label={option.label}
                                />
                            ))}
                        </OptionGroup>
                    )}

                    {config.addon_enabled && addons.length > 0 && (
                        <div>
                            <Label className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                                Add-on
                            </Label>
                            <ul className="mt-2 flex flex-col divide-y rounded-lg border">
                                {addons.map((addon) => {
                                    const qty = selectedAddons[addon.id] ?? 0;

                                    return (
                                        <li
                                            key={addon.id}
                                            className="flex items-center justify-between gap-3 px-3 py-2.5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm leading-5 font-medium">
                                                    {addon.name}
                                                </p>
                                                <p className="tabular text-xs leading-4 text-muted-foreground">
                                                    +{rupiah(addon.price)}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    disabled={qty === 0}
                                                    onClick={() =>
                                                        toggleAddon(addon, -1)
                                                    }
                                                    aria-label={`Kurangi ${addon.name}`}
                                                >
                                                    <Minus
                                                        className="size-3.5"
                                                        aria-hidden
                                                    />
                                                </Button>
                                                <span className="tabular w-6 text-center text-sm font-medium">
                                                    {qty}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        toggleAddon(addon, 1)
                                                    }
                                                    aria-label={`Tambah ${addon.name}`}
                                                >
                                                    <Plus
                                                        className="size-3.5"
                                                        aria-hidden
                                                    />
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    <div>
                        <Label
                            htmlFor="item-notes"
                            className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Catatan item
                        </Label>
                        <Textarea
                            id="item-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Contoh: tanpa es, gelas terpisah"
                            rows={2}
                            className="mt-2 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-10"
                            disabled={quantity <= 1}
                            onClick={() =>
                                setQuantity((q) => Math.max(1, q - 1))
                            }
                            aria-label="Kurangi jumlah"
                        >
                            <Minus className="size-4" aria-hidden />
                        </Button>
                        <span className="tabular w-10 text-center text-lg font-semibold">
                            {quantity}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-10"
                            onClick={() =>
                                setQuantity((q) => Math.min(999, q + 1))
                            }
                            aria-label="Tambah jumlah"
                        >
                            <Plus className="size-4" aria-hidden />
                        </Button>
                    </div>

                    <Button
                        type="button"
                        onClick={confirm}
                        className="h-10 w-full sm:w-auto"
                    >
                        Tambah ke keranjang · {rupiah(lineTotal)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OptionGroup({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <Label className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">{children}</div>
        </div>
    );
}

function OptionChip({
    active,
    onClick,
    label,
    hint,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    hint?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-sm leading-5 font-medium transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted',
            )}
        >
            {label}
            {hint && (
                <span
                    className={cn(
                        'tabular text-xs',
                        active
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground',
                    )}
                >
                    {hint}
                </span>
            )}
        </button>
    );
}
