<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::withCount('transactions')
            ->orderBy('name')
            ->get();

        return Inertia::render('customers/index', [
            'customers' => $customers,
        ]);
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'transactions' => function ($q) {
                $q->with('items.addons')
                    ->orderByDesc('created_at')
                    ->limit(20);
            },
        ]);

        return response()->json($customer);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        Customer::create($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Customer {$validated['name']} berhasil ditambahkan.",
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $customer->update($validated);

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Customer berhasil diperbarui.',
        ]);
    }
}
