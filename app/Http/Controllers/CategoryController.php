<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Categories have their own screen: they drive the chip row on the cashier
     * screen, so their order and active state are worth managing directly
     * rather than buried in a tab.
     */
    public function index(): Response
    {
        return Inertia::render('categories/index', [
            'categories' => Category::query()
                ->withCount([
                    'products',
                    'products as active_products_count' => fn ($q) => $q->where('is_active', true),
                ])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'sort_order' => $category->sort_order,
                    'is_active' => (bool) $category->is_active,
                    'products_count' => $category->products_count,
                    'active_products_count' => $category->active_products_count,
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        Category::create([
            ...$validated,
            'slug' => $this->uniqueSlug($validated['name']),
        ]);

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Kategori {$validated['name']} berhasil ditambahkan.",
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate($this->rules());

        $category->update($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Kategori berhasil diperbarui.',
        ]);
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Kategori masih memiliki produk. Pindahkan produknya terlebih dahulu.',
            ]);
        }

        $category->delete();

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }

    /** @return array<string, mixed> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * The slug column is unique, so a second "Kopi" gets "kopi-2".
     * Renaming a category never changes its slug — recipes and reports are
     * keyed on the id, and a stable slug keeps old links working.
     */
    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'kategori';
        $slug = $base;
        $suffix = 2;

        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
