<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_owners_can_visit_the_dashboard()
    {
        $owner = User::factory()->create(['role' => Role::Owner]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk();
    }

    public function test_cashiers_cannot_visit_the_dashboard()
    {
        $cashier = User::factory()->create(['role' => Role::Kasir]);

        $this->actingAs($cashier)
            ->get(route('dashboard'))
            ->assertForbidden();
    }

    public function test_dashboard_ships_every_panel()
    {
        $owner = User::factory()->create(['role' => Role::Owner]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('kpis')
                ->has('salesTrend')
                ->has('hourlyTraffic')
                ->has('topProducts')
                ->has('categoryMix')
                ->has('paymentMix')
                ->has('weekdayPerformance')
                ->has('profitTrend')
                ->has('lowStock')
                ->has('recentTransactions')
                ->has('topCustomers')
                ->has('highlights')
            );
    }
}
