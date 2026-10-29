// Isolate only the two named appendices. Preserve every unrelated course,
// question, field and ordering in historical positive comparisons.
const courseId = 'wissen-vertiefung-hunde-klare-lernsignale';
const shortLessonIds = ['gewoehnung', 'lernverknuepfungen'];
const lessonIds = shortLessonIds.map(id => `${courseId}-${id}`);
const sourceURLs = [
  'https://www.msdvetmanual.com/behavior/behavioral-medicine-introduction/treatment-of-behavior-problems-in-animals',
  'https://avsab.org/getting-used-to-things-or-not-habituation-vs-sensitization/',
  'https://openstax.org/books/psychology-2e/pages/6-1-what-is-learning',
  'https://openstax.org/books/psychology-2e/pages/6-3-operant-conditioning',
];
const scopeSuffix = ' Ausschließlich die am 29. Oktober ergänzten Begriffslektionen zu Gewöhnung/Sensitivierung und klassischem/operantem Lernen wurden anhand der jeweils genannten unabhängigen Fachtexte abgeglichen; die historischen Kurs- und übrigen Lektionsdaten bleiben erhalten.';
function stripDogLearningProcessesAddition(module) {
  if (module?.id !== courseId) return module;
  const sourceReview = module.sourceReview ? { ...module.sourceReview,
    scope: module.sourceReview.scope.endsWith(scopeSuffix)
      ? module.sourceReview.scope.slice(0, -scopeSuffix.length) : module.sourceReview.scope,
    lessons: module.sourceReview.lessons.filter(record => !shortLessonIds.includes(record.lesson)),
  } : module.sourceReview;
  return { ...module,
    sourceReview,
    lessons: module.lessons.filter(lesson => !lessonIds.includes(lesson.id)),
    questions: module.questions.filter(question => !lessonIds.includes(question.lessonId)),
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
  };
}
function isDogLearningProcessesCard(card) {
  return card.moduleId === courseId && lessonIds.includes(card.lessonId);
}
function dogLearningProcessesBaselineFixture(overrides = {}) {
  const key = './learning-dog-depth';
  const exports = Object.hasOwn(overrides, key) ? overrides[key]
    : require('./project-module.cjs').createLoader(overrides)('lib/learning-dog-depth.js');
  return { ...overrides, [key]: { ...exports, dogDepthModules: exports.dogDepthModules.map(stripDogLearningProcessesAddition) } };
}
module.exports = { courseId, shortLessonIds, lessonIds, sourceURLs, scopeSuffix,
  stripDogLearningProcessesAddition, isDogLearningProcessesCard, dogLearningProcessesBaselineFixture };
