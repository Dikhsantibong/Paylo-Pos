<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
App\Models\Recipe::truncate();
App\Models\Product::truncate();
App\Models\Ingredient::truncate();
App\Models\Category::truncate();
App\Models\ProductAddon::truncate();
App\Models\ProductVariant::truncate();
App\Models\IngredientEntry::truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');
echo "OK\n";