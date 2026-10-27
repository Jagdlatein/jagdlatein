// Exact authorized appendices only; every other course field/card stays visible.
const additions = [
  { courseId: 'wissen-ausbau-biologie-verdauungsvergleich-2026', lessonId: 'gewoelle',
    questionIds: ['gewoelle-muskelmagen', 'gewoelle-rueckweg'],
    sourceURLs: ['https://www.birds.cornell.edu/k12/pellet-teaching-tips/',
      'https://lucec.loyno.edu/natural-history-writings/owl-pellets',
      'https://www.nhm.ac.uk/discover/do-birds-pee.html'] },
  { courseId: 'wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026', lessonId: 'zuendungsarten',
    questionIds: ['zuendungsart-position'],
    sourceURLs: ['https://saami.org/glossary/centerfire-primer/',
      'https://saami.org/glossary/rimfire-cartridge/',
      'https://www.hunter-ed.com/california/studyGuide/Centerfire-and-Rimfire-Ammunition/20100501_66837/',
      'https://www.nist.gov/glossary-term/40306'] },
];
function stripAddition(module, addition) {
  if (module?.id !== addition.courseId) return module;
  return { ...module,
    sources: module.sources.filter(source => !addition.sourceURLs.includes(source.url)),
    lessons: module.lessons.filter(lesson => lesson.id !== addition.lessonId),
    questions: module.questions.filter(question => !addition.questionIds.some(id => question.id === id || question.id === `${addition.courseId}-${id}`)),
  };
}
const stripGewoelleAddition = module => stripAddition(module, additions[0]);
const stripIgnitionAddition = module => stripAddition(module, additions[1]);
const stripDigestiveIgnitionAdditions = module => additions.reduce(stripAddition, module);
const isScopedCard = card => additions.some(addition => addition.questionIds.some(id => card.id === `flash-${addition.courseId}-${id}`));
const isGewoelleEvidence = record => record.moduleId === additions[0].courseId && record.lessonId === additions[0].lessonId;
function stripDataset(dataset, addition) {
  return { ...dataset, modules: dataset.modules.map(module => stripAddition(module, addition)),
    evidence: dataset.evidence.filter(record => !(record.moduleId === addition.courseId && record.lessonId === addition.lessonId)),
  };
}
const stripGewoelleDataset = dataset => stripDataset(dataset, additions[0]);
const stripIgnitionDataset = dataset => stripDataset(dataset, additions[1]);
// Compose with an older, explicitly scoped fixture (for example the fish appendix).
// Supplied dataset overrides retain every unrelated caller-provided field.
function digestiveIgnitionBaselineFixture(overrides = {}) {
  const biology = '../data/learning-expansion-biology-2026-10-16.json';
  const field = '../data/learning-expansion-field-science-2026-10-17.json';
  return { ...overrides,
    [biology]: stripGewoelleDataset(Object.hasOwn(overrides, biology) ? overrides[biology] : require('../../data/learning-expansion-biology-2026-10-16.json')),
    [field]: stripIgnitionDataset(Object.hasOwn(overrides, field) ? overrides[field] : require('../../data/learning-expansion-field-science-2026-10-17.json')),
  };
}
module.exports = { stripGewoelleAddition, stripIgnitionAddition, stripDigestiveIgnitionAdditions,
  isScopedCard, isGewoelleEvidence, stripGewoelleDataset, stripIgnitionDataset, digestiveIgnitionBaselineFixture };
