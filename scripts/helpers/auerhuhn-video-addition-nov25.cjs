// Historical snapshots exclude exactly this separately verified appendix.
// Never exclude a directory/prefix, rewrite an old object, or hide a neighbour.
const caseId = 'auerhuhn-baum';
const paths = new Set([
  '/lernen/videos-2026-11-25/auerhuhn-baum.mp4',
  '/lernen/videos-2026-11-25/auerhuhn-baum-vorschau.jpg',
  '/lernen/videos-2026-11-25/mediennachweise.json',
  '/lernen/videos-2026-11-25/MEDIEN-LIZENZEN.md',
]);
const withoutAuerhuhnNov25Cases = items => items.filter(item => item.id !== caseId);
const withoutAuerhuhnNov25Paths = items => items.filter(item => !paths.has(item));
module.exports = { withoutAuerhuhnNov25Cases, withoutAuerhuhnNov25Paths };
