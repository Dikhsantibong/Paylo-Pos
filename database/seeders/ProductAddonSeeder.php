<?php

namespace Database\Seeders;

use App\Models\ProductAddon;
use Illuminate\Database\Seeder;

/**
 * Paid extras offered on the cashier screen.
 *
 * Add-ons carry a selling price but no recipe, so their cost is not part of
 * HPP yet — keep the price comfortably above what the extra actually costs you.
 * The whole feature can be switched off in Pengaturan → Kasir.
 */
class ProductAddonSeeder extends Seeder
{
    /** name, price */
    private const ADDONS = [
        ['Extra Shot', 5_000],
        ['Susu Oat', 7_000],
        ['Syrup Vanilla', 3_000],
        ['Syrup Hazelnut', 3_000],
        ['Syrup Caramel', 3_000],
        ['Whipped Cream', 4_000],
        ['Extra Es Krim', 8_000],
    ];

    public function run(): void
    {
        $created = 0;

        foreach (self::ADDONS as [$name, $price]) {
            $created += ProductAddon::firstOrCreate(
                ['name' => $name],
                ['price' => $price, 'is_active' => true],
            )->wasRecentlyCreated ? 1 : 0;
        }

        $this->command?->info("Add-on: {$created} baru, ".(count(self::ADDONS) - $created).' sudah ada.');
    }
}
