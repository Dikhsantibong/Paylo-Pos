<?php

namespace App\Services\Costing;

use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Support\Collection;

/**
 * HPP (Harga Pokok Penjualan / COGS) calculation for coffee-shop products.
 *
 * The cost of one cup is the sum of `recipe.quantity * ingredient.cost_per_unit`
 * over every recipe row attached to the product. A product can also carry
 * variant-specific rows (e.g. a Large uses more milk); those are added on top of
 * the product's shared base recipe.
 *
 * Every figure is in whole rupiah.
 */
class HppService
{
    /**
     * Cost of goods for a single unit of a product (optionally a variant).
     *
     * Base rows (product_variant_id = null) always apply; variant rows apply
     * only to the matching variant.
     */
    public function unitCost(int $productId, ?int $variantId = null): int
    {
        $recipes = Recipe::query()
            ->with('ingredient:id,cost_per_unit')
            ->where('product_id', $productId)
            ->where(function ($q) use ($variantId) {
                $q->whereNull('product_variant_id');

                if ($variantId !== null) {
                    $q->orWhere('product_variant_id', $variantId);
                }
            })
            ->get();

        return $this->sumRecipeCost($recipes);
    }

    /**
     * Same as unitCost() but reusing already-loaded relations, so callers that
     * iterate a catalogue do not fire a query per row.
     *
     * @param  Collection<int, Recipe>  $recipes  all recipes of one product
     */
    public function unitCostFromLoaded(Collection $recipes, ?int $variantId = null): int
    {
        $applicable = $recipes->filter(
            fn (Recipe $r) => $r->product_variant_id === null || $r->product_variant_id === $variantId
        );

        return $this->sumRecipeCost($applicable);
    }

    /**
     * Full costing breakdown for one product, including every variant.
     *
     * @return array<string, mixed>
     */
    public function breakdownFor(Product $product): array
    {
        $product->loadMissing(['recipes.ingredient', 'variants', 'category']);

        $recipes = $product->recipes;

        $baseCost = $this->unitCostFromLoaded($recipes, null);
        $basePrice = (int) $product->base_price;

        $variants = $product->variants
            ->where('is_active', true)
            ->map(function ($variant) use ($recipes, $product) {
                $cost = $this->unitCostFromLoaded($recipes, $variant->id);
                $price = (int) $product->base_price + (int) $variant->price_adjustment;

                return [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'price' => $price,
                ] + $this->metrics($price, $cost);
            })
            ->values()
            ->all();

        $ingredients = $recipes
            ->filter(fn (Recipe $r) => $r->product_variant_id === null)
            ->map(fn (Recipe $r) => [
                'id' => $r->id,
                'ingredient_id' => $r->ingredient_id,
                'name' => $r->ingredient?->name ?? '—',
                'unit' => $r->ingredient?->unit ?? '',
                'quantity' => (float) $r->quantity,
                'cost_per_unit' => (int) ($r->ingredient?->cost_per_unit ?? 0),
                'cost' => (int) round((float) $r->quantity * (int) ($r->ingredient?->cost_per_unit ?? 0)),
            ])
            ->values()
            ->all();

        return [
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category?->name,
            'is_active' => (bool) $product->is_active,
            'has_recipe' => $recipes->isNotEmpty(),
            'price' => $basePrice,
            'ingredients' => $ingredients,
            'variants' => $variants,
        ] + $this->metrics($basePrice, $baseCost);
    }

    /**
     * Costing table for the whole catalogue — one row per product.
     *
     * @return array<int, array<string, mixed>>
     */
    public function catalogue(): array
    {
        return Product::query()
            ->with(['recipes.ingredient:id,name,unit,cost_per_unit', 'variants', 'category:id,name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product) => $this->breakdownFor($product))
            ->all();
    }

    /**
     * Portfolio-level summary of the costing table.
     *
     * @param  array<int, array<string, mixed>>  $catalogue
     * @return array<string, mixed>
     */
    public function catalogueSummary(array $catalogue): array
    {
        $priced = array_values(array_filter($catalogue, fn ($row) => $row['has_recipe'] && $row['price'] > 0));
        $count = count($priced);

        $withoutRecipe = array_values(array_filter($catalogue, fn ($row) => ! $row['has_recipe']));

        $avgMargin = $count > 0
            ? round(array_sum(array_column($priced, 'margin_percent')) / $count, 1)
            : 0.0;

        $avgFoodCost = $count > 0
            ? round(array_sum(array_column($priced, 'food_cost_percent')) / $count, 1)
            : 0.0;

        usort($priced, fn ($a, $b) => $b['margin_percent'] <=> $a['margin_percent']);

        return [
            'productsTotal' => count($catalogue),
            'productsCosted' => $count,
            'productsWithoutRecipe' => array_map(fn ($row) => [
                'id' => $row['id'],
                'name' => $row['name'],
            ], $withoutRecipe),
            'averageMarginPercent' => $avgMargin,
            'averageFoodCostPercent' => $avgFoodCost,
            'healthyCount' => count(array_filter($priced, fn ($r) => $r['health'] === 'healthy')),
            'watchCount' => count(array_filter($priced, fn ($r) => $r['health'] === 'watch')),
            'criticalCount' => count(array_filter($priced, fn ($r) => $r['health'] === 'critical')),
            'bestMargin' => array_slice($priced, 0, 5),
            'worstMargin' => array_slice(array_reverse($priced), 0, 5),
        ];
    }

    /**
     * Derived metrics shared by products and variants.
     *
     * @return array<string, mixed>
     */
    public function metrics(int $price, int $cost): array
    {
        $margin = $price - $cost;
        $marginPercent = $price > 0 ? round($margin / $price * 100, 1) : 0.0;
        $foodCostPercent = $price > 0 ? round($cost / $price * 100, 1) : 0.0;
        $markupPercent = $cost > 0 ? round($margin / $cost * 100, 1) : 0.0;

        return [
            'hpp' => $cost,
            'margin' => $margin,
            'margin_percent' => $marginPercent,
            'food_cost_percent' => $foodCostPercent,
            'markup_percent' => $markupPercent,
            'health' => $this->health($foodCostPercent),
        ];
    }

    /**
     * Industry rule of thumb for F&B: food cost at or under 35% of the selling
     * price is healthy, 35–45% needs attention, above that erodes the margin.
     */
    public function health(float $foodCostPercent): string
    {
        return match (true) {
            $foodCostPercent <= 0 => 'unknown',
            $foodCostPercent <= 35 => 'healthy',
            $foodCostPercent <= 45 => 'watch',
            default => 'critical',
        };
    }

    /**
     * Selling price that hits a target food-cost percentage, rounded up to the
     * nearest 500 rupiah so the result is a usable menu price.
     */
    public function suggestedPrice(int $cost, float $targetFoodCostPercent = 30.0): int
    {
        if ($cost <= 0 || $targetFoodCostPercent <= 0) {
            return 0;
        }

        $raw = $cost / ($targetFoodCostPercent / 100);

        return (int) (ceil($raw / 500) * 500);
    }

    /** @param  Collection<int, Recipe>  $recipes */
    private function sumRecipeCost(Collection $recipes): int
    {
        return (int) round($recipes->sum(
            fn (Recipe $recipe) => (float) $recipe->quantity * (int) ($recipe->ingredient?->cost_per_unit ?? 0)
        ));
    }
}
