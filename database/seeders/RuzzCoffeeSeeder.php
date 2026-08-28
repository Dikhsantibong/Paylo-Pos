<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RuzzCoffeeSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding data untuk Ruzz Coffee...');

        // 1. Kategori
        $categoriesData = [
            ['name' => 'Coffee', 'slug' => 'coffee'],
            ['name' => 'Non Coffee', 'slug' => 'non-coffee'],
        ];

        foreach ($categoriesData as $cat) {
            Category::firstOrCreate(
                ['slug' => $cat['slug']],
                ['name' => $cat['name']]
            );
        }
        $categories = Category::query()->pluck('id', 'slug');

        // 2. Bahan Baku
        $ingredientsData = [
            ['Biji Kopi Arabica', 'gram', 2000, 500, 180],
            ['Cup', 'pcs', 500, 50, 1250],
            ['Pipet', 'pcs', 500, 50, 74],
            ['Susu UHT', 'ml', 12000, 1000, 21],
            ['Matcha Powder', 'gram', 800, 200, 238],
            ['Dark Coco', 'gram', 1000, 200, 65],
            ['Creamer', 'gram', 1000, 200, 57],
            ['Susu Kental Manis (SKM)', 'gram', 4000, 500, 13],
            ['Gula Cair', 'ml', 5000, 500, 15],
            ['Es Batu', 'gram', 15000, 2000, 1],
            ['Jus Orange', 'ml', 1000, 200, 35],
            ['Teh Sari Wangi', 'pcs', 80, 10, 375],
            ['Air Galon', 'ml', 50000, 5000, 1],
            ['Sirup Pandan', 'ml', 1000, 200, 120],
            ['Sirup Aren', 'ml', 1000, 200, 120],
            ['Sirup Caramel', 'ml', 1000, 200, 120],
            ['Sirup Butterscotch', 'ml', 1000, 200, 120],
            ['Sirup Vanilla', 'ml', 1000, 200, 120],
            ['Sirup Peach', 'ml', 1000, 200, 120],
            ['Sirup Lychee', 'ml', 1000, 200, 120],
            ['Sirup Lemon', 'ml', 1000, 200, 120],
        ];

        foreach ($ingredientsData as [$name, $unit, $stock, $minStock, $cost]) {
            Ingredient::firstOrCreate(
                ['name' => $name],
                [
                    'unit' => $unit,
                    'current_stock' => $stock,
                    'min_stock' => $minStock,
                    'cost_per_unit' => $cost,
                ]
            );
        }
        $ingredients = Ingredient::query()->pluck('id', 'name');

        // 3. Produk & Resep
        $productsData = [
            [
                'name' => 'Coffe Pandan',
                'category' => 'coffee',
                'price' => 15000,
                'recipe' => [
                    'Biji Kopi Arabica' => 15,
                    'Susu UHT' => 120,
                    'Sirup Pandan' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Coffe Aren',
                'category' => 'coffee',
                'price' => 15000,
                'recipe' => [
                    'Biji Kopi Arabica' => 15,
                    'Susu UHT' => 120,
                    'Sirup Aren' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Coffe Caramel',
                'category' => 'coffee',
                'price' => 18000,
                'recipe' => [
                    'Biji Kopi Arabica' => 15,
                    'Susu UHT' => 120,
                    'Sirup Caramel' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Coffe Butterscoot',
                'category' => 'coffee',
                'price' => 18000,
                'recipe' => [
                    'Biji Kopi Arabica' => 15,
                    'Susu UHT' => 120,
                    'Sirup Butterscotch' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Coffe Vanila',
                'category' => 'coffee',
                'price' => 18000,
                'recipe' => [
                    'Biji Kopi Arabica' => 15,
                    'Susu UHT' => 120,
                    'Sirup Vanilla' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Americano Peach',
                'category' => 'coffee',
                'price' => 15000,
                'recipe' => [
                    'Biji Kopi Arabica' => 15,
                    'Air Galon' => 150,
                    'Sirup Peach' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Dark Coco',
                'category' => 'non-coffee',
                'price' => 15000,
                'recipe' => [
                    'Dark Coco' => 20,
                    'Susu UHT' => 100,
                    'Creamer' => 15,
                    'Susu Kental Manis (SKM)' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Matcha Latte',
                'category' => 'non-coffee',
                'price' => 18000,
                'recipe' => [
                    'Matcha Powder' => 15,
                    'Susu UHT' => 100,
                    'Creamer' => 10,
                    'Susu Kental Manis (SKM)' => 15,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Lyche Tea',
                'category' => 'non-coffee',
                'price' => 12000,
                'recipe' => [
                    'Teh Sari Wangi' => 1,
                    'Air Galon' => 150,
                    'Gula Cair' => 15,
                    'Sirup Lychee' => 20,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
            [
                'name' => 'Lemon Tea',
                'category' => 'non-coffee',
                'price' => 12000,
                'recipe' => [
                    'Teh Sari Wangi' => 1,
                    'Air Galon' => 150,
                    'Gula Cair' => 15,
                    'Sirup Lemon' => 20,
                    'Jus Orange' => 5,
                    'Es Batu' => 100,
                    'Cup' => 1,
                    'Pipet' => 1,
                ]
            ],
        ];

        foreach ($productsData as $def) {
            $catId = $categories[$def['category']] ?? null;

            $product = Product::firstOrCreate(
                ['slug' => Str::slug($def['name'])],
                [
                    'category_id' => $catId,
                    'name' => $def['name'],
                    'base_price' => $def['price'],
                    'is_active' => true,
                    'has_variants' => false,
                    'has_temperature' => false,
                ]
            );

            // Resep
            foreach ($def['recipe'] as $ingName => $quantity) {
                if (isset($ingredients[$ingName])) {
                    $product->recipes()->firstOrCreate([
                        'ingredient_id' => $ingredients[$ingName],
                    ], [
                        'quantity' => $quantity,
                    ]);
                }
            }
        }

        $this->command->info('Seeder Ruzz Coffee berhasil dijalankan!');
    }
}