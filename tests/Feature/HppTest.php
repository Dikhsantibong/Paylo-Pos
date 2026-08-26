<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\User;
use App\Services\Costing\HppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HppTest extends TestCase
{
    use RefreshDatabase;

    private HppService $hpp;

    private Product $latte;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hpp = app(HppService::class);

        $category = Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1]);

        $this->latte = Product::create([
            'category_id' => $category->id,
            'name' => 'Latte',
            'slug' => 'latte',
            'base_price' => 28_000,
            'has_variants' => true,
        ]);

        $beans = Ingredient::create([
            'name' => 'Kopi Arabica', 'unit' => 'gram',
            'current_stock' => 1_000, 'min_stock' => 100, 'cost_per_unit' => 150,
        ]);

        $milk = Ingredient::create([
            'name' => 'Susu Segar', 'unit' => 'ml',
            'current_stock' => 5_000, 'min_stock' => 500, 'cost_per_unit' => 15,
        ]);

        // Base recipe: 18 g beans (2.700) + 150 ml milk (2.250) = 4.950
        Recipe::create(['product_id' => $this->latte->id, 'ingredient_id' => $beans->id, 'quantity' => 18]);
        Recipe::create(['product_id' => $this->latte->id, 'ingredient_id' => $milk->id, 'quantity' => 150]);

        $large = $this->latte->variants()->create(['name' => 'Large', 'price_adjustment' => 5_000]);

        // A Large adds another 50 ml of milk (750) on top of the base recipe.
        Recipe::create([
            'product_id' => $this->latte->id,
            'product_variant_id' => $large->id,
            'ingredient_id' => $milk->id,
            'quantity' => 50,
        ]);

        $this->largeId = $large->id;
    }

    private int $largeId;

    public function test_unit_cost_sums_the_base_recipe(): void
    {
        $this->assertSame(4_950, $this->hpp->unitCost($this->latte->id));
    }

    public function test_variant_rows_are_added_on_top_of_the_base_recipe(): void
    {
        $this->assertSame(5_700, $this->hpp->unitCost($this->latte->id, $this->largeId));
    }

    public function test_metrics_describe_margin_and_food_cost(): void
    {
        $metrics = $this->hpp->metrics(28_000, 4_950);

        $this->assertSame(4_950, $metrics['hpp']);
        $this->assertSame(23_050, $metrics['margin']);
        $this->assertSame(82.3, $metrics['margin_percent']);
        $this->assertSame(17.7, $metrics['food_cost_percent']);
        $this->assertSame('healthy', $metrics['health']);
    }

    public function test_food_cost_above_forty_five_percent_is_flagged_critical(): void
    {
        $this->assertSame('healthy', $this->hpp->health(30));
        $this->assertSame('watch', $this->hpp->health(40));
        $this->assertSame('critical', $this->hpp->health(52));
        $this->assertSame('unknown', $this->hpp->health(0));
    }

    public function test_suggested_price_hits_the_target_food_cost_rounded_up(): void
    {
        // 4.950 at a 30% food cost = 16.500 exactly.
        $this->assertSame(16_500, $this->hpp->suggestedPrice(4_950, 30));

        // 2.700 at 35% = 7.714,28… → rounded up to the next Rp 500.
        $this->assertSame(8_000, $this->hpp->suggestedPrice(2_700, 35));
    }

    public function test_a_product_without_a_recipe_costs_nothing_and_is_flagged(): void
    {
        $category = Category::first();

        $cake = Product::create([
            'category_id' => $category->id,
            'name' => 'Chocolate Cake',
            'slug' => 'chocolate-cake',
            'base_price' => 25_000,
        ]);

        $breakdown = $this->hpp->breakdownFor($cake);

        $this->assertFalse($breakdown['has_recipe']);
        $this->assertSame(0, $breakdown['hpp']);

        $summary = $this->hpp->catalogueSummary($this->hpp->catalogue());

        $this->assertSame(2, $summary['productsTotal']);
        $this->assertSame(1, $summary['productsCosted']);
        $this->assertSame([['id' => $cake->id, 'name' => 'Chocolate Cake']], $summary['productsWithoutRecipe']);
    }

    public function test_the_costing_screen_is_owner_only(): void
    {
        $this->actingAs(User::factory()->create(['role' => Role::Kasir]))
            ->get(route('hpp.index'))
            ->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => Role::Owner]))
            ->get(route('hpp.index'))
            ->assertInertia(fn ($page) => $page
                ->component('hpp/index')
                ->has('products')
                ->has('summary')
                ->has('ingredients')
            );
    }
}
