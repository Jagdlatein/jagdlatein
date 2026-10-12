// Device-only repetition history: no email, chosen answer, cookie or server write.
export const REVIEW_STORAGE_KEY = "jagdlatein.repetition.v1";
const DAY = 86400000;
const LIMIT = 1000;
const ID = /^[a-z][a-z0-9-]{1,159}$/;
const empty = () => ({ version: 1, entries: {} });
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;

export function parseReviewHistory(raw) {
  if (typeof raw !== "string" || raw.length > 350000) return empty();
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !value.entries || Array.isArray(value.entries) || typeof value.entries !== "object") return empty();
    const entries = {};
    for (const [id, item] of Object.entries(value.entries).slice(0, LIMIT)) {
      if (!ID.test(id) || !item || !integer(item.seen, 1, 100000) || !integer(item.mistakes, 0, item.seen)
        || !integer(item.streak, 0, 5) || !integer(item.lastSeen, 0, 8640000000000000)
        || !integer(item.due, item.lastSeen, item.lastSeen + 30 * DAY)
        || typeof item.lastEvent !== "string" || item.lastEvent.length > 240) continue;
      entries[id] = { seen: item.seen, mistakes: item.mistakes, streak: item.streak, lastSeen: item.lastSeen, due: item.due, lastEvent: item.lastEvent };
    }
    return { version: 1, entries };
  } catch { return empty(); }
}

export function updateReviewHistory(history, id, correct, now, eventId) {
  const clean = parseReviewHistory(JSON.stringify(history));
  if (!ID.test(id) || typeof correct !== "boolean" || !integer(now, 0, 8640000000000000 - 30 * DAY)
    || typeof eventId !== "string" || !eventId.length || eventId.length > 240) return clean;
  const old = clean.entries[id];
  if (old?.lastEvent === eventId || (old && now < old.lastSeen)) return clean;
  const streak = correct ? Math.min(5, (old?.streak || 0) + 1) : 0;
  const delay = correct ? [1, 3, 7, 14, 30][streak - 1] * DAY : 10 * 60000;
  clean.entries[id] = { seen: Math.min(100000, (old?.seen || 0) + 1), mistakes: Math.min(100000, (old?.mistakes || 0) + (correct ? 0 : 1)), streak, lastSeen: now, due: now + delay, lastEvent: eventId };
  const ordered = Object.entries(clean.entries).sort((a, b) => b[1].lastSeen - a[1].lastSeen).slice(0, LIMIT);
  return { version: 1, entries: Object.fromEntries(ordered) };
}

export function readReviewHistory() {
  try { return parseReviewHistory(window.localStorage.getItem(REVIEW_STORAGE_KEY)); } catch { return empty(); }
}
export function recordReviewAnswer(id, correct, eventId = null, answeredAt = Date.now()) {
  try {
    const event = eventId || `${answeredAt}:${Math.random().toString(36).slice(2)}`;
    const next = updateReviewHistory(readReviewHistory(), id, correct, answeredAt, event);
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch { return false; }
}
export function clearReviewHistory() {
  try { window.localStorage.removeItem(REVIEW_STORAGE_KEY); return true; } catch { return false; }
}

function hash(value) { return [...value].reduce((sum, char) => (Math.imul(sum, 31) + char.charCodeAt(0)) >>> 0, 7); }
export function selectDailyReview(pool, history, { now = Date.now(), category = "", count = 8 } = {}) {
  const entries = parseReviewHistory(JSON.stringify(history)).entries;
  const dateKey = Math.floor(now / DAY);
  const unique = new Map(pool.filter(item => ID.test(item.id) && (!category || item.category === category)).map(item => [item.id, item]));
  return [...unique.values()].map(question => {
    const item = entries[question.id];
    const reason = item?.due <= now ? (item.streak === 0 ? "Fehler wiederholen" : "Fällige Wiederholung") : !item ? "Neu entdecken" : "Erneut festigen";
    const priority = reason === "Fehler wiederholen" ? 0 : reason === "Fällige Wiederholung" ? 1 : reason === "Neu entdecken" ? 2 : 3;
    return { ...question, reason, priority, due: item?.due || 0, order: hash(`${dateKey}:${question.id}`) };
  }).sort((a, b) => a.priority - b.priority || (a.priority < 2 ? a.due - b.due : a.order - b.order) || a.id.localeCompare(b.id))
    .slice(0, Math.max(1, Math.min(20, Math.floor(count) || 8))).map(({ priority, due, order, ...question }) => question);
}

export const reviewMethodSources = [
  { label: "Roediger & Karpicke (2006): Abrufen und längerfristiges Behalten", organization: "Washington University / Psychological Science", url: "https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/", supports: "Die untersuchten Abrufübungen verbesserten die spätere Erinnerung an gelesene Texte gegenüber erneutem Lesen. Das ist kein Nachweis für eine bestimmte App oder eine Fünf-Minuten-Dauer." },
  { label: "Cepeda et al. (2006): Verteiltes Üben – Metaanalyse", organization: "University of Colorado / UC San Diego / University of South Florida", url: "https://escholarship.org/uc/item/3rr6q10c", supports: "Abstände zwischen Lernphasen und der spätere Prüfzeitpunkt wirken zusammen. Die Studie gibt keinen universell optimalen Wiederholungsplan vor." },
];
