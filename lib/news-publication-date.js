// Date-only source announcements do not claim an observed publication time.
// DACH uses the same civil day in this timezone, including summer time.
const dachDate = new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" });
function calendarDay(time) {
  const parts = Object.fromEntries(dachDate.formatToParts(time).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isNewsPublicationCurrent(item, now = Date.now()) {
  if (!item || !Number.isFinite(now)) return false;
  const timestamp = Date.parse(item.publishedAt);
  if (!Number.isFinite(timestamp)) return false;
  const earliest = now - 366 * 86400000;
  if (!Object.hasOwn(item, "publishedDate")) return timestamp <= now && timestamp >= earliest;

  const day = item.publishedDate;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsedDay = Date.parse(`${day}T12:00:00Z`);
  if (!Number.isFinite(parsedDay) || new Date(parsedDay).toISOString().slice(0, 10) !== day
    || new Date(timestamp).toISOString().slice(0, 10) !== day) return false;
  return day <= calendarDay(now) && day >= calendarDay(earliest);
}
