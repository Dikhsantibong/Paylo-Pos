<?php

use App\Http\Controllers\InstallController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $user = auth()->user();

    return $user
        ? redirect()->route($user->homeRoute())
        : redirect()->route('login');
})->name('home');

// Public, shareable install guide — see InstallController.
Route::get('install', InstallController::class)->name('install');

require __DIR__.'/settings.php';
require __DIR__.'/pos.php';
