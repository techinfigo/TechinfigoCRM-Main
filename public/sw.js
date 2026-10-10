/*
 * Techinfigo CRM service worker.
 *
 * Two jobs only:
 *  1. Lets the CRM be installed as an app ("Add to Home Screen").
 *  2. Shows a phone notification for each new enquiry. The website sends a
 *     Firebase Cloud Messaging data message ({ title, body, link, tag }); this
 *     shows it and opens the CRM on tap.
 *
 * It does not cache pages: the CRM always loads fresh from the server.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// An (empty) fetch handler keeps older browsers treating the CRM as installable.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }
  const d = payload.data || (payload.notification ? payload.notification : {}) || {};
  const title = d.title || 'New enquiry';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || 'Open the CRM to see it.',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: d.tag || 'enquiry',
      renotify: true,
      data: { link: d.link || '/?view=LEADS' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = new URL((event.notification.data && event.notification.data.link) || '/?view=LEADS', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && 'focus' in w) {
          w.navigate(link).catch(() => {});
          return w.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
