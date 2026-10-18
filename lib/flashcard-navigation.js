// Browsing state only: never store an answer, review, score or account identifier.
const CARD_ID = /^[a-z][a-z0-9-]{1,159}$/;
const BASE = "https://jagdlatein.invalid";
const ROUTE = "/lernen/lernkarten";
function single(query, key) {
  const values = typeof query?.getAll === "function" ? query.getAll(key) : query?.[key];
  return Array.isArray(values) ? values.length === 1 ? values[0] : undefined : values;
}
export function readFlashcardNavigation(query, categories = [], selection = null) {
  const requested = single(query, "kategorie") || single(query, "category");
  const text = single(query, "q"), card = single(query, "karte");
  return {
    category: !selection && categories.some(item => item.id === requested) ? requested : "all",
    query: typeof text === "string" ? text.slice(0, 160) : "",
    mode: single(query, "modus") === "alle" ? "all" : "pending",
    cardId: typeof card === "string" && CARD_ID.test(card) ? card : null,
  };
}
export function sameFlashcardNavigation(left, right) {
  return ["category", "query", "mode", "cardId"].every(key => left[key] === right[key]);
}
function routeURL(value) {
  const url = new URL(typeof value === "string" ? value : ROUTE, BASE);
  return `${url.pathname}${url.search}${url.hash}`;
}
export function flashcardRouterURL(router) {
  if (typeof router.asPath === "string") return routeURL(router.asPath);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(router.query || {})) {
    for (const entry of Array.isArray(value) ? value : [value]) if (typeof entry === "string") params.append(key, entry);
  }
  return `${ROUTE}${params.size ? `?${params}` : ""}`;
}
export function readFlashcardURL(value, categories, selection) {
  return readFlashcardNavigation(new URL(routeURL(value), BASE).searchParams, categories, selection);
}
export function flashcardNavigationURL(value, state, categories, selection) {
  const url = new URL(routeURL(value), BASE);
  if (url.pathname !== ROUTE) return null;
  // Keep the original course/lesson selection, including invalid selections;
  // browsing must never silently widen a scoped deck to the complete catalog.
  for (const key of ["kategorie", "category", "q", "modus", "karte"]) url.searchParams.delete(key);
  if (!selection && state.category !== "all" && categories.some(item => item.id === state.category)) url.searchParams.set("kategorie", state.category);
  if (state.query.trim()) url.searchParams.set("q", state.query.slice(0, 160));
  if (state.mode === "all") url.searchParams.set("modus", "alle");
  if (typeof state.cardId === "string" && CARD_ID.test(state.cardId)) url.searchParams.set("karte", state.cardId);
  return `${url.pathname}${url.search}${url.hash}`;
}

// One shallow replacement at a time. New typing overwrites the queued intent,
// not the already visible state; old acknowledgements never restore old text.
export function createFlashcardURLSync({ getRouter, getState, getContext, onRestore, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer = null, queued = false, flight = null, epoch = 0, disposed = false, suspended = false;
  const ownURLs = new Set();
  function cancelTimer() { if (timer !== null) clearTimer(timer); timer = null; }
  function run() {
    if (flight) return flight.promise;
    if (disposed || suspended || !queued) return Promise.resolve();
    queued = false;
    const router = getRouter(), context = getContext();
    if (router.isReady === false || typeof router.replace !== "function") return Promise.resolve();
    const href = flashcardNavigationURL(flashcardRouterURL(router), getState(), context.categories, context.selection);
    if (!href || href === flashcardRouterURL(router)) return Promise.resolve();
    const request = { epoch, href, promise: null };
    ownURLs.add(href);
    if (ownURLs.size > 32) ownURLs.delete(ownURLs.values().next().value);
    flight = request;
    request.promise = Promise.resolve().then(() => {
      if (disposed || request.epoch !== epoch) return false;
      return router.replace(href, undefined, { shallow: true, scroll: false });
    }).then(completed => {
      if (completed === false) ownURLs.delete(href);
      else if (request.epoch !== epoch && !disposed) queued = true;
    }, () => { ownURLs.delete(href); }).then(() => {
      flight = null;
      return queued && !disposed ? run() : undefined;
    });
    return request.promise;
  }
  function restore(href) {
    if (disposed) return;
    cancelTimer(); queued = false; epoch++; suspended = false;
    const context = getContext();
    onRestore(readFlashcardURL(href, context.categories, context.selection));
  }
  return {
    schedule(delay = 220) {
      if (disposed) return;
      cancelTimer();
      if (!delay) { queued = true; return run(); }
      timer = setTimer(() => { timer = null; queued = true; run(); }, delay);
    },
    flush() { cancelTimer(); queued = true; return run(); },
    route(href) { if (!ownURLs.delete(routeURL(href))) restore(href); },
    start(href) {
      if (ownURLs.has(routeURL(href))) return;
      cancelTimer(); queued = false; epoch++; suspended = true;
    },
    restore,
    version() { return epoch; },
    isCurrent(version) { return !disposed && version === epoch; },
    resume() { disposed = false; suspended = false; },
    dispose() { disposed = true; cancelTimer(); queued = false; epoch++; },
  };
}
