<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\IngredientEntry;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\Recipe;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionItemAddon;
use App\Models\User;
use App\Services\Costing\HppService;
use Database\Seeders\StarterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The starter data is what a new shop actually opens with, so it has to be
 * complete, sane, and safe to run twice.
 */
class StarterDataSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(StarterDataSeeder::class);
    }

    public function test_it_creates_the_full_opening_catalogue(): void
    {
        $this->assertSame(4, Category::count());
        $this->assertSame(20, Product::count());
        $this->assertSame(24, Ingredient::count());
        $this->assertSame(7, ProductAddon::count());
        $this->assertGreaterThan(0, Recipe::count());
    }

    /**
     * Master data only. A freshly seeded shop must open with an empty
     * dashboard, so the first sale it records is a real one.
     */
    public function test_it_creates_no_transaction_data(): void
    {
        $this->assertSame(0, Transaction::count(), 'Seeder tidak boleh membuat transaksi.');
        $this->assertSame(0, TransactionItem::count());
        $this->assertSame(0, TransactionItemAddon::count());
        $this->assertSame(0, IngredientEntry::count(), 'Riwayat stok harus kosong.');
        $this->assertSame(0, Customer::count(), 'Seeder tidak boleh membuat pelanggan.');
    }

    public function test_the_dashboard_opens_empty(): void
    {
        $owner = User::where('email', 'owner@paylo.com')->sole();

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('kpis.revenue.value', 0)
                ->where('kpis.transactions.value', 0)
                ->where('kpis.grossProfit.value', 0)
                ->where('recentTransactions', [])
                ->where('paymentMix', [])
            );
    }

    public function test_both_accounts_can_reach_the_app(): void
    {
        $owner = User::where('email', 'owner@paylo.com')->sole();
        $cashier = User::where('email', 'kasir@paylo.com')->sole();

        $this->assertTrue($owner->isOwner());
        $this->assertTrue($cashier->isKasir());

        // Every POS route sits behind `verified`.
        $this->assertNotNull($owner->email_verified_at);
        $this->assertNotNull($cashier->email_verified_at);

        $this->actingAs($owner)->get(route('dashboard'))->assertOk();
        $this->actingAs($cashier)->get(route('pos.index'))->assertOk();
    }

    public function test_every_product_has_a_recipe_so_hpp_works_immediately(): void
    {
        $withoutRecipe = Product::query()->doesntHave('recipes')->pluck('name')->all();

        $this->assertSame([], $withoutRecipe, 'Produk tanpa resep: '.implode(', ', $withoutRecipe));
    }

    public function test_every_product_is_priced_at_a_healthy_food_cost(): void
    {
        $hpp = app(HppService::class);

        foreach ($hpp->catalogue() as $row) {
            $this->assertGreaterThan(0, $row['hpp'], "{$row['name']} tidak punya HPP.");

            $this->assertLessThanOrEqual(
                35,
                $row['food_cost_percent'],
                "{$row['name']} food cost {$row['food_cost_percent']}% — terlalu tinggi untuk data awal.",
            );

            $this->assertSame('healthy', $row['health'], "{$row['name']} tidak berstatus sehat.");
        }
    }

    public function test_variant_recipes_cost_more_than_the_base(): void
    {
        $latte = Product::where('slug', 'latte')->sole();
        $large = $latte->variants()->where('name', 'Large')->sole();

        $hpp = app(HppService::class);

        $this->assertGreaterThan(
            $hpp->unitCost($latte->id),
            $hpp->unitCost($latte->id, $large->id),
            'Large seharusnya memakai lebih banyak bahan daripada porsi standar.',
        );
    }

    public function test_running_it_again_changes_nothing(): void
    {
        $before = [
            'categories' => Category::count(),
            'products' => Product::count(),
            'ingredients' => Ingredient::count(),
            'addons' => ProductAddon::count(),
            'recipes' => Recipe::count(),
            'users' => User::count(),
        ];

        $this->seed(StarterDataSeeder::class);

        $this->assertSame($before['categories'], Category::count());
        $this->assertSame($before['products'], Product::count());
        $this->assertSame($before['ingredients'], Ingredient::count());
        $this->assertSame($before['addons'], ProductAddon::count());
        $this->assertSame($before['recipes'], Recipe::count());
        $this->assertSame($before['users'], User::count());
    }

    public function test_it_does_not_reset_data_the_shop_has_edited(): void
    {
        $latte = Product::where('slug', 'latte')->sole();
        $latte->update(['name' => 'Signature Latte', 'base_price' => 33_000]);

        $beans = Ingredient::where('name', 'Biji Kopi Arabica')->sole();
        $beans->update(['cost_per_unit' => 220, 'current_stock' => 42]);

        $this->seed(StarterDataSeeder::class);

        $this->assertSame('Signature Latte', $latte->fresh()->name);
        $this->assertSame(33_000, $latte->fresh()->base_price);
        $this->assertSame(220, $beans->fresh()->cost_per_unit);
        $this->assertEqualsWithDelta(42.0, $beans->fresh()->current_stock, 0.01);
    }
}
