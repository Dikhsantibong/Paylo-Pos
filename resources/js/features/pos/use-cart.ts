import { useCallback, useMemo, useState } from 'react';
import type {
    CartItem,
    CartItemAddon,
    PosConfig,
    Product,
    ProductVariant,
    SugarLevel,
    Temperature,
} from '@/types';

export type CartDraft = {
    product: Product;
    variant: ProductVariant | null;
    quantity: number;
    temperature: Temperature | null;
    sugarLevel: SugarLevel | null;
    notes: string;
    addons: CartItemAddon[];
};

/**
 * Cart state for the cashier screen.
 *
 * Kept out of the page component so the checkout flow can be reasoned about
 * (and tested) on its own. Two lines of the same product only merge when every
 * option matches — a hot latte and an iced latte stay separate rows.
 */
export function useCart(config: PosConfig) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');

    const add = useCallback(
        (draft: CartDraft) => {
            const addons = config.addon_enabled ? draft.addons : [];
            const variantAdjustment = draft.variant?.price_adjustment ?? 0;
            const addonTotal = addons.reduce(
                (sum, addon) => sum + addon.price * addon.quantity,
                0,
            );
            const unitPrice =
                draft.product.base_price + variantAdjustment + addonTotal;

            const signature = fingerprint({
                productId: draft.product.id,
                variantId: draft.variant?.id ?? null,
                temperature: draft.temperature,
                sugarLevel: draft.sugarLevel,
                notes: draft.notes,
                addons,
            });

            setItems((current) => {
                const existing = current.find((item) => item.id === signature);

                if (existing) {
                    return current.map((item) =>
                        item.id === signature
                            ? {
                                  ...item,
                                  quantity: item.quantity + draft.quantity,
                                  subtotal:
                                      (item.quantity + draft.quantity) *
                                      item.unit_price,
                              }
                            : item,
                    );
                }

                const line: CartItem = {
                    id: signature,
                    product_id: draft.product.id,
                    product_variant_id: draft.variant?.id ?? null,
                    product_name: draft.product.name,
                    variant_name: draft.variant?.name ?? null,
                    base_price: draft.product.base_price,
                    variant_adjustment: variantAdjustment,
                    quantity: draft.quantity,
                    temperature: draft.temperature,
                    sugar_level: draft.sugarLevel,
                    notes: draft.notes,
                    addons,
                    unit_price: unitPrice,
                    subtotal: unitPrice * draft.quantity,
                };

                return [...current, line];
            });
        },
        [config.addon_enabled],
    );

    const setQuantity = useCallback((id: string, quantity: number) => {
        setItems((current) =>
            quantity <= 0
                ? current.filter((item) => item.id !== id)
                : current.map((item) =>
                      item.id === id
                          ? {
                                ...item,
                                quantity,
                                subtotal: quantity * item.unit_price,
                            }
                          : item,
                  ),
        );
    }, []);

    const remove = useCallback((id: string) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);

    const clear = useCallback(() => {
        setItems([]);
        setCustomerId(null);
        setDiscount(0);
        setNotes('');
    }, []);

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const appliedDiscount = config.discount_enabled
            ? Math.min(Math.max(discount, 0), subtotal)
            : 0;
        const taxable = subtotal - appliedDiscount;
        const tax = config.tax_enabled
            ? Math.round((taxable * config.tax_rate) / 100)
            : 0;

        return {
            subtotal,
            discount: appliedDiscount,
            tax,
            total: taxable + tax,
            quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        };
    }, [
        items,
        discount,
        config.discount_enabled,
        config.tax_enabled,
        config.tax_rate,
    ]);

    /** Request body for POST /pos/checkout. */
    const toPayload = useCallback(
        (paymentMethod: string, paymentAmount: number) => ({
            customer_id: config.customer_enabled ? customerId : null,
            payment_method: paymentMethod,
            payment_amount: paymentAmount,
            discount: totals.discount,
            notes: config.order_note_enabled ? notes || null : null,
            items: items.map((item) => ({
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
                temperature: item.temperature,
                sugar_level: item.sugar_level,
                notes: item.notes || null,
                addons: item.addons.map((addon) => ({
                    product_addon_id: addon.product_addon_id,
                    quantity: addon.quantity,
                })),
            })),
        }),
        [
            items,
            customerId,
            notes,
            totals.discount,
            config.customer_enabled,
            config.order_note_enabled,
        ],
    );

    return {
        items,
        isEmpty: items.length === 0,
        totals,
        customerId,
        setCustomerId,
        discount,
        setDiscount,
        notes,
        setNotes,
        add,
        setQuantity,
        remove,
        clear,
        toPayload,
    };
}

/** Stable identity for a fully configured cart line. */
function fingerprint(input: {
    productId: number;
    variantId: number | null;
    temperature: Temperature | null;
    sugarLevel: SugarLevel | null;
    notes: string;
    addons: CartItemAddon[];
}): string {
    const addons = input.addons
        .map((addon) => `${addon.product_addon_id}x${addon.quantity}`)
        .sort()
        .join(',');

    return [
        input.productId,
        input.variantId ?? '-',
        input.temperature ?? '-',
        input.sugarLevel ?? '-',
        input.notes.trim() || '-',
        addons || '-',
    ].join('|');
}
