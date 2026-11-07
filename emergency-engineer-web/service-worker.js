/*
 * App-shell cache only: HTML, local CSS/JS, icons, and the stage/learning JSON.
 * Player progress and profile remain in localStorage and are never intercepted
 * as writes; cross-origin resources (including optional Google Fonts) are not cached.
 */
const CACHE_VERSION = 'hydraulic-emergency-engineer-v2';
const APP_ROOT = new URL('./', self.registration.scope);
const CORE_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/main.css',
  './css/stage.css',
  './css/game-polish.css',
  './css/pwa.css',
  './js/main.js',
  './js/game-config.js',
  './js/pwa-install.js',
  './js/audio-manager.js',
  './js/i18n.js',
  './js/learning-service.js',
  './js/network-renderer.js',
  './js/player-data-store.js',
  './js/progress-store.js',
  './js/stage-loader.js',
  './js/stage-manifest.js',
  './js/core/stage-schema.js',
  './js/core/stage-session.js',
  './js/core/stage-validator.js',
  './js/ui/hud.js',
  './js/ui/learning-dialog.js',
  './js/ui/menu-screen.js',
  './js/ui/name-entry-screen.js',
  './js/ui/notifications.js',
  './js/ui/player-drawer.js',
  './js/ui/result-screen.js',
  './js/ui/stage-screen.js',
  './js/ui/stage-select-screen.js',
  './js/ui/welcome-screen.js',
  './data/stages/index.json',
  './data/learning-content.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-512-maskable.png',
  './assets/icons/apple-touch-icon.png',
  ...Array.from({ length: 22 }, (_, i) => `./assets/fonts/font-${i}.woff2`),
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // A missing core file should fail installation rather than leave a partial shell.
    await cache.addAll(CORE_FILES.map((path) => new URL(path, APP_ROOT).href));

    // Warm every stage referenced by the unchanged stage manifest. A single
    // unavailable stage must not prevent the rest of the app shell installing.
    try {
      const response = await fetch(new URL('./data/stages/index.json', APP_ROOT));
      if (!response.ok) throw new Error(`Stage manifest HTTP ${response.status}`);
      const manifest = await response.json();
      await Promise.allSettled((manifest.stages ?? []).map(async ({ url }) => {
        if (typeof url !== 'string' || !url || url.includes('..')) return;
        const stageUrl = new URL(`./data/stages/${url}`, APP_ROOT);
        if (stageUrl.origin !== self.location.origin) return;
        const stageResponse = await fetch(stageUrl);
        if (stageResponse.ok) await cache.put(stageUrl.href, stageResponse);
      }));
    } catch (error) {
      console.warn('[service-worker] Could not warm every stage:', error);
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('hydraulic-emergency-engineer-') && name !== CACHE_VERSION)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(APP_ROOT.href)) return;

  // Network first keeps deployed updates fresh. Cached local resources provide
  // an offline fallback after a successful visit/install.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return (await cache.match(new URL('./index.html', APP_ROOT))) ?? Response.error();
      }
      return Response.error();
    }
  })());
});
