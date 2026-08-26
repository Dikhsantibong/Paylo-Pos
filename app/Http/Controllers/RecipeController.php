<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecipeController extends Controller
{
    public function index()
    {
        $products = Product::with(['recipes.ingredient', 'variants', 'category:id,name'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $ingredients = Ingredient::orderBy('name')->get();

        return Inertia::render('recipes/index', [
            'products' => $products,
            'ingredients' => $ingredients,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.01',
        ]);

        // Check for duplicate
        $exists = Recipe::where('product_id', $validated['product_id'])
            ->where('ingredient_id', $validated['ingredient_id'])
            ->where('product_variant_id', $validated['product_variant_id'] ?? null)
            ->exists();

        if ($exists) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Resep untuk kombinasi ini sudah ada.',
            ]);
        }

        Recipe::create($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Resep berhasil ditambahkan.',
        ]);
    }

    public function update(Request $request, Recipe $recipe)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
        ]);

        $recipe->update($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Resep berhasil diperbarui.',
        ]);
    }

    public function destroy(Recipe $recipe)
    {
        $recipe->delete();

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Resep berhasil dihapus.',
        ]);
    }
}
