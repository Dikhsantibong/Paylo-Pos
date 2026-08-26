<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot the HPP (COGS) at the moment of sale.
     *
     * Recipes and ingredient prices change over time; storing the cost on the
     * line item keeps historical profit reports accurate and lets the dashboard
     * sum margins without walking the recipe tree on every request.
     */
    public function up(): void
    {
        Schema::table('transaction_items', function (Blueprint $table) {
            $table->unsignedInteger('unit_cost')->default(0)->after('unit_price');
            $table->unsignedInteger('cost_subtotal')->default(0)->after('subtotal');
        });

        $this->backfillExistingItems();
    }

    /**
     * Estimate the cost of already-recorded sales from today's recipe prices so
     * historical reports are not blank. Newer sales snapshot their own cost.
     */
    private function backfillExistingItems(): void
    {
        $costs = DB::table('recipes')
            ->join('ingredients', 'recipes.ingredient_id', '=', 'ingredients.id')
            ->whereNull('recipes.product_variant_id')
            ->groupBy('recipes.product_id')
            ->selectRaw('recipes.product_id, ROUND(SUM(recipes.quantity * ingredients.cost_per_unit)) as unit_cost')
            ->pluck('unit_cost', 'product_id');

        foreach ($costs as $productId => $unitCost) {
            DB::table('transaction_items')
                ->where('product_id', $productId)
                ->update([
                    'unit_cost' => (int) $unitCost,
                    'cost_subtotal' => DB::raw('quantity * '.(int) $unitCost),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('transaction_items', function (Blueprint $table) {
            $table->dropColumn(['unit_cost', 'cost_subtotal']);
        });
    }
};
