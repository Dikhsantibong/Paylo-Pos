<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * Menu groupings. `sort_order` decides the order of the category chips on the
 * cashier screen.
 *
 * Keyed on the slug, and existing rows are left untouched — renaming a category
 * in the app must survive a re-run.
 */
class CategorySeeder extends Seeder
{
    private const CATEGORIES = [
        ['slug' => 'kopi-dingin', 'name' => 'Kopi Dingin', 'sort_order' => 1],
        ['slug' => 'kopi-panas', 'name' => 'Kopi Panas', 'sort_order' => 2],
        ['slug' => 'non-kopi', 'name' => 'Non Kopi', 'sort_order' => 3],
    ];

    public function run(): void
    {
        $created = 0;

        foreach (self::CATEGORIES as $category) {
            $created += Category::firstOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'sort_order' => $category['sort_order'],
                    'is_active' => true,
                ],
            )->wasRecentlyCreated ? 1 : 0;
        }

        $this->command?->info("Kategori: {$created} baru, ".(count(self::CATEGORIES) - $created).' sudah ada.');
    }
}
