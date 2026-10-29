// Only the two named sensory appendices. Historical fixtures remove these
// exact records while preserving every other field and object order.
const additions = [
  {
    courseId: 'wissen-ausbau-biologie-vogelkoerper-2026',
    lessonId: 'gesichtsschleier',
    questionIds: ['gesichtsschleier-schallweg', 'gesichtsschleier-federohren'],
    sourceURLs: [
      'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0007721',
      'https://dl.allaboutbirds.org/hubfs/Bird%20Academy/WonderfulWorldOwlsPoster_July%202024.pdf',
      'https://www.naturland-noe.at/uhu',
    ],
    oldLessons: 5, oldQuestions: 33, oldSources: 10, words: 187,
  },
  {
    courseId: 'wissen-ausbau-biologie-hundesinne-2026',
    lessonId: 'tapetum',
    questionIds: ['tapetum-lichtweg', 'tapetum-lichtreiz'],
    sourceURLs: [
      'https://link.springer.com/article/10.1186/1751-0147-53-13',
      'https://www.acvo.org/tips-treatments-tricks/why-do-my-dogs-eyes-shine-at-night',
    ],
    oldLessons: 4, oldQuestions: 32, oldSources: 13, words: 194,
  },
];
function stripSensesAddition(module) {
  const addition = additions.find(item => item.courseId === module?.id);
  if (!addition) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== addition.lessonId),
    questions: module.questions.filter(question => !addition.questionIds.some(id => question.id === id || question.id === `${module.id}-${id}`)),
    sources: module.sources.filter(source => !addition.sourceURLs.includes(source.url)),
  };
}
function isSensesEvidence(record) {
  return additions.some(item => record.moduleId === item.courseId && record.lessonId === item.lessonId);
}
function stripSensesDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripSensesAddition),
    evidence: dataset.evidence.filter(record => !isSensesEvidence(record)) };
}
function isSensesCard(card) {
  return additions.some(item => card.moduleId === item.courseId && item.questionIds.some(id => card.id === `flash-${item.courseId}-${id}`));
}
function sensesBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key]
    : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripSensesDataset(dataset) };
}
module.exports = { additions, stripSensesAddition, stripSensesDataset,
  isSensesEvidence, isSensesCard, sensesBaselineFixture };
