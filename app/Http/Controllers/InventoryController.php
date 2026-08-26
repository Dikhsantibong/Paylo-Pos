<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        $ingredients = Ingredient::orderBy('name')->get()->map(function ($ingredient) {
            $ingredient->is_low_stock = $ingredient->isLowStock();

            return $ingredient;
        });

        return Inertia::render('inventory/index', [
            'ingredients' => $ingredients,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|in:gram,ml,pcs,pack',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|integer|min:0',
        ]);

        Ingredient::create($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Bahan {$validated['name']} berhasil ditambahkan.",
        ]);
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|in:gram,ml,pcs,pack',
            'min_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|integer|min:0',
        ]);

        $ingredient->update($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Bahan berhasil diperbarui.',
        ]);
    }

    public function addStock(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $ingredient->addStock(
            $validated['quantity'],
            $request->user()->id,
            $validated['notes']
        );

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Stok {$ingredient->name} berhasil ditambahkan.",
        ]);
    }

    public function history(Ingredient $ingredient)
    {
        $entries = $ingredient->entries()
            ->with('user')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'ingredient' => $ingredient,
            'entries' => $entries,
        ]);
    }
}
