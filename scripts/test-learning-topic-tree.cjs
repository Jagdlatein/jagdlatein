const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { learningTopicTree, reservedLearningTopicModuleIds, getLearningTopicGroups,
  getLearningTopicLocation, validateLearningTopicTree } = load('lib/learning-topic-tree.js');

test('Every existing course has exactly one explicit topic in its actual category, with only the four author reservations allowed to be absent', () => {
  assert.equal(validateLearningTopicTree(learningModules), true);
  assert.deepEqual(learningTopicTree.map(branch => branch.categorySlug), learningCategoryDetails.map(category => category.slug));
  const mapped = learningTopicTree.flatMap(branch => branch.groups.flatMap(group => group.moduleIds));
  assert.equal(new Set(mapped).size, mapped.length);
  assert.equal(reservedLearningTopicModuleIds.length, 4);
  const actualIds = new Set(learningModules.map(module => module.id));
  for (const id of mapped.filter(id => !actualIds.has(id))) assert.ok(reservedLearningTopicModuleIds.includes(id), id);
  for (const category of learningCategoryDetails) {
    const groups = getLearningTopicGroups(category.slug, learningModules);
    assert.ok(groups.length >= 3 && groups.length <= 7, category.slug);
    assert.equal(new Set(groups.map(group => group.id)).size, groups.length);
    assert.ok(groups.every(group => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group.id) && group.moduleIds.length && !/sonstig|weitere themen/i.test(group.title)));
    assert.deepEqual(new Set(groups.flatMap(group => group.moduleIds)), new Set(learningModules.filter(module => module.category === category.title).map(module => module.id)));
  }
});

test('Unknown, duplicate, moved and removed courses fail explicitly instead of vanishing into a fallback topic', () => {
  const course = learningModules[0];
  assert.throws(() => getLearningTopicGroups('wildkunde', [{ id: 'new-unmapped-course', category: 'Wildkunde' }]), /ohne Themenbereich/);
  assert.throws(() => getLearningTopicGroups('wildkunde', [course, course]), /doppelter Lernkurs/);
  assert.throws(() => getLearningTopicGroups('wildkunde', [{ ...course, category: 'Hundewesen' }]), /falscher Kategorie/);
  assert.throws(() => validateLearningTopicTree(learningModules.filter(module => module.id !== course.id)), /fehlenden Kurs/);
  const absentReservation = reservedLearningTopicModuleIds.find(id => !learningModules.some(module => module.id === id));
  if (absentReservation) assert.throws(() => validateLearningTopicTree(learningModules, { allowReserved: false }), /fehlenden Kurs/);
});

test('Category summaries preserve stable editorial topic order, return only available courses, and do not mutate their input', () => {
  const branch = learningTopicTree[0], group = branch.groups[0];
  const selected = group.moduleIds.slice(0, 2).reverse().map(id => ({ id, title: 'Summary only' }));
  const before = JSON.stringify(selected);
  assert.deepEqual(getLearningTopicGroups(branch.categorySlug, selected), [{ id: group.id, title: group.title, moduleIds: group.moduleIds.slice(0, 2) }]);
  assert.deepEqual(getLearningTopicGroups(branch.categorySlug, []), []);
  assert.deepEqual(getLearningTopicGroups('missing-category', selected), []);
  assert.equal(JSON.stringify(selected), before);
  const result = getLearningTopicGroups(branch.categorySlug, selected);
  result[0].moduleIds.length = 0;
  assert.equal(getLearningTopicGroups(branch.categorySlug, selected)[0].moduleIds.length, 2);
});

test('Client breadcrumb metadata needs no curriculum and remains isolated from caller mutation', () => {
  const source = fs.readFileSync(path.join(root, 'lib/learning-topic-tree.js'), 'utf8');
  assert.doesNotMatch(source, /import[^;]+(?:learning-curriculum|learning-growth|\.json)/);
  for (const branch of learningTopicTree) for (const group of branch.groups) for (const moduleId of group.moduleIds) {
    assert.deepEqual(getLearningTopicLocation(moduleId), { categorySlug: branch.categorySlug, groupId: group.id, groupTitle: group.title });
  }
  assert.equal(getLearningTopicLocation('unmapped-course'), null);
  const id = learningModules[0].id;
  const original = getLearningTopicLocation(id);
  getLearningTopicLocation(id).groupTitle = 'Changed outside';
  assert.deepEqual(getLearningTopicLocation(id), original);
});
