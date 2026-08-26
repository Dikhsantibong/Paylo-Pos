<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('users/index', [
            'users' => User::query()
                ->withCount('transactions')
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value,
                    'role_label' => $user->role?->label(),
                    'transactions_count' => $user->transactions_count,
                    'created_at' => $user->created_at?->translatedFormat('d M Y'),
                ]),
            'roles' => Role::options(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(Role::values())],
        ]);

        User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Pengguna {$validated['name']} berhasil ditambahkan.",
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(Role::values())],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if ($user->id === $request->user()->id && $validated['role'] !== Role::Owner->value) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Anda tidak dapat menurunkan peran akun sendiri.',
            ]);
        }

        $user->update(array_filter([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => filled($validated['password'] ?? null)
                ? Hash::make($validated['password'])
                : null,
        ]));

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Pengguna berhasil diperbarui.',
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Anda tidak dapat menghapus akun sendiri.',
            ]);
        }

        if ($user->transactions()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Pengguna ini memiliki riwayat transaksi dan tidak dapat dihapus.',
            ]);
        }

        $user->delete();

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Pengguna berhasil dihapus.',
        ]);
    }
}
