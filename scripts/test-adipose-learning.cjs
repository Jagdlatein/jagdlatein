const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
// Technical scope/preservation checks; the actual scientific reading is separate.
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const{createLoader: createLinkedProjectLoader,local,root}=require('./helpers/project-module.cjs');
const createLoader = overrides => createLinkedProjectLoader(linkedExamBaselineFixture(overrides));
const{courseId,lessonIds,questionIds,sourceURLs,stripAdiposeAddition:strip,stripAdiposeDataset:stripDataset,isAdiposeCard,adiposeBaselineFixture}=require('./helpers/adipose-learning-additions-oct27.cjs');
const{stripPlantEnergyAddition,isPlantEnergyCard}=require('./helpers/plant-energy-additions-oct27.cjs');
const baseline='647e2df',rawPath='data/learning-expansion-applied-2026-10-16.json',plantPath='data/learning-expansion-ecology-2026-10-16.json';
const atBaseline=file=>JSON.parse(execFileSync('git',['show',`${baseline}:${file}`],{cwd:root,encoding:'utf8'}));
const raw=require(`../${rawPath}`),oldRaw=atBaseline(rawPath),load=createLoader(examKnowledgeBaselineFixture()),oldLoad=createLoader(examKnowledgeBaselineFixture({[`../${rawPath}`]:oldRaw,[`../${plantPath}`]:atBaseline(plantPath)}));
const modules=load('lib/learning-curriculum.js').learningModules,oldModules=oldLoad('lib/learning-curriculum.js').learningModules,course=modules.find(item=>item.id===courseId),lessons=course.lessons.slice(-2);
const cards=load('lib/learning-flashcards.js').getFlashcards(),oldCards=oldLoad('lib/learning-flashcards.js').getFlashcards(),newCards=cards.filter(isAdiposeCard);

test('The complete applied dataset retains all old fields, four muscle lessons, 32 questions, six sources and original dates',()=>{
 assert.deepEqual(stripDataset(raw),oldRaw);assert.deepEqual(strip(course),oldModules.find(item=>item.id===courseId));
 const before=oldRaw.modules.find(item=>item.id===courseId);assert.equal(before.lessons.length,4);assert.equal(before.questions.length,32);assert.equal(before.sources.length,6);
 assert.deepEqual(course.lessons.slice(0,4),oldModules.find(item=>item.id===courseId).lessons);assert.equal(raw.reviewedOn,'2026-10-16');assert.equal(course.reviewedOn,'2026-10-16');
 const tamu='https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/structure-and-composition-of-muscle/';assert.deepEqual(raw.modules.find(item=>item.id===courseId).sources.find(source=>source.url===tamu),before.sources.find(source=>source.url===tamu));
});

test('All 198 full old course objects, 1732 complete old cards and 116 starter cards keep every field and order',()=>{
 assert.equal(modules.length,198);assert.deepEqual(modules.map(module=>strip(stripPlantEnergyAddition(module))),oldModules);
 assert.equal(oldCards.length,1732);assert.deepEqual(cards.filter(card=>!isAdiposeCard(card)&&!isPlantEnergyCard(card)),oldCards);assert.deepEqual(cards.slice(0,116),oldCards.slice(0,116));
 assert.deepEqual(newCards.map(card=>card.id),questionIds.map(id=>`flash-${courseId}-${id}`));
});

test('The two appended lessons teach a bounded white-adipocyte model, preparation artifact and precise meat-anatomy positions without new safety or quality promises',()=>{
 assert.equal(course.lessons.length,6);assert.equal(course.questions.length,35);assert.equal(course.sources.length,10);assert.deepEqual(lessons.map(lesson=>lesson.id),lessonIds);assert.deepEqual(lessons.map(lesson=>lesson.title),['Fettzellen','Fettlagen']);
 assert.deepEqual(lessons.map(lesson=>lesson.paragraphs.join(' ').split(/\s+/).length),[161,171]);const[cell,position]=lessons.map(lesson=>lesson.paragraphs.join(' '));
 assert.match(cell,/weißes Fettgewebe als histologisches Grundmodell/);assert.match(cell,/Zellkern an den Rand/);assert.match(cell,/schmaler Saum von Zellplasma/);assert.match(cell,/nicht unterschiedslos für alle Fettzelltypen/);assert.match(cell,/können Lipide.*herausgelöst/);assert.match(cell,/nicht, dass die lebende Fettzelle.*leeren Hohlraum/);
 assert.match(position,/Intramuskuläres Fett liegt innerhalb eines Muskels/);assert.match(position,/Bindegewebe zwischen seinen Faserbündeln/);assert.match(position,/Intermuskuläres Fett.*zwischen ganzen Muskeln/);assert.match(position,/Marmorierung/);assert.match(position,/keine einheitliche Ausprägung/);assert.match(position,/Weder die Lagebezeichnung noch sichtbare Marmorierung sind eine Hygiene-, Sicherheits- oder Qualitätsfreigabe/);
 for(const lesson of lessons){assert.equal(lesson.reviewedOn,'2026-10-27');assert.equal(lesson.flashcardExpansion,true);assert.equal(lesson.image,undefined);assert.equal(lesson.diagram,undefined);assert.doesNotMatch(lesson.paragraphs.join(' '),/\d|°C|Minuten|Stunden|Garzeit|T-Tubul|Tierart.*erkennt/);}
 assert.deepEqual(course.questions.filter(question=>lessonIds.includes(question.lessonId)).map(question=>question.id),questionIds.map(id=>`${courseId}-${id}`));
});

test('Every exact claim has concrete evidence roles, new sources are lesson-scoped, and no new source changes an old lesson',()=>{
 assert.deepEqual(course.sources.slice(-4).map(source=>source.url),sourceURLs);for(const source of course.sources.slice(-4)){assert.equal(source.checkedOn,'2026-10-27');assert.ok(source.lessonIds.every(id=>lessonIds.includes(id)));}
 assert.match(course.sources.find(source=>source.url===sourceURLs[2]).label,/2007/);assert.ok(!course.sources.some(source=>source.url.includes('_jcr_content')));
 const records=raw.evidence.filter(record=>record.moduleId===courseId&&lessonIds.includes(record.lessonId));assert.equal(records.length,2);for(const record of records){assert.equal(record.claims.length,2);for(const claim of record.claims){assert.ok(claim.sourceUrls.length>=2);assert.deepEqual(Object.keys(claim.sourceRoles),claim.sourceUrls);}}
 for(const lesson of course.lessons.slice(0,4))assert.ok(lesson.evidence.every(claim=>claim.sources.every(source=>!sourceURLs.includes(source.url))));
 assert.deepEqual(lessons[0].evidence.map(claim=>claim.sources.map(source=>source.url)),[[sourceURLs[0],sourceURLs[1]],[sourceURLs[0],sourceURLs[1]]]);
 assert.deepEqual(lessons[1].evidence.map(claim=>claim.sources.map(source=>source.url)),[['https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/structure-and-composition-of-muscle/',sourceURLs[2],sourceURLs[3]],[sourceURLs[2],sourceURLs[3]]]);
});

test('Three distinct own questions create three exact dated cards with current answer IDs, complete explanations and precise existing lesson links',()=>{
 assert.equal(newCards.length,3);const{quizLearningPool}=load('lib/quiz-learning-scope.js'),bank=load('data/questions-full.js').QUESTIONS;
 for(const card of newCards){const question=course.questions.find(item=>`flash-${item.id}`===card.id);assert.ok(question);assert.equal(modules.flatMap(item=>item.questions).filter(item=>item.q===question.q).length,1);assert.equal(new Set(question.answers.map(answer=>answer.text)).size,4);assert.equal(question.correct.length,1);assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);assert.equal(card.explanation,question.explain);assert.equal(card.sourceScope,'lesson');assert.equal(card.reviewedOn,'2026-10-27');assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${question.lessonId}`);assert.equal(card.options,undefined);
  const expected=[...new Set(course.lessons.find(lesson=>lesson.id===question.lessonId).evidence.flatMap(claim=>claim.sources.map(source=>source.url)))];assert.deepEqual(card.sources.map(source=>source.url),expected);
  for(const country of ['DE','AT','CH'])assert.ok(quizLearningPool(bank,{country,topic:'Wildbret & Gesundheit'}).some(item=>item.id===question.id));
 }
});

test('The existing category, precise searches and static course payload expose only the actual appended lesson targets and card counts',()=>{
 const location=load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);assert.equal(location.categorySlug,'wildbret-gesundheit');assert.equal(location.groupId,'qualitaet-lagerung');const search=load('lib/learning-search.js').searchLearning;
 for(const[query,lesson]of[['Adipozyten',lessons[0]],['Marmorierung',lessons[1]]]){const found=search({query,type:'course'}).results.find(item=>item.id===`course:${courseId}`);assert.ok(found);assert.equal(found.href,`/kurse/${courseId}#lesson-${lesson.id}`);assert.equal(found.lessonTitle,lesson.title);}
 const props=load('pages/kurse/[slug].js').getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module.lessons.slice(-2),lessons);assert.equal(props.flashcards.lessons.fettzellen,2);assert.equal(props.flashcards.lessons.fettlagen,1);
});

test('The actual course reader places both complete new texts before closed final sources carrying only the true lesson date',()=>{
 const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
 for(let i=0;i<2;i++){let cursor=0;const hooks={...React,useState(initial){return[cursor++===1?4+i:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
  const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonIds[i]}`})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
  const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId)})),start=html.indexOf('<details id="quellen"');assert.ok(start>0);for(const paragraph of lessons[i].paragraphs)assert.ok(html.slice(0,start).includes(paragraph));assert.ok(!html.slice(start).split('>')[0].includes('open'));assert.match(html.slice(start),/27\. Oktober 2026/);assert.doesNotMatch(html.slice(start),/16\. Oktober 2026/);for(const url of [...new Set(lessons[i].evidence.flatMap(claim=>claim.sources.map(source=>source.url)))]){assert.ok(html.slice(start).includes(url));assert.ok(!html.slice(0,start).includes(url));}
 }
});

test('The actual print/PDF renderer puts each full own card above the final source appendix with inherited evidence and date',()=>{
 const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');const Print=createLoader({'next/router':{useRouter:()=>({query:{},isReady:true})},'../../components/LearningToolLayout':{__esModule:true,default:({children})=>children},'../../components/PageMenu':{__esModule:true,default:()=>null,closePageMenu(){}},'../../components/useFlashcardDeck':{__esModule:true,default:props=>({...props,incomplete:false,loading:false})}})('pages/lernen/lernkarten-drucken.js').default;
 const html=renderToStaticMarkup(React.createElement(Print,{cards:newCards,categories:[{id:'wildbret-gesundheit',title:'Wildbret & Gesundheit',count:3}]})),start=html.indexOf('<h2 id="lernkarten-quellen">');assert.ok(start>0);for(const card of newCards)for(const text of[card.question,card.answer,card.explanation])assert.ok(html.slice(0,start).includes(text));for(const url of sourceURLs)assert.ok(html.indexOf(url)>start);assert.match(html,/27\.10\.2026/);
});

test('A purely synthetic authenticated expiring offline pack retains all full old/new lessons, questions and date roles',()=>{
 const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-adipose-offline-session';
 try{const now=Date.parse('2026-10-27T15:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-10-29T15:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.equal(pack.courses[0].reviewedOn,'2026-10-16');assert.deepEqual(pack.courses[0].lessons.slice(-2),lessons);}
 finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});

test('The exact historical projection respects an explicit prior JSON override and preserves unknown fields and similarly named content',()=>{
 const key=`../${rawPath}`,custom=structuredClone(raw),selected=custom.modules.find(module=>module.id===courseId);custom.futureField={kept:true};selected.futureMetadata='keep';selected.lessons.push({id:'fettzellen-extra'});selected.questions.push({id:'fettzellen-aufbau-extra'});selected.sources.push({url:`${sourceURLs[0]}?unrelated=true`});custom.evidence.push({moduleId:'unrelated-course',lessonId:'fettzellen',claims:[]});const original=structuredClone(custom),token={},result=adiposeBaselineFixture({[key]:custom,other:token});assert.deepEqual(custom,original);assert.equal(result.other,token);assert.deepEqual(result[key],stripDataset(custom));assert.deepEqual(result[key].futureField,{kept:true});const kept=result[key].modules.find(module=>module.id===courseId);assert.equal(kept.futureMetadata,'keep');assert.ok(kept.lessons.some(lesson=>lesson.id==='fettzellen-extra'));assert.ok(kept.questions.some(question=>question.id==='fettzellen-aufbau-extra'));assert.ok(kept.sources.some(source=>source.url.endsWith('?unrelated=true')));assert.ok(result[key].evidence.some(record=>record.moduleId==='unrelated-course'&&record.lessonId==='fettzellen'));
});
