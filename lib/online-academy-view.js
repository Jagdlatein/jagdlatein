import { learningCategoryDetails } from './learning-categories';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const academyViews = [
  { id: 'kurse', title: 'Selbstlernen' }, { id: 'live', title: 'Live-Unterricht' },
  { id: 'schulen', title: 'Jagdschulen' }, { id: 'verwaltung', title: 'Verwaltung' },
];
export const academyLearningStates = [
  { value: '', title: 'Alle', status: 'all' },
  { value: 'offen', title: 'Offen', status: 'open' },
  { value: 'begonnen', title: 'Begonnen', status: 'in_progress' },
  { value: 'abgeschlossen', title: 'Abgeschlossen', status: 'completed' },
];
export function readAcademySelection(router) {
  if (!router?.isReady) return null;
  const query = router.query || {};
  const view = query.ansicht === undefined ? 'kurse' : query.ansicht;
  if (typeof view !== 'string' || !academyViews.some(item => item.id === view)) return { invalid: true };
  const category = query.kategorie === undefined ? 'all' : query.kategorie;
  if (typeof category !== 'string' || category !== 'all' && !learningCategoryDetails.some(item => item.slug === category)) return { invalid: true };
  for (const key of ['angebot', 'termin']) if (query[key] !== undefined && (typeof query[key] !== 'string' || !uuid.test(query[key]))) return { invalid: true };
  if (query.angebot && view !== 'kurse' || query.termin && view !== 'live' || query.angebot && query.termin) return { invalid: true };
  const learningState = query.lernstand === undefined ? academyLearningStates[0]
    : academyLearningStates.find(item => item.value && item.value === query.lernstand);
  if (!learningState || query.lernstand !== undefined && (view !== 'kurse' || query.angebot)) return { invalid: true };
  return { view, category, offerId: query.angebot || null, sessionId: query.termin || null, learningStatus: learningState.status };
}
export function academyQuery(query, changes) {
  const clean = { ...query };
  for (const key of ['ansicht', 'kategorie', 'angebot', 'termin', 'lernstand']) delete clean[key];
  for (const [key, value] of Object.entries(changes)) if (value && value !== 'all') clean[key] = value;
  return clean;
}
export function academyDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(date) : 'Termin wird geklärt';
}
export function academyUtcInput(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Bitte Beginn und Ende vollständig eingeben.');
  const date = new Date(`${value}:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,16) !== value) throw new Error('Datum oder Uhrzeit ist ungültig.');
  return date.toISOString();
}
function escapeIcs(value) { return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ''); }
function icsTime(value) { return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
export function makeAcademyCalendar(session, offer, now = Date.now()) {
  if (!session || !uuid.test(session.id) || !Number.isFinite(Date.parse(session.starts_at)) || !Number.isFinite(Date.parse(session.ends_at)) || Date.parse(session.ends_at) <= Date.parse(session.starts_at)) throw new Error('Ungültiger Termin.');
  const description = `${offer?.title || 'Onlinekurs'}\nZeitangaben im Kurs: Europe/Zurich. Der Videoraum öffnet frühestens 15 Minuten vorher.`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jagdlatein//Onlinekurse//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${session.id}@jagdlatein.de`, `DTSTAMP:${icsTime(now)}`, `DTSTART:${icsTime(session.starts_at)}`, `DTEND:${icsTime(session.ends_at)}`, `SUMMARY:${escapeIcs(session.title)}`, `DESCRIPTION:${escapeIcs(description)}`, `URL:https://jagdlatein.de/online-kurse?ansicht=live&termin=${session.id}`, 'END:VEVENT', 'END:VCALENDAR'];
  // Fold on UTF-8 byte boundaries (RFC 5545), never through a multibyte character.
  const folded = lines.flatMap(line => {
    const result = []; let part = '', bytes = 0;
    for (const char of line) { const size = new TextEncoder().encode(char).length; if (bytes + size > 75) { result.push(part); part = ' '; bytes = 1; } part += char; bytes += size; }
    result.push(part); return result;
  });
  return folded.join('\r\n') + '\r\n';
}
