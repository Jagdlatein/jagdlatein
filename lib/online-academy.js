export class AcademyError extends Error {
  constructor(code, status, message) { super(message); this.code = code; this.status = status; }
}

export const ACADEMY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invalid = (message = "Bitte prüfe die Angaben zum Onlinekurs.") => {
  throw new AcademyError("INVALID_ACADEMY_RECORD", 400, message);
};
const plain = value => value && typeof value === "object" && !Array.isArray(value);
function text(value, min, max) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) invalid();
  return value.trim();
}
function uuid(value) {
  if (typeof value !== "string" || !ACADEMY_UUID.test(value)) invalid();
  return value.toLowerCase();
}
function status(value, choices) {
  if (!choices.includes(value)) invalid();
  return value;
}
export function normalizeAcademyWebsite(value) {
  if (value === "" || value === null || value === undefined) return "";
  const raw = text(value, 1, 500);
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !url.hostname.includes(".") || url.hostname.endsWith(".") || /[\s\\]/.test(raw)) invalid();
    return url.href;
  } catch { return invalid("Bitte eine vollständige HTTPS-Webadresse ohne Zugangsdaten eintragen."); }
}
function timestamp(value) {
  // UTC is explicit. Reject calendar rollover and ambiguous local date strings.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) invalid("Bitte Beginn und Ende mit Datum und Uhrzeit festlegen.");
  const time = Date.parse(value);
  if (value.startsWith("0000-") || !Number.isFinite(time) || new Date(time).toISOString() !== value.replace(/Z$/, value.includes(".") ? "Z" : ".000Z")) invalid("Datum oder Uhrzeit ist ungültig.");
  return new Date(time).toISOString();
}

export function validateAcademyRecord(action, record, { moduleIds = [], categorySlugs = [] } = {}) {
  const allowed = {
    school: ["id", "name", "description", "website", "status"],
    offer: ["id", "school_id", "title", "description", "category_slug", "module_ids", "status"],
    session: ["id", "offer_id", "title", "starts_at", "ends_at", "status"],
  };
  const fields = typeof action === "string" && Object.hasOwn(allowed, action) ? allowed[action] : null;
  if (!fields || !plain(record) || Object.keys(record).some(key => !fields.includes(key))) invalid();
  const id = Object.hasOwn(record, "id") ? uuid(record.id) : null;
  if (action === "school") return {
    ...(id ? { id } : {}), name: text(record.name, 2, 120), description: text(record.description, 1, 2000),
    website: normalizeAcademyWebsite(record.website), status: status(record.status, ["pending", "approved", "rejected"]),
  };
  if (action === "offer") {
    if (typeof record.category_slug !== "string" || !categorySlugs.includes(record.category_slug)) invalid("Bitte eine vorhandene Lernkategorie wählen.");
    if (!Array.isArray(record.module_ids) || record.module_ids.length < 1 || record.module_ids.length > 32 || new Set(record.module_ids).size !== record.module_ids.length || record.module_ids.some(id => typeof id !== "string" || !moduleIds.includes(id))) invalid("Bitte zwischen einer und 32 vorhandenen Lerneinheiten auswählen.");
    return { ...(id ? { id } : {}), school_id: uuid(record.school_id), title: text(record.title, 3, 160),
      description: text(record.description, 1, 2000), category_slug: record.category_slug,
      module_ids: [...record.module_ids], status: status(record.status, ["draft", "submitted", "published"]) };
  }
  const starts_at = timestamp(record.starts_at), ends_at = timestamp(record.ends_at);
  if (Date.parse(ends_at) <= Date.parse(starts_at) || Date.parse(ends_at) - Date.parse(starts_at) > 8 * 60 * 60 * 1000) invalid("Das Ende muss nach dem Beginn und höchstens acht Stunden später liegen.");
  return { ...(id ? { id } : {}), offer_id: uuid(record.offer_id), title: text(record.title, 3, 160),
    starts_at, ends_at, status: status(record.status, ["scheduled", "cancelled"]) };
}

export function getSessionPhase(session, now = Date.now()) {
  if (session?.status === "cancelled") return "cancelled";
  const start = Date.parse(session?.starts_at), end = Date.parse(session?.ends_at);
  if (session?.status !== "scheduled" || !Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isFinite(now)) return "unavailable";
  if (now < start - 15 * 60000) return "upcoming";
  if (now < start) return "opening";
  if (now < end) return "live";
  return "ended";
}
