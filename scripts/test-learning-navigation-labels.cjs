const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader } = require('./helpers/project-module.cjs');
const { stripOctober26Additions } = require('./helpers/learning-additions-oct26.cjs');
const { stripOctober27Additions } = require('./helpers/learning-additions-oct27.cjs');
const { fishLateralLineBaselineFixture } = require('./helpers/fish-lateral-line-addition.cjs');
const { digestiveIgnitionBaselineFixture } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { practiceKnowledgeBaselineFixture } = require('./helpers/practice-knowledge-additions-oct29.cjs');
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const { learningTopicTree } = load('lib/learning-topic-tree.js');
const { learningNavigationLabels, getLearningNavigationLabel } = load('lib/learning-navigation-labels.js');
// Preserve the original full-object golden. Only the independently tested,
// explicitly named later appendices are removed by the existing fixtures.
// Baseline reproduction: work/regional-law-qa/navigation-labels-head74dfb34-independent.json
// in the chat workspace outside this repository.
const historicalFixture = [
  digestiveIgnitionBaselineFixture, firearmTermsBaselineFixture,
  flightFeatherBaselineFixture, adiposeBaselineFixture, plantEnergyBaselineFixture,
  examKnowledgeBaselineFixture, linkedExamBaselineFixture, practiceKnowledgeBaselineFixture,
].reduce((overrides, fixture) => fixture(overrides), fishLateralLineBaselineFixture());
const historicalModules = createLoader(historicalFixture)('lib/learning-curriculum.js').learningModules
  .map(stripOctober27Additions).map(stripOctober26Additions);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

test('All 198 existing courses have curated short navigation labels with no extra or missing course IDs', () => {
  assert.equal(learningModules.length, 198);
  assert.deepEqual(Object.keys(learningNavigationLabels).sort(), learningModules.map(course => course.id).sort());
  for (const course of learningModules) {
    const label = getLearningNavigationLabel(course);
    assert.equal(typeof label, 'string', course.id);
    assert.equal(label, label.trim(), course.id);
    assert.ok(label.split(/\s+/).length >= 1 && label.split(/\s+/).length <= 4, `${course.id}: ${label}`);
    assert.ok(label.length <= 52, `${course.id}: ${label}`);
    assert.doesNotMatch(label, /[.!?;\r\n]/, `${course.id}: navigation is a keyword label, not an explanation`);
    assert.match(label, /\p{L}/u, course.id);
  }
});

test('Navigation choices remain distinct inside every existing topic branch and retain important course differences', () => {
  const byId = new Map(learningModules.map(course => [course.id, course]));
  for (const category of learningTopicTree) for (const group of category.groups) {
    const labels = group.moduleIds.filter(id => byId.has(id)).map(id => normalize(getLearningNavigationLabel(byId.get(id))));
    assert.equal(new Set(labels).size, labels.length, `${category.categorySlug}/${group.id}`);
  }
  const label = id => getLearningNavigationLabel(byId.get(id));
  assert.match(label('wissen-rotwild-sozialverhalten'), /Rudel/);
  assert.match(label('wissen-rotwild-stimme-formanten-2026'), /Stimme|stimme/);
  assert.match(label('wissen-schwarzwild-lebensweise'), /Rotte/);
  assert.match(label('wissen-vertiefung-wild-schwarzwild-fortpflanzung'), /Fortpflanzung/);
  assert.match(label('wissen-ausbau-karten-gps'), /Koordinaten/);
  assert.match(label('wissen-wachstum-gps-wald-2026'), /Wald/);
  assert.match(label('wissen-vertiefung-gnss-hoehenbezug-2026'), /Höhenbezug/);
  assert.match(label('wissen-jagdrecht-de'), /Deutschland/);
  assert.match(label('wissen-jagdrecht-at'), /Österreich/);
  assert.match(label('wissen-jagdrecht-ch'), /Schweiz/);
});

test('The complete authored course data remains exact and label lookup never edits course objects or original titles', () => {
  const historical = '60199a84027bb1c5bac1ce381526fb6175d424897a5e92fc6a24155b3fadf9bb';
  assert.equal(hash(historicalModules), historical);
  const complete = hash(learningModules);
  for (const course of learningModules) {
    const original = JSON.stringify(course);
    getLearningNavigationLabel(Object.freeze({ ...course }));
    assert.equal(JSON.stringify(course), original, course.id);
  }
  assert.equal(hash(learningModules), complete);
  assert.equal(hash(historicalModules), historical);
});

test('Unknown courses keep their complete original title instead of an invented or mechanically shortened label', () => {
  for (const id of ['future-course', '__proto__', 'constructor']) {
    const course = Object.freeze({ id, title: 'Ein unbekannter Kurs: dieser Originaltitel bleibt vollständig erhalten' });
    assert.equal(getLearningNavigationLabel(course), course.title);
  }
  assert.equal(getLearningNavigationLabel({ title: 'Titel ohne bekannte Kurs-ID' }), 'Titel ohne bekannte Kurs-ID');
  assert.equal(getLearningNavigationLabel(null), '');
});
