// Service Worker for PWA Support
const CACHE_NAME = 'sky-city-v1';
// 使用相對路徑，適應不同部署環境
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './config.js',
  './manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 開始快取資源...');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('快取失敗:', error);
      })
  );
  self.skipWaiting(); // 強制激活新的 Service Worker
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳過非 HTTP(S) 請求（如 chrome-extension://）
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果有快取，直接返回
        if (response) {
          return response;
        }

        // 否則從網路獲取
        return fetch(event.request).then((response) => {
          // 檢查響應是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆響應（因為響應只能使用一次）
          const responseToCache = response.clone();

          // 快取靜態資源
          if (event.request.url.includes('.css') || 
              event.request.url.includes('.js') || 
              event.request.url.includes('.html')) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        }).catch(() => {
          // 網路失敗時，可以返回一個離線頁面
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

