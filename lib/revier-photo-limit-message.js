const DAY_MS = 24 * 60 * 60 * 1000;
const MANUAL_COMPARISON = "Die manuellen Merkmalsvergleiche bleiben verfügbar.";

function localDailyReset(value, now, timeZone) {
  // Only the server's bounded UTC-midnight reset is accepted, never free text.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/u.test(value)) return "";
  const reset = new Date(value), timestamp = reset.getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(now) || timestamp <= now || timestamp - now > DAY_MS + 2 * 60 * 60 * 1000
    || reset.toISOString() !== (value.endsWith(".000Z") ? value : value.replace(/Z$/u, ".000Z"))) return "";
  try {
    return new Intl.DateTimeFormat("de-CH", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
      ...(timeZone ? { timeZone } : {}),
    }).format(reset);
  } catch { return ""; }
}

/** Fixed UI copy only. Provider/server messages and unknown codes are not rendered. */
export function photoRecognitionLimitMessage(data, { now = Date.now(), timeZone } = {}) {
  const code = data && typeof data === "object" ? data.code : null;
  if (code === "photo_monthly_capacity_limit") {
    return `Das monatliche Gesamtkontingent der Foto-Erkennung ist aufgebraucht. Bitte nutze vorerst die manuellen Merkmalsvergleiche.`;
  }
  if (code !== "photo_daily_limit" && code !== "photo_capacity_limit") {
    return `Das Erkennungslimit ist erreicht. Bitte versuche es später erneut. ${MANUAL_COMPARISON}`;
  }
  const reset = localDailyReset(data.resetsAt, now, timeZone);
  const explanation = code === "photo_daily_limit"
    ? "Dein Tageslimit von 5 Foto-Erkennungsversuchen ist erreicht. Auch ein gestarteter Versuch ohne Ergebnis zählt mit."
    : reset ? "Das Tageskontingent der Foto-Erkennung für alle Konten ist aufgebraucht."
      : "Das Gesamtkontingent der Foto-Erkennung für alle Konten ist aufgebraucht.";
  return `${explanation} ${reset ? `Das Tageskontingent wird am ${reset} (deine Ortszeit) erneuert.` : "Bitte versuche es später erneut."} ${MANUAL_COMPARISON}`;
}
