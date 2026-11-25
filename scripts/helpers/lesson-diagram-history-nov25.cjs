// Historic null assertions remain strict. Only these named, already published
// additions use their complete object from the actual released 7b baseline.
const assert = require('node:assert/strict'), { execFileSync } = require('node:child_process');
const { local, root } = require('./project-module.cjs');
const releasedRevision = '7b69962b0fee40db63096d512b852a4241c90fcb';
const laterPublished = Object.freeze({
  absorption: Object.freeze([
    'wissen-spuren-systematisch/auftrittsformen',
    'wissen-ausbau-waldverjuengung-verbiss/stockausschlag-wurzelbrut',
    'wissen-vertiefung-wild-alpine-winterstrategien/aufwaermphasen',
    'wissen-pruefung-bodenwasser-wurzelraum-2026/wurzelhaare',
    'wissen-ausbau-biologie-verdauungsvergleich-2026/zotten-mikrovilli',
    'wissen-ausbau-federaufbau-funktion-2026/alula',
  ]),
  toxin: Object.freeze([
    'wissen-spuren-systematisch/auftrittsformen',
    'wissen-lebensraeume-biotopverbund/biotop-biozoenose',
    'wissen-ausbau-waldverjuengung-verbiss/stockausschlag-wurzelbrut',
    'wissen-vertiefung-wild-alpine-winterstrategien/aufwaermphasen',
    'wissen-pruefung-bodenwasser-wurzelraum-2026/wurzelhaare',
    'wissen-ausbau-revierpraxis-lebensmittelbakterien-2026/vorgebildete-toxine',
    'wissen-ausbau-biologie-verdauungsvergleich-2026/zotten-mikrovilli',
    'wissen-ausbau-federaufbau-funktion-2026/alula',
  ]),
  ecology: Object.freeze([
    'wissen-spuren-systematisch/auftrittsformen',
    'wissen-lebensraeume-biotopverbund/biotop-biozoenose',
    'wissen-ausbau-waldverjuengung-verbiss/stockausschlag-wurzelbrut',
    'wissen-vertiefung-wild-alpine-winterstrategien/aufwaermphasen',
    'wissen-pruefung-bodenwasser-wurzelraum-2026/wurzelhaare',
    'wissen-ausbau-biologie-verdauungsvergleich-2026/zotten-mikrovilli',
    'wissen-ausbau-federaufbau-funktion-2026/alula',
  ]),
  winterForest: Object.freeze([
    'wissen-spuren-systematisch/auftrittsformen',
    'wissen-ausbau-waldverjuengung-verbiss/stockausschlag-wurzelbrut',
    'wissen-vertiefung-wild-alpine-winterstrategien/aufwaermphasen',
    'wissen-ausbau-federaufbau-funktion-2026/alula',
  ]),
});
const currentAppendix = 'wissen-ausbau-habitat-insektenentwicklung-2026/tracheen-atmung';
let releasedGetter;
function getReleasedDiagram(courseId, lessonId) {
  if (!releasedGetter) {
    const source = execFileSync('git', ['show', `${releasedRevision}:lib/lesson-diagrams.js`], { cwd: root, encoding: 'utf8' });
    const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const previous = { exports: {} }; new Function('module', 'exports', code)(previous, previous.exports);
    releasedGetter = previous.exports.getLessonDiagram;
  }
  return releasedGetter(courseId, lessonId);
}
function assertDiagramHistory(kind, historicalGetter, actualGetter, courseId, lessonId) {
  assert.ok(Object.hasOwn(laterPublished, kind));
  const key = `${courseId}/${lessonId}`;
  // This single new target has its own positive diagram, renderer, offline and
  // all-prior-diagram checks in test-insect-respiration-diagram-nov25.cjs.
  if (key === currentAppendix) return 'current-appendix';
  const prior = historicalGetter(courseId, lessonId), actual = actualGetter(courseId, lessonId);
  if (laterPublished[kind].includes(key)) {
    assert.equal(prior, null, `Expected historical absence: ${key}`);
    const released = getReleasedDiagram(courseId, lessonId);
    assert.ok(released, `Missing named published reference: ${key}`);
    assert.deepEqual(actual, released, key);
    return 'published-addition';
  }
  assert.deepEqual(actual, prior, key);
  return 'historical';
}
module.exports = { releasedRevision, laterPublished, currentAppendix, getReleasedDiagram, assertDiagramHistory };
