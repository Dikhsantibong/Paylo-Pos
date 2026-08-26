<?php

namespace Tests\Feature\Catalog;

use App\Enums\Role;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => Role::Owner]);
    }

    public function test_categories_have_their_own_screen(): void
    {
        Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1]);

        $this->actingAs($this->owner)
            ->get(route('categories.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('categories/index')
                ->has('categories', 1)
                ->where('categories.0.name', 'Coffee')
                ->where('categories.0.products_count', 0)
            );
    }

    public function test_it_counts_products_and_active_products_per_category(): void
    {
        $category = Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1]);

        Product::create([
            'category_id' => $category->id, 'name' => 'Latte',
            'slug' => 'latte', 'base_price' => 28_000, 'is_active' => true,
        ]);
        Product::create([
            'category_id' => $category->id, 'name' => 'Kopi Musiman',
            'slug' => 'kopi-musiman', 'base_price' => 30_000, 'is_active' => false,
        ]);

        $this->actingAs($this->owner)
            ->get(route('categories.index'))
            ->assertInertia(fn ($page) => $page
                ->where('categories.0.products_count', 2)
                ->where('categories.0.active_products_count', 1)
            );
    }

    public function test_a_category_can_be_created_with_an_automatic_slug(): void
    {
        $this->actingAs($this->owner)
            ->post(route('categories.store'), [
                'name' => 'Minuman Dingin',
                'sort_order' => 3,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('categories', [
            'name' => 'Minuman Dingin',
            'slug' => 'minuman-dingin',
            'sort_order' => 3,
        ]);
    }

    public function test_a_duplicate_name_still_gets_a_unique_slug(): void
    {
        $this->actingAs($this->owner)->post(route('categories.store'), ['name' => 'Kopi']);
        $this->actingAs($this->owner)->post(route('categories.store'), ['name' => 'Kopi']);

        $this->assertDatabaseHas('categories', ['slug' => 'kopi']);
        $this->assertDatabaseHas('categories', ['slug' => 'kopi-2']);
    }

    public function test_renaming_a_category_keeps_its_slug(): void
    {
        $category = Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1]);

        $this->actingAs($this->owner)
            ->put(route('categories.update', $category), [
                'name' => 'Kopi Spesial',
                'sort_order' => 1,
                'is_active' => true,
            ]);

        $category->refresh();

        $this->assertSame('Kopi Spesial', $category->name);
        $this->assertSame('coffee', $category->slug);
    }

    public function test_a_category_still_holding_products_cannot_be_deleted(): void
    {
        $category = Category::create(['name' => 'Coffee', 'slug' => 'coffee', 'sort_order' => 1]);

        Product::create([
            'category_id' => $category->id, 'name' => 'Latte',
            'slug' => 'latte', 'base_price' => 28_000,
        ]);

        $this->actingAs($this->owner)
            ->delete(route('categories.destroy', $category))
            ->assertRedirect();

        $this->assertModelExists($category);
    }

    public function test_an_empty_category_can_be_deleted(): void
    {
        $category = Category::create(['name' => 'Kosong', 'slug' => 'kosong', 'sort_order' => 9]);

        $this->actingAs($this->owner)->delete(route('categories.destroy', $category));

        $this->assertModelMissing($category);
    }

    public function test_a_cashier_can_also_manage_categories(): void
    {
        $this->actingAs(User::factory()->create(['role' => Role::Kasir]))
            ->get(route('categories.index'))
            ->assertOk();
    }

    public function test_guests_are_sent_to_the_login_screen(): void
    {
        $this->get(route('categories.index'))->assertRedirect(route('login'));
    }
}
