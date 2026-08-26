<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The whole access matrix in one place. Cashiers run the shop floor;
     * owners additionally see money, costing and configuration.
     *
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function cashierRoutes(): array
    {
        return [
            'cashier screen' => ['pos.index', true],
            'products' => ['products.index', true],
            'categories' => ['categories.index', true],
            'add-ons' => ['product-addons.index', true],
            'customers' => ['customers.index', true],
            'inventory' => ['inventory.index', true],
            'dashboard' => ['dashboard', false],
            'reports' => ['reports.index', false],
            'costing' => ['hpp.index', false],
            'recipes' => ['recipes.index', false],
            'users' => ['users.index', false],
            'settings' => ['settings-pos.index', false],
        ];
    }

    #[DataProvider('cashierRoutes')]
    public function test_cashier_access(string $route, bool $allowed): void
    {
        $response = $this->actingAs(User::factory()->create(['role' => Role::Kasir]))
            ->get(route($route));

        $allowed ? $response->assertOk() : $response->assertForbidden();
    }

    #[DataProvider('cashierRoutes')]
    public function test_owner_access(string $route, bool $allowedForCashier): void
    {
        $this->actingAs(User::factory()->create(['role' => Role::Owner]))
            ->get(route($route))
            ->assertOk();
    }

    public function test_the_barista_role_no_longer_exists(): void
    {
        $this->assertSame(['owner', 'kasir'], Role::values());

        $this->actingAs(User::factory()->create(['role' => Role::Owner]))
            ->post(route('users.store'), [
                'name' => 'Barista',
                'email' => 'barista@paylo.test',
                'password' => 'password123',
                'role' => 'barista',
            ])
            ->assertSessionHasErrors('role');
    }

    public function test_an_owner_cannot_demote_their_own_account(): void
    {
        $owner = User::factory()->create(['role' => Role::Owner]);

        $this->actingAs($owner)
            ->put(route('users.update', $owner), [
                'name' => $owner->name,
                'email' => $owner->email,
                'role' => 'kasir',
            ]);

        $this->assertTrue($owner->fresh()->isOwner());
    }

    public function test_a_user_with_sales_history_cannot_be_deleted(): void
    {
        $owner = User::factory()->create(['role' => Role::Owner]);
        $cashier = User::factory()->create(['role' => Role::Kasir]);

        $cashier->transactions()->create([
            'transaction_number' => 'TRX-TEST-0001',
            'subtotal' => 10_000,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'discount' => 0,
            'total' => 10_000,
            'payment_method' => 'cash',
            'payment_amount' => 10_000,
            'change_amount' => 0,
            'status' => 'completed',
        ]);

        $this->actingAs($owner)->delete(route('users.destroy', $cashier));

        $this->assertNotNull($cashier->fresh());
    }
}
