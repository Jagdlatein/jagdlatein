import { wildYearCatalog } from "./wild-year-catalog";

export function validWildYearMonth(value) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

// A bare entry opens the species chooser instead of silently choosing Gams.
// Explicit invalid fields stay invalid; a missing month uses the Swiss calendar.
export function readWildYearSelection(query = {}, currentMonth = 1) {
  const slug = typeof query.art === "string" && wildYearCatalog.some(item => item.slug === query.art) ? query.art : null;
  const rawMonth = query.monat;
  const month = rawMonth === undefined ? validWildYearMonth(currentMonth) ? currentMonth : 1
    : typeof rawMonth === "string" && /^\d{1,2}$/.test(rawMonth.trim()) && validWildYearMonth(Number(rawMonth)) ? Number(rawMonth) : null;
  return { slug, month };
}
