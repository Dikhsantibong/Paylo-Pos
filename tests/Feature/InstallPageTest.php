<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use App\Services\Settings\SettingsRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `/install` is handed out as a link, so it has to work for a visitor with no
 * account and no session — and it must never leak anything beyond the shop's
 * public branding.
 */
class InstallPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_open_the_install_page(): void
    {
        $this->get(route('install'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('install')
                ->has('shop')
                ->has('shareUrl')
                ->where('isSignedIn', false)
            );
    }

    public function test_it_shows_the_shop_branding_from_settings(): void
    {
        app(SettingsRepository::class)->put([
            'shop_name' => 'Kopi Senja',
            'shop_tagline' => 'Specialty coffee & roastery',
            'shop_phone' => '0812-0000-0000',
        ]);

        $this->get(route('install'))
            ->assertInertia(fn ($page) => $page
                ->component('install')
                ->where('shop.name', 'Kopi Senja')
                ->where('shop.tagline', 'Specialty coffee & roastery')
                ->where('shop.phone', '0812-0000-0000')
            );
    }

    public function test_it_tells_a_signed_in_visitor_they_can_open_the_app(): void
    {
        $this->actingAs(User::factory()->create(['role' => Role::Owner]))
            ->get(route('install'))
            ->assertInertia(fn ($page) => $page->where('isSignedIn', true));
    }

    public function test_the_share_url_is_absolute_so_it_can_be_pasted_anywhere(): void
    {
        $this->get(route('install'))
            ->assertInertia(fn ($page) => $page->where('shareUrl', route('install')));

        $this->assertStringStartsWith('http', route('install'));
    }

    public function test_the_page_exposes_no_private_data(): void
    {
        $this->get(route('install'))
            ->assertInertia(fn ($page) => $page
                ->missing('shop.email')
                ->where('auth.user', null)
            );
    }

    /** The install prompt only appears for pages inside the manifest scope. */
    public function test_the_manifest_and_service_worker_are_publicly_reachable(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true);

        $this->assertSame('/', $manifest['scope']);
        $this->assertSame('standalone', $manifest['display']);
        $this->assertFileExists(public_path('sw.js'));
    }
}
