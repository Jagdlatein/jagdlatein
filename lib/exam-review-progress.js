import { parseReviewHistory } from "./daily-review";
import { unpackDailyReviewCatalog } from "./daily-review-catalog";
import { learningCategoryDetails } from "./learning-categories";

const categories = new Set(learningCategoryDetails.map(item => item.slug).filter(slug => slug !== "jagdrecht"));
const counts = () => ({ available: 0, answered: 0, due: 0, mistakes: 0 });

// A view over existing device records, never a new store or a measure of mastery.
// Removed/unknown question IDs and regional law are deliberately not counted.
export function getExamReviewProgress(catalog, raw, now = Date.now()) {
  const items = unpackDailyReviewCatalog(catalog);
  if (!items.length || new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !categories.has(item.category)) || !Number.isSafeInteger(now) || now < 0 || now > 8640000000000000) return null;
  if (raw !== null) {
    if (typeof raw !== "string" || raw.length > 1750000) return null;
    try {
      const value = JSON.parse(raw);
      if (value?.version !== 1 || !value.entries || typeof value.entries !== "object" || Array.isArray(value.entries)) return null;
    } catch { return null; }
  }
  const history = parseReviewHistory(raw).entries;
  const total = counts(), byCategory = {};
  for (const item of items) {
    const group = byCategory[item.category] ||= counts();
    group.available++; total.available++;
    const entry = Object.hasOwn(history, item.id) ? history[item.id] : null;
    if (!entry) continue;
    group.answered++; total.answered++;
    if (entry.due <= now) { group.due++; total.due++; }
    if (entry.streak === 0) { group.mistakes++; total.mistakes++; }
  }
  return { total, byCategory };
}

export function examReviewHref(mode, category = "") {
  if (!["gemischt", "faellig", "fehler"].includes(mode) || category !== "" && !categories.has(category)) return null;
  return `/lernen/fuenf-minuten?modus=${mode}${category ? `&kategorie=${encodeURIComponent(category)}` : ""}`;
}
