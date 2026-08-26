<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_sent_to_the_login_screen()
    {
        $this->get(route('home'))->assertRedirect(route('login'));
    }

    public function test_owners_land_on_the_dashboard()
    {
        $owner = User::factory()->create(['role' => Role::Owner]);

        $this->actingAs($owner)
            ->get(route('home'))
            ->assertRedirect(route('dashboard'));
    }

    public function test_cashiers_land_on_the_cashier_screen()
    {
        $cashier = User::factory()->create(['role' => Role::Kasir]);

        $this->actingAs($cashier)
            ->get(route('home'))
            ->assertRedirect(route('pos.index'));
    }
}
