<?php

namespace App\Http\Middleware;

use App\Services\Settings\SettingsRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Applies the operator-configured session lifetime.
 *
 * A POS terminal is expected to stay signed in for a whole shift, so the owner
 * can set the idle limit in Settings — 0 meaning "never expire". This runs
 * *before* StartSession so the value is in place when the session cookie and
 * garbage-collection window are computed.
 */
class ConfigureSessionLifetime
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $minutes = $this->settings->int('session_lifetime', 0);

        if ($minutes <= 0) {
            $minutes = (int) config('paylo.session_forever_minutes');
        }

        config([
            'session.lifetime' => $minutes,
            'session.expire_on_close' => false,
        ]);

        return $next($request);
    }
}
