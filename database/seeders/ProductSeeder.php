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

    private function products(): array
    {
        return [
            // ── Kopi Dingin ────────────────────────────────────────
            [
                'slug' => 'kopi-aren', 'name' => 'Kopi Aren', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Gula Aren' => 20, 'Es Batu' => 60],
            ],
            [
                'slug' => 'kopi-pandan', 'name' => 'Kopi Pandan', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Syrup Pandan' => 20, 'Es Batu' => 60],
            ],
            [
                'slug' => 'americano', 'name' => 'Americano', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Air Mineral' => 150, 'Es Batu' => 100],
            ],
            [
                'slug' => 'kopi-pisang', 'name' => 'Kopi Pisang', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Syrup Pisang' => 20, 'Es Batu' => 60],
            ],
            [
                'slug' => 'kopi-caramel', 'name' => 'Kopi Caramel', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Syrup Caramel' => 20, 'Es Batu' => 60],
            ],
            [
                'slug' => 'es-koja', 'name' => 'Es Koja', 'category' => 'kopi',
                'price' => 18_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Gula Aren' => 10, 'Es Batu' => 60],
            ],
            [
                'slug' => 'butterscotch-sea-salt', 'name' => 'Butterscotch Sea Salt', 'category' => 'kopi',
                'price' => 18_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Syrup Butterscotch' => 20, 'Sea Salt' => 5, 'Es Batu' => 60],
            ],
            [
                'slug' => 'goguma-latte', 'name' => 'Goguma Latte', 'category' => 'kopi',
                'price' => 18_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Bubuk Goguma' => 20, 'Es Batu' => 60],
            ],
            [
                'slug' => 'spanish-latte', 'name' => 'Spanish Latte', 'category' => 'kopi',
                'price' => 17_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 100, 'Susu Kental Manis' => 30, 'Es Batu' => 60],
            ],
            [
                'slug' => 'ice-latte', 'name' => 'Ice Latte', 'category' => 'kopi',
                'price' => 17_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Es Batu' => 60],
            ],

            // ── Kopi Panas ────────────────────────────────────────
            [
                'slug' => 'kopi-panas-koja', 'name' => 'Kopi Panas Koja', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Gula Aren' => 10],
            ],
            [
                'slug' => 'americano-hot', 'name' => 'Americano Hot', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Air Mineral' => 150],
            ],
            [
                'slug' => 'white', 'name' => 'White', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150],
            ],
            [
                'slug' => 'latte-hot', 'name' => 'Latte Hot', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150],
            ],
            [
                'slug' => 'aren-hot', 'name' => 'Aren Hot', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Gula Aren' => 20],
            ],
            [
                'slug' => 'pandan-hot', 'name' => 'Pandan Hot', 'category' => 'kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Biji Kopi Arabica' => 18, 'Susu Segar' => 150, 'Syrup Pandan' => 20],
            ],

            // ── Non Kopi ────────────────────────────────────────
            [
                'slug' => 'matcha', 'name' => 'Matcha', 'category' => 'non-kopi',
                'price' => 18_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Matcha Powder' => 15, 'Susu Segar' => 150, 'Es Batu' => 60],
            ],
            [
                'slug' => 'banana-milk', 'name' => 'Banana Milk', 'category' => 'non-kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Syrup Pisang' => 20, 'Susu Segar' => 150, 'Es Batu' => 60],
            ],
            [
                'slug' => 'matcha-strawberry', 'name' => 'Matcha Strawberry', 'category' => 'non-kopi',
                'price' => 18_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Matcha Powder' => 15, 'Susu Segar' => 150, 'Syrup Strawberry' => 20, 'Es Batu' => 60],
            ],
            [
                'slug' => 'pandan-milk', 'name' => 'Pandan Milk', 'category' => 'non-kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Syrup Pandan' => 20, 'Susu Segar' => 150, 'Es Batu' => 60],
            ],
            [
                'slug' => 'coklat-milk', 'name' => 'Coklat Milk', 'category' => 'non-kopi',
                'price' => 15_000, 'sizes' => false, 'temperature' => false,
                'recipe' => ['Coklat Bubuk' => 20, 'Susu Segar' => 150, 'Es Batu' => 60],
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
