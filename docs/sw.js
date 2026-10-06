// Offline support: the app shell and CDN libraries are cached; card data is cached by the app itself.
// Bump VERSION whenever you deploy changes so phones pick up the new files.
const VERSION = 'taboo-v4';

const APP_SHELL = [
    './',
    'index.html',
    'app.js',
    'styles.css',
    'config.js',
    'manifest.webmanifest',
    'icons/icon.svg',
    'icons/icon-192.png',
    'icons/apple-touch-icon.png',
    'https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.prod.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
];

self.addEventListener('install', (event) => {
    // cache: 'reload' skips the browser's HTTP cache (GitHub Pages allows 10 minutes), so a new
    // version never pairs a fresh index.html with a stale app.js.
    const requests = APP_SHELL.map(url => new Request(url, { cache: 'reload' }));
    event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    // Never cache the Apps Script API or Google sign-in.
    if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;

    // Versioned CDN files never change: cache first.
    if (url.hostname === 'cdn.jsdelivr.net') {
        event.respondWith(
            caches.match(request).then(hit => hit || fetch(request).then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(VERSION).then(cache => cache.put(request, copy));
                }
                return res;
            }))
        );
        return;
    }

    // Our own files: serve from cache straight away, refresh the cache in the background.
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.open(VERSION).then(cache =>
                cache.match(request, { ignoreSearch: true }).then(hit => {
                    const network = fetch(request.url, { cache: 'no-cache' }).then(res => {
                        if (res.ok) cache.put(request, res.clone());
                        return res;
                    }).catch(() => hit);
                    return hit || network;
                })
            )
        );
    }
});
