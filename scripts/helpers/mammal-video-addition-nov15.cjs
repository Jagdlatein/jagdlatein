// Isolate only the separately tested two-scene appendix and three link tails.
// Historical snapshots still receive every other field, object and neighbour.
const assert = require('node:assert/strict');
const caseIds = new Set(['murmeltier-klausenpass', 'fischotter-fellpflege']);
const paths = new Set([
  '/lernen/videos-saeugetiere-2026-11-15/murmeltier-klausenpass.mp4',
  '/lernen/videos-saeugetiere-2026-11-15/murmeltier-klausenpass-vorschau.jpg',
  '/lernen/videos-saeugetiere-2026-11-15/fischotter-fellpflege.mp4',
  '/lernen/videos-saeugetiere-2026-11-15/fischotter-fellpflege-vorschau.jpg',
  '/lernen/videos-saeugetiere-2026-11-15/mediennachweise.json',
  '/lernen/videos-saeugetiere-2026-11-15/MEDIEN-LIZENZEN.md',
]);
const previousModuleIds = new Map([
  ['fuchs', ['wissen-ausbau-raubwildoekologie']],
  ['dachs-fellpflege', ['wissen-ausbau-raubwildoekologie']],
  ['rehwild', ['wissen-rehwild-jahreslauf']],
]);
const withoutMammalNov15Cases = items => items.filter(item => !caseIds.has(item.id));
const withoutMammalNov15Paths = items => items.filter(item => !paths.has(item));
function beforeMammalNov15Links(items) {
  return withoutMammalNov15Cases(items).map(item => {
    const previous = previousModuleIds.get(item.id);
    if (!previous) return item;
    assert.equal(item.kind, 'wild');
    assert.deepEqual(item.moduleIds, [...previous, 'wissen-spuren-systematisch']);
    return { ...item, moduleIds: item.moduleIds.slice(0, -1) };
  });
}
module.exports = { withoutMammalNov15Cases, withoutMammalNov15Paths, beforeMammalNov15Links };
