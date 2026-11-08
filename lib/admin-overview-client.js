// Presentation of server-produced aggregates only. No customer identifiers,
// provider credentials, price estimates or browser tracking belong here.
export const OVERVIEW_SECTION_IDS = ["accounts", "learning", "courses", "subscriptions", "payments", "usage", "community", "system"];
export const OVERVIEW_PRESETS = [7, 30, 90, 365];
const statuses = ["ready", "not_configured", "unavailable", "not_recorded", "not_applicable"];
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype);
const keysOnly = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const safeKey = value => typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(value) && !/^(?:email|account_email|password|secret|token|session|ip_address|account_id|user_id)$/i.test(value);
const text = (value, limit = 160) => typeof value === "string" && value.length <= limit && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
const number = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const currency = value => typeof value === "string" && /^[A-Z]{3}$/.test(value);
const decimal = value => typeof value === "string" && /^-?(?:0|[1-9]\d{0,29})(?:\.\d{1,6})?$/.test(value);

export function validOverviewDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const stamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value && value >= "2000-01-01" && value <= "2100-12-31";
}

export function validOverviewPeriod(value) {
  if (!value || !validOverviewDay(value.from) || !validOverviewDay(value.to)) return false;
  const days = (Date.parse(value.to) - Date.parse(value.from)) / 86400000 + 1;
  return Number.isInteger(days) && days >= 1 && days <= 366 && ["live", "sandbox"].includes(value.environment);
}

export function overviewPreset(days = 30, environment = "live", now = Date.now()) {
  if (!OVERVIEW_PRESETS.includes(days) || !["live", "sandbox"].includes(environment)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now));
  const get = type => parts.find(part => part.type === type)?.value;
  const to = `${get("year")}-${get("month")}-${get("day")}`;
  if (!validOverviewDay(to)) return null;
  const from = new Date(Date.parse(`${to}T00:00:00.000Z`) - (days - 1) * 86400000).toISOString().slice(0, 10);
  return { from, to, environment };
}

export const overviewContext = value => validOverviewPeriod(value) ? `${value.from}/${value.to}/${value.environment}` : "";
const validInstant = value => typeof value === "string" && value.length <= 32 && Number.isFinite(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && new Date(Date.parse(value)).toISOString().replace(/\.000Z$/, "Z") === value.replace(/\.000Z$/, "Z");
const metricValue = (value, format) => value === null || (number(value) && (format !== "count" || Number.isSafeInteger(value)) && (format !== "percent" || value <= 100));

export function validAdminOverview(value, expected) {
  if (!validOverviewPeriod(expected) || !plain(value) || !keysOnly(value, ["schemaVersion", "asOf", "period", "environment", "sections"]) || value.schemaVersion !== 1 || !validInstant(value.asOf) ||
      !plain(value.period) || !keysOnly(value.period, ["from", "to", "timeZone"]) || value.period.from !== expected.from || value.period.to !== expected.to || value.period.timeZone !== "Europe/Zurich" ||
      value.environment !== (expected.environment === "live" ? "Production" : "Sandbox") || !Array.isArray(value.sections) || value.sections.length > 8) return false;
  const seen = new Set();
  for (const section of value.sections) {
    if (!plain(section) || !keysOnly(section, ["id", "title", "status", "note", "metrics", "columns", "rows", "series", "seriesLabel"]) || !OVERVIEW_SECTION_IDS.includes(section.id) || seen.has(section.id) ||
        !text(section.title, 100) || !section.title.trim() || !statuses.includes(section.status) || !text(section.note, 2000) ||
        !Array.isArray(section.metrics) || section.metrics.length > 16 || !Array.isArray(section.columns) || section.columns.length > 10 || !Array.isArray(section.rows) || section.rows.length > 30) return false;
    seen.add(section.id);
    const metricKeys = new Set();
    for (const item of section.metrics) {
      if (!plain(item) || !keysOnly(item, ["key", "label", "value", "format", "note"]) || !safeKey(item.key) || metricKeys.has(item.key) || !text(item.label, 120) || !item.label.trim() ||
          !["count", "percent", "seconds"].includes(item.format) || !own(item, "value") || !metricValue(item.value, item.format) || own(item, "note") && !text(item.note, 1000)) return false;
      metricKeys.add(item.key);
    }
    const columnKeys = new Set();
    for (const item of section.columns) {
      if (!plain(item) || !keysOnly(item, ["key", "label", "format"]) || !safeKey(item.key) || columnKeys.has(item.key) || !text(item.label, 120) || !item.label.trim() || !["text", "count", "percent", "date", "amount"].includes(item.format)) return false;
      columnKeys.add(item.key);
    }
    for (const row of section.rows) {
      if (!plain(row) || Object.keys(row).length > 11 || !keysOnly(row, [...columnKeys, "currency"]) || own(row, "currency") && !currency(row.currency)) return false;
      for (const column of section.columns) {
        if (!own(row, column.key)) return false;
        const cell = row[column.key];
        if (cell === null) continue;
        if (column.format === "text" && !(text(cell, 400) || typeof cell === "boolean") ||
            column.format === "count" && !(number(cell) && Number.isSafeInteger(cell)) ||
            column.format === "percent" && !(number(cell) && cell <= 100) ||
            column.format === "date" && !(validOverviewDay(cell) || validInstant(cell)) ||
            column.format === "amount" && !(decimal(cell) && currency(row.currency))) return false;
      }
    }
    if (own(section, "seriesLabel") && !text(section.seriesLabel, 120)) return false;
    if (own(section, "series")) {
      if (!Array.isArray(section.series) || section.series.length > 366) return false;
      let previous = "";
      for (const point of section.series) {
        if (!plain(point) || !keysOnly(point, ["date", "value"]) || !validOverviewDay(point.date) || point.date < expected.from || point.date > expected.to || point.date <= previous ||
            !own(point, "value") || !(point.value === null || number(point.value))) return false;
        previous = point.date;
      }
    }
  }
  return true;
}

export function overviewNumber(value, format = "count") {
  if (value === null || !number(value)) return "—";
  if (format === "seconds") return value >= 60 ? `${(value / 60).toLocaleString("de-CH", { maximumFractionDigits: 1 })} min` : `${value.toLocaleString("de-CH", { maximumFractionDigits: 1 })} s`;
  return `${value.toLocaleString("de-CH", { maximumFractionDigits: format === "percent" ? 1 : 0 })}${format === "percent" ? " %" : ""}`;
}

export function overviewDate(value, withTime = false) {
  if (!validOverviewDay(value) && !validInstant(value)) return "—";
  const date = new Date(validOverviewDay(value) ? `${value}T12:00:00.000Z` : value);
  return new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : {}) }).format(date);
}

export function overviewCell(value, column, row) {
  if (value === null || value === undefined) return "—";
  if (["count", "percent"].includes(column.format)) return overviewNumber(value, column.format);
  if (column.format === "date") return overviewDate(value);
  // Keep the exact decimal string. Number/currency formatting would round
  // provider amounts or silently discard minor-unit precision.
  if (column.format === "amount") return `${value} ${row.currency}`;
  return typeof value === "boolean" ? value ? "Ja" : "Nein" : value;
}

const csvCell = value => `"${String(value ?? "").replace(/^[\s\uFEFF]*(?=[=+\-@])/, "'").replace(/"/g, '""')}"`;

export function adminOverviewCsv(data, expected) {
  if (!validAdminOverview(data, expected)) throw new Error("Die aktuelle Übersicht ist nicht vollständig bestätigt.");
  const lines = [["Jagdlatein", "Betreiberübersicht"], ["Von", data.period.from], ["Bis", data.period.to], ["Zeitzone", data.period.timeZone], ["Umgebung", data.environment], ["Datenstand", data.asOf]];
  for (const section of data.sections) {
    lines.push([], [section.title, section.status], ["Hinweis", section.note]);
    for (const metric of section.metrics) lines.push([metric.label, section.status === "ready" ? metric.value : null, metric.format, metric.note || ""]);
    if (section.status !== "ready") continue;
    if (section.rows.length) {
      const appendCurrency = section.columns.some(column => column.format === "amount") && !section.columns.some(column => column.key === "currency");
      lines.push([...section.columns.map(column => column.label), ...(appendCurrency ? ["Währung"] : [])]);
      for (const row of section.rows) lines.push([...section.columns.map(column => row[column.key]), ...(appendCurrency ? [row.currency] : [])]);
    }
    if (section.series?.length) {
      lines.push(["Datum", section.seriesLabel || "Wert"]);
      for (const point of section.series) lines.push([point.date, point.value]);
    }
  }
  return "\uFEFF" + lines.map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
