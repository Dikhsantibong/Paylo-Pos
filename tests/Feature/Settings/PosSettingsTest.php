<?php

namespace Tests\Feature\Settings;

use App\Enums\Role;
use App\Models\Setting;
use App\Models\User;
use App\Services\Settings\SettingsRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PosSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => Role::Owner]);
    }

    public function test_settings_fall_back_to_their_declared_defaults(): void
    {
        $settings = app(SettingsRepository::class);

        $this->assertSame(0, Setting::count());
        $this->assertSame('Paylo Coffee', $settings->string('shop_name'));
        $this->assertTrue($settings->bool('addon_enabled'));
        $this->assertFalse($settings->bool('tax_enabled'));
        $this->assertSame(0, $settings->int('session_lifetime'));
    }

    public function test_values_round_trip_with_the_right_types(): void
    {
        $this->actingAs($this->owner)
            ->post(route('settings-pos.update'), [
                'shop_name' => 'Kopi Senja',
                'tax_enabled' => '1',
                'tax_rate' => '11',
                'addon_enabled' => '0',
                'session_lifetime' => '480',
            ])
            ->assertRedirect();

        $settings = app(SettingsRepository::class);
        $settings->flush();

        $this->assertSame('Kopi Senja', $settings->string('shop_name'));
        $this->assertTrue($settings->bool('tax_enabled'));
        $this->assertSame(11.0, $settings->float('tax_rate'));
        $this->assertFalse($settings->bool('addon_enabled'));
        $this->assertSame(480, $settings->int('session_lifetime'));
    }

    public function test_blank_numeric_fields_fall_back_instead_of_failing_validation(): void
    {
        $this->actingAs($this->owner)
            ->post(route('settings-pos.update'), [
                'shop_name' => 'Kopi Senja',
                'tax_rate' => '',
                'session_lifetime' => '',
            ])
            ->assertSessionHasNoErrors();
    }

    public function test_the_logo_can_be_uploaded_and_removed(): void
    {
        Storage::fake('public');

        $this->actingAs($this->owner)
            ->post(route('settings-pos.update'), [
                'shop_name' => 'Kopi Senja',
                'logo' => UploadedFile::fake()->image('logo.png', 512, 512),
            ])
            ->assertRedirect();

        $settings = app(SettingsRepository::class);
        $settings->flush();

        $path = $settings->string('shop_logo');

        $this->assertNotSame('', $path);
        Storage::disk('public')->assertExists($path);

        $this->actingAs($this->owner)
            ->post(route('settings-pos.update'), [
                'shop_name' => 'Kopi Senja',
                'remove_logo' => '1',
            ]);

        $settings->flush();

        $this->assertSame('', $settings->string('shop_logo'));
        Storage::disk('public')->assertMissing($path);
    }

    public function test_an_oversized_or_wrong_format_logo_is_rejected(): void
    {
        Storage::fake('public');

        $this->actingAs($this->owner)
            ->post(route('settings-pos.update'), [
                'shop_name' => 'Kopi Senja',
                'logo' => UploadedFile::fake()->create('brochure.pdf', 100, 'application/pdf'),
            ])
            ->assertSessionHasErrors('logo');
    }

    public function test_a_zero_lifetime_means_the_session_never_expires(): void
    {
        app(SettingsRepository::class)->put(['session_lifetime' => 0]);

        $this->actingAs($this->owner)->get(route('settings-pos.index'));

        $this->assertSame(
            (int) config('paylo.session_forever_minutes'),
            (int) config('session.lifetime'),
        );
    }

    public function test_a_configured_lifetime_is_applied_to_the_session(): void
    {
        app(SettingsRepository::class)->put(['session_lifetime' => 480]);

        $this->actingAs($this->owner)->get(route('settings-pos.index'));

        $this->assertSame(480, (int) config('session.lifetime'));
    }

    public function test_the_heartbeat_keeps_an_authenticated_session_alive(): void
    {
        $this->actingAs($this->owner)
            ->postJson(route('session.heartbeat'))
            ->assertOk()
            ->assertJson(['authenticated' => true])
            ->assertJsonStructure(['authenticated', 'csrf_token', 'lifetime_minutes', 'server_time']);
    }

    public function test_only_owners_can_open_settings(): void
    {
        $this->actingAs(User::factory()->create(['role' => Role::Kasir]))
            ->get(route('settings-pos.index'))
            ->assertForbidden();
    }
}
