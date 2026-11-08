import { getRevierMomentCases } from "./revier-moment-cases-server";

const DAY_MS = 86400000;
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich", era: "short", year: "numeric", month: "2-digit", day: "2-digit",
});
const displayFormatter = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich", day: "numeric", month: "long", year: "numeric",
});
const hasText = value => typeof value === "string" && value.trim().length > 0;
const isDateKey = value => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
};
function requireData(condition) {
  if (!condition) throw new Error("Revier-Moment: Der geprüfte Fragenvorrat ist unvollständig oder ungültig.");
}

// A Swiss civil day, rather than elapsed hours, determines the case. Epoch-based
// day numbering keeps the 60-day cycle continuous through DST and New Year.
// These are rotating, previously reviewed cases; selection is not a new review.
export function getRevierMoment(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError("Revier-Moment: now muss ein gültiges Date-Objekt sein.");
  }
  const parts = Object.fromEntries(dayFormatter.formatToParts(now).map(part => [part.type, part.value]));
  const dateKey = `${parts.year.padStart(4, "0")}-${parts.month}-${parts.day}`;
  if (parts.era !== "AD" || !isDateKey(dateKey) || Number(parts.year) < 1) throw new RangeError("Revier-Moment: Datum außerhalb des unterstützten Kalenderbereichs.");
  const day = Math.floor(new Date(`${dateKey}T00:00:00.000Z`).getTime() / DAY_MS);
  const cases = getRevierMomentCases();
  requireData(Array.isArray(cases) && cases.length === 60 && new Set(cases.map(item => item.question?.id)).size === 60);
  const cycleDay = ((day % cases.length) + cases.length) % cases.length;
  return { dateKey, displayDate: displayFormatter.format(now), ...cases[cycleDay] };
}

// Only this explicit teaser may be passed to the public home page. No answer,
// source mapping, full question, photograph or unused dossier crosses that edge.
export function getRevierMomentPreview(moment) {
  requireData(moment && isDateKey(moment.dateKey) && hasText(moment.displayDate)
    && hasText(moment.question?.prompt) && hasText(moment.topic?.title));
  return { dateKey: moment.dateKey, displayDate: moment.displayDate, prompt: moment.question.prompt, topicTitle: moment.topic.title };
}
