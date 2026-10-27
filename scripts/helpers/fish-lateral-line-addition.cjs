// Historic fixtures remove only the separately tested, exact October27 appendix.
const courseId = 'wissen-ausbau-oekologie-tierbewegungen-2026';
const lessonId = 'seitenliniensinn';
const questionId = 'seitenliniensinn-wasserbewegung';
const sourceURLs = [
  'https://www.manoa.hawaii.edu/exploringourfluidearth/biological/fish/structure-and-function-fish',
  'https://utmsi.utexas.edu/science-and-the-sea/radio-program/fish-sense/',
];
function withoutFishLateralLineModule(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => ![questionId, `${courseId}-${questionId}`].includes(question.id)),
  };
}
function withoutFishLateralLineDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(withoutFishLateralLineModule),
    evidence: dataset.evidence.filter(record => !(record.moduleId === courseId && record.lessonId === lessonId)),
  };
}
function fishLateralLineBaselineFixture() {
  return { '../data/learning-expansion-ecology-2026-10-16.json':
    withoutFishLateralLineDataset(require('../../data/learning-expansion-ecology-2026-10-16.json')) };
}
module.exports = { withoutFishLateralLineModule, withoutFishLateralLineDataset, fishLateralLineBaselineFixture };
