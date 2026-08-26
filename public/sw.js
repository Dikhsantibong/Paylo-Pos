/*
 * Paylo service worker.
 *
 * Priorities, in order: never break a sale, never serve a stale CSRF token,
 * then work offline where it is safe to.
 *
 * Strategy
 *  - Build assets (/build/*), icons and fonts are content-hashed or static →
 *    cache-first, they can never go stale in a harmful way.
 *  - Navigations are network-first with an offline fallback page. HTML is NOT
 *    cached for reuse: every Paylo page embeds a CSRF token and session state,
 *    and replaying an old one would make the next POST fail.
 *  - Everything else (API calls, Inertia XHR, POST/PUT/DELETE) is network-only.
 */

const VERSION = 'paylo-v1';
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL_CACHE = `${VERSION}-shell`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
    OFFLINE_URL,
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/favicon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .catch(() => undefined)
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !key.startsWith(VERSION))
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Anything that changes server state goes straight to the network.
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // Only handle our own origin; third-party requests are left alone.
    if (url.origin !== self.location.origin) {
        return;
    }

    // Never intercept the session heartbeat or file downloads.
    if (url.pathname.startsWith('/session/') || url.pathname.startsWith('/reports/export')) {
        return;
    }

    if (isImmutableAsset(url)) {
        event.respondWith(cacheFirst(request));

        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(navigationWithOfflineFallback(request));
    }
});

function isImmutableAsset(url) {
    return (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/fonts/') ||
        url.pathname === '/favicon.svg' ||
        url.pathname === '/favicon.ico' ||
        url.pathname === '/manifest.webmanifest'
    );
}

async function cacheFirst(request) {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);

        if (response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // An asset miss while offline: nothing sensible to substitute.
        return Response.error();
    }
}

async function navigationWithOfflineFallback(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cache = await caches.open(SHELL_CACHE);
        const fallback = await cache.match(OFFLINE_URL);

        return (
            fallback ??
            new Response('<h1>Offline</h1>', {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            })
        );
    }
}
