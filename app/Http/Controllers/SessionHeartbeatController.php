<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Keeps a standby cashier terminal signed in.
 *
 * The browser pings this endpoint while the app is open; touching the session
 * refreshes its idle timer and returns a fresh CSRF token, so a terminal left
 * alone for hours can still charge the next customer without a surprise
 * "page expired" on submit.
 */
class SessionHeartbeatController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->session()->put('last_heartbeat_at', now()->toIso8601String());

        return response()->json([
            'authenticated' => $request->user() !== null,
            'csrf_token' => csrf_token(),
            'lifetime_minutes' => (int) config('session.lifetime'),
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
