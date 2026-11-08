import { readWebCoursePlatform } from "./web-course-platform";
// Fixed, first-party counters only. Never derive event data from DOM text or URLs.
export const USAGE_PAGES = Object.freeze({ lernen: "Lernbereich", wildkunde: "Wildkunde", wildjahr: "Wildjahr", kurse: "Kurse", quiz: "Jagdquiz", lernkarten: "Lernkarten", videos: "Lernvideos", werkzeuge: "Lernwerkzeuge", jagdrecht: "Jagdrecht", community: "Community", fotohelfer: "Fotohelfer", online_kurse: "Onlinekurse" });
export const USAGE_EVENTS = Object.freeze(["page_view", "navigation", "action", "expand", "video_play"]);
export const USAGE_PREFERENCE_EVENT = "jagdlatein-usage-preference-changed";
export const USAGE_LOCAL_PREFERENCE = "jagdlatein-usage-purpose-v1";
export const USAGE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validUsageConsentVersion(value) {
  return value === null || typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}
const tools = new Set(["wissen-fuers-revier", "wildtier-details", "wildbret-stuecke", "wildbret-fallwerkstatt", "tierstimmen", "spurenwerkstatt", "pruefungsplan", "pruefungsgespraech", "pflanzenatlas", "offline-rucksack", "lebensraum-werkstatt", "kleines-revierleben", "kiefer-3d", "jagdhund-kompass", "hundetraining-tagebuch", "fuenf-minuten", "fotodetektiv", "forschung-verstehen", "beobachtungswerkstatt", "anatomie"]);
const categories = new Set(["wildkunde", "waffen-sicherheit", "jagdpraxis", "natur-revier", "jagdrecht", "jagdhunde", "wildbret", "jagdkultur", "[category]"]);

export function usagePageForPath(pathname) {
  if (typeof pathname !== "string" || pathname.length > 240 || /[?#\\\u0000-\u0020]/.test(pathname) || pathname.includes("//")) return null;
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/lernen") return "lernen";
  if (path === "/lernen/wildjahr") return "wildjahr";
  if (["/lernen/lernkarten", "/lernen/lernkarten-drucken"].includes(path)) return "lernkarten";
  if (["/lernen/videos", "/lernen/wildtier-videofaelle", "/lernen/jagdhund-videos"].includes(path)) return "videos";
  if (path === "/fotohelfer") return "fotohelfer";
  if (path === "/online-kurse") return "online_kurse";
  if (["/tagesquiz", "/quiz", "/jagdpraxis/ansitz"].includes(path) || /^\/quiz-app(?:\/(?:run|stats|leaderboard))?$/.test(path)) return "quiz";
  if (/^\/wildkunde(?:\/(?:[a-z0-9-]+|\[art\]))?$/.test(path)) return "wildkunde";
  if (/^\/kurse(?:\/(?:[a-z0-9-]+|\[(?:id|slug)\]))?$/.test(path)) return "kurse";
  if (/^\/jagdrecht(?:\/(?:de|at|ch|wildarten))?$/.test(path)) return "jagdrecht";
  if (/^\/community(?:\/(?:[0-9a-f-]{36}|\[id\]))?$/.test(path)) return "community";
  if (/^\/lernen\/jagdhunde(?:\/(?:[a-z0-9-]+|\[rasse\]))?$/.test(path)) return "werkzeuge";
  const entry = path.match(/^\/lernen\/([^/]+)$/)?.[1];
  if (categories.has(entry)) return "lernen";
  return tools.has(entry) ? "werkzeuge" : null;
}

export function validateUsageBatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 2 ||
      Object.keys(body).some(key => !["batchId", "events"].includes(key)) || !USAGE_UUID.test(body.batchId || "") ||
      !Array.isArray(body.events) || body.events.length < 1 || body.events.length > 10) throw new Error("INVALID_USAGE_BATCH");
  const seen = new Set();
  const events = body.events.map(value => {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 3 ||
        Object.keys(value).some(key => !["page", "event", "count"].includes(key)) ||
        typeof value.page !== "string" || !Object.hasOwn(USAGE_PAGES, value.page) || !USAGE_EVENTS.includes(value.event) ||
        !Number.isInteger(value.count) || value.count < 1 || value.count > 20) throw new Error("INVALID_USAGE_BATCH");
    const key = `${value.page}:${value.event}`;
    if (seen.has(key)) throw new Error("INVALID_USAGE_BATCH");
    seen.add(key);
    return { page: value.page, event: value.event, count: value.count };
  });
  return { batchId: body.batchId.toLowerCase(), events };
}

export function usagePrivacyAllows(win) {
  try {
    if (!win) return false;
    const navigator = win.navigator || {};
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || win.doNotTrack === "1") return false;
    return win.localStorage.getItem(USAGE_LOCAL_PREFERENCE) !== "off";
  } catch { return false; }
}

export function usageBrowserAllowed(win) {
  try {
    if (!win?.navigator) return false;
    if (win.Capacitor && (typeof win.Capacitor.isNativePlatform !== "function" || win.Capacitor.isNativePlatform())) return false;
    return readWebCoursePlatform({ browserWindow: win, browserNavigator: win.navigator, capacitor: win.Capacitor }) === "browser";
  } catch { return false; }
}

export function createUsagePreferenceClient({ fetcher = (...args) => fetch(...args), windowFor = () => typeof window === "undefined" ? null : window } = {}) {
  let state = { known: false, enabled: false, serverEnabled: false, accountKey: null, consentVersion: null, loading: false, error: null, pendingEnabled: null, revision: 0 };
  let ticket = 0, controller = null, localBlock = false, requestOwner = null;
  const listeners = new Set();
  const publish = patch => { state = { ...state, ...patch, revision: state.revision + 1 }; for (const fn of listeners) { try { fn(); } catch {} } return state; };
  const invalidate = () => { ticket++; controller?.abort(); controller = null; };
  const current = (id, guard) => { try { return id === ticket && guard(); } catch { return false; } };
  // Bound the complete fetch + JSON operation, including a fetch double or
  // response body which does not settle when aborted. No retry is automatic.
  const request = (activeController, work) => new Promise((resolve, reject) => {
    let finished = false, timer;
    const settle = (callback, value) => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      activeController.signal.removeEventListener("abort", aborted);
      callback(value);
    };
    const aborted = () => settle(reject, new Error("USAGE_PREFERENCE_UNAVAILABLE"));
    activeController.signal.addEventListener("abort", aborted, { once: true });
    timer = setTimeout(() => activeController.abort(), 8000);
    Promise.resolve().then(work).then(value => settle(resolve, value), error => settle(reject, error));
  });
  const notifyWindow = () => { const win = windowFor(); if (win) try { win.dispatchEvent(new win.CustomEvent(USAGE_PREFERENCE_EVENT, { detail: { revision: state.revision } })); } catch {} };
  const stop = ({ owner } = {}) => {
    if (owner !== undefined && requestOwner !== owner) return state;
    invalidate(); requestOwner = null;
    return publish({ known: false, enabled: false, serverEnabled: false, accountKey: null, consentVersion: null, loading: false, error: null, pendingEnabled: null });
  };
  function blockLocally() {
    localBlock = true; invalidate();
    try { windowFor()?.localStorage.setItem(USAGE_LOCAL_PREFERENCE, "off"); } catch {}
    publish({ enabled: false, serverEnabled: false, loading: false, error: null }); notifyWindow();
  }
  function dto(body) {
    if (!body || typeof body.enabled !== "boolean" || !USAGE_UUID.test(body.accountKey || "") || !validUsageConsentVersion(body.consentVersion)) throw new Error("INVALID_USAGE_PREFERENCE");
    return { accountKey: body.accountKey.toLowerCase(), serverEnabled: body.enabled, consentVersion: body.consentVersion };
  }
  async function load({ isCurrent = () => true, owner = null } = {}) {
    if (!current(ticket, isCurrent)) return state;
    invalidate(); requestOwner = owner; const id = ticket; controller = new AbortController();
    const activeController = controller;
    publish({ known: false, enabled: false, loading: true, error: null, accountKey: null, consentVersion: null, pendingEnabled: null });
    try {
      const result = await request(activeController, async () => {
        const response = await fetcher("/api/account/usage-preference", { credentials: "same-origin", cache: "no-store", signal: activeController.signal });
        if (!response.ok) throw Object.assign(new Error("USAGE_PREFERENCE_UNAVAILABLE"), { status: response.status });
        return dto(await response.json());
      });
      if (!current(id, isCurrent)) return state;
      return publish({ ...result, known: true, enabled: result.serverEnabled && !localBlock && usagePrivacyAllows(windowFor()), loading: false, error: null });
    } catch (error) {
      if (!current(id, isCurrent)) return state;
      return publish({ known: false, enabled: false, loading: false, accountKey: null, error: error.status || 503 });
    }
  }
  async function setEnabled(enabled, { accountKey, revision, isCurrent = () => true, owner = null } = {}) {
    if (typeof enabled !== "boolean" || !current(ticket, isCurrent) || !state.known || accountKey !== state.accountKey || revision !== state.revision) return state;
    const expectedRevision = state.consentVersion;
    if (!enabled) blockLocally(); // Fail closed before the network, including a failed PUT.
    else { invalidate(); publish({ enabled: false, loading: true, error: null }); }
    requestOwner = owner; const id = ticket; controller = new AbortController();
    const activeController = controller;
    publish({ loading: true, error: null, pendingEnabled: enabled });
    try {
      const result = await request(activeController, async () => {
        const response = await fetcher("/api/account/usage-preference", { method: "PUT", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, accountKey, expectedRevision }), signal: activeController.signal });
        if (!response.ok) throw Object.assign(new Error("USAGE_PREFERENCE_UNAVAILABLE"), { status: response.status });
        return dto(await response.json());
      });
      if (!current(id, isCurrent)) return state;
      if (result.accountKey !== accountKey || result.serverEnabled !== enabled) throw new Error("INVALID_USAGE_PREFERENCE");
      let remembered = true;
      try { windowFor().localStorage.setItem(USAGE_LOCAL_PREFERENCE, enabled ? "on" : "off"); } catch { remembered = false; }
      localBlock = !enabled || !remembered;
      publish({ ...result, known: true, enabled: enabled && !localBlock && usagePrivacyAllows(windowFor()), loading: false, error: remembered ? null : 503, pendingEnabled: null });
      notifyWindow(); return state;
    } catch (error) {
      if (!current(id, isCurrent)) return state;
      // A server may have accepted a PUT whose response was lost. Keep the
      // local stop across later GETs until an explicit enable is confirmed.
      localBlock = true;
      try { windowFor()?.localStorage.setItem(USAGE_LOCAL_PREFERENCE, "off"); } catch {}
      publish({ enabled: false, loading: false, error: error.status || 503, ...([401, 403, 409].includes(error.status) ? { known: false, accountKey: null, consentVersion: null, pendingEnabled: null } : {}) });
      notifyWindow(); return state;
    }
  }
  const isBlocked = () => { try { return localBlock || windowFor()?.localStorage.getItem(USAGE_LOCAL_PREFERENCE) === "off"; } catch { return true; } };
  return { getSnapshot: () => state, isBlocked, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, stop, blockLocally, load, setEnabled };
}

export const usagePreferenceClient = createUsagePreferenceClient();
export function stopUsageAnalytics() { usagePreferenceClient.stop(); }
