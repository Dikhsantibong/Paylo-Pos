<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;

/**
 * Raw materials, with an opening stock and a purchase price per unit.
 *
 * `cost_per_unit` is what drives HPP for every menu item, so these are the
 * numbers to correct first with your real supplier prices — Inventori →
 * Harga per satuan.
 *
 * Existing ingredients are never touched: a re-run must not reset stock levels
 * or overwrite prices you have already updated.
 */
class IngredientSeeder extends Seeder
{
    /** name, unit, opening stock, minimum stock, rupiah per unit */
    private const INGREDIENTS = [
        // Kopi & susu
        ['Biji Kopi Arabica', 'gram', 5_000, 500, 150],
        ['Susu Segar', 'ml', 10_000, 2_000, 15],
        ['Susu Oat', 'ml', 3_000, 500, 45],

        // Bubuk & pemanis
        ['Coklat Bubuk', 'gram', 3_000, 500, 80],
        ['Matcha Powder', 'gram', 1_000, 200, 200],
        ['Bubuk Taro', 'gram', 1_000, 200, 120],
        ['Gula Cair', 'ml', 3_000, 500, 20],

        // Syrup
        ['Syrup Vanilla', 'ml', 2_000, 300, 40],
        ['Syrup Hazelnut', 'ml', 2_000, 300, 40],
        ['Syrup Caramel', 'ml', 2_000, 300, 40],

        // Dasar
        ['Air Mineral', 'ml', 50_000, 10_000, 2],
        ['Es Batu', 'gram', 20_000, 5_000, 3],

        // Teh & buah
        ['Teh Celup', 'pcs', 200, 50, 1_000],
        ['Lemon', 'pcs', 100, 20, 3_000],
        ['Jeruk Peras', 'pcs', 150, 30, 2_000],
        ['Pisang', 'pcs', 60, 15, 2_500],

        // Topping
        ['Es Krim Vanilla', 'gram', 3_000, 500, 40],
        ['Whipped Cream', 'gram', 1_000, 200, 60],

        // Dapur
        ['Kentang Beku', 'gram', 5_000, 1_000, 40],
        ['Nugget Ayam', 'gram', 4_000, 800, 60],
        ['Minyak Goreng', 'ml', 5_000, 1_000, 25],

        // Pastry siap saji
        ['Croissant Beku', 'pcs', 60, 15, 5_500],
        ['Banana Bread Slice', 'pcs', 40, 10, 4_500],
        ['Chocolate Cake Slice', 'pcs', 40, 10, 7_500],
    ];

    public function run(): void
    {
        $created = 0;

        foreach (self::INGREDIENTS as [$name, $unit, $stock, $minStock, $cost]) {
            $created += Ingredient::firstOrCreate(
                ['name' => $name],
                [
                    'unit' => $unit,
                    'current_stock' => $stock,
                    'min_stock' => $minStock,
                    'cost_per_unit' => $cost,
                ],
            )->wasRecentlyCreated ? 1 : 0;
        }

        $this->command?->info("Bahan baku: {$created} baru, ".(count(self::INGREDIENTS) - $created).' sudah ada.');
    }
}
