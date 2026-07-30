/* DigiSutra CMS push service worker. Kept tiny and dependency-free: it only
   shows notifications and focuses the CMS when one is clicked. The icon and
   click URL are absolute URLs supplied by the server payload, so this works
   the same on the apex domain and on subpath (staging) deploys. */

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
        for (const client of list) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return undefined;
      }),
  );
});
