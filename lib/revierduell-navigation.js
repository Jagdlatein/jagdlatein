import { normaliseDuellSeed, normaliseDuellRevision, parseDuellTarget, normaliseDuellTopic } from "./revierduell";

const BASE = "https://jagdlatein.invalid";
function identity(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.getAll === "function") return [...new Set(value.keys())].sort().map(key => {
    const values = value.getAll(key); return [key, values.length > 1, values];
  });
  const entries = Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (entries.length > 32 || entries.some(([, item]) => Array.isArray(item) ? item.some(part => typeof part !== "string" || part.length > 4096) : typeof item !== "string" || item.length > 4096)) return null;
  return entries.map(([key, item]) => [key, Array.isArray(item), Array.isArray(item) ? item : [item]]);
}
function localUrl(raw) {
  if (typeof raw !== "string" || raw.length > 4096 || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  try { const url = new URL(raw, BASE); return url.pathname === "/revierduell" ? url : null; } catch { return null; }
}
export function duellRoute(router = {}, { requestSelection, initialRawPath } = {}) {
  const raw = router.asPath, url = localUrl(raw), initial = localUrl(initialRawPath), query = identity(router.query);
  const location = typeof window === "undefined" ? null : window.location;
  const browser = typeof location?.pathname === "string" ? `${location.pathname}${location.search || ""}${location.hash || ""}` : null;
  const selection = { seedQuery: normaliseDuellSeed(router.query?.duell), targetQuery: parseDuellTarget(router.query?.ziel), revisionQuery: normaliseDuellRevision(router.query?.v), topicQuery: normaliseDuellTopic(router.query?.thema) };
  const sameSelection = requestSelection && selection.seedQuery === requestSelection.seedQuery && selection.targetQuery === requestSelection.targetQuery && selection.revisionQuery === requestSelection.revisionQuery && selection.topicQuery === requestSelection.topicQuery;
  const ready = router.isReady === true && Boolean(url && initial && query && sameSelection
    && initial.pathname + initial.search === url.pathname + url.search
    && JSON.stringify(query) === JSON.stringify(identity(url.searchParams))
    && (typeof window === "undefined" || browser !== null && browser === raw));
  return { ready, origin: JSON.stringify([router.isReady === true, raw, query, browser, initialRawPath, selection]) };
}
