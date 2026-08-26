<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Services\Costing\HppService;
use Inertia\Inertia;
use Inertia\Response;

/**
 * HPP (Harga Pokok Penjualan) — the cost of goods behind every menu item.
 */
class HppController extends Controller
{
    public function __construct(
        private readonly HppService $hpp,
    ) {}

    public function index(): Response
    {
        $catalogue = $this->hpp->catalogue();

        return Inertia::render('hpp/index', [
            'products' => array_map(function (array $row) {
                $row['suggested_price'] = $this->hpp->suggestedPrice($row['hpp']);

                return $row;
            }, $catalogue),
            'summary' => $this->hpp->catalogueSummary($catalogue),
            'ingredients' => Ingredient::query()
                ->orderBy('name')
                ->get(['id', 'name', 'unit', 'cost_per_unit', 'current_stock', 'min_stock']),
        ]);
    }
}
