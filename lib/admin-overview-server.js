import { courses } from "./course-catalog";
import { isPayPalSandboxTestEnvironment } from "./test-environment";
import { trialOverviewJson } from "./admin-trial-overview";
import { USAGE_PAGES } from "./usage-analytics";

const STATUSES = new Set(["ready", "not_configured", "unavailable", "not_recorded", "not_applicable"]);
const DAY = 86400000;
const definitions = [
  ["accounts", "Konten", "Aktueller Kontobestand und bis zu 30 häufigste Prüfungsziele; keine Anmelde- oder Registrierungshistorie.",
    [["current", "Aktuelle Konten"], ["admins", "Administratorkonten"], ["legacy", "Legacy-Freischaltungen"], ["examSelected", "Prüfungsziel gewählt"], ["examMissing", "Prüfungsziel offen"]],
    [["country", "Land", "text"], ["region", "Prüfungsregion", "text"], ["accounts", "Konten", "count"]]],
  ["learning", "Lernrunden", "Gespeicherte abgeschlossene Runden im Zeitraum. Verifizierte Quizrunden und selbst gemeldete Ergebnisse bleiben unterscheidbar; Rundendauer ist keine aktive Lernzeit.",
    [["rounds", "Abgeschlossene Runden"], ["learners", "Konten mit abgeschlossenen Runden"], ["verified", "Servergeprüfte Quizrunden"], ["selfReported", "Selbst gemeldete Runden"], ["questions", "Beantwortete Fragen"], ["correct", "Richtige Antworten"], ["accuracy", "Gewichtete Trefferquote", "percent"], ["seconds", "Gespeicherte Rundendauer", "seconds"]],
    [["activity", "Aktivität", "text"], ["country", "Land", "text"], ["rounds", "Runden", "count"], ["accuracy", "Trefferquote", "percent"]]],
  ["courses", "Kursfortschritt", "Aktuelle gespeicherte Kursstände; ein Kursstand ersetzt keinen Verlauf einzelner Übungen. Abschlüsse im Zeitraum verwenden den ersten gespeicherten Abschluss. Die Tabelle zeigt bis zu 20 Kurse; die Kennzahlen berücksichtigen alle gespeicherten Kursstände.",
    [["pairs", "Gespeicherte Kursstände"], ["completed", "Abgeschlossene Kursstände"], ["learners", "Konten mit Kursständen"], ["firstCompletions", "Erste Kursabschlüsse im Zeitraum"]],
    [["course", "Kurs", "text"], ["learners", "Konten", "count"], ["completed", "Abgeschlossen", "count"], ["lastUpdated", "Letztes gespeichertes Update", "date"]]],
  ["subscriptions", "Abos und Lernzugänge", "Verträge und eindeutige Konten sind verschiedene Größen. Deckung folgt den gespeicherten Anbieterfristen, nicht einer neuen Anbieterabfrage. Prüfbedarf kann auch Verträge mit aktueller Deckung betreffen. Kulanz-, Legacy- und Adminzugänge sind keine bezahlten Abos.",
    [["contracts", "Gespeicherte Verträge"], ["paid", "Verträge mit Zahlungsdeckung"], ["trial", "Verträge mit Testzugang"], ["grace", "Apple-Zahlungsfrist"], ["ended", "Ohne aktuelle Deckung"], ["review", "Nachweise prüfen"], ["coveredAccounts", "Konten mit Anbieterdeckung"], ["courtesy", "Aktuelle Kulanzzugänge"], ["legacy", "Legacy-Freischaltungen"], ["admins", "Administratorkonten"]],
    [["provider", "Anbieter", "text"], ["state", "Gespeicherter Stand", "text"], ["contracts", "Verträge", "count"], ["accounts", "Eindeutige Konten", "count"]]],
  ["payments", "Zahlungsnachweise", "PayPal-Beträge sind gespeicherte ursprüngliche Bruttobeträge je Währung. Teilrückzahlungen stehen separat und sind kein Nettoumsatz. Die Tabelle zeigt höchstens 30 Währungs-/Statusgruppen; Kennzahlen zählen alle Nachweise. Unvollständige Beträge werden separat gezählt und nicht summiert. Apple-Transaktionen enthalten hier keine Preise. Keine Gesamtumsatz- oder MRR-Berechnung.",
    [["paypalCompleted", "PayPal-Zahlungen mit Status abgeschlossen"], ["paypalPartial", "PayPal-Zahlungen mit Teilrückzahlung"], ["paypalReview", "PayPal-Beträge mit Prüfbedarf"], ["appleTransactions", "Apple-Transaktionen im Zeitraum"]],
    [["provider", "Anbieter", "text"], ["currency", "Währung", "text"], ["state", "Zahlungsstand", "text"], ["payments", "Nachweise", "count"], ["amount", "Ursprünglicher Bruttobetrag", "amount"]]],
  ["usage", "Website-Nutzung", "Nur freiwillig eingewilligte Website- und PWA-Nutzung ohne DNT wird erfasst. Native Apps sind ausgeschlossen. Die Erfassung beginnt erst mit ihrer Einrichtung. Tageszähler werden bei Nutzung auf die letzten 400 Schweizer Kalendertage begrenzt; frühere Tage sind unbekannt und werden nicht als null Aufrufe ausgegeben. Eindeutige Besucher und Video-Sehzeit sind nicht verfügbar.",
    [["pageViews", "Erfasste Seitenaufrufe"], ["clicks", "Erfasste Bedienaktionen"], ["videoPlays", "Erfasste Videostarts"]],
    [["page", "Bereich", "text"], ["pageViews", "Seitenaufrufe", "count"], ["clicks", "Bedienaktionen", "count"], ["videoPlays", "Videostarts", "count"]]],
  ["community", "Community", "Gespeicherte Beiträge und offene Meldungen. Das kurzlebige Community-Limitjournal ist keine vollständige Klickhistorie.",
    [["posts", "Beiträge im Zeitraum"], ["replies", "Antworten im Zeitraum"], ["authors", "Beteiligte Konten im Zeitraum"], ["openReports", "Aktuell offene Meldungen"]], []],
  ["system", "Betriebsnachweise", "Begrenzte technische Nachweise: Fotoversuche umfassen auch Fehler und werden kurz aufbewahrt; Monatszähler verwenden UTC. E-Mail-Annahme ist kein Lese- oder Zustellnachweis.",
    [["photoRetained", "Noch gespeicherte Fotoversuche"], ["photoCurrentMonth", "Fotoversuche im aktuellen UTC-Monat"], ["mailPending", "Offene E-Mail-Aufträge"], ["mailSent", "Gespeicherte E-Mail-Annahmen"]], []],
];
const COURSE_NAMES = new Map(courses.map(course => [course.id, course.title]));

export class AdminOverviewError extends Error {
  constructor(code, status, message) { super(message); this.code = code; this.status = status; }
}
const invalid = () => new AdminOverviewError("INVALID_OVERVIEW_QUERY", 400, "Bitte einen gültigen Zeitraum und eine Umgebung auswählen.");
const unavailable = () => new AdminOverviewError("ADMIN_OVERVIEW_UNAVAILABLE", 503, "Die Auswertung ist gerade nicht erreichbar. Bitte erneut versuchen.");

export function validOverviewDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 2000 || year > 2100) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.toISOString().slice(0, 10) === value;
}
function swissDate(nowMs) {
  if (!Number.isFinite(nowMs)) throw invalid();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(nowMs));
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type).value).join("-");
}

export function readAdminOverviewOptions(url, env = process.env, { nowMs = Date.now() } = {}) {
  const params = new URL(url).searchParams;
  for (const key of params.keys()) if (!["from", "to", "environment"].includes(key) || params.getAll(key).length !== 1 || !params.get(key)) throw invalid();
  let isolated;
  try { isolated = isPayPalSandboxTestEnvironment(env); } catch { throw unavailable(); }
  const base = env.PAYPAL_API_BASE?.replace(/\/$/, "");
  if (base && !["https://api-m.paypal.com", "https://api.paypal.com", "https://api-m.sandbox.paypal.com"].includes(base)) throw unavailable();
  if (isolated && base && base !== "https://api-m.sandbox.paypal.com") throw unavailable();
  const paypalEnvironment = base === "https://api-m.sandbox.paypal.com" || isolated ? "Sandbox" : "Production";
  const requested = params.get("environment") || (isolated ? "sandbox" : "live");
  if (!["live", "sandbox"].includes(requested) || isolated && requested !== "sandbox") throw invalid();
  const today = swissDate(nowMs);
  const to = params.get("to") || today;
  if (!validOverviewDate(to)) throw invalid();
  const from = params.get("from") || new Date(Date.parse(to + "T00:00:00Z") - 29 * DAY).toISOString().slice(0, 10);
  if (!validOverviewDate(from) || !validOverviewDate(to) || from > to || to > today || (Date.parse(to) - Date.parse(from)) / DAY >= 366) throw invalid();
  return { from, to, environment: requested === "live" ? "Production" : "Sandbox", paypalEnvironment };
}

function numeric(value, format = "count") {
  if (value === null && format === "percent") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (format !== "percent" && !Number.isSafeInteger(value)) || format === "percent" && value > 100) throw unavailable();
  return value;
}
function dateValue(value) {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 64 || !Number.isFinite(Date.parse(value))) throw unavailable();
  return new Date(value).toISOString();
}
function enumValue(value, allowed) { if (!allowed.includes(value)) throw unavailable(); return value; }
function sourceRows(id, values) {
  if (!Array.isArray(values) || values.length > 30) throw unavailable();
  return values.map(row => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw unavailable();
    if (id === "accounts") return { country: row.country === null ? "Nicht gewählt" : enumValue(row.country, ["CH", "AT", "DE"]), region: row.region === null ? "Nicht gewählt" : /^[A-Z0-9]{1,4}$/.test(row.region) ? row.region : "Nicht verfügbar", accounts: numeric(row.accounts) };
    if (id === "learning") return { activity: enumValue(row.type, ["quiz", "ansitz"]) === "quiz" ? "Quiz" : "Ansitzsimulator", country: row.country === null ? "–" : enumValue(row.country, ["CH", "AT", "DE"]), rounds: numeric(row.rounds), accuracy: numeric(row.accuracy, "percent") };
    if (id === "courses") return { course: COURSE_NAMES.get(row.course_id) || "Kursbezeichnung nicht verfügbar", learners: numeric(row.learners), completed: numeric(row.completed), lastUpdated: dateValue(row.last_updated) };
    if (id === "subscriptions") return { provider: enumValue(row.provider, ["paypal", "apple"]) === "paypal" ? "PayPal" : "Apple", state: ({ paid: "Zahlungsdeckung", trial: "Testzugang", grace: "Zahlungsfrist", ended: "Ohne Deckung", review: "Nachweise prüfen" })[enumValue(row.state, ["paid", "trial", "grace", "ended", "review"])], contracts: numeric(row.contracts), accounts: numeric(row.accounts) };
    if (id === "payments") {
      if (typeof row.currency !== "string" || !/^[A-Z]{3}$/.test(row.currency) || typeof row.amount !== "string" || !/^\d{1,30}(?:\.\d{1,6})?$/.test(row.amount)) throw unavailable();
      return { provider: "PayPal", currency: row.currency, state: enumValue(row.state, ["COMPLETED", "PARTIALLY_REFUNDED"]) === "COMPLETED" ? "Abgeschlossen" : "Teilweise zurückgezahlt", payments: numeric(row.payments), amount: row.amount };
    }
    if (id === "usage") return { page: typeof USAGE_PAGES?.[row.page_key] === "string" ? USAGE_PAGES[row.page_key] : "Bereich nicht verfügbar", pageViews: numeric(row.page_views), clicks: numeric(row.clicks), videoPlays: numeric(row.video_plays) };
    throw unavailable();
  });
}

function section(definition, raw, options) {
  const [id, title, note, metricDefs, columnDefs] = definition;
  const result = { id, title, status: "unavailable", note, metrics: metricDefs.map(([key, label, format = "count"]) => ({ key, label, value: null, format })), columns: columnDefs.map(([key, label, format]) => ({ key, label, format })), rows: [] };
  if (!raw || !STATUSES.has(raw.status)) return result;
  result.status = raw.status;
  if (raw.status !== "ready") {
    result.note += raw.status === "not_configured" ? " Die nötige Datenquelle ist noch nicht eingerichtet." : raw.status === "not_recorded" ? " Für diesen Zeitraum liegen keine eingerichteten Nutzungsaufzeichnungen vor." : raw.status === "not_applicable" ? " Diese Quelle gehört nicht zur gewählten Umgebung." : " Die Datenquelle konnte nicht zuverlässig gelesen werden.";
    return result;
  }
  try {
    if (!raw.metrics || typeof raw.metrics !== "object" || Array.isArray(raw.metrics)) throw unavailable();
    result.metrics = metricDefs.map(([key, label, format = "count"]) => id === "payments" && raw.paypal_applicable === false && key.startsWith("paypal")
      ? { key, label, value: null, format, note: "PayPal gehört nicht zur gewählten Umgebung." }
      : { key, label, value: numeric(raw.metrics[key], format), format });
    result.rows = sourceRows(id, raw.rows);
    if (["subscriptions", "payments"].includes(id) && raw.paypal_applicable === false) result.note += " PayPal ist in dieser Umgebung nicht anwendbar; seine Daten werden nicht eingemischt.";
    if (id === "usage" && raw.started_at !== null) {
      const started = dateValue(raw.started_at);
      if (!started) throw unavailable();
      result.note += ` Erfassungsbeginn: ${started}.`;
    }
    if (id === "learning" || id === "usage") {
      if (!Array.isArray(raw.series) || raw.series.length > 366) throw unavailable();
      let previous = "";
      result.series = raw.series.map(point => {
        if (!point || !validOverviewDate(point.date) || point.date < options.from || point.date > options.to || point.date <= previous) throw unavailable();
        previous = point.date; return { date: point.date, value: id === "usage" && point.value === null ? null : numeric(point.value) };
      });
      result.seriesLabel = id === "learning" ? "Abgeschlossene Runden pro Tag" : "Erfasste Bedienaktionen pro Tag";
    }
    return result;
  } catch {
    return { ...result, status: "unavailable", note: note + " Die Datenquelle lieferte keine zuverlässig prüfbare Auswertung.", metrics: metricDefs.map(([key, label, format = "count"]) => ({ key, label, value: null, format })), rows: [], ...(result.series ? { series: [] } : {}) };
  }
}

export async function getAdminOverview(database, session, options, { nowMs = Date.now() } = {}) {
  const result = await database.rpc("get_admin_overview", { p_email: session.email, p_account_generation: session.accountGeneration, p_from: options.from, p_to: options.to, p_environment: options.environment, p_paypal_environment: options.paypalEnvironment });
  let raw;
  if (result.error) {
    if (result.error.code === "42501") throw new AdminOverviewError("ADMIN_OVERVIEW_FORBIDDEN", 403, "Diese Übersicht ist nur für den Betreiber zugänglich.");
    if (!["42883", "PGRST202"].includes(result.error.code)) throw unavailable();
    raw = { as_of: new Date(nowMs).toISOString(), sections: Object.fromEntries(definitions.map(([id]) => [id, { status: "not_configured" }])) };
  } else raw = result.data;
  if (!raw || typeof raw !== "object" || !raw.sections || !dateValue(raw.as_of)) throw unavailable();
  return { schemaVersion: 1, asOf: dateValue(raw.as_of), period: { from: options.from, to: options.to, timeZone: "Europe/Zurich" }, environment: options.environment, sections: definitions.map(definition => section(definition, raw.sections[definition[0]], options)) };
}

export function adminOverviewErrorResponse(error) {
  if (error instanceof AdminOverviewError) return trialOverviewJson({ code: error.code, message: error.message }, error.status);
  if (error?.status === 401) return trialOverviewJson({ code: "SESSION_RENEWAL_REQUIRED", message: "Bitte melde dich erneut an." }, 401);
  if (error?.status === 403) return trialOverviewJson({ code: "ADMIN_OVERVIEW_FORBIDDEN", message: "Diese Übersicht ist nur für den Betreiber zugänglich." }, 403);
  return trialOverviewJson({ code: "ADMIN_OVERVIEW_UNAVAILABLE", message: "Die Auswertung ist gerade nicht erreichbar. Bitte erneut versuchen." }, 503);
}
