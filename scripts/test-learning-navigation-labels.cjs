const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const { learningTopicTree } = load('lib/learning-topic-tree.js');
const { learningNavigationLabels, getLearningNavigationLabel } = load('lib/learning-navigation-labels.js');
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
  assert.equal(hash(learningModules), historical);
  for (const course of learningModules) {
    const original = JSON.stringify(course);
    getLearningNavigationLabel(Object.freeze({ ...course }));
    assert.equal(JSON.stringify(course), original, course.id);
  }
  assert.equal(hash(learningModules), historical);
});

test('Unknown courses keep their complete original title instead of an invented or mechanically shortened label', () => {
  for (const id of ['future-course', '__proto__', 'constructor']) {
    const course = Object.freeze({ id, title: 'Ein unbekannter Kurs: dieser Originaltitel bleibt vollständig erhalten' });
    assert.equal(getLearningNavigationLabel(course), course.title);
  }
  assert.equal(getLearningNavigationLabel({ title: 'Titel ohne bekannte Kurs-ID' }), 'Titel ohne bekannte Kurs-ID');
  assert.equal(getLearningNavigationLabel(null), '');
});
