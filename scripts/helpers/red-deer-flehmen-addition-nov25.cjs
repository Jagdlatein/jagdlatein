// Strict projection of one explicitly named, dated appendix. This helper never
// substitutes a count-only guard for the positive whole-object Git comparison.
const assert = require('node:assert/strict');
const { createLoader } = require('./project-module.cjs');
const addition = Object.freeze({
  courseId: 'wissen-rotwild-sozialverhalten', lessonId: 'rot-flehmen', date: '2026-11-25',
  questionIds: ['rot-flehmen-haltung', 'rot-flehmen-sinnesrolle'],
  urls: [
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10127101/',
    'https://www.vetmeduni.ac.at/fileadmin/v/fiwi/Publikationen/Populaerwissenschaftliche/Valencak_2015_Pheromone.pdf',
    'https://www.sdw-nrw-koeln.de/wp-content/uploads/Broschu%CC%88re-Rotwild.pdf',
  ],
});
const newQuestionIds = addition.questionIds.map(id => `${addition.courseId}-${id}`);
const newCardIds = newQuestionIds.map(id => `flash-${id}`);
// Existing adapters deduplicate the first claim's direct posture pair before
// appending the third source used by the subsequent functional claims.
const cardSourceUrls = [addition.urls[0], addition.urls[2], addition.urls[1]];
function stripRedDeerFlehmenCourse(course) {
  if (course?.id !== addition.courseId || !course.lessons.some(lesson => lesson.id === addition.lessonId)) return course;
  assert.equal(course.lessons.length, 4); assert.equal(course.questions.length, 10); assert.equal(course.sources.length, 7);
  assert.deepEqual(course.lessons.map(lesson => lesson.id), ['rot-familien', 'rot-brunft', 'rot-raum', addition.lessonId]);
  const lesson = course.lessons.at(-1);
  assert.equal(lesson.title, 'Flehmen: chemische Hinweise aufnehmen'); assert.equal(lesson.reviewedOn, addition.date); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.paragraphs.length, 3); assert.equal(lesson.evidence.length, 3); assert.ok(lesson.takeaway && lesson.exercise);
  assert.deepEqual(course.questions.slice(-2).map(question => question.id.replace(`${course.id}-`, '')), addition.questionIds);
  assert.ok(course.questions.slice(-2).every(question => question.lessonId === addition.lessonId));
  assert.deepEqual(course.sources.slice(-3).map(source => source.url), addition.urls);
  assert.ok(course.sources.slice(-3).every(source => source.checkedOn === addition.date && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  assert.deepEqual(lesson.evidence.map(record => record.sources.map(source => source.url)), [[addition.urls[0], addition.urls[2]], addition.urls, addition.urls]);
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -2), sources: course.sources.slice(0, -3) };
}
function stripRedDeerFlehmenModule(exports) {
  return { ...exports, wildlifeModules: exports.wildlifeModules.map(stripRedDeerFlehmenCourse) };
}
function redDeerFlehmenBaselineFixture(overrides = {}) {
  const key = './learning-wildlife';
  const exports = Object.hasOwn(overrides, key) ? overrides[key] : createLoader()('lib/learning-wildlife.js');
  return { ...overrides, [key]: stripRedDeerFlehmenModule(exports) };
}
function stripRedDeerFlehmenCards(cards) {
  const extra = cards.filter(card => newCardIds.includes(card.id));
  if (!extra.length) return cards;
  assert.deepEqual(extra.map(card => card.id), newCardIds);
  assert.ok(extra.every(card => card.moduleId === addition.courseId && card.lessonId === addition.lessonId && card.reviewedOn === addition.date && card.sourceScope === 'lesson'
    && JSON.stringify(card.sources.map(source => source.url)) === JSON.stringify(cardSourceUrls)));
  return cards.filter(card => !newCardIds.includes(card.id));
}
// An explicit positive contract for this new comparison, separate from the
// older diagram-history helpers. Unknown siblings and every old diagram still
// reach the original complete historical comparison.
const flehmenDiagram = Object.freeze({
  type: 'comparison',
  title: 'Flehmen und Röhren: zwei Funktionen',
  note: 'Eigenes vereinfachtes Funktionsschema. Die beiden Spalten vergleichen Aufnahme und Abgabe von Informationen; sie sind keine zeitliche Abfolge und keine Darstellung innerer Anatomie.',
  steps: [
    { title: 'Flehmen: chemische Hinweise aufnehmen', text: 'Angehobenes Haupt, gestreckter Hals, geöffnetes Maul und zurückgezogene Oberlippe beschreiben die Haltung. Im Brunftkontext wird sie mit chemischen Hinweisen verbunden, etwa aus dem Harn weiblicher Tiere.' },
    { title: 'Röhren: einen Laut abgeben', text: 'Der Hirsch erzeugt eine hörbare Lautäusserung. Ein geöffnetes Maul allein macht Flehmen und Röhren nicht zum selben Vorgang; die beobachtete Handlung und ihre Funktion sind zu unterscheiden.' },
  ],
});
function redDeerFlehmenDiagramBaseline(getDiagram) {
  return (courseId, lessonId) => {
    const current = getDiagram(courseId, lessonId);
    if (courseId !== addition.courseId || lessonId !== addition.lessonId) return current;
    assert.deepEqual(current, flehmenDiagram, 'Exact separately reviewed Flehmen diagram');
    return null;
  };
}
module.exports = { addition, newQuestionIds, newCardIds, cardSourceUrls, stripRedDeerFlehmenCourse, stripRedDeerFlehmenModule, stripRedDeerFlehmenCards, redDeerFlehmenBaselineFixture, redDeerFlehmenDiagramBaseline };
