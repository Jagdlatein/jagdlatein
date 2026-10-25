/* Firebase Messaging only. This worker has /push/ scope and never handles
 * fetch/cache requests or replaces the separate /lernen/ offline worker. */
self.addEventListener("notificationclick", event => {
  event.stopImmediatePropagation();
  event.notification.close();
  const target = new URL("/lernen", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      let sameOrigin = false;
      try { sameOrigin = new URL(client.url).origin === self.location.origin; } catch {}
      if (!sameOrigin) continue;
      try {
        const focused = await client.navigate(target);
        if (focused?.focus) { await focused.focus(); return; }
      } catch { /* A closed/unavailable window does not swallow the click. */ }
    }
    await self.clients.openWindow(target);
  })());
});
importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js");
const pushApp = firebase.initializeApp({
  apiKey: "AIzaSyDLnWAbNeeeedoH23PS_A0MQbmyN5oSRV8",
  authDomain: "jagdlatein-a17b1.firebaseapp.com",
  projectId: "jagdlatein-a17b1",
  storageBucket: "jagdlatein-a17b1.firebasestorage.app",
  messagingSenderId: "1084120782155",
  appId: "1:1084120782155:web:ee1478c3213a25c6da44ce",
}, "jagdlatein-web-push");
pushApp.messaging().onBackgroundMessage(payload => {
  // FCM already displays notification payloads; do not show them twice.
  if (payload.notification) return;
  const title = typeof payload.data?.title === "string" ? payload.data.title.slice(0, 200) : "Jagdlatein";
  const body = typeof payload.data?.body === "string" ? payload.data.body.slice(0, 1000) : "Neue Nachricht von Jagdlatein";
  return self.registration.showNotification(title, { body, icon: "/android_192.png", tag: "jagdlatein-message" });
});
