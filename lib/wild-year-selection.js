import { wildYearCatalog } from "./wild-year-catalog";

export function validWildYearMonth(value) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

// Missing fields preserve the documented first entry. Explicit invalid fields
// remain invalid instead of showing another species or month as a fallback.
export function readWildYearSelection(query = {}, currentMonth = 1) {
  const slug = query.art === undefined ? "gamswild"
    : typeof query.art === "string" && wildYearCatalog.some(item => item.slug === query.art) ? query.art : null;
  const rawMonth = query.monat;
  const month = rawMonth === undefined ? validWildYearMonth(currentMonth) ? currentMonth : 1
    : typeof rawMonth === "string" && /^\d{1,2}$/.test(rawMonth.trim()) && validWildYearMonth(Number(rawMonth)) ? Number(rawMonth) : null;
  return { slug, month };
}
