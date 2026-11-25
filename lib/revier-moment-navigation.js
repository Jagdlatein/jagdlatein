const ROUTE = "/tagesquiz", BASE = "https://jagdlatein.invalid";

function queryIdentity(query) {
  if (!query || typeof query !== "object" || Array.isArray(query)) return null;
  if (typeof query.getAll === "function") return [...new Set(query.keys())].sort().map(key => {
    const values = query.getAll(key); return [key, values.length > 1, values];
  });
  const entries = Object.entries(query).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  if (entries.some(([, value]) => Array.isArray(value) ? value.some(item => typeof item !== "string") : typeof value !== "string")) return null;
  return entries.map(([key, value]) => [key, Array.isArray(value), Array.isArray(value) ? value : [value]]);
}

export function revierMomentRoute(router = {}) {
  const raw = router.asPath;
  let url = null;
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(raw)) {
    try { url = new URL(raw, BASE); } catch {}
  }
  const query = queryIdentity(router.query), location = typeof window === "undefined" ? null : window.location;
  const browser = typeof location?.pathname === "string" ? `${location.pathname}${location.search || ""}${location.hash || ""}` : null;
  const ready = router.isReady === true && Boolean(url && url.pathname === ROUTE && query
    && JSON.stringify(query) === JSON.stringify(queryIdentity(url.searchParams))
    && (typeof window === "undefined" || browser !== null && browser === raw));
  return { ready, origin: JSON.stringify([router.isReady === true, raw, query, browser]) };
}
