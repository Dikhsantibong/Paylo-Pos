import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CartPanel } from '@/features/pos/cart-panel';
import { ItemOptionsDialog } from '@/features/pos/item-options-dialog';
import { PaymentDialog } from '@/features/pos/payment-dialog';
import { ProductGrid } from '@/features/pos/product-grid';
import { ReceiptDialog } from '@/features/pos/receipt-dialog';
import { useCart } from '@/features/pos/use-cart';
import type { CartDraft } from '@/features/pos/use-cart';
import type {
    Category,
    Customer,
    PaymentMethodOption,
    PosConfig,
    Product,
    ProductAddon,
    Receipt,
} from '@/types';

type Props = {
    categories: Category[];
    products: Product[];
    addons: ProductAddon[];
    customers: Customer[];
    paymentMethods: PaymentMethodOption[];
    config: PosConfig;
};

/**
 * The cashier screen — design.md §8.
 *
 * Layout: menu on the left, order on the right, total always visible. The page
 * itself only wires the pieces together; cart maths lives in `useCart` and each
 * panel is its own component under `features/pos`.
 */
export default function PosIndex({
    categories,
    products,
    addons,
    customers,
    paymentMethods,
    config,
}: Props) {
    const cart = useCart(config);
    const receiptProp = usePage().props.receipt as Receipt | null | undefined;

    const [configuring, setConfiguring] = useState<Product | null>(null);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Checkout is a POST, so Inertia remounts this page with the receipt in the
    // shared props. Seeding the state during initialisation picks that up on
    // the very first render; `submit` also sets it for the rarer case where
    // Inertia preserves component state across the visit.
    const [receipt, setReceipt] = useState<Receipt | null>(() =>
        receiptProp && config.receipt_enabled ? receiptProp : null,
    );

    const searchRef = useRef<HTMLInputElement>(null);

    // A product with no options at all goes straight into the cart.
    const selectProduct = useCallback(
        (product: Product) => {
            const variants = product.active_variants ?? product.variants ?? [];
            const hasAddons = config.addon_enabled && addons.length > 0;
            const needsChoice =
                variants.length > 0 ||
                product.has_temperature ||
                product.has_sugar_level ||
                hasAddons;

            if (needsChoice) {
                setConfiguring(product);

                return;
            }

            cart.add({
                product,
                variant: null,
                quantity: 1,
                temperature: null,
                sugarLevel: null,
                notes: '',
                addons: [],
            });
        },
        [addons.length, cart, config.addon_enabled],
    );

    const addConfigured = useCallback(
        (draft: CartDraft) => cart.add(draft),
        [cart],
    );

    const submit = useCallback(
        (method: string, tendered: number) => {
            setProcessing(true);

            router.post('/pos/checkout', cart.toPayload(method, tendered), {
                preserveScroll: true,
                onSuccess: (page) => {
                    const created = (page.props.receipt ??
                        null) as Receipt | null;

                    cart.clear();
                    setPaymentOpen(false);

                    if (created && config.receipt_enabled) {
                        setReceipt(created);
                    }

                    searchRef.current?.focus();
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0];

                    if (first) {
                        toast.error(String(first));
                    }
                },
                onFinish: () => setProcessing(false),
            });
        },
        [cart, config.receipt_enabled],
    );

    // Keyboard shortcuts — design.md §8.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'F2') {
                event.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();

                return;
            }

            if (event.key === 'F4') {
                event.preventDefault();

                if (!cart.isEmpty && !processing) {
                    setPaymentOpen(true);
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [cart.isEmpty, processing]);

    return (
        <>
            <Head title="Kasir" />

            <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col lg:flex-row">
                <div className="flex min-h-0 flex-1 flex-col">
                    <ProductGrid
                        products={products}
                        categories={categories}
                        onSelect={selectProduct}
                        searchRef={searchRef}
                        addonsAvailable={
                            config.addon_enabled && addons.length > 0
                        }
                    />
                </div>

                <div className="min-h-0 w-full shrink-0 lg:h-full lg:w-[380px] xl:w-[420px]">
                    <CartPanel
                        items={cart.items}
                        totals={cart.totals}
                        config={config}
                        customers={customers}
                        customerId={cart.customerId}
                        onCustomerChange={cart.setCustomerId}
                        discount={cart.discount}
                        onDiscountChange={cart.setDiscount}
                        notes={cart.notes}
                        onNotesChange={cart.setNotes}
                        onQuantityChange={cart.setQuantity}
                        onRemove={cart.remove}
                        onClear={cart.clear}
                        onCharge={() => setPaymentOpen(true)}
                        disabled={processing}
                    />
                </div>
            </div>

            {/* Keys force a fresh form each time a dialog opens. */}
            <ItemOptionsDialog
                key={configuring ? `item-${configuring.id}` : 'item-none'}
                product={configuring}
                addons={addons}
                config={config}
                onClose={() => setConfiguring(null)}
                onConfirm={addConfigured}
            />

            <PaymentDialog
                key={paymentOpen ? 'pay-open' : 'pay-closed'}
                open={paymentOpen}
                total={cart.totals.total}
                methods={paymentMethods}
                processing={processing}
                onClose={() => setPaymentOpen(false)}
                onConfirm={submit}
            />

            <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
        </>
    );
}

PosIndex.layout = { breadcrumbs: [{ title: 'Kasir', href: '/pos' }] };
