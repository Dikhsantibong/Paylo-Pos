<?php

namespace Tests\Feature\Pos;

use App\Enums\Role;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\ProductVariant;
use App\Models\Recipe;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Settings\SettingsRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;

    private Product $latte;

    private ProductVariant $large;

    private Ingredient $beans;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::factory()->create(['role' => Role::Kasir]);

        $category = Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1]);

        $this->latte = Product::create([
            'category_id' => $category->id,
            'name' => 'Latte',
            'slug' => 'latte',
            'base_price' => 28_000,
            'has_variants' => true,
            'has_temperature' => true,
            'has_sugar_level' => true,
        ]);

        $this->large = $this->latte->variants()->create([
            'name' => 'Large',
            'price_adjustment' => 5_000,
        ]);

        // Rp 150 per gram × 18 g = Rp 2.700 of beans in every cup.
        $this->beans = Ingredient::create([
            'name' => 'Kopi Arabica',
            'unit' => 'gram',
            'current_stock' => 1_000,
            'min_stock' => 100,
            'cost_per_unit' => 150,
        ]);

        Recipe::create([
            'product_id' => $this->latte->id,
            'ingredient_id' => $this->beans->id,
            'quantity' => 18,
        ]);

        $this->settings()->put([
            'tax_enabled' => false,
            'discount_enabled' => true,
            'addon_enabled' => true,
            'payment_cash' => true,
            'payment_qris' => true,
            'payment_bank_transfer' => false,
            'payment_debit_card' => false,
            'payment_credit_card' => false,
        ]);
    }

    public function test_cash_sale_records_the_tendered_amount_and_change(): void
    {
        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'cash',
                'payment_amount' => 50_000,
            ]))
            ->assertRedirect();

        $transaction = Transaction::sole();

        $this->assertSame(33_000, $transaction->total);
        $this->assertSame(50_000, $transaction->payment_amount);
        $this->assertSame(17_000, $transaction->change_amount);
        $this->assertSame('completed', $transaction->status);
    }

    public function test_cash_sale_is_rejected_when_the_customer_pays_too_little(): void
    {
        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'cash',
                'payment_amount' => 10_000,
            ]))
            ->assertSessionHasErrors('payment_amount');

        $this->assertSame(0, Transaction::count());
    }

    public function test_non_cash_methods_are_recorded_as_a_label_with_no_change(): void
    {
        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'qris',
                // The screen sends nothing for non-cash; the total is implied.
                'payment_amount' => 0,
            ]))
            ->assertRedirect();

        $transaction = Transaction::sole();

        $this->assertSame('qris', $transaction->payment_method);
        $this->assertSame(33_000, $transaction->payment_amount);
        $this->assertSame(0, $transaction->change_amount);
    }

    public function test_a_disabled_payment_method_is_refused(): void
    {
        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'credit_card',
            ]))
            ->assertSessionHasErrors('payment_method');

        $this->assertSame(0, Transaction::count());
    }

    public function test_the_cost_of_goods_is_snapshotted_on_every_line(): void
    {
        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'cash',
                'payment_amount' => 100_000,
                'items' => [[
                    'product_id' => $this->latte->id,
                    'product_variant_id' => $this->large->id,
                    'quantity' => 3,
                ]],
            ]));

        $item = Transaction::sole()->items()->sole();

        $this->assertSame(2_700, $item->unit_cost);
        $this->assertSame(8_100, $item->cost_subtotal);
    }

    public function test_selling_deducts_ingredient_stock_through_the_recipe(): void
    {
        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'cash',
                'payment_amount' => 100_000,
                'items' => [[
                    'product_id' => $this->latte->id,
                    'product_variant_id' => $this->large->id,
                    'quantity' => 2,
                ]],
            ]));

        // 1000 g − (18 g × 2 cups)
        $this->assertEqualsWithDelta(964.0, $this->beans->fresh()->current_stock, 0.01);
    }

    public function test_tax_and_discount_are_applied_in_the_right_order(): void
    {
        $this->settings()->put(['tax_enabled' => true, 'tax_rate' => 10]);

        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'cash',
                'payment_amount' => 100_000,
                'discount' => 3_000,
            ]));

        $transaction = Transaction::sole();

        // 33.000 − 3.000 discount = 30.000, +10% tax = 33.000
        $this->assertSame(33_000, $transaction->subtotal);
        $this->assertSame(3_000, $transaction->discount);
        $this->assertSame(3_000, $transaction->tax_amount);
        $this->assertSame(33_000, $transaction->total);
    }

    public function test_add_ons_are_ignored_while_the_feature_is_switched_off(): void
    {
        $addon = ProductAddon::create(['name' => 'Extra shot', 'price' => 5_000, 'is_active' => true]);

        $this->settings()->put(['addon_enabled' => false]);

        $this->actingAs($this->cashier)
            ->post(route('pos.checkout'), $this->payload([
                'payment_method' => 'cash',
                'payment_amount' => 100_000,
                'items' => [[
                    'product_id' => $this->latte->id,
                    'product_variant_id' => $this->large->id,
                    'quantity' => 1,
                    'addons' => [['product_addon_id' => $addon->id, 'quantity' => 1]],
                ]],
            ]));

        $item = Transaction::sole()->items()->sole();

        $this->assertSame(0, $item->addons()->count());
        $this->assertSame(33_000, $item->unit_price);
    }

    public function test_the_cashier_screen_only_offers_enabled_payment_methods(): void
    {
        $this->actingAs($this->cashier)
            ->get(route('pos.index'))
            ->assertInertia(fn ($page) => $page
                ->component('pos/index')
                ->where('paymentMethods.0.value', 'cash')
                ->where('paymentMethods.1.value', 'qris')
                ->count('paymentMethods', 2)
            );
    }

    /** @param array<string, mixed> $overrides */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'payment_method' => 'cash',
            'payment_amount' => 50_000,
            'items' => [[
                'product_id' => $this->latte->id,
                'product_variant_id' => $this->large->id,
                'quantity' => 1,
            ]],
        ], $overrides);
    }

    private function settings(): SettingsRepository
    {
        return app(SettingsRepository::class);
    }
}
