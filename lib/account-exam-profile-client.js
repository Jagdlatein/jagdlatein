import { normalizeExamProfile } from "./exam-profile";

// Account preferences stay in RAM. The server, never an old device preference,
// decides whether this authenticated account has completed its first choice.
const listeners = new Set();
const initial = Object.freeze({ phase: "idle", ready: false, profile: null, accountKey: null, persistence: "account", saving: false, error: "", saveProfile: saveAccountExamProfile, clearProfile: () => false });
let snapshot = initial, generation = 0, pending = null;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const same = (a, b) => a === b || Boolean(a && b && a.country === b.country && a.region === b.region);
function publish(values) {
  const next = { ...snapshot, ...values };
  if (same(snapshot.profile, next.profile)) next.profile = snapshot.profile;
  snapshot = Object.freeze(next);
  [...listeners].forEach(notify => notify());
}
export const getAccountExamSnapshot = () => snapshot;
export const getServerAccountExamSnapshot = () => initial;
export function subscribeAccountExamProfile(notify) { listeners.add(notify); return () => listeners.delete(notify); }

async function request(options, controller) {
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch("/api/account/exam-profile", { cache: "no-store", credentials: "same-origin", ...options, signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw Object.assign(new Error(body?.message || "Dein Prüfungsziel konnte nicht geladen werden."), { status: response.status });
        if (!uuid.test(body?.accountKey || "") || !Object.hasOwn(body, "profile") || (body.profile !== null && !normalizeExamProfile(body.profile))) throw new Error("Dein Prüfungsziel konnte nicht gelesen werden.");
        return { accountKey: body.accountKey, profile: normalizeExamProfile(body.profile) };
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("Die Antwort dauert zu lange. Bitte erneut versuchen.")); }, 18000); }),
    ]);
  } finally { clearTimeout(timer); }
}

export async function loadAccountExamProfile({ force = false } = {}) {
  if (typeof window === "undefined") return false;
  if (!force && snapshot.phase !== "idle") return snapshot.phase === "ready";
  pending?.abort();
  const ticket = ++generation, controller = new AbortController(); pending = controller;
  publish({ phase: "loading", ready: false, profile: null, accountKey: null, saving: false, error: "" });
  try {
    const data = await request({}, controller);
    if (generation !== ticket || pending !== controller || controller.signal.aborted) return false;
    publish({ ...data, phase: "ready", ready: true, error: "" });
    return true;
  } catch (error) {
    if (generation !== ticket || pending !== controller) return false;
    publish({ phase: error.status === 401 ? "signed-out" : "error", ready: false, profile: null, accountKey: null, error: error.status === 401 ? "Bitte melde dich erneut an." : "Dein Prüfungsziel ist gerade nicht verfügbar. Bitte erneut versuchen." });
    return false;
  } finally { if (pending === controller) pending = null; }
}

export async function saveAccountExamProfile(value) {
  const profile = normalizeExamProfile(value);
  if (!profile || snapshot.phase !== "ready" || !snapshot.accountKey || snapshot.saving || pending) return false;
  const accountKey = snapshot.accountKey, ticket = generation, controller = new AbortController(); pending = controller;
  publish({ saving: true, error: "" });
  try {
    const data = await request({ method: "PUT", headers: { "Content-Type": "application/json", "X-Jagdlatein-Exam-Account": accountKey }, body: JSON.stringify(profile) }, controller);
    if (ticket !== generation || pending !== controller || controller.signal.aborted) return false;
    if (data.accountKey !== accountKey || !same(data.profile, profile)) throw Object.assign(new Error("Die Kontositzung hat sich geändert."), { status: 409 });
    publish({ profile: data.profile, saving: false, error: "" });
    return true;
  } catch (error) {
    if (ticket !== generation || pending !== controller) return false;
    if ([401, 409].includes(error.status)) publish({ phase: "signed-out", ready: false, profile: null, accountKey: null, saving: false, error: "Deine Kontositzung hat sich geändert. Bitte erneut anmelden." });
    else publish({ saving: false, error: "Dein Prüfungsziel wurde nicht bestätigt. Bitte erneut speichern." });
    return false;
  } finally { if (pending === controller) pending = null; }
}

export function resetAccountExamProfile() {
  generation++;
  pending?.abort(); pending = null;
  publish({ phase: "signed-out", ready: false, profile: null, accountKey: null, saving: false, error: "Bitte melde dich erneut an." });
}
