// Historical projector for this exact independently checked appendix only.
const courseId='wissen-ausbau-anwendung-muskelbiologie-2026',lessonIds=['fettzellen','fettlagen'];
const questionIds=['fettzellen-aufbau','fettzellen-praeparat','fettlagen-ort'];
const sourceURLs=[
 'https://histology.leeds.ac.uk/home/tissue_types/connective/connective_adipocyte/',
 'https://istologia.unige.it/en/connective_specialized',
 'https://ira.agroscope.ch/fr-CH/Ajax/Einzelpublikation/Download?einzelpublikationId=17385',
 'https://www.porkgateway.iastate.edu/resource/marbling-and-pork-tenderness',
];
const allQuestionIds=new Set([...questionIds,...questionIds.map(id=>`${courseId}-${id}`)]);
function stripAdiposeAddition(module){if(module?.id!==courseId)return module;return{...module,sources:module.sources.filter(source=>!sourceURLs.includes(source.url)),lessons:module.lessons.filter(lesson=>!lessonIds.includes(lesson.id)),questions:module.questions.filter(question=>!allQuestionIds.has(question.id))};}
function stripAdiposeDataset(dataset){return{...dataset,modules:dataset.modules.map(stripAdiposeAddition),evidence:dataset.evidence.filter(record=>!(record.moduleId===courseId&&lessonIds.includes(record.lessonId)))};}
function isAdiposeCard(card){return questionIds.some(id=>card.id===`flash-${courseId}-${id}`);}
function adiposeBaselineFixture(overrides={}){const key='../data/learning-expansion-applied-2026-10-16.json',dataset=Object.hasOwn(overrides,key)?overrides[key]:require('../../data/learning-expansion-applied-2026-10-16.json');return{...overrides,[key]:stripAdiposeDataset(dataset)};}
module.exports={courseId,lessonIds,questionIds,sourceURLs,stripAdiposeAddition,stripAdiposeDataset,isAdiposeCard,adiposeBaselineFixture};
