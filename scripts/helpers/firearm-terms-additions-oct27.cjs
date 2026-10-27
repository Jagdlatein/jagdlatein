// Strip only this separately checked two-lesson appendix for historical fixtures.
const courseId='wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026';
const lessonIds=['laufprofil','flintenpatronen'];
const questionIds=['laufprofil-zug-feld','laufprofil-drehung','flintenpatronen-geschossladung','flintenpatronen-zwischenmittel'];
const sourceURLs=[
  'https://saami.org/glossary/rifling/',
  'https://www.hunter-ed.com/california/studyGuide/Rifling-in-the-Rifle-or-Handgun-Bore/20100501_66876/',
  'https://nij.ojp.gov/nij-hosted-online-training-courses/firearms-examiner-training/glossary',
  'https://www.hunter-ed.com/california/studyGuide/Shotshells/20100501_66838/',
  'https://saami.org/glossary/shot/',
  'https://saami.org/glossary/slug/',
  'https://www.vims.edu/ccrm/research/marine_debris/problems/plastics/shotgun_wads/',
  'https://www.fedpol.admin.ch/dam/de/sd-web/pQ5Q3W4g13Sk/pruefung-schusswaffenhandel.pdf#page=48',
];
const allQuestionIds=new Set([...questionIds,...questionIds.map(id=>`${courseId}-${id}`)]);
function stripFirearmTermsAddition(module){
  if(module?.id!==courseId)return module;
  return{...module,sources:module.sources.filter(source=>!sourceURLs.includes(source.url)),lessons:module.lessons.filter(lesson=>!lessonIds.includes(lesson.id)),questions:module.questions.filter(question=>!allQuestionIds.has(question.id))};
}
function stripFirearmTermsDataset(dataset){return{...dataset,modules:dataset.modules.map(stripFirearmTermsAddition),evidence:dataset.evidence.filter(record=>!(record.moduleId===courseId&&lessonIds.includes(record.lessonId)))};}
function isFirearmTermsCard(card){return questionIds.some(id=>card.id===`flash-${courseId}-${id}`);}
function firearmTermsBaselineFixture(overrides={}){
  const key='../data/learning-expansion-field-science-2026-10-17.json';
  const dataset=Object.hasOwn(overrides,key)?overrides[key]:require('../../data/learning-expansion-field-science-2026-10-17.json');
  return{...overrides,[key]:stripFirearmTermsDataset(dataset)};
}
module.exports={courseId,lessonIds,questionIds,sourceURLs,stripFirearmTermsAddition,stripFirearmTermsDataset,isFirearmTermsCard,firearmTermsBaselineFixture};
