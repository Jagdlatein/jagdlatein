// Historical snapshots isolate only this exact named appendix. Positive full
// preservation and actual diagram/reader coverage live in test-bird-leg-lesson.
const assert=require('node:assert/strict');
const courseId='wissen-ausbau-biologie-vogelkoerper-2026',lessonId='vogelbein',questionId='vogelbein-gelenk';
const sourceURLs=['https://gf.nd.gov/wildlife-notes/look-bird-legs','https://reidparkzoo.org/why-do-birds-knees-bend-backwards/','https://abcbirds.org/news/why-are-owl-legs-so-long-the-science-behind-those-lengthy-bird-limbs/'];
function stripBirdLegAddition(module){
  if(module?.id!==courseId)return module;
  return {...module,lessons:module.lessons.filter(lesson=>lesson.id!==lessonId),
    questions:module.questions.filter(question=>question.id!==questionId&&question.id!==`${courseId}-${questionId}`),
    sources:module.sources.filter(source=>!(sourceURLs.includes(source.url)&&source.lessonIds?.length===1&&source.lessonIds[0]===lessonId))};
}
function stripBirdLegDataset(dataset){return{...dataset,modules:dataset.modules.map(stripBirdLegAddition),evidence:dataset.evidence.filter(record=>!(record.moduleId===courseId&&record.lessonId===lessonId))};}
function birdLegBaselineFixture(overrides={}){
  const key='../data/learning-expansion-biology-2026-10-16.json';
  const dataset=Object.hasOwn(overrides,key)?overrides[key]:require('../../data/learning-expansion-biology-2026-10-16.json');
  return{...overrides,[key]:stripBirdLegDataset(dataset)};
}
function beforeBirdLegGuide(targets){return targets.map(target=>{if(target.moduleId!==courseId)return target;assert.equal(target.flashcardCount,39);return{...target,flashcardCount:38};});}
module.exports={courseId,lessonId,questionId,sourceURLs,stripBirdLegAddition,stripBirdLegDataset,birdLegBaselineFixture,beforeBirdLegGuide};
