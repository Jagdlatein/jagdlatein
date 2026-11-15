// Browsing state only: never store an answer, review, score or account identifier.
const CARD_ID = /^[a-z][a-z0-9-]{1,159}$/;
const BASE = "https://jagdlatein.invalid";
const ROUTE = "/lernen/lernkarten";
const FIELDS = ["kategorie", "category", "q", "modus", "karte", "kurs", "lektion"];
function field(query, key) {
  if (typeof query?.getAll === "function") {
    const values = query.getAll(key);
    return { present: values.length > 0, valid: values.length <= 1, value: values[0] };
  }
  const present = Object.prototype.hasOwnProperty.call(query || {}, key);
  const value = query?.[key];
  return { present, valid: !present || typeof value === "string", value };
}
export function readFlashcardRoute(query, categories = [], selection = null) {
  const fields = Object.fromEntries(FIELDS.map(key => [key, field(query, key)]));
  const main = fields.kategorie, alias = fields.category;
  const requested = main.present ? main.value : alias.value;
  const validCategory = requested === "all" || categories.some(item => item.id === requested);
  let valid = Object.values(fields).every(item => item.valid);
  if (main.present || alias.present) valid = valid && validCategory && (!main.present || !alias.present || main.value === alias.value);
  if (fields.modus.present) valid = valid && fields.modus.value === "alle";
  if (fields.karte.present) valid = valid && typeof fields.karte.value === "string" && CARD_ID.test(fields.karte.value);
  if (selection?.invalid) valid = false;
  // A supplied course selection must agree with the URL. Never widen a stale
  // lesson prop while Next is still updating the query and page props.
  if (selection && !selection.invalid) {
    if (!fields.kurs.present || fields.kurs.value !== selection.courseId) valid = false;
    if (Boolean(selection.lessonId) !== fields.lektion.present || fields.lektion.present && fields.lektion.value !== selection.lessonId) valid = false;
  } else if (fields.kurs.present || fields.lektion.present) valid = false;
  const search = fields.q.valid && typeof fields.q.value === "string" ? fields.q.value.slice(0, 160) : "";
  const cardId = fields.karte.valid && typeof fields.karte.value === "string" && CARD_ID.test(fields.karte.value) ? fields.karte.value : null;
  const mode = fields.modus.value === "alle" ? "all" : "pending";
  // Bare entry starts with the category chooser. Old direct search/card links
  // remain usable, but an explicitly invalid selection never becomes "all".
  const identifiesDeck = selection || cardId || search.trim() || mode === "all";
  const category = valid ? (!selection && validCategory ? requested : identifiesDeck ? "all" : null) : null;
  return { valid, navigation: { category, query: search, mode, cardId } };
}
export function readFlashcardNavigation(query, categories = [], selection = null) {
  return readFlashcardRoute(query, categories, selection).navigation;
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
export function flashcardRouteIsReady(router, categories, selection) {
  if (router.isReady === false) return false;
  const parsed = new URL(flashcardRouterURL(router), BASE);
  if (parsed.pathname !== ROUTE || !readFlashcardRoute(parsed.searchParams, categories, selection).valid || !readFlashcardRoute(router.query, categories, selection).valid) return false;
  if (typeof router.asPath !== "string") return true;
  return FIELDS.every(key => {
    const fromURL = field(parsed.searchParams, key), fromQuery = field(router.query, key);
    return fromURL.present === fromQuery.present && (!fromURL.present || fromURL.value === fromQuery.value);
  });
}
export function flashcardOrigin(router) {
  const query = Object.entries(router.query || {}).sort(([a], [b]) => a.localeCompare(b));
  const location = typeof window === "undefined" ? null : window.location;
  return JSON.stringify([router.isReady !== false, flashcardRouterURL(router), query, location ? `${location.pathname}${location.search || ""}${location.hash || ""}` : null]);
}
export function flashcardNavigationURL(value, state, categories, selection) {
  const url = new URL(routeURL(value), BASE);
  if (url.pathname !== ROUTE) return null;
  // Keep the original course/lesson selection, including invalid selections;
  // browsing must never silently widen a scoped deck to the complete catalog.
  for (const key of ["kategorie", "category", "q", "modus", "karte"]) url.searchParams.delete(key);
  if (!selection && (state.category === "all" || categories.some(item => item.id === state.category))) url.searchParams.set("kategorie", state.category);
  if (state.query.trim()) url.searchParams.set("q", state.query.slice(0, 160));
  if (state.mode === "all") url.searchParams.set("modus", "alle");
  if (typeof state.cardId === "string" && CARD_ID.test(state.cardId)) url.searchParams.set("karte", state.cardId);
  return `${url.pathname}${url.search}${url.hash}`;
}

// One shallow replacement at a time. New typing overwrites the queued intent,
// not the already visible state; old acknowledgements never restore old text.
export function createFlashcardURLSync({ getRouter, getState, getContext, onRestore, onPending, onCommit, onError, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let timer = null, queued = false, method = "replace", flight = null, epoch = 0, disposed = false, suspended = false, lastRoute = null;
  const ownURLs = new Map();
  function cancelTimer() { if (timer !== null) clearTimer(timer); timer = null; }
  function forget(request) { if (ownURLs.get(request.href) === request) ownURLs.delete(request.href); }
  function changed() { if (!disposed) onPending?.(Boolean(timer !== null || queued || flight)); }
  function retireFlight() {
    if (!flight) return;
    const obsolete = flight; flight = null;
    obsolete.finished = true; obsolete.resolve(false);
  }
  function finish(request, success) {
    if (request.finished) return;
    request.finished = true;
    if (success) lastRoute = request.href;
    if (request.committed) forget(request);
    if (flight === request) flight = null;
    if (!disposed && request.epoch === epoch) {
      if (success) onCommit?.(request.href);
      else onError?.(request.state, Boolean(queued || timer !== null));
    }
    request.resolve(success);
    changed();
    if (queued && !disposed && !suspended) run();
  }
  function run() {
    if (flight) return flight.promise;
    if (disposed || suspended || !queued) return Promise.resolve(false);
    queued = false;
    const router = getRouter(), context = getContext();
    const action = method; method = "replace";
    if (router.isReady === false || typeof router[action] !== "function") { changed(); return Promise.resolve(false); }
    const state = { ...getState() };
    const href = flashcardNavigationURL(flashcardRouterURL(router), state, context.categories, context.selection);
    if (!href) { changed(); return Promise.resolve(false); }
    if (href === flashcardRouterURL(router)) { changed(); onCommit?.(href); return Promise.resolve(true); }
    const request = { epoch, href, state, accepted: false, committed: false, promise: null, finished: false };
    request.promise = new Promise(resolve => { request.resolve = resolve; });
    ownURLs.set(href, request);
    if (ownURLs.size > 32) ownURLs.delete(ownURLs.keys().next().value);
    flight = request;
    changed();
    let result;
    try { result = router[action](href, undefined, { shallow: true, scroll: false }); }
    catch { result = Promise.reject(new Error("navigation")); }
    Promise.resolve(result).then(completed => {
      if (disposed) { finish(request, false); return; }
      if (request.finished) { request.accepted = completed !== false; if (completed === false) forget(request); return; }
      if (completed === false) { forget(request); finish(request, false); return; }
      request.accepted = true;
      if (request.epoch !== epoch) {
        if (request.committed && !suspended) queued = true;
        finish(request, false);
      } else if (request.committed && flashcardRouterURL(getRouter()) !== href) restore(flashcardRouterURL(getRouter()));
      else if (flashcardRouterURL(getRouter()) === href) { request.committed = true; finish(request, true); }
    }, () => { forget(request); finish(request, false); });
    return request.promise;
  }
  function restore(href) {
    if (disposed) return;
    cancelTimer(); queued = false; epoch++; suspended = false;
    retireFlight();
    lastRoute = routeURL(href);
    const context = getContext();
    onRestore(readFlashcardURL(href, context.categories, context.selection));
    changed();
  }
  return {
    schedule(delay = 220, nextMethod = "replace") {
      if (disposed) return;
      cancelTimer(); method = nextMethod;
      if (!delay) { queued = true; return run(); }
      timer = setTimer(() => { timer = null; queued = true; run(); }, delay); changed();
    },
    flush() {
      cancelTimer(); queued = true;
      const version = epoch;
      const drain = () => run().then(result => {
        if (disposed || epoch !== version || suspended || result === false) return false;
        return flight || queued ? drain() : true;
      });
      return drain();
    },
    route(href) {
      if (disposed) return;
      const normalized = routeURL(href), request = ownURLs.get(normalized);
      if (request) {
        request.committed = true; lastRoute = normalized;
        if (request.finished) {
          ownURLs.delete(normalized);
          if (request.epoch !== epoch && !suspended) { queued = true; run(); }
        } else if (request.accepted) finish(request, request.epoch === epoch);
      } else if (normalized !== lastRoute) restore(href);
    },
    start(href) {
      if (ownURLs.has(routeURL(href))) return;
      cancelTimer(); queued = false; epoch++; suspended = true; retireFlight(); changed();
    },
    restore,
    available() { return !disposed && !suspended; },
    busy() { return Boolean(timer !== null || queued || flight && flight.epoch === epoch); },
    version() { return epoch; },
    isCurrent(version) { return !disposed && version === epoch; },
    resume() { disposed = false; suspended = false; },
    dispose() { disposed = true; cancelTimer(); queued = false; epoch++; retireFlight(); ownURLs.clear(); },
  };
}
