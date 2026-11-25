// Only this exact named appendix is projected from historical fixtures. Full
// positive old-course/card/diagram comparisons live in the companion suite.
const assert = require('node:assert/strict');
const addition = Object.freeze({
  courseId: 'wissen-ausbau-gewaesser-sauerstoff-2026', lessonId: 'kiemen-gegenstrom', date: '2026-11-25',
  questionIds: ['kiemen-gegenstrom-richtung', 'kiemen-lamellen-bau'],
  urls: [
    'https://people.clas.ufl.edu/devans/files/PRVGill.pdf',
    'https://www.fao.org/fishery/docs/CDrom/aquaculture/a0844t/docrep/009/T1623E/T1623E02.htm',
    'https://openstax.org/books/biology-2e/pages/39-1-systems-of-gas-exchange',
  ],
});
const newQuestionIds = addition.questionIds.map(id => `${addition.courseId}-${id}`);
const newCardIds = newQuestionIds.map(id => `flash-${id}`);
function stripFishGillCourse(course) {
  if (course?.id !== addition.courseId || !course.lessons.some(item => item.id === addition.lessonId)) return course;
  assert.equal(course.lessons.length, 5); assert.equal(course.questions.length, 18); assert.equal(course.sources.length, 9);
  assert.deepEqual(course.lessons.map(item => item.id), ['geloest', 'schichtung', 'naehrstoffkette', 'messprofil', addition.lessonId]);
  const lesson = course.lessons.at(-1);
  assert.equal(lesson.title, 'Fischkiemen: Wasserstrom und Blutstrom');
  assert.equal(lesson.reviewedOn, addition.date); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.paragraphs.length, 3); assert.ok(lesson.takeaway && lesson.exercise);
  if (lesson.evidence) assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [addition.urls, addition.urls.slice(0, 2)]);
  assert.deepEqual(course.questions.slice(-2).map(item => item.id.replace(`${course.id}-`, '')), addition.questionIds);
  assert.ok(course.questions.slice(-2).every(item => item.lessonId === addition.lessonId));
  assert.deepEqual(course.sources.slice(-3).map(source => source.url), addition.urls);
  assert.ok(course.sources.slice(-3).every(source => source.checkedOn === addition.date && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -2), sources: course.sources.slice(0, -3) };
}
function stripFishGillDataset(dataset) {
  if (!dataset?.modules?.some(course => course.id === addition.courseId && course.lessons.some(item => item.id === addition.lessonId))) return dataset;
  const records = dataset.evidence.filter(item => item.moduleId === addition.courseId && item.lessonId === addition.lessonId);
  assert.equal(records.length, 1); assert.equal(dataset.evidence.at(-1), records[0]); assert.equal(records[0].claims.length, 2);
  assert.deepEqual(records[0].claims.map(item => item.sourceUrls), [addition.urls, addition.urls.slice(0, 2)]);
  for (const claim of records[0].claims) {
    assert.ok(claim.claim); assert.deepEqual(Object.keys(claim.sourceRoles), claim.sourceUrls);
    assert.ok(Object.values(claim.sourceRoles).every(role => typeof role === 'string' && role.length > 30));
  }
  return { ...dataset, modules: dataset.modules.map(stripFishGillCourse), evidence: dataset.evidence.slice(0, -1) };
}
function fishGillBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-nature-equipment-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-nature-equipment-2026-10-16.json');
  return { ...overrides, [key]: stripFishGillDataset(dataset) };
}
function stripFishGillCards(cards) {
  const extra = cards.filter(card => newCardIds.includes(card.id));
  if (!extra.length) return cards;
  assert.deepEqual(extra.map(card => card.id), newCardIds);
  assert.ok(extra.every(card => card.moduleId === addition.courseId && card.lessonId === addition.lessonId && card.reviewedOn === addition.date && card.sourceScope === 'lesson'
    && JSON.stringify(card.sources.map(source => source.url)) === JSON.stringify(addition.urls)));
  return cards.filter(card => !newCardIds.includes(card.id));
}
const expectedDiagram = {
  type: 'comparison', title: 'Kiemen-Gegenstrom: zwei gleichzeitige Strömungen',
  note: 'Eigenes vereinfachtes Funktionsschema für das beschriebene Knochenfischmodell. Die zwei gegenläufigen Strömungen finden gleichzeitig statt; dies ist keine Schrittreihenfolge und keine massstäbliche Anatomiezeichnung. Sauerstoffdiffusion durch die Gewebebarriere ist ein dritter Vorgang, kein weiterer Wasser- oder Blutstrom.',
  steps: [
    { title: 'Wasserstrom →', text: 'Wasser strömt aussen an den dünnen Lamellen entlang. Der gelöste Sauerstoff kann von dort durch die Gewebebarriere ins Blut übertreten.' },
    { title: '← Blutstrom', text: 'Blut wird innerhalb der Lamellen in entgegengesetzter Richtung geführt. Es ist ein vom Wasserstrom getrennter Strömungsweg.' },
  ],
};
function fishGillDiagramBaseline(getDiagram) {
  return (courseId, lessonId) => {
    const current = getDiagram(courseId, lessonId);
    if (courseId !== addition.courseId || lessonId !== addition.lessonId) return current;
    assert.deepEqual(current, expectedDiagram, 'Complete exact new fish-gill comparison');
    return null;
  };
}
module.exports = { addition, newQuestionIds, newCardIds, stripFishGillCourse, stripFishGillDataset, fishGillBaselineFixture, stripFishGillCards, fishGillDiagramBaseline };
