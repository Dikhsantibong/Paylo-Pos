<?php

namespace App\Services\Pos;

use App\Enums\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\Recipe;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Costing\HppService;
use App\Services\Settings\SettingsRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Turns a validated cart into a completed transaction.
 *
 * The cashier is the last step of the flow — a sale is `completed` the moment
 * it is charged. Non-cash methods (QRIS, debit, credit, transfer) are recorded
 * as a label only: Paylo does not talk to any payment processor, so the total
 * is simply considered tendered in full.
 */
class CheckoutService
{
    public function __construct(
        private readonly SettingsRepository $settings,
        private readonly HppService $hpp,
    ) {}

    /**
     * @param  array<string, mixed>  $payload  output of CheckoutRequest::validated()
     *
     * @throws ValidationException
     */
    public function checkout(array $payload, User $cashier): Transaction
    {
        $method = $this->resolvePaymentMethod($payload['payment_method']);

        return DB::transaction(function () use ($payload, $cashier, $method) {
            $lines = $this->buildLines($payload['items']);

            $subtotal = (int) array_sum(array_column($lines, 'subtotal'));
            $discount = $this->resolveDiscount($payload['discount'] ?? 0, $subtotal);
            $taxable = max(0, $subtotal - $discount);

            [$taxRate, $taxAmount] = $this->calculateTax($taxable);
            $total = $taxable + $taxAmount;

            [$tendered, $change] = $this->resolveTender($method, $payload['payment_amount'] ?? 0, $total);

            $transaction = Transaction::create([
                'transaction_number' => Transaction::generateNumber(),
                'customer_id' => $this->settings->bool('customer_enabled', true)
                    ? ($payload['customer_id'] ?? null)
                    : null,
                'user_id' => $cashier->id,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $method->value,
                'payment_amount' => $tendered,
                'change_amount' => $change,
                'status' => 'completed',
                'notes' => $this->settings->bool('order_note_enabled', true)
                    ? ($payload['notes'] ?? null)
                    : null,
            ]);

            foreach ($lines as $line) {
                $addons = $line['addons'];
                unset($line['addons']);

                $item = $transaction->items()->create($line);

                foreach ($addons as $addon) {
                    $item->addons()->create($addon);
                }

                $this->deductIngredients(
                    $line['product_id'],
                    $line['product_variant_id'],
                    $line['quantity'],
                    $cashier->id,
                    $transaction->id,
                );
            }

            return $transaction->load(['items.addons', 'customer', 'cashier']);
        });
    }

    /**
     * Payment methods currently switched on in settings, shaped for the UI.
     *
     * @return array<int, array<string, mixed>>
     */
    public function availablePaymentMethods(): array
    {
        $methods = [];

        foreach (PaymentMethod::cases() as $method) {
            if (! $this->settings->bool($method->settingKey())) {
                continue;
            }

            $methods[] = [
                'value' => $method->value,
                'label' => $method->label(),
                'description' => $method->description(),
                'requires_tender' => $method->requiresTenderedAmount(),
            ];
        }

        // A shop with every method switched off could not sell anything.
        if ($methods === []) {
            $cash = PaymentMethod::Cash;

            $methods[] = [
                'value' => $cash->value,
                'label' => $cash->label(),
                'description' => $cash->description(),
                'requires_tender' => true,
            ];
        }

        return $methods;
    }

    /**
     * Receipt payload rendered by the POS screen after a successful sale.
     *
     * @return array<string, mixed>
     */
    public function receiptFor(Transaction $transaction): array
    {
        $transaction->loadMissing(['items.addons', 'customer', 'cashier']);

        return [
            'number' => $transaction->transaction_number,
            'created_at' => $transaction->created_at->toIso8601String(),
            'cashier' => $transaction->cashier?->name,
            'customer' => $transaction->customer?->name,
            'items' => $transaction->items->map(fn ($item) => [
                'name' => $item->product_name,
                'variant' => $item->variant_name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->subtotal,
                'temperature' => $item->temperature,
                'sugar_level' => $item->sugar_level,
                'notes' => $item->notes,
                'addons' => $item->addons->map(fn ($addon) => [
                    'name' => $addon->addon_name,
                    'price' => $addon->addon_price,
                    'quantity' => $addon->quantity,
                ])->all(),
            ])->all(),
            'subtotal' => $transaction->subtotal,
            'discount' => $transaction->discount,
            'tax_label' => $this->settings->string('tax_label', 'PPN'),
            'tax_rate' => (float) $transaction->tax_rate,
            'tax_amount' => $transaction->tax_amount,
            'total' => $transaction->total,
            'payment_method' => $transaction->payment_method,
            'payment_method_label' => PaymentMethod::tryFrom($transaction->payment_method)?->label()
                ?? strtoupper($transaction->payment_method),
            'payment_amount' => $transaction->payment_amount,
            'change_amount' => $transaction->change_amount,
            'notes' => $transaction->notes,
            'footer' => $this->settings->string('receipt_footer'),
            'shop' => [
                'name' => $this->settings->string('shop_name', 'Paylo Coffee'),
                'tagline' => $this->settings->string('shop_tagline'),
                'address' => $this->settings->string('shop_address'),
                'phone' => $this->settings->string('shop_phone'),
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function buildLines(array $items): array
    {
        $addonsEnabled = $this->settings->bool('addon_enabled', true);
        $lines = [];

        foreach ($items as $item) {
            $product = Product::with('variants')->findOrFail($item['product_id']);

            $unitPrice = (int) $product->base_price;
            $variantId = $item['product_variant_id'] ?? null;
            $variantName = null;

            if ($variantId) {
                $variant = $product->variants->firstWhere('id', $variantId);

                if (! $variant) {
                    throw ValidationException::withMessages([
                        'items' => "Varian yang dipilih tidak tersedia untuk produk {$product->name}.",
                    ]);
                }

                $unitPrice += (int) $variant->price_adjustment;
                $variantName = $variant->name;
            }

            [$addonTotal, $addonRows] = $addonsEnabled
                ? $this->buildAddons($item['addons'] ?? [])
                : [0, []];

            $lineUnitPrice = $unitPrice + $addonTotal;
            $quantity = (int) $item['quantity'];
            $unitCost = $this->hpp->unitCost($product->id, $variantId);

            $lines[] = [
                'product_id' => $product->id,
                'product_variant_id' => $variantId,
                'product_name' => $product->name,
                'variant_name' => $variantName,
                'quantity' => $quantity,
                'unit_price' => $lineUnitPrice,
                'unit_cost' => $unitCost,
                'subtotal' => $lineUnitPrice * $quantity,
                'cost_subtotal' => $unitCost * $quantity,
                'temperature' => $item['temperature'] ?? null,
                'sugar_level' => $item['sugar_level'] ?? null,
                'notes' => $item['notes'] ?? null,
                'addons' => $addonRows,
            ];
        }

        return $lines;
    }

    /**
     * @param  array<int, array<string, mixed>>  $addons
     * @return array{0: int, 1: array<int, array<string, mixed>>}
     */
    private function buildAddons(array $addons): array
    {
        $total = 0;
        $rows = [];

        foreach ($addons as $addon) {
            $model = ProductAddon::findOrFail($addon['product_addon_id']);
            $quantity = (int) $addon['quantity'];

            $total += (int) $model->price * $quantity;

            $rows[] = [
                'product_addon_id' => $model->id,
                'addon_name' => $model->name,
                'addon_price' => (int) $model->price,
                'quantity' => $quantity,
            ];
        }

        return [$total, $rows];
    }

    /** @return array{0: float, 1: int} */
    private function calculateTax(int $taxable): array
    {
        if (! $this->settings->bool('tax_enabled')) {
            return [0.0, 0];
        }

        $rate = $this->settings->float('tax_rate');

        return [$rate, (int) round($taxable * $rate / 100)];
    }

    private function resolveDiscount(mixed $requested, int $subtotal): int
    {
        if (! $this->settings->bool('discount_enabled', true)) {
            return 0;
        }

        return max(0, min((int) $requested, $subtotal));
    }

    /**
     * Non-cash payments are labels: the total counts as tendered in full and
     * there is never any change.
     *
     * @return array{0: int, 1: int}
     */
    private function resolveTender(PaymentMethod $method, mixed $paymentAmount, int $total): array
    {
        if (! $method->requiresTenderedAmount()) {
            return [$total, 0];
        }

        $tendered = (int) $paymentAmount;

        if ($tendered < $total) {
            throw ValidationException::withMessages([
                'payment_amount' => 'Uang yang diterima kurang dari total tagihan.',
            ]);
        }

        return [$tendered, $tendered - $total];
    }

    private function resolvePaymentMethod(string $value): PaymentMethod
    {
        $method = PaymentMethod::tryFrom($value);

        if (! $method || ! $this->settings->bool($method->settingKey())) {
            throw ValidationException::withMessages([
                'payment_method' => 'Metode pembayaran tersebut tidak aktif. Aktifkan lebih dulu di Pengaturan.',
            ]);
        }

        return $method;
    }

    /**
     * Deduct ingredient stock following the product recipe. Base rows always
     * apply; variant rows apply only to the variant that was sold.
     */
    private function deductIngredients(int $productId, ?int $variantId, int $quantity, int $userId, int $transactionId): void
    {
        $recipes = Recipe::query()
            ->with('ingredient')
            ->where('product_id', $productId)
            ->where(function ($q) use ($variantId) {
                $q->whereNull('product_variant_id');

                if ($variantId !== null) {
                    $q->orWhere('product_variant_id', $variantId);
                }
            })
            ->get();

        foreach ($recipes as $recipe) {
            $recipe->ingredient?->deductStock(
                (float) $recipe->quantity * $quantity,
                $userId,
                'transaction',
                $transactionId,
            );
        }
    }
}
