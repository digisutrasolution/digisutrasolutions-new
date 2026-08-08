/* DigiSutra CMS push service worker. Kept tiny and dependency-free: it only
   shows notifications and focuses the CMS when one is clicked. The icon and
   click URL are absolute URLs supplied by the server payload, so this works
   the same on the apex domain and on subpath (staging) deploys. */

/* Take over immediately. Without these a redeployed worker parks in `waiting`
   until every CMS tab is closed, and navigator.serviceWorker.ready never
   settles for the page trying to subscribe. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = data.title || "DigiSutra CMS";
  const options = {
    body: data.body || "",
    icon: data.icon || undefined,
    badge: data.icon || undefined,
    tag: data.tag || undefined,
    data: { url: data.url || "/admin" },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // Reuse any already-open CMS tab — an exact URL match almost never
        // hits, so match the /admin prefix and navigate it.
        for (const client of list) {
          if (client.url.indexOf("/admin") !== -1 && "focus" in client) {
            if ("navigate" in client) client.navigate(url).catch(function () {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return undefined;
      }),
  );
});
