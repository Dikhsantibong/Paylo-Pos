<?php

namespace App\Http\Controllers;

use App\Services\Settings\SettingsRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public install page.
 *
 * A link the shop can hand to anyone — staff setting up a new terminal, or a
 * prospect trying Paylo — that explains what the app is and walks them through
 * adding it to their device. Deliberately outside the auth middleware so it can
 * be shared, and it exposes nothing but the shop's public branding.
 */
class InstallController extends Controller
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function __invoke(Request $request): Response
    {
        return Inertia::render('install', [
            'shop' => [
                'name' => $this->settings->string('shop_name', 'Paylo'),
                'tagline' => $this->settings->string('shop_tagline'),
                'address' => $this->settings->string('shop_address'),
                'phone' => $this->settings->string('shop_phone'),
                'logo' => $this->settings->imageUrl('shop_logo'),
            ],
            'shareUrl' => route('install'),
            'isSignedIn' => $request->user() !== null,
        ]);
    }
}
