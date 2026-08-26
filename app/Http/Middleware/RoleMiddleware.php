<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * @param  Closure(Request): Response  $next
     * @param  string  ...$roles  role values, e.g. 'owner', 'kasir'
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole(...$roles)) {
            abort(403, 'Akses ditolak. Peran Anda tidak memiliki izin untuk halaman ini.');
        }

        return $next($request);
    }
}
