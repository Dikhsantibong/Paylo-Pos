<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Services\Costing\HppService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly HppService $hpp,
    ) {}

    /**
     * Products only — categories live at /categories and add-ons at
     * /product-addons, each with their own controller and screen.
     */
    public function index(): Response
    {
        $products = Product::query()
            ->with(['category:id,name', 'variants', 'recipes.ingredient:id,cost_per_unit'])
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) {
                $cost = $this->hpp->unitCostFromLoaded($product->recipes, null);

                return [
                    'id' => $product->id,
                    'category_id' => $product->category_id,
                    'category' => $product->category,
                    'name' => $product->name,
                    'description' => $product->description,
                    'base_price' => (int) $product->base_price,
                    'is_active' => (bool) $product->is_active,
                    'has_variants' => (bool) $product->has_variants,
                    'has_temperature' => (bool) $product->has_temperature,
                    'has_sugar_level' => (bool) $product->has_sugar_level,
                    'variants' => $product->variants,
                    'hpp' => $cost,
                    'margin_percent' => $product->base_price > 0
                        ? round(((int) $product->base_price - $cost) / (int) $product->base_price * 100, 1)
                        : 0.0,
                    'has_recipe' => $product->recipes->isNotEmpty(),
                ];
            });

        return Inertia::render('products/index', [
            'products' => $products,
            // Categories and add-ons have their own screens now; the form
            // only needs the category list to populate its select.
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'sort_order']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        $product = Product::create([
            ...$validated,
            'slug' => Str::slug($validated['name']).'-'.Str::random(4),
        ]);

        $this->syncVariants($product, $validated['variants'] ?? []);

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Produk {$product->name} berhasil ditambahkan.",
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate($this->rules($product->id));

        $product->update($validated);

        if (array_key_exists('variants', $validated)) {
            $this->syncVariants($product, $validated['variants'] ?? []);
        }

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Produk {$product->name} berhasil diperbarui.",
        ]);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Produk berhasil dihapus.',
        ]);
    }

    /** @return array<string, mixed> */
    private function rules(?int $ignoreId = null): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'base_price' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'has_variants' => ['boolean'],
            'has_temperature' => ['boolean'],
            'has_sugar_level' => ['boolean'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'exists:product_variants,id'],
            'variants.*.name' => ['required', 'string', 'max:50'],
            'variants.*.price_adjustment' => ['required', 'integer'],
        ];
    }

    /**
     * Replace the product's variant list with the submitted one, keeping ids so
     * existing recipes and sales history stay attached.
     *
     * @param  array<int, array<string, mixed>>  $variants
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $keptIds = [];

        foreach ($variants as $variant) {
            $payload = [
                'name' => $variant['name'],
                'price_adjustment' => $variant['price_adjustment'],
                'is_active' => true,
            ];

            if (! empty($variant['id'])) {
                $product->variants()->whereKey($variant['id'])->update($payload);
                $keptIds[] = (int) $variant['id'];

                continue;
            }

            $keptIds[] = $product->variants()->create($payload)->id;
        }

        $product->variants()->whereNotIn('id', $keptIds ?: [0])->delete();
    }
}
