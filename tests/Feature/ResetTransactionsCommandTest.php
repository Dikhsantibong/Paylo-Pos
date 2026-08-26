<?php

namespace Tests\Feature;

use App\Enums\Role;
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
use Database\Seeders\StarterDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResetTransactionsCommandTest extends TestCase
{
    use RefreshDatabase;

    private Ingredient $beans;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(StarterDataSeeder::class);

        $this->beans = Ingredient::where('name', 'Biji Kopi Arabica')->sole();

        // A trial sale: 2 lattes, paid in cash, with one add-on.
        $cashier = User::factory()->create(['role' => Role::Kasir]);
        $latte = Product::where('slug', 'latte')->sole();
        $addon = ProductAddon::first();

        $this->actingAs($cashier)->post(route('pos.checkout'), [
            'payment_method' => 'cash',
            'payment_amount' => 100_000,
            'items' => [[
                'product_id' => $latte->id,
                'quantity' => 2,
                'addons' => [['product_addon_id' => $addon->id, 'quantity' => 1]],
            ]],
        ]);
    }

    public function test_the_trial_sale_really_landed(): void
    {
        $this->assertSame(1, Transaction::count());
        $this->assertSame(1, TransactionItem::count());
        $this->assertSame(1, TransactionItemAddon::count());
        $this->assertGreaterThan(0, IngredientEntry::where('reference_type', 'transaction')->count());
    }

    public function test_it_removes_every_trace_of_trading_history(): void
    {
        $this->artisan('paylo:reset-transactions --force')->assertSuccessful();

        $this->assertSame(0, Transaction::count());
        $this->assertSame(0, TransactionItem::count());
        $this->assertSame(0, TransactionItemAddon::count());
        $this->assertSame(0, IngredientEntry::where('reference_type', 'transaction')->count());
    }

    public function test_it_leaves_the_master_data_alone(): void
    {
        $this->artisan('paylo:reset-transactions --force');

        $this->assertSame(4, Category::count());
        $this->assertSame(20, Product::count());
        $this->assertSame(24, Ingredient::count());
        $this->assertSame(7, ProductAddon::count());
        $this->assertGreaterThan(0, Recipe::count());
        $this->assertGreaterThan(0, User::count());
    }

    public function test_it_puts_the_consumed_stock_back(): void
    {
        $afterSale = $this->beans->fresh()->current_stock;

        $this->artisan('paylo:reset-transactions --force');

        // The seeder opens with 5.000 g; two lattes took 18 g each.
        $this->assertEqualsWithDelta(36.0, 5_000 - $afterSale, 0.01);
        $this->assertEqualsWithDelta(5_000.0, $this->beans->fresh()->current_stock, 0.01);
    }

    public function test_keep_stock_leaves_the_deduction_in_place(): void
    {
        $afterSale = $this->beans->fresh()->current_stock;

        $this->artisan('paylo:reset-transactions --force --keep-stock');

        $this->assertEqualsWithDelta($afterSale, $this->beans->fresh()->current_stock, 0.01);
    }

    public function test_customers_are_kept_unless_asked_for(): void
    {
        Customer::create(['name' => 'Budi', 'phone' => '0812']);

        $this->artisan('paylo:reset-transactions --force');
        $this->assertSame(1, Customer::count());

        $this->artisan('paylo:reset-transactions --force --customers');
        $this->assertSame(0, Customer::count());
    }

    public function test_it_reports_a_clean_database_instead_of_prompting(): void
    {
        $this->artisan('paylo:reset-transactions --force');

        $this->artisan('paylo:reset-transactions')
            ->expectsOutputToContain('Database sudah bersih.')
            ->assertSuccessful();
    }

    public function test_declining_the_prompt_deletes_nothing(): void
    {
        $this->artisan('paylo:reset-transactions')
            ->expectsConfirmation('Lanjutkan?', 'no')
            ->assertSuccessful();

        $this->assertSame(1, Transaction::count());
    }

    public function test_transaction_numbering_starts_over_afterwards(): void
    {
        $this->artisan('paylo:reset-transactions --force');

        $this->assertSame(
            'TRX-'.now()->format('Ymd').'-0001',
            Transaction::generateNumber(),
        );
    }
}
