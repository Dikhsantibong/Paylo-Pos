<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * See StarterDataSeeder: master data only, no transactions, safe to re-run.
     */
    public function run(): void
    {
        $this->call(StarterDataSeeder::class);
    }
}
