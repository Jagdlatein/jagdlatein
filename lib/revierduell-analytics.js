// Named first-party counters only; no seed, question, answer, score or identity.
// Enabled only after the corresponding SQL migration and explicit server flag.
export const REVIERDUELL_ANALYTICS_EVENT = "jagdlatein-revierduell-usage";
export const REVIERDUELL_ANALYTICS_EVENTS = Object.freeze([
  "revierduell_view", "revierduell_start", "revierduell_question_view",
  "revierduell_answer", "revierduell_complete", "revierduell_share", "revierduell_copy",
]);
const ownEvents = new WeakSet(), eventRecords = new WeakMap();
export function readDuellAnalyticsEvent(event) {
  if (!event || !ownEvents.has(event) || event.type !== REVIERDUELL_ANALYTICS_EVENT) return null;
  const record = eventRecords.get(event);
  ownEvents.delete(event); eventRecords.delete(event);
  // Retained/replayed events cannot later adopt a different round or owner.
  try { return record?.isCurrent() === true ? record.name : null; } catch { return null; }
}
export function emitDuellAnalytics(name, { enabled = false, isCurrent = () => false } = {}) {
  if (enabled !== true || !REVIERDUELL_ANALYTICS_EVENTS.includes(name) || typeof isCurrent !== "function") return false;
  try {
    if (!isCurrent() || typeof window === "undefined" || window.location?.pathname !== "/revierduell" || typeof window.CustomEvent !== "function") return false;
    const event = new window.CustomEvent(REVIERDUELL_ANALYTICS_EVENT, { detail: Object.freeze({ name }) });
    ownEvents.add(event); eventRecords.set(event, { name, isCurrent });
    window.dispatchEvent(event);
    return true;
  } catch { return false; }
}
