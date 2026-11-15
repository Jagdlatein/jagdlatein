// Historical video snapshots may isolate only this separately tested addition.
// Do not exclude a directory, ID prefix, future case, or any object properties.
const caseIds = new Set(['stockente-flugstart', 'graugans-landung']);
const paths = new Set([
  '/lernen/videos-2026-11-15/stockente-flugstart.mp4',
  '/lernen/videos-2026-11-15/stockente-flugstart-vorschau.jpg',
  '/lernen/videos-2026-11-15/graugans-landung.mp4',
  '/lernen/videos-2026-11-15/graugans-landung-vorschau.jpg',
  '/lernen/videos-2026-11-15/mediennachweise.json',
  '/lernen/videos-2026-11-15/MEDIEN-LIZENZEN.md',
]);

const withoutFlightNov15Cases = items => items.filter(item => !caseIds.has(item.id));
const withoutFlightNov15Paths = items => items.filter(item => !paths.has(item));

module.exports = { withoutFlightNov15Cases, withoutFlightNov15Paths };
