// Arvo Service Worker — Push Notifications
// This file MUST be served from root (public/sw.js → /sw.js)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle incoming push messages
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Arvo', body: event.data.text() }
  }

  const options = {
    body: data.body || 'Something changed at Arvo!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    tag: data.tag || 'arvo',
    renotify: !!data.renotify,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Arvo', options)
  )
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(url)
      })
  )
})
