/* Explicit downloads only. No API, account, payment or protected HTML caching. */
const CACHE = "jagdlatein-rucksack-v1";
const SHELL = "/lernen/offline-rucksack";
const MEDIA = new Set([
  "/lernen/waldwiese.jpg", "/lernen/sicherheit.jpg", "/lernen/jagdpraxis.jpg", "/lernen/ausruestung.jpg", "/lernen/jagdrecht.jpg", "/lernen/lernmaterial.jpg", "/lernen/feldlandschaft.jpg", "/lernen/hygiene.jpg",
  "/lernen/deutsch-drahthaar.jpg", "/lernen/kleiner-muensterlaender.jpg", "/lernen/wachtelhund.jpg", "/lernen/bayerischer-gebirgsschweisshund.jpg",
  "/wildkunde/rehwild.jpg", "/wildkunde/hirsch.jpg", "/wildkunde/schwarzwild.jpg", "/wildkunde/gamswild.jpg", "/wildkunde/steinwild.jpg", "/wildkunde/stockente.jpg", "/wildkunde/fasan.jpg", "/wildkunde/feldhase.jpg", "/wildkunde/wildkaninchen.jpg", "/wildkunde/fuchs.jpg", "/wildkunde/dachs.jpg", "/wildkunde/baummarder.jpg",
  ...Array.from({ length: 8 }, (_, index) => `/lernen/stimmen/aufnahme-0${index + 1}.mp3`),
]);
const staticAsset = path => /^\/_next\/static\/[a-zA-Z0-9_./%~-]+$/.test(path);
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("message", event => {
  if (event.data?.type !== "PREPARE" || !event.ports[0]) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    try {
      if (new URL(event.source.url).pathname !== SHELL || !Array.isArray(event.data.assets) || event.data.assets.length > 100) throw new Error("Ungültiger Downloadauftrag.");
      const paths = [...new Set([SHELL, ...event.data.assets])];
      if (paths.some(path => typeof path !== "string" || (path !== SHELL && !MEDIA.has(path) && !staticAsset(path)))) throw new Error("Unzulässige Offline-Datei.");
      const pending = []; let total = 0;
      // Fetch before replacing anything so failed downloads retain the previous pack.
      for (const path of paths) {
        const response = await fetch(path, { cache: "reload", credentials: "same-origin" });
        if (!response.ok || response.redirected || new URL(response.url).pathname !== path) throw new Error("Eine Offline-Datei konnte nicht geladen werden.");
        const type = response.headers.get("content-type") || "";
        if (path.endsWith(".jpg") && !type.startsWith("image/") || path.endsWith(".mp3") && !type.startsWith("audio/") || path === SHELL && !type.includes("text/html")) throw new Error("Eine Offline-Datei hat ein unerwartetes Format.");
        const bytes = await response.arrayBuffer(); total += bytes.byteLength;
        if (total > 64 * 1024 * 1024) throw new Error("Das Paket ist zu groß. Bitte weniger Kurse auswählen.");
        pending.push([path, new Response(bytes, { status: 200, headers: response.headers })]);
      }
      const cache = await caches.open(CACHE);
      for (const [path, response] of pending) await cache.put(path, response);
      port.postMessage({ ok: true, bytes: total });
    } catch (error) { port.postMessage({ ok: false, message: error.message || "Offline-Speicherung fehlgeschlagen." }); }
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search || (!MEDIA.has(url.pathname) && !staticAsset(url.pathname) && url.pathname !== SHELL)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === "navigate" && url.pathname === SHELL) {
      try { return await fetch(request); } catch { return await cache.match(SHELL) || new Response("Bitte den Lernrucksack einmal mit Internetverbindung vorbereiten.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
    }
    const cached = await cache.match(url.pathname);
    if (!cached) return fetch(request);
    const range = request.headers.get("range");
    if (!range) return cached;
    const bytes = await cached.arrayBuffer();
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.byteLength}` } });
    const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.byteLength}` } });
    const headers = new Headers(cached.headers);
    headers.set("Content-Range", `bytes ${start}-${end}/${bytes.byteLength}`); headers.set("Content-Length", String(end - start + 1)); headers.set("Accept-Ranges", "bytes");
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  })());
});
