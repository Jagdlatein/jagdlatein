import { examCountries, normalizeExamProfile } from "./exam-profile";

export const EXAM_GOAL_PROGRESS_KEY = "jagdlatein-exam-goals-v1";
export const EXAM_GOAL_STATES = ["offen", "ueben", "erklaert"];
const goalId = value => typeof value === "string" && /^[a-z][a-z0-9-]{1,100}$/.test(value);
const object = value => Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype);
export function examGoalProfileKey(value) { const profile = normalizeExamProfile(value); return profile ? `${profile.country}:${profile.region}` : ""; }

// Only already projected authored goals are eligible. The registry retains the
// current objects to invalidate callbacks captured before a content change.
export function buildExamGoalCatalog(blueprint, alignment) {
  const common = (blueprint?.categories || []).flatMap(category => category.goals || []);
  const profiles = new Map();
  for (const country of examCountries) for (const region of country.regions) {
    const selected = alignment?.regions?.find(item => item.country === country.code && item.region === region.code);
    const goals = [...common, ...(selected?.subjectAreas || []).flatMap(area => area.goals || [])];
    const ids = new Map();
    for (const goal of goals) {
      if (!goalId(goal?.id) || ids.has(goal.id)) throw new Error("Ungültiger Lernzielbezug");
      ids.set(goal.id, goal);
    }
    profiles.set(`${country.code}:${region.code}`, ids);
  }
  return { profiles };
}

function knownEntries(entries, catalog) {
  const result = {};
  if (!object(entries) || !catalog?.profiles || Object.keys(entries).length > 51) return result;
  let count = 0;
  for (const [profile, values] of Object.entries(entries)) {
    const allowed = catalog.profiles.get(profile);
    if (!allowed || !object(values) || Object.keys(values).length > 256) continue;
    const valid = {};
    for (const [id, state] of Object.entries(values)) {
      if (++count > 4096) return {};
      if (goalId(id) && allowed.has(id) && ["ueben", "erklaert"].includes(state)) valid[id] = state;
    }
    if (Object.keys(valid).length) result[profile] = valid;
  }
  return result;
}

export function readExamGoalProgress(raw, catalog) {
  if (raw === null || raw === "") return {};
  if (typeof raw !== "string" || raw.length > 524288) return {};
  try {
    const value = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || Object.keys(value).some(key => !["version", "profiles"].includes(key))) return {};
    return knownEntries(value.profiles, catalog);
  } catch { return {}; }
}

const neutral = () => Object.freeze({ phase: "loading", entries: {}, persistence: "unknown", revision: 0, error: "" });
export function createExamGoalProgressStore({ windowFor = () => typeof window === "undefined" ? null : window } = {}) {
  let snapshot = neutral(), catalog = null, target = null, listening = null, sessionOnly = false, account = null;
  const listeners = new Set();
  function publish(patch) {
    snapshot = Object.freeze({ ...snapshot, ...patch, revision: snapshot.revision + 1 });
    for (const notify of listeners) { try { notify(); } catch {} }
    return snapshot;
  }
  function restore() {
    if (!target || !catalog) return;
    if (sessionOnly) return publish({ phase: "ready", persistence: "session" });
    try {
      const entries = readExamGoalProgress(target.localStorage.getItem(EXAM_GOAL_PROGRESS_KEY), catalog);
      publish({ phase: "ready", entries, persistence: "device", error: "" });
    } catch {
      sessionOnly = true;
      publish({ phase: "ready", persistence: "session", error: "Der Gerätespeicher ist nicht verfügbar. Deine Selbstkontrolle bleibt nur in dieser Sitzung." });
    }
  }
  function storage(event) {
    if (!target || event.key !== EXAM_GOAL_PROGRESS_KEY && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== target.localStorage) return; } catch { return; }
    // A queued StorageEvent may contain an older newValue. Read present bytes.
    // A blocked write/remove keeps session marks, but a confirmed native clear
    // in another tab must still clear RAM without reviving older device bytes.
    if (sessionOnly) {
      try { if (target.localStorage.getItem(EXAM_GOAL_PROGRESS_KEY) === null) { sessionOnly = false; publish({ phase: "ready", entries: {}, persistence: "device", error: "" }); } } catch {}
      return;
    }
    restore();
  }
  function attach() {
    const win = windowFor();
    if (!win) return;
    if (target !== win) {
      listening?.removeEventListener?.("storage", storage); listening = null;
      target = win; account = null; sessionOnly = false; snapshot = neutral();
    }
    if (!listening) { listening = win; listening.addEventListener?.("storage", storage); restore(); }
  }
  function persist(entries) {
    let saved = false;
    if (!sessionOnly) try { target ||= windowFor(); if (!target) throw new Error(); target.localStorage.setItem(EXAM_GOAL_PROGRESS_KEY, JSON.stringify({ version: 1, profiles: entries })); saved = true; } catch {}
    sessionOnly = !saved;
    publish({ phase: "ready", entries, persistence: saved ? "device" : "session", error: saved ? "" : "Deine Änderung gilt nur in dieser Sitzung. Sie konnte nicht auf dem Gerät gespeichert werden." });
    return true;
  }
  function currentEntries() {
    // Another tab may have saved before its queued StorageEvent arrives. Start
    // an explicit delta from the present device bytes, not that older snapshot.
    if (!sessionOnly) try { return readExamGoalProgress(target.localStorage.getItem(EXAM_GOAL_PROGRESS_KEY), catalog); }
    catch { sessionOnly = true; }
    // A failed read must never be followed by overwriting an unknown device
    // value. The explicit change remains in this session instead.
    return knownEntries(snapshot.entries, catalog);
  }
  function clear() {
    target ||= windowFor();
    let removed = false;
    try { if (!target) throw new Error(); target.localStorage.removeItem(EXAM_GOAL_PROGRESS_KEY); removed = true; } catch {}
    sessionOnly = !removed;
    publish({ phase: "ready", entries: {}, persistence: removed ? "device" : "session", error: removed ? "" : "Die Selbstkontrolle wurde in dieser Sitzung entfernt. Der blockierte Gerätespeicher konnte nicht bereinigt werden." });
    return removed;
  }
  return {
    getSnapshot: () => snapshot,
    configure(value) {
      if (catalog === value) return;
      catalog = value;
      if (snapshot.phase === "ready") publish({ entries: knownEntries(snapshot.entries, catalog) });
    },
    isCatalog: value => catalog === value,
    bindAccount(value) {
      if (typeof value !== "string" || !value) return;
      if (account && account !== value) clear();
      account = value; // RAM guard only. Never persisted or returned.
    },
    accountMatches: value => !value || !account || account === value,
    subscribe(notify) {
      listeners.add(notify); attach();
      return () => { listeners.delete(notify); if (!listeners.size && listening) { listening.removeEventListener?.("storage", storage); listening = null; } };
    },
    set(profile, goal, state) {
      if (snapshot.phase !== "ready" || !catalog?.profiles.get(profile)?.has(goal) || !EXAM_GOAL_STATES.includes(state)) return false;
      const entries = currentEntries(), values = { ...(entries[profile] || {}) };
      if (state === "offen") delete values[goal]; else values[goal] = state;
      if (Object.keys(values).length) entries[profile] = values; else delete entries[profile];
      return persist(entries);
    },
    reset(profile) {
      if (snapshot.phase !== "ready" || !catalog?.profiles.has(profile)) return false;
      const entries = currentEntries(); delete entries[profile];
      return persist(entries);
    },
    clear,
  };
}

export const examGoalProgressStore = createExamGoalProgressStore();
// The ordinary logout/account-deletion flow calls this; no other learning or
// account preference is changed. False means blocked storage, never old RAM.
export function clearExamGoalProgress() { return examGoalProgressStore.clear(); }
