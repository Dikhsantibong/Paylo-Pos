<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * The two accounts a shop needs on day one.
 *
 * Existing accounts are never overwritten — re-running the seeder must not
 * reset a password somebody has already changed. It only fills in the email
 * verification stamp, because every POS route sits behind `verified` and an
 * unverified account would be stuck on the verification screen.
 */
class UserSeeder extends Seeder
{
    private const ACCOUNTS = [
        [
            'email' => 'owner@paylo.com',
            'name' => 'Owner',
            'role' => Role::Owner,
        ],
        [
            'email' => 'kasir@paylo.com',
            'name' => 'Kasir',
            'role' => Role::Kasir,
        ],
    ];

    public function run(): void
    {
        foreach (self::ACCOUNTS as $account) {
            $user = User::firstOrNew(['email' => $account['email']]);

            if (! $user->exists) {
                $user->name = $account['name'];
                $user->password = Hash::make('password');
                $user->role = $account['role'];

                $this->command?->info("Akun dibuat: {$account['email']} (kata sandi: password)");
            }

            // Safe to re-apply: the POS is unusable without it.
            $user->email_verified_at ??= now();
            $user->save();
        }

        $this->command?->warn('Ganti kata sandi kedua akun ini sebelum dipakai di toko.');
    }
}
