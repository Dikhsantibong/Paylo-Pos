<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * The opening menu: products, their size variants, and the recipe behind each
 * one.
 *
 * Recipes are seeded alongside the product on purpose — a menu item and what it
 * is made of are one unit of information. Because every product ships with a
 * recipe, HPP, margin and automatic stock deduction all work from the very
 * first sale instead of showing "belum ada resep".
 *
 * How the recipe columns are read (see HppService):
 *   - `recipe` applies to every sale of the product,
 *   - `variant_recipe` is *added on top* for that variant only.
 * So the base recipe describes the standard (Medium) serving, and a Large adds
 * the extra milk or ice it really uses.
 *
 * Prices are aimed at roughly 15–30% food cost, which is healthy for F&B.
 * Nothing here is overwritten on a re-run.
 */
class ProductSeeder extends Seeder
{
    /** name, price adjustment against the base price */
    private const SIZES = [
        ['Small', -5_000],
        ['Medium', 0],
        ['Large', 5_000],
    ];

    /**
     * @return array<int, array<string, mixed>>
     */
    private function products(): array
    {
        return [
            // ── Coffee ────────────────────────────────────────
            [
                'slug' => 'espresso', 'name' => 'Espresso', 'category' => 'coffee',
                'price' => 18_000, 'sizes' => true,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Air Mineral' => 40],
                'variant_recipe' => ['Large' => ['Biji Kopi Arabica' => 9]],
            ],
            [
                'slug' => 'americano', 'name' => 'Americano', 'category' => 'coffee',
                'price' => 22_000, 'sizes' => true,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Air Mineral' => 150, 'Es Batu' => 100],
                'variant_recipe' => ['Large' => ['Air Mineral' => 60, 'Es Batu' => 40]],
            ],
            [
                'slug' => 'latte', 'name' => 'Latte', 'category' => 'coffee',
                'price' => 28_000, 'sizes' => true,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Es Batu' => 60],
                'variant_recipe' => ['Large' => ['Susu Segar' => 50, 'Es Batu' => 20]],
            ],
            [
                'slug' => 'cappuccino', 'name' => 'Cappuccino', 'category' => 'coffee',
                'price' => 28_000, 'sizes' => true,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 120],
            ],
            [
                'slug' => 'flat-white', 'name' => 'Flat White', 'category' => 'coffee',
                'price' => 30_000, 'sizes' => true,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 100],
            ],
            [
                'slug' => 'mocha', 'name' => 'Mocha', 'category' => 'coffee',
                'price' => 32_000, 'sizes' => true,
                'recipe' => [
                    'Biji Kopi Arabica' => 18, 'Susu Segar' => 120,
                    'Coklat Bubuk' => 15, 'Gula Cair' => 15,
                ],
            ],
            [
                'slug' => 'caramel-macchiato', 'name' => 'Caramel Macchiato', 'category' => 'coffee',
                'price' => 35_000, 'sizes' => true,
                'recipe' => [
                    'Biji Kopi Arabica' => 18, 'Susu Segar' => 150,
                    'Syrup Caramel' => 20, 'Es Batu' => 60,
                ],
            ],
            [
                'slug' => 'affogato', 'name' => 'Affogato', 'category' => 'coffee',
                'price' => 30_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Es Krim Vanilla' => 80],
            ],

            // ── Non-Coffee ────────────────────────────────────
            [
                'slug' => 'matcha-latte', 'name' => 'Matcha Latte', 'category' => 'non-coffee',
                'price' => 30_000, 'sizes' => true,
                'recipe' => [
                    'Matcha Powder' => 5, 'Susu Segar' => 200,
                    'Gula Cair' => 15, 'Es Batu' => 60,
                ],
            ],
            [
                'slug' => 'taro-latte', 'name' => 'Taro Latte', 'category' => 'non-coffee',
                'price' => 28_000, 'sizes' => true,
                'recipe' => ['Bubuk Taro' => 25, 'Susu Segar' => 180, 'Es Batu' => 60],
            ],
            [
                'slug' => 'chocolate', 'name' => 'Chocolate', 'category' => 'non-coffee',
                'price' => 25_000, 'sizes' => true,
                'recipe' => ['Coklat Bubuk' => 25, 'Susu Segar' => 180, 'Gula Cair' => 10],
            ],
            [
                'slug' => 'iced-tea', 'name' => 'Iced Tea', 'category' => 'non-coffee',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => [
                    'Teh Celup' => 1, 'Air Mineral' => 200,
                    'Gula Cair' => 20, 'Es Batu' => 100,
                ],
            ],
            [
                'slug' => 'lemon-tea', 'name' => 'Lemon Tea', 'category' => 'non-coffee',
                'price' => 18_000, 'sizes' => false,
                'recipe' => [
                    'Teh Celup' => 1, 'Air Mineral' => 200, 'Lemon' => 0.5,
                    'Gula Cair' => 20, 'Es Batu' => 80,
                ],
            ],
            [
                'slug' => 'fresh-orange', 'name' => 'Fresh Orange', 'category' => 'non-coffee',
                'price' => 22_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Jeruk Peras' => 3, 'Es Batu' => 80],
            ],

            // ── Snack ─────────────────────────────────────────
            [
                'slug' => 'french-fries', 'name' => 'French Fries', 'category' => 'snack',
                'price' => 20_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Kentang Beku' => 150, 'Minyak Goreng' => 20],
            ],
            [
                'slug' => 'chicken-nuggets', 'name' => 'Chicken Nuggets', 'category' => 'snack',
                'price' => 25_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Nugget Ayam' => 120, 'Minyak Goreng' => 20],
            ],
            [
                'slug' => 'banana-split', 'name' => 'Banana Split', 'category' => 'snack',
                'price' => 22_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Pisang' => 1, 'Es Krim Vanilla' => 80, 'Whipped Cream' => 20],
            ],

            // ── Pastry ────────────────────────────────────────
            [
                'slug' => 'croissant', 'name' => 'Croissant', 'category' => 'pastry',
                'price' => 18_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Croissant Beku' => 1],
            ],
            [
                'slug' => 'banana-bread', 'name' => 'Banana Bread', 'category' => 'pastry',
                'price' => 15_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Banana Bread Slice' => 1],
            ],
            [
                'slug' => 'chocolate-cake', 'name' => 'Chocolate Cake', 'category' => 'pastry',
                'price' => 25_000, 'sizes' => false, 'temperature' => false, 'sugar' => false,
                'recipe' => ['Chocolate Cake Slice' => 1],
            ],
        ];
    }

    public function run(): void
    {
        $categories = Category::query()->pluck('id', 'slug');
        $ingredients = Ingredient::query()->pluck('id', 'name');

        if ($categories->isEmpty() || $ingredients->isEmpty()) {
            $this->command?->error('Jalankan CategorySeeder dan IngredientSeeder lebih dulu.');

            return;
        }

        $created = 0;
        $recipeRows = 0;

        foreach ($this->products() as $definition) {
            $categoryId = $categories[$definition['category']] ?? null;

            if ($categoryId === null) {
                $this->command?->warn("Kategori '{$definition['category']}' tidak ditemukan, {$definition['name']} dilewati.");

                continue;
            }

            $product = Product::firstOrCreate(
                ['slug' => $definition['slug']],
                [
                    'category_id' => $categoryId,
                    'name' => $definition['name'],
                    'base_price' => $definition['price'],
                    'is_active' => true,
                    'has_variants' => $definition['sizes'],
                    'has_temperature' => $definition['temperature'] ?? true,
                    'has_sugar_level' => $definition['sugar'] ?? true,
                ],
            );

            if ($product->wasRecentlyCreated) {
                $created++;
            }

            $variants = $definition['sizes'] ? $this->syncSizes($product) : collect();

            $recipeRows += $this->syncRecipe($product, null, $definition['recipe'] ?? [], $ingredients);

            foreach ($definition['variant_recipe'] ?? [] as $sizeName => $extra) {
                $variantId = $variants[$sizeName] ?? null;

                if ($variantId !== null) {
                    $recipeRows += $this->syncRecipe($product, $variantId, $extra, $ingredients);
                }
            }
        }

        $total = count($this->products());
        $this->command?->info("Produk: {$created} baru, ".($total - $created).' sudah ada.');
        $this->command?->info("Resep: {$recipeRows} baris baru.");
    }

    /**
     * Ensure the product has the three standard sizes.
     *
     * @return Collection<string, int> variant id keyed by name
     */
    private function syncSizes(Product $product): Collection
    {
        foreach (self::SIZES as [$name, $adjustment]) {
            $product->variants()->firstOrCreate(
                ['name' => $name],
                ['price_adjustment' => $adjustment, 'is_active' => true],
            );
        }

        return $product->variants()->pluck('id', 'name');
    }

    /**
     * @param  array<string, float>  $lines  ingredient name => quantity
     * @param  Collection<string, int>  $ingredients
     * @return int number of rows created
     */
    private function syncRecipe(Product $product, ?int $variantId, array $lines, $ingredients): int
    {
        $created = 0;

        foreach ($lines as $ingredientName => $quantity) {
            $ingredientId = $ingredients[$ingredientName] ?? null;

            if ($ingredientId === null) {
                $this->command?->warn("Bahan '{$ingredientName}' tidak ditemukan untuk {$product->name}.");

                continue;
            }

            $created += Recipe::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'product_variant_id' => $variantId,
                    'ingredient_id' => $ingredientId,
                ],
                ['quantity' => $quantity],
            )->wasRecentlyCreated ? 1 : 0;
        }

        return $created;
    }
}
