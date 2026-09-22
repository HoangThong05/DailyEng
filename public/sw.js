/* Service worker của DailyEng.
 * Chiến lược:
 *  - Điều hướng trang: chỉ lấy từ mạng. Mọi trang đều cần đăng nhập và render
 *    riêng cho từng người, nên KHÔNG cache HTML — cache lại thì sau khi đăng
 *    xuất, mở offline vẫn thấy dữ liệu cá nhân của phiên trước. Mất mạng thì
 *    trả về trang /offline đã lưu sẵn.
 *  - Asset build của Next (/_next/static): cache-first vì tên file có hash, không bao giờ đổi nội dung
 *  - Ảnh, icon, manifest: stale-while-revalidate
 *  - Mọi thứ khác (RSC payload, server action, prefetch của Next…): KHÔNG
 *    đụng vào — để trình duyệt tự lo. Chen vào đây từng làm router của Next
 *    nhận phản hồi lỗi/cũ và kẹt điều hướng.
 *  - Push: hiện thông báo nhắc học, bấm vào thì mở app
 *  - Message "cache-offline" (app gửi khi có mạng): tải lại /offline cùng
 *    JS/CSS của nó vào cache, để màn ôn offline luôn khớp bản build đang chạy.
 * Tăng VERSION mỗi lần đổi logic để cache cũ bị dọn.
 */
const VERSION = "dailyeng-v10";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/mascot/vit-chao-256.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function navigate(request) {
  try {
    // Cố tình không cache: HTML ở đây luôn gắn với người đang đăng nhập.
    return await fetch(request);
  } catch (error) {
    // Người dùng bấm link khác khi trang chưa tải xong → yêu cầu cũ bị huỷ.
    // Đó không phải mất mạng; ném lại để trình duyệt bỏ qua như bình thường.
    if (error && error.name === "AbortError") throw error;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME);
        cache.put(request, response.clone());
      }
      return response;
    })
    // Mất mạng mà cũng không có bản cache thì phải trả về một Response lỗi
    // thật sự; trả undefined sẽ làm respondWith ném TypeError.
    .catch(() => cached ?? Response.error());

  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Chỉ cache file tĩnh của mình; RSC payload, prefetch, API, font… để yên.
  const isStaticAsset =
    /^\/(photos|decks|games|mascot)\//.test(url.pathname) ||
    /^\/(icon-|apple-icon|favicon|manifest\.webmanifest)/.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(staleWhileRevalidate(request));
});

/* ---- Thông báo nhắc học ------------------------------------------------ */

self.addEventListener("push", (event) => {
  // Server gửi JSON { title, body, url }; phòng hờ payload lạ thì vẫn hiện được.
  let payload = { title: "DailyEng", body: "Đến giờ học rồi!", url: "/" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    // Không phải JSON — giữ nội dung mặc định.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      // Android hiện ảnh to bên dưới nội dung; nền tảng khác bỏ qua.
      image: "/mascot/vit-ngu.png",
      lang: "vi",
      // Cùng tag thì thông báo mới thay thông báo cũ, không chất đống.
      tag: "dailyeng-nhac-hoc",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? "/", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        // App đang mở thì đưa lên trước, không mở thêm tab mới.
        const existing = windows.find((w) => w.url.startsWith(self.location.origin));
        if (existing) {
          existing.navigate(target);
          return existing.focus();
        }
        return self.clients.openWindow(target);
      }),
  );
});

/* ---- Cache lại trang offline theo bản build hiện tại ------------------- */

async function cacheOfflinePage() {
  const response = await fetch(OFFLINE_URL, { cache: "no-store" });
  if (!response.ok) return;

  const html = await response.clone().text();
  const precache = await caches.open(PRECACHE);
  await precache.put(OFFLINE_URL, response);

  // JS/CSS mà trang này cần: tên file có hash nên cache-first là an toàn.
  const assets = new Set();
  for (const match of html.matchAll(/["'](\/_next\/static\/[^"']+)["']/g)) {
    assets.add(match[1]);
  }
  const runtime = await caches.open(RUNTIME);
  await Promise.all(
    [...assets].map(async (url) => {
      if (await runtime.match(url)) return;
      try {
        const asset = await fetch(url);
        if (asset.ok) await runtime.put(url, asset);
      } catch {
        // Thiếu một file thì lần sau thử lại.
      }
    }),
  );
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "cache-offline") {
    event.waitUntil(cacheOfflinePage().catch(() => {}));
  }
});
