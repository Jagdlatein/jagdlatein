// Device persistence belongs to the UI. These functions have no browser access,
// network calls, course completion writes or effects on ranked quiz results.
export const FLASHCARD_STORAGE_KEY = "jagdlatein.flashcards.v1";
const DAY = 86400000;
const AGAIN_DELAY = 10 * 60000;
const INTERVALS = [1, 3, 7, 14, 30];
const ID = /^[a-z][a-z0-9-]{1,159}$/;
const MAX_TIME = 8640000000000000;
const LIMIT = 1000;
const empty = () => ({ version: 1, cards: {} });
const timestamp = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIME - 30 * DAY;
const validId = value => typeof value === "string" && ID.test(value);

export function parseFlashcardReview(raw) {
  try {
    if (typeof raw === "string") {
      if (raw.length > 350000) return empty();
      raw = JSON.parse(raw);
    }
    if (!raw || raw.version !== 1 || !raw.cards || typeof raw.cards !== "object" || Array.isArray(raw.cards)) return empty();
    const entries = [];
    for (const [id, item] of Object.entries(raw.cards).slice(0, LIMIT)) {
      if (!ID.test(id) || !item || !["again", "known"].includes(item.rating) || !timestamp(item.reviewedAt)) continue;
      const interval = item.intervalDays;
      if (item.rating === "again" ? interval !== 0 : !INTERVALS.includes(interval)) continue;
      const delay = item.rating === "again" ? AGAIN_DELAY : interval * DAY;
      if (!Number.isSafeInteger(item.dueAt) || item.dueAt !== item.reviewedAt + delay) continue;
      entries.push([id, { rating: item.rating, reviewedAt: item.reviewedAt, dueAt: item.dueAt, intervalDays: interval }]);
    }
    return { version: 1, cards: Object.fromEntries(entries) };
  } catch { return empty(); }
}

export function getFlashcardRating(state, id) {
  if (!validId(id)) return null;
  const clean = parseFlashcardReview(state);
  return Object.hasOwn(clean.cards, id) ? clean.cards[id] : null;
}

export function rateFlashcardReview(state, id, rating, now) {
  const clean = parseFlashcardReview(state);
  if (!validId(id) || !["again", "known"].includes(rating) || !timestamp(now)) return clean;
  const old = getFlashcardRating(clean, id);
  // Duplicate same-frame or stale callbacks cannot advance the schedule twice.
  if (old && now <= old.reviewedAt) return clean;
  const step = old?.rating === "known" ? Math.min(INTERVALS.length - 1, INTERVALS.indexOf(old.intervalDays) + 1) : 0;
  const intervalDays = rating === "again" ? 0 : INTERVALS[step];
  clean.cards[id] = { rating, reviewedAt: now, dueAt: now + (rating === "again" ? AGAIN_DELAY : intervalDays * DAY), intervalDays };
  const recent = Object.entries(clean.cards).sort((a, b) => b[1].reviewedAt - a[1].reviewedAt || a[0].localeCompare(b[0])).slice(0, LIMIT);
  return { version: 1, cards: Object.fromEntries(recent) };
}

export function getDueCards(cards, state, now) {
  if (!Array.isArray(cards) || !timestamp(now)) return [];
  const clean = parseFlashcardReview(state);
  return cards.filter(card => card && validId(card.id) && Object.hasOwn(clean.cards, card.id) && clean.cards[card.id].dueAt <= now)
    .sort((a, b) => clean.cards[a.id].dueAt - clean.cards[b.id].dueAt || a.id.localeCompare(b.id));
}

// This is a simple local self-assessment schedule, not a measured guarantee of
// recall or the universally optimal spacing for a learner or subject.
