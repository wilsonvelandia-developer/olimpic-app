/**
 * Service Worker for OlimpicApp PWA.
 *
 * Strategies:
 *  - Static assets (JS, CSS, fonts, images): Cache-first, background refresh
 *  - API calls (fixture, standings, tournaments): Network-first, cache fallback
 *  - API calls (mutations): Network-only
 *
 * Cached API data allows viewing fixture, standings, and results offline.
 */

const APP_CACHE = 'olimpicapp-v2';
const STATIC_CACHE = 'olimpicapp-static-v2';
const API_CACHE = 'olimpicapp-api-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// API paths that are safe to cache for offline viewing
const CACHEABLE_API_PATTERNS = [
  '/api/tournaments',
  '/api/teams',
  '/api/matches',
  '/api/standings',
  '/api/sports',
  '/api/venues',
  '/api/announcements',
  '/api/gallery',
  '/public/',
];

// ── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const validCaches = [APP_CACHE, STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and chrome-extension
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API calls: network-first with cache fallback
  if (isCacheableApi(url.pathname)) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Non-cacheable API calls (payments, notifications, users): network-only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: stale-while-revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Navigation (HTML): cache-first for app shell, network fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(request))
    );
    return;
  }

  // Default: network
  event.respondWith(fetch(request));
});

// ── Strategies ──────────────────────────────────────────────────────────────

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ data: null, success: false, message: 'Sin conexión. Mostrando datos en caché.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isCacheableApi(pathname) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pathname.startsWith(pattern));
}

function isStaticAsset(pathname) {
  return pathname.endsWith('.js') || pathname.endsWith('.css') ||
         pathname.endsWith('.woff2') || pathname.endsWith('.woff') ||
         pathname.endsWith('.png') || pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg') || pathname.endsWith('.webp') ||
         pathname.includes('/assets/');
}

// ── Background sync for offline mutations (future) ──────────────────────────
// TODO: Register sync events for POST/PUT made while offline
