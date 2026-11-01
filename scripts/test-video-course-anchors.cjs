const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { videoLibraryCourseHref, getLearningVideoLibrary } = load('lib/learning-video-library.js');

test('Bled directory course keeps its authored Schwimmlappen target while the separate Federwild course keeps its own entry', () => {
  const videos = getLearningVideoLibrary(), coot = videos.find(item => item.id === 'wild-blaesshuhn-bled');
  assert.ok(coot);
  assert.deepEqual(coot.courses.map(item => item.href), [
    '/kurse/wissen-ausbau-biologie-vogelkoerper-2026#lesson-schwimmlappen', '/kurse/wissen-federwild-beobachtung',
  ]);
  for (const id of ['wild-fuchs', 'wild-damwild-dyrehaven', 'hund-labrador-signal']) {
    const item = videos.find(item => item.id === id); assert.ok(item);
    for (const course of item.courses) assert.equal(new URL(course.href, 'https://jagdlatein.test').hash, '', item.id);
  }
});

test('Only an exact uniquely owned lesson ID permits an internal primary anchor; unrelated, external or malformed targets fall back', () => {
  const module = { id: 'synthetic-course', lessons: [{ id: 'intro' }, { id: 'details' }] }, base = '/kurse/synthetic-course';
  assert.equal(videoLibraryCourseHref({ course: `${base}#lesson-details` }, module), `${base}#lesson-details`);
  assert.equal(videoLibraryCourseHref({ course: `${base}#lesson-%69ntro` }, module), `${base}#lesson-intro`);
  for (const course of [undefined, null, [], '', base, `${base}#lesson-unknown`, `${base}#lesson-`, `${base}#lesson-%ZZ`, `${base}#sources`,
    '/kurse/other#lesson-intro', `https://evil.test${base}#lesson-intro`, `https://jagdlatein.de${base}#lesson-intro`, `//evil.test${base}#lesson-intro`,
    `${base}?private=note#lesson-intro`, `${base}#lesson-intro?private=note`, `${base}#lesson-intro#other`]) {
    assert.equal(videoLibraryCourseHref({ course }, module), base, JSON.stringify(course));
  }
  assert.equal(videoLibraryCourseHref({ course: `${base}#lesson-intro` }, { ...module, lessons: [{ id: 'intro' }, { id: 'intro' }] }), base, 'Ambiguous duplicate lesson IDs do not invent a target');
  assert.equal(videoLibraryCourseHref({ course: `${base}#lesson-intro` }, { id: 'secondary', lessons: [{ id: 'intro' }] }), '/kurse/secondary');
});
