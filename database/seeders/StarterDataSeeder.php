<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Everything a new shop needs to start selling — and nothing else.
 *
 *   php artisan db:seed
 *
 * Master data only: accounts, settings, categories, ingredients, add-ons,
 * products with their recipes. No customers, no transactions — the first sale
 * you record will be a real one, so the dashboard and reports start clean.
 *
 * Safe to run more than once. Every step creates what is missing and leaves
 * what already exists alone, so it will not duplicate your menu or reset a
 * price you have edited.
 *
 * Order matters: products reference categories and ingredients.
 */
class StarterDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->newLine();
        $this->command?->info('Menyiapkan data awal Paylo…');
        $this->command?->newLine();

        $this->call([
            SettingsSeeder::class,
            UserSeeder::class,
            RuzzCoffeeSeeder::class,
        ]);

        $this->command?->newLine();
        $this->command?->info('Selesai. Masuk sebagai owner@paylo.com (kata sandi: password).');
        $this->command?->line('Langkah berikutnya: perbarui harga bahan di Inventori, lalu cek margin di HPP & margin.');
        $this->command?->newLine();
    }
}
