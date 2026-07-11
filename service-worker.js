// Service Worker for PWA Support
const CACHE_NAME = 'sky-city-v3';
// 使用相對路徑，適應不同部署環境
const urlsToCache = [
  './',
  './index.html',
  './style.css?v=3',
  './script.js?v=3',
  './config.js?v=3',
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

// 攔截請求：站內靜態資源採網路優先，避免舊版 JS/CSS 被快取卡住。
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳過非 HTTP(S) 請求（如 chrome-extension://）
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Google Sheets、Google Drive 等第三方請求交給瀏覽器處理，絕不寫入本站快取。
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    // 略過瀏覽器 HTTP 快取，讓版本化靜態檔案在下一次重新整理立即更新。
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        if (!response || !response.ok || response.type !== 'basic') return response;

        const isStaticAsset = /\.(?:css|js|html|json)$/i.test(requestUrl.pathname);
        if (isStaticAsset) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.destination === 'document') return caches.match('./index.html');
        return Response.error();
      })
  );
});
