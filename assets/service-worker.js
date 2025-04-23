self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                '/CedvelPro/',
                '/CedvelPro/index.html',
                '/CedvelPro/style.css',
                '/CedvelPro/app.js',
                '/CedvelPro/xlsx.full.min.js',
                '/CedvelPro/assets/manifest.json',
                '/CedvelPro/assets/icon-192.png',
                '/CedvelPro/assets/icon-512.png'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['v1'];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/CedvelPro/index.html');
                }
            });
        })
    );
});