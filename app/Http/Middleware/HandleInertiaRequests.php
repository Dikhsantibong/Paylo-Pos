<?php

namespace App\Http\Middleware;

use App\Services\Settings\SettingsRepository;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props every page receives.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),

            'name' => config('app.name'),

            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value,
                    'role_label' => $user->role?->label(),
                    'email_verified_at' => $user->email_verified_at,
                    'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
                ] : null,
            ],

            // Branding + POS toggles the shell needs on every screen.
            'brand' => fn () => [
                'name' => $this->settings->string('shop_name', 'Paylo Coffee'),
                'tagline' => $this->settings->string('shop_tagline'),
                'logo' => $this->settings->imageUrl('shop_logo'),
            ],

            'session' => fn () => [
                'lifetimeMinutes' => (int) config('session.lifetime'),
                'keepAlive' => $this->settings->bool('session_keepalive', true),
                'neverExpires' => $this->settings->int('session_lifetime', 0) === 0,
            ],

            'flash' => fn () => $request->session()->get('flash'),
            'receipt' => fn () => $request->session()->get('receipt'),

            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
