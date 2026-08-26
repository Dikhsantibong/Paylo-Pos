<?php

namespace Tests\Feature\Catalog;

use App\Enums\Role;
use App\Models\ProductAddon;
use App\Models\User;
use App\Services\Settings\SettingsRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductAddonManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => Role::Owner]);
    }

    public function test_add_ons_have_their_own_screen(): void
    {
        ProductAddon::create(['name' => 'Extra Shot', 'price' => 5_000, 'is_active' => true]);

        $this->actingAs($this->owner)
            ->get(route('product-addons.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('product-addons/index')
                ->has('addons', 1)
                ->where('addons.0.name', 'Extra Shot')
                ->where('featureEnabled', true)
            );
    }

    public function test_the_screen_reports_when_the_feature_is_switched_off(): void
    {
        app(SettingsRepository::class)->put(['addon_enabled' => false]);

        $this->actingAs($this->owner)
            ->get(route('product-addons.index'))
            ->assertInertia(fn ($page) => $page->where('featureEnabled', false));
    }

    public function test_an_add_on_can_be_created_updated_and_deleted(): void
    {
        $this->actingAs($this->owner)
            ->post(route('product-addons.store'), [
                'name' => 'Susu Oat',
                'price' => 7_000,
                'is_active' => true,
            ])
            ->assertRedirect();

        $addon = ProductAddon::sole();
        $this->assertSame(7_000, $addon->price);

        $this->actingAs($this->owner)
            ->put(route('product-addons.update', $addon), [
                'name' => 'Susu Oat',
                'price' => 8_000,
                'is_active' => false,
            ]);

        $addon->refresh();
        $this->assertSame(8_000, $addon->price);
        $this->assertFalse($addon->is_active);

        $this->actingAs($this->owner)->delete(route('product-addons.destroy', $addon));
        $this->assertModelMissing($addon);
    }

    public function test_a_negative_price_is_rejected(): void
    {
        $this->actingAs($this->owner)
            ->post(route('product-addons.store'), ['name' => 'Diskon', 'price' => -1_000])
            ->assertSessionHasErrors('price');

        $this->assertSame(0, ProductAddon::count());
    }

    public function test_guests_are_sent_to_the_login_screen(): void
    {
        $this->get(route('product-addons.index'))->assertRedirect(route('login'));
    }
}
