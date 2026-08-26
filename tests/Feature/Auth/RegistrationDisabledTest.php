<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

/**
 * Paylo has no self-service signup. Accounts are created by the owner from the
 * Pengguna screen, so the registration routes must not exist at all — a 404,
 * not a redirect or a disabled-looking form.
 */
class RegistrationDisabledTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_registration_feature_is_switched_off(): void
    {
        $this->assertFalse(Features::enabled(Features::registration()));
    }

    public function test_the_registration_screen_does_not_exist(): void
    {
        $this->get('/register')->assertNotFound();
    }

    public function test_the_registration_endpoint_does_not_exist(): void
    {
        $this->post('/register', [
            'name' => 'Orang Luar',
            'email' => 'orang@luar.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertNotFound();

        $this->assertSame(0, User::count());
        $this->assertGuest();
    }

    public function test_no_route_is_named_register(): void
    {
        $this->assertFalse(app('router')->has('register'));
        $this->assertFalse(app('router')->has('register.store'));
    }

    public function test_the_login_screen_does_not_offer_a_signup_link(): void
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertDontSee('/register');
    }
}
