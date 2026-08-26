<?php

namespace App\Http\Controllers;

use App\Models\ProductAddon;
use App\Services\Settings\SettingsRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductAddonController extends Controller
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function index(): Response
    {
        return Inertia::render('product-addons/index', [
            'addons' => ProductAddon::query()
                ->orderBy('name')
                ->get(['id', 'name', 'price', 'is_active']),

            // The whole feature can be switched off; the screen says so rather
            // than letting an owner wonder why nothing shows up at the till.
            'featureEnabled' => $this->settings->bool('addon_enabled', true),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        ProductAddon::create($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Add-on {$validated['name']} berhasil ditambahkan.",
        ]);
    }

    public function update(Request $request, ProductAddon $productAddon)
    {
        $validated = $request->validate($this->rules());

        $productAddon->update($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Add-on berhasil diperbarui.',
        ]);
    }

    public function destroy(ProductAddon $productAddon)
    {
        $productAddon->delete();

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Add-on berhasil dihapus.',
        ]);
    }

    /** @return array<string, mixed> */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
