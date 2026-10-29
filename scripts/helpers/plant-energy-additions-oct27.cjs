// Only the two named plant-energy appendices; keep all unrelated fields and
// historical object ordering in positive preservation comparisons.
const courseId = 'wissen-ausbau-oekologie-blattfunktion-2026';
const lessonIds = ['zellatmung', 'energie-stoffe'];
const questionIds = ['zellatmung-pflanze-sauerstoff', 'zellatmung-tag-nacht', 'energie-stoffe-waerme', 'energie-stoffe-kohlenstoff'];
const sourceURLs = [
  'https://www.mpg.de/4982054/pflanzen-sauerstoff',
  'https://pesticidecert.cfans.umn.edu/sites/pesticidecert.cfans.umn.edu/files/files/media/e3_plant_biology_basics_mar24final.pdf',
  'https://www.bio.uni-stuttgart.de/pflanzen-biotechnologie/forschung/regulation-des-primaerstoffwechsels/',
  'https://openstax.org/books/biology-2e/pages/46-2-energy-flow-through-ecosystems',
  'https://carbontime.create4stem.msu.edu/sites/default/files/ecosystems/teacher_guides/tg_lesson3.pdf',
  'https://www.noaa.gov/education/resource-collections/climate/carbon-cycle',
  'https://scied.ucar.edu/learning-zone/earth-system/biogeochemical-cycles',
];
function stripPlantEnergyAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => !lessonIds.includes(lesson.id)),
    questions: module.questions.filter(question => !questionIds.some(id => question.id === id || question.id === `${courseId}-${id}`)),
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
  };
}
function isPlantEnergyEvidence(record) {
  return record.moduleId === courseId && lessonIds.includes(record.lessonId);
}
function stripPlantEnergyDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripPlantEnergyAddition),
    evidence: dataset.evidence.filter(record => !isPlantEnergyEvidence(record)) };
}
function isPlantEnergyCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function plantEnergyBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-ecology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key]
    : require('../../data/learning-expansion-ecology-2026-10-16.json');
  return { ...overrides, [key]: stripPlantEnergyDataset(dataset) };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs,
  stripPlantEnergyAddition, stripPlantEnergyDataset, isPlantEnergyEvidence,
  isPlantEnergyCard, plantEnergyBaselineFixture };
