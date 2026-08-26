<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HppController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductAddonController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SessionHeartbeatController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Paylo POS Routes
|--------------------------------------------------------------------------
|
| Two roles exist: `owner` (everything) and `kasir` (day-to-day operations).
| The sale completes at the cashier — there is no downstream barista queue.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // Keeps a standby terminal signed in; see ConfigureSessionLifetime.
    Route::post('session/heartbeat', SessionHeartbeatController::class)->name('session.heartbeat');

    /*
     | Operations — owner + kasir
     */
    Route::middleware('role:owner,kasir')->group(function () {
        // Cashier
        Route::get('pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('pos/checkout', [PosController::class, 'checkout'])->name('pos.checkout');

        // Catalogue
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('product-addons', [ProductAddonController::class, 'index'])->name('product-addons.index');
        Route::post('product-addons', [ProductAddonController::class, 'store'])->name('product-addons.store');
        Route::put('product-addons/{productAddon}', [ProductAddonController::class, 'update'])->name('product-addons.update');
        Route::delete('product-addons/{productAddon}', [ProductAddonController::class, 'destroy'])->name('product-addons.destroy');

        // Customers
        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
        Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');

        // Inventory
        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('inventory', [InventoryController::class, 'store'])->name('inventory.store');
        Route::put('inventory/{ingredient}', [InventoryController::class, 'update'])->name('inventory.update');
        Route::post('inventory/{ingredient}/add-stock', [InventoryController::class, 'addStock'])->name('inventory.add-stock');
        Route::get('inventory/{ingredient}/history', [InventoryController::class, 'history'])->name('inventory.history');
    });

    /*
     | Management — owner only
     */
    Route::middleware('role:owner')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Reports
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export/pdf', [ReportController::class, 'exportPdf'])->name('reports.export.pdf');
        Route::get('reports/export/excel', [ReportController::class, 'exportExcel'])->name('reports.export.excel');

        // Costing
        Route::get('hpp', [HppController::class, 'index'])->name('hpp.index');

        // Recipes
        Route::get('recipes', [RecipeController::class, 'index'])->name('recipes.index');
        Route::post('recipes', [RecipeController::class, 'store'])->name('recipes.store');
        Route::put('recipes/{recipe}', [RecipeController::class, 'update'])->name('recipes.update');
        Route::delete('recipes/{recipe}', [RecipeController::class, 'destroy'])->name('recipes.destroy');

        // People
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Settings
        Route::get('settings-pos', [SettingController::class, 'index'])->name('settings-pos.index');
        Route::post('settings-pos', [SettingController::class, 'update'])->name('settings-pos.update');
    });
});
