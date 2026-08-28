<?php
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
App\Models\Recipe::truncate();
App\Models\Product::truncate();
App\Models\Ingredient::truncate();
App\Models\Category::truncate();
App\Models\ProductAddon::truncate();
App\Models\ProductVariant::truncate();
App\Models\IngredientEntry::truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');
echo "Tables truncated.\n";
