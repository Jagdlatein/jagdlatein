const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { getMyCoursesView } = load('lib/my-courses.js');
const categoryPairs = learningCategoryDetails.map(({ slug, title }) => ({ slug, title }));
const makeCourse = (id, categorySlug, categoryTitle, title = `Kurs ${id}`) => ({
  id, title, description: 'Eine bestehende Lerneinheit.', href: `/kurse/${id}`,
  totalQuestions: 4, categorySlug, categoryTitle,
});

test('Personal course filters use the exact menu titles and order regardless of catalog order or historical labels', () => {
  const catalog = [...learningCategoryDetails].reverse().map(category =>
    makeCourse(category.slug, category.slug, `Bisheriger Bereich ${category.slug}`));
  const before = JSON.stringify(catalog);
  const view = getMyCoursesView(catalog, []);
  assert.deepEqual(view.categories, categoryPairs);
  assert.deepEqual(view.rows.map(row => row.course.id), catalog.map(course => course.id), 'Category order must not reorder course results');
  for (const row of view.rows) assert.equal(row.course.categoryTitle,
    learningCategoryDetails.find(category => category.slug === row.course.categorySlug).title);
  assert.equal(JSON.stringify(catalog), before, 'Historical metadata remains unchanged');
  const subset = [catalog.find(course => course.categorySlug === 'pruefung-sprache'), catalog.find(course => course.categorySlug === 'wildkunde')];
  assert.deepEqual(getMyCoursesView(subset, []).categories, categoryPairs.filter(category => ['wildkunde', 'pruefung-sprache'].includes(category.slug)));
});

test('Canonical category display preserves original category and course-title searches with intersecting filters', () => {
  const historical = Object.freeze(makeCourse('waffe', 'waffen-sicherheit', 'Waffenkunde früher', 'Große Waffenkunde'));
  const other = Object.freeze(makeCourse('reh', 'wildkunde', 'Wildkunde', 'Rehwild'));
  const catalog = Object.freeze([historical, other]);
  for (const query of ['Waffenkunde früher', 'Waffen Sicherheit', 'grosse waffenkunde']) {
    const view = getMyCoursesView(catalog, [], { query, category: 'waffen-sicherheit' });
    assert.deepEqual(view.rows.map(row => row.course.id), ['waffe']);
    assert.equal(view.rows[0].course.categoryTitle, 'Waffen & Sicherheit');
    assert.equal(view.rows[0].course.title, historical.title);
    assert.equal(view.rows[0].course.href, historical.href);
    assert.deepEqual(view.metrics, { total: 2, completed: 0, in_progress: 0, open: 2 });
    assert.deepEqual(view.categories, categoryPairs.filter(category => ['wildkunde', 'waffen-sicherheit'].includes(category.slug)));
  }
  assert.equal(getMyCoursesView(catalog, [], { query: 'Waffenkunde früher', category: 'wildkunde' }).rows.length, 0);
  assert.equal(historical.categoryTitle, 'Waffenkunde früher');
  assert.strictEqual(getMyCoursesView(catalog, []).rows.find(row => row.course.id === 'reh').course, other);
});

test('Unknown historical categories retain their original labels and courses after the known menu categories', () => {
  const catalog = [
    makeCourse('z', 'historisch-z', 'Zweiter Altbereich'),
    makeCourse('hund', 'hundewesen', 'Jagdhunde früher'),
    makeCourse('a', 'historisch-a', 'Alter Spezialbereich'),
    makeCourse('wild', 'wildkunde', 'Wildkunde'),
  ];
  const view = getMyCoursesView(catalog, []);
  assert.deepEqual(view.categories, [
    ...categoryPairs.filter(category => ['wildkunde', 'hundewesen'].includes(category.slug)),
    { slug: 'historisch-a', title: 'Alter Spezialbereich' },
    { slug: 'historisch-z', title: 'Zweiter Altbereich' },
  ]);
  assert.equal(view.rows.length, catalog.length);
  for (const course of catalog.filter(course => course.categorySlug.startsWith('historisch-'))) {
    const chosen = getMyCoursesView(catalog, [], { category: course.categorySlug, query: course.categoryTitle });
    assert.deepEqual(chosen.rows.map(row => row.course.id), [course.id]);
    assert.strictEqual(chosen.rows[0].course, course);
  }
});

test('The complete public course catalog shares menu categories without copying or changing its current course objects', () => {
  const catalog = load('lib/my-course-catalog.js').getMyCourseCatalog();
  const view = getMyCoursesView(catalog, []);
  assert.deepEqual(view.categories, categoryPairs);
  assert.equal(view.rows.length, catalog.length);
  for (let index = 0; index < catalog.length; index++) assert.strictEqual(view.rows[index].course, catalog[index]);
});
