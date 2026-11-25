const ROUTE = "/lernen/anatomie", BASE = "https://jagdlatein.invalid";

function queryIdentity(query) {
  if (!query || typeof query !== "object" || Array.isArray(query)) return null;
  if (typeof query.getAll === "function") return [...new Set(query.keys())].sort().map(key => {
    const values = query.getAll(key); return [key, values.length > 1, values];
  });
  const entries = Object.entries(query).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (entries.some(([, value]) => Array.isArray(value) ? value.some(item => typeof item !== "string") : typeof value !== "string")) return null;
  return entries.map(([key, value]) => [key, Array.isArray(value), Array.isArray(value) ? value : [value]]);
}
function localURL(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try { return new URL(value, BASE); } catch { return null; }
}
export function anatomyRoute(router = {}) {
  const url = localURL(router.asPath), query = queryIdentity(router.query);
  const location = typeof window === "undefined" ? null : window.location;
  const browser = typeof location?.pathname === "string" ? `${location.pathname}${location.search || ""}${location.hash || ""}` : null;
  const ready = router.isReady === true && Boolean(url && url.pathname === ROUTE && query
    && JSON.stringify(query) === JSON.stringify(queryIdentity(url.searchParams))
    && (typeof window === "undefined" || browser !== null && browser === router.asPath));
  return { ready, origin: JSON.stringify([router.isReady === true, router.asPath, query, browser]) };
}
