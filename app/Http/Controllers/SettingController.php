<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdatePosSettingsRequest;
use App\Services\Settings\SettingsRepository;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function index(): Response
    {
        return Inertia::render('settings-pos/index', [
            'settings' => $this->settings->all(),
            'logoUrl' => $this->settings->imageUrl('shop_logo'),
            'sessionDefaults' => [
                'configured' => (int) config('session.lifetime'),
                'foreverMinutes' => (int) config('paylo.session_forever_minutes'),
            ],
        ]);
    }

    public function update(UpdatePosSettingsRequest $request): RedirectResponse
    {
        $this->settings->put($request->settingValues());

        if ($request->boolean('remove_logo')) {
            $this->settings->forgetImage('shop_logo');
        }

        if ($request->hasFile('logo')) {
            $this->settings->putImage('shop_logo', $request->file('logo'));
        }

        return back()->with('flash', [
            'type' => 'success',
            'message' => 'Pengaturan tersimpan.',
        ]);
    }
}
