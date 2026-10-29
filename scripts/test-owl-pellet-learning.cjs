const { practiceKnowledgeBaselineFixture } = require('./helpers/practice-knowledge-additions-oct29.cjs');
const { stripAvianUrinaryDataset } = require('./helpers/avian-urinary-addition-oct29.cjs');
const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { sensesBaselineFixture, stripSensesDataset } = require('./helpers/senses-learning-additions-oct29.cjs');
const { dogLearningProcessesBaselineFixture } = require('./helpers/dog-learning-processes-additions-oct29.cjs');
const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
// Narrow editorial/integration checks; actual source reading is documented separately.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const{createHash}=require('node:crypto');
const{createLoader:createProjectLoader,local}=require('./helpers/project-module.cjs');
const createLoader = overrides => createProjectLoader(practiceKnowledgeBaselineFixture(linkedExamBaselineFixture(sensesBaselineFixture(dogLearningProcessesBaselineFixture(overrides)))));
const{stripGewoelleAddition,stripDigestiveIgnitionAdditions,isScopedCard,isGewoelleEvidence}=require('./helpers/digestive-ignition-additions-oct27.cjs');
const raw=stripAvianUrinaryDataset(stripSensesDataset(require('../data/learning-expansion-biology-2026-10-16.json'))),load=createLoader(plantEnergyBaselineFixture(adiposeBaselineFixture(flightFeatherBaselineFixture(firearmTermsBaselineFixture()))));
const courseId='wissen-ausbau-biologie-verdauungsvergleich-2026',lessonId='gewoelle',questionIds=['gewoelle-muskelmagen','gewoelle-rueckweg'];
const urls=['https://www.birds.cornell.edu/k12/pellet-teaching-tips/','https://lucec.loyno.edu/natural-history-writings/owl-pellets','https://www.nhm.ac.uk/discover/do-birds-pee.html'];
const{learningModules,getLearningModule}=load('lib/learning-curriculum.js'),course=getLearningModule(courseId),original=raw.modules.find(item=>item.id===courseId),lesson=course.lessons.at(-1),cards=load('lib/learning-flashcards.js').getFlashcards();
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only the exact owl-pellet appendix differs from the a0a6563 biology file; five old lessons,34 questions,15 sources and dates remain complete',()=>{
 const historical={...raw,modules:raw.modules.map(stripGewoelleAddition),evidence:raw.evidence.filter(item=>!isGewoelleEvidence(item))};
 assert.equal(hash(historical),'31ae063cbb495b5d6fbe09e66a9f619bfe24be94b3f545d3b78d42097906f137');
 assert.equal(hash(stripGewoelleAddition(original)),'8fc9c71ffb00b8801cb5b05d80266077301d713aa855b089ebeb723dd36487bf');
 assert.equal(hash(raw.modules.filter(item=>item.id!==courseId)),'4ebae31f4c7f8601887dd0cf0994b09cfc800d27886100a6645c79c702af9403');
 assert.equal(hash(raw.evidence.filter(item=>item.moduleId===courseId&&item.lessonId!==lessonId)),'1bc9ba84e6c9f7a67a9e97e4fcadcc6cd32ea47dff17c2245f7826dce72a8dd5');
 assert.equal(hash(stripGewoelleAddition(course)),'34c726f353e80291ccab49d240653430c3f65c021621eee6d43daa310a58d4db');
 assert.deepEqual(stripGewoelleAddition(course).lessons.map(item=>item.id),['blinddarm','caecotrophie','schweinemagen','vogelmagen','kropfmilch']);
 assert.equal(raw.reviewedOn,'2026-10-16');assert.equal(course.reviewedOn,'2026-10-16');assert.equal(course.lessons.find(item=>item.id==='kropfmilch').reviewedOn,'2026-10-27');
});
test('The127-word sixth lesson distinguishes formation, exit route and the visible limits with two exact independent sources per claim',()=>{
 assert.equal(course.lessons.length,6);assert.equal(course.questions.length,36);assert.equal(course.sources.length,18);
 assert.equal(lesson.id,lessonId);assert.equal(lesson.reviewedOn,'2026-10-27');assert.equal(lesson.flashcardExpansion,true);assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length,127);
 const text=lesson.paragraphs.join(' ');assert.match(text,/Bei Eulen können unverdaute Nahrungsreste/);assert.match(text,/im Muskelmagen zu einem Ballen/);assert.match(text,/hochgewürgt und durch den Schnabel/);assert.match(text,/Ein Gewölle ist deshalb kein Kot/);assert.match(text,/Auch andere Vögel können/);assert.match(text,/Fundbild allein liefert hier keinen sicheren Artbeweis/);
 assert.doesNotMatch(text,/\d|alle Knochen|vollständige Skelette|schlucken.*ganz|an[f]?assen|berühren|einsammeln|zerlegen|desinfizier|sterilisier|immer|jedes Gewölle/);
 assert.equal(lesson.image,undefined);assert.equal(lesson.diagram,undefined);assert.deepEqual(course.sources.slice(-3).map(item=>item.url),urls);for(const source of course.sources.slice(-3)){assert.equal(source.checkedOn,'2026-10-27');assert.deepEqual(source.lessonIds,[lessonId]);}
 assert.deepEqual(lesson.evidence.map(item=>item.sources.map(source=>source.url)),[[urls[0],urls[1]],[urls[0],urls[2]],[urls[1],urls[2]]]);
});
test('All198 old full course objects and1722 old cards retain exact contents and order while isolating only the separately authorized ignition appendix',()=>{
 assert.equal(learningModules.length,198);assert.equal(hash(learningModules.map(stripDigestiveIgnitionAdditions)),'78e548ee83b0c39c75fbeec37dfa6ec4698d98f0a692c15436df0702d17b95f5');
 const historical=cards.filter(card=>!isScopedCard(card));assert.equal(historical.length,1722);assert.equal(hash(historical),'ce7971c1e548bdec709dd98ec0c60977909e53970ff8e4b3cbe97097c64b0669');
 assert.equal(hash(cards.filter(card=>card.moduleId===courseId&&!isScopedCard(card))),'963e28f909b4006d1ce5d4cce49ec486fd0a905f33be7ad78bd4e3b2d6b16e9f');
 assert.equal(hash(cards.slice(0,116)),'54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');assert.equal(cards.filter(card=>card.moduleId===courseId).length,33);
 const foreign=fs.readFileSync(require('node:path').join(__dirname,'../data/learning-expansion-afternoon-2026-10-16.json'));assert.equal(createHash('sha256').update(foreign).digest('hex'),'23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});
test('Two distinct own questions become two dated lesson cards with exact answers, sources and the existing direct lesson route',()=>{
 const selected=course.questions.filter(question=>question.lessonId===lessonId);assert.deepEqual(selected.map(question=>question.id),questionIds.map(id=>`${courseId}-${id}`));
 assert.equal(new Set(selected.map(question=>question.q)).size,2);
 for(const question of selected){assert.equal(learningModules.flatMap(module=>module.questions).filter(item=>item.q===question.q).length,1);assert.equal(new Set(question.answers.map(answer=>answer.text)).size,4);const chosen=cards.filter(card=>card.id===`flash-${question.id}`);assert.equal(chosen.length,1);const[card]=chosen;assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);assert.equal(card.explanation,question.explain);assert.equal(card.sourceScope,'lesson');assert.equal(card.reviewedOn,'2026-10-27');assert.deepEqual(card.sources.map(source=>source.url),urls);assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${lessonId}`);assert.equal(card.options,undefined);}
 const bank=load('data/questions-full.js').QUESTIONS,{quizLearningPool}=load('lib/quiz-learning-scope.js');for(const country of ['DE','AT','CH'])for(const question of selected)assert.ok(quizLearningPool(bank,{country,topic:'Wildkunde'}).some(item=>item.id===question.id));
});
test('Existing category/search/static course delivery exposes the full precise lesson and both cards without a new route or portrait',()=>{
 const place=load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);assert.equal(place.categorySlug,'wildkunde');assert.equal(place.groupId,'organe-stoffwechsel');const result=load('lib/learning-search.js').searchLearning({query:'Gewölle',type:'course'}).results.find(item=>item.id===`course:${courseId}`);assert.ok(result);assert.equal(result.href,`/kurse/${courseId}#lesson-${lessonId}`);assert.equal(result.lessonTitle,lesson.title);
 const props=load('pages/kurse/[slug].js').getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module.lessons.at(-1),lesson);assert.equal(props.flashcards.lessons[lessonId],2);
});
test('Offline delivery retains every lesson/question/evidence and both true date roles without extending access',()=>{
 const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-owl-pellet-offline';try{const now=Date.parse('2026-10-27T16:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-10-29T16:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.deepEqual(pack.courses[0].lessons.at(-1).evidence,lesson.evidence);assert.equal(pack.courses[0].reviewedOn,'2026-10-16');assert.equal(pack.courses[0].lessons.at(-1).reviewedOn,'2026-10-27');}finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});
test('The actual course reader shows the whole sixth lesson before its closed final source block and uses the new lesson date only',()=>{
 const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');let cursor=0;const hooks={...React,useState(initial){return[cursor++===1?5:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
 const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonId}`})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
 const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId)})),start=html.indexOf('<details id="quellen"');assert.ok(start>0);for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,start).includes(paragraph));for(const url of urls){assert.ok(!html.slice(0,start).includes(url));assert.ok(html.slice(start).includes(url));}assert.match(html,/Lektion 6 von 6/);assert.match(html.slice(start),/27\. Oktober 2026/);assert.doesNotMatch(html.slice(start),/16\. Oktober 2026/);assert.ok(!html.slice(start).split('>')[0].includes('open'));
});
