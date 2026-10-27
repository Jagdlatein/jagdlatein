// Remove only this separately tested exact appendix for historical fixtures.
const courseId='wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026',lessonId='zuendungsarten',questionId='zuendungsart-position';
const sourceURLs=[
  'https://saami.org/glossary/centerfire-primer/',
  'https://saami.org/glossary/rimfire-cartridge/',
  'https://www.hunter-ed.com/california/studyGuide/Centerfire-and-Rimfire-Ammunition/20100501_66837/',
  'https://www.nist.gov/glossary-term/40306',
];
function withoutCartridgeIgnitionModule(module){
  if(module?.id!==courseId)return module;
  return{...module,sources:module.sources.filter(source=>!sourceURLs.includes(source.url)),lessons:module.lessons.filter(lesson=>lesson.id!==lessonId),questions:module.questions.filter(question=>![questionId,`${courseId}-${questionId}`].includes(question.id))};
}
function withoutCartridgeIgnitionDataset(dataset){return{...dataset,modules:dataset.modules.map(withoutCartridgeIgnitionModule),evidence:dataset.evidence.filter(record=>!(record.moduleId===courseId&&record.lessonId===lessonId))};}
function cartridgeIgnitionBaselineFixture(){return{'../data/learning-expansion-field-science-2026-10-17.json':withoutCartridgeIgnitionDataset(require('../../data/learning-expansion-field-science-2026-10-17.json'))};}
module.exports={courseId,lessonId,questionId,sourceURLs,withoutCartridgeIgnitionModule,withoutCartridgeIgnitionDataset,cartridgeIgnitionBaselineFixture};
