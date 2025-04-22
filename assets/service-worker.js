// Service Worker yüklandıqda cache fayllarını saxlayacaq
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                '/CedvelPro/',
                '/CedvelPro/index.html',
                '/CedvelPro/style.css',
                '/CedvelPro/app.js',
                '/CedvelPro/assets/manifest.json',
                '/CedvelPro/assets/icon-192.png',
                '/CedvelPro/assets/icon-512.png'
            ]);
        })
    );
});

// Service Worker aktivləşdikdən sonra köhnə cache-i silirik (köhnəlmiş versiyanı)
self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['v1']; // Yalnız 'v1' cache versiyasını saxlayacağıq

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName); // Köhnə cache-ləri silirik
                    }
                })
            );
        })
    );
});

// Service Worker hər dəfə şəbəkə tələbi etdikdə cache-i yoxlayacaq
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Cache-də varsa, onu qaytarırıq, yoxdursa şəbəkədən sorğu edirik
            return cachedResponse || fetch(event.request);
        })
    );
});
