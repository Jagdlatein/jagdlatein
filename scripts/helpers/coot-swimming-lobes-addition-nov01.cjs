// Historical snapshots isolate only this named lesson and its audited picture.
// Positive full-content/photo preservation checks live in test-coot-swimming-lobes-lesson.
const assert = require('node:assert/strict');
const { createLoader } = require('./project-module.cjs');
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
const lessonId = 'schwimmlappen', questionId = 'schwimmlappen-anordnung';
const sourceURLs = ['https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/blaesshuhn/',
  'https://www.rspb.org.uk/birds-and-wildlife/eurasian-coot', 'https://www.bluehendesoesterreich.at/naturlexikon/blaesshuhn'];
function stripCootSwimmingLobesAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => question.id !== questionId && question.id !== `${courseId}-${questionId}`),
    sources: module.sources.filter(source => !(sourceURLs.includes(source.url)
      && source.lessonIds?.length === 1 && source.lessonIds[0] === lessonId)),
  };
}
function stripCootSwimmingLobesDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripCootSwimmingLobesAddition),
    evidence: dataset.evidence.filter(record => !(record.moduleId === courseId && record.lessonId === lessonId)) };
}
function cootSwimmingLobesBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const currentDataset = require('../../data/learning-expansion-biology-2026-10-16.json');
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : currentDataset;
  const completeLesson = currentDataset.modules.find(module => module.id === courseId).lessons.find(lesson => lesson.id === lessonId);
  const liveProjection = createLoader(overrides)('lib/lesson-photos-server.js');
  const output = { ...overrides, [key]: stripCootSwimmingLobesDataset(dataset) };
  for (const photoKey of ['../../lib/lesson-photos-server', '../lib/lesson-photos-server', './lesson-photos-server']) {
    const projection = Object.hasOwn(overrides, photoKey) ? overrides[photoKey] : liveProjection;
    if (typeof projection?.getCourseLessonPhotos !== 'function') { output[photoKey] = projection; continue; }
    output[photoKey] = { ...projection, getCourseLessonPhotos(course) {
      if (course?.id !== courseId || course.lessons.some(lesson => lesson.id === lessonId)) return projection.getCourseLessonPhotos(course);
      // Keep the production missing-lesson guard intact. Supply only the exact
      // removed lesson for projection, then omit only its new photo placement.
      const photos = projection.getCourseLessonPhotos({ ...course, lessons: [...course.lessons, completeLesson] });
      return Object.fromEntries(Object.entries(photos).filter(([id]) => id !== lessonId));
    } };
  }
  return output;
}
function beforeCootSwimmingLobesGuide(targets) {
  return targets.map(target => {
    if (target.moduleId !== courseId) return target;
    assert.equal(target.flashcardCount, 38);
    return { ...target, flashcardCount: 37 };
  });
}
module.exports = { courseId, lessonId, questionId, sourceURLs, stripCootSwimmingLobesAddition,
  stripCootSwimmingLobesDataset, cootSwimmingLobesBaselineFixture, beforeCootSwimmingLobesGuide };
