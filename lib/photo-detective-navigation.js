import { photoDetectiveRounds } from "./photo-detective";

const ROUTE = "/lernen/fotodetektiv", BASE = "https://jagdlatein.invalid";
const species = new Set(photoDetectiveRounds.map(round => round.id));
function field(query, key) {
  if (typeof query?.getAll === "function") {
    const values = query.getAll(key);
    return { present: values.length > 0, valid: values.length <= 1, value: values[0] };
  }
  const present = Object.prototype.hasOwnProperty.call(query || {}, key), value = query?.[key];
  return { present, valid: !present || typeof value === "string", value };
}

export function readPhotoDetectiveSelection(query = {}) {
  const view = field(query, "ansicht"), art = field(query, "art");
  const mode = view.present ? view.value : art.present ? "merkmale" : "quiz";
  const valid = view.valid && art.valid && ["quiz", "merkmale"].includes(mode)
    && (!art.present || species.has(art.value)) && !(mode === "quiz" && art.present);
  return { valid, view: valid ? mode : null, art: valid && art.present ? art.value : null };
}

function queryIdentity(query) {
  if (typeof query?.getAll === "function") return [...new Set(query.keys())].sort().map(key => {
    const values = query.getAll(key); return [key, values.length > 1, values];
  });
  return Object.entries(query || {}).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => [key, Array.isArray(value), Array.isArray(value) ? value : [value]]);
}
function localURL(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try { return new URL(value, BASE); } catch { return null; }
}
function browserAddress() {
  const location = typeof window === "undefined" ? null : window.location;
  return typeof location?.pathname === "string" ? `${location.pathname}${location.search || ""}${location.hash || ""}` : null;
}

export function photoDetectiveRoute(router = {}) {
  const url = localURL(router.asPath), query = router.query, browser = browserAddress();
  const identity = queryIdentity(query), selection = readPhotoDetectiveSelection(query);
  const ready = router.isReady === true && Boolean(url && url.pathname === ROUTE && query && typeof query === "object" && !Array.isArray(query)
    && JSON.stringify(identity) === JSON.stringify(queryIdentity(url.searchParams)) && (browser === null || browser === router.asPath));
  return { ready, selection, origin: JSON.stringify([router.isReady === true, router.asPath, identity, browser]),
    scope: { path: router.asPath, query: JSON.stringify(identity), browser } };
}

// This marker permits only post-commit focus, never an action from an old view.
export function photoDetectiveFocusIntent(router, target) {
  const source = photoDetectiveRoute(router), url = localURL(target);
  if (!source.ready || !url || url.pathname !== ROUTE) return null;
  return { source: source.scope, target: { path: target, query: JSON.stringify(queryIdentity(url.searchParams)), browser: source.scope.browser === null ? null : target } };
}

export function photoDetectiveTarget(router, view, art = null) {
  if (!photoDetectiveRoute(router).ready || !["quiz", "merkmale"].includes(view)
    || art !== null && !species.has(art) || view === "quiz" && art !== null) return null;
  const url = localURL(router.asPath);
  url.searchParams.delete("ansicht"); url.searchParams.delete("art");
  url.searchParams.set("ansicht", view);
  if (art !== null) url.searchParams.set("art", art);
  url.hash = "fotodetektiv-title";
  return `${url.pathname}${url.search}${url.hash}`;
}
