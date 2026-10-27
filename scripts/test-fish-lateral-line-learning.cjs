// Exact preservation and integration checks; source reading is recorded separately.
const test=require('node:test'),assert=require('node:assert/strict');
const{createHash}=require('node:crypto');
const{createLoader,local}=require('./helpers/project-module.cjs');
const raw=require('../data/learning-expansion-ecology-2026-10-16.json');
const load=createLoader(),courseId='wissen-ausbau-oekologie-tierbewegungen-2026',lessonId='seitenliniensinn',questionId='seitenliniensinn-wasserbewegung';
const sourceURLs=['https://www.manoa.hawaii.edu/exploringourfluidearth/biological/fish/structure-and-function-fish','https://utmsi.utexas.edu/science-and-the-sea/radio-program/fish-sense/'];
const{learningModules,getLearningModule}=load('lib/learning-curriculum.js'),course=getLearningModule(courseId),original=raw.modules.find(item=>item.id===courseId),lesson=course.lessons.at(-1);
const cards=load('lib/learning-flashcards.js').getFlashcards(),cardId=`flash-${courseId}-${questionId}`;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function beforeAddition(module){return module.id!==courseId?module:{...module,sources:module.sources.filter(source=>!sourceURLs.includes(source.url)),lessons:module.lessons.filter(item=>item.id!==lessonId),questions:module.questions.filter(item=>![questionId,`${courseId}-${questionId}`].includes(item.id))};}

test('Only this exact addition differs from the complete6d85030 ecology file and the four original lessons,32questions and11source objects',()=>{
 const historical={...raw,modules:raw.modules.map(beforeAddition),evidence:raw.evidence.filter(item=>!(item.moduleId===courseId&&item.lessonId===lessonId))};
 assert.equal(hash(historical),'697dae661774c9f98538c4031c6c40f4001e6c09069a6945aa95a1e8061212ad');
 assert.equal(hash(beforeAddition(original)),'fb0f7e1bb154ff343418a446ddca8ab1da683ebc01c3b4ae0077a2e4167bf908');
 assert.equal(hash(raw.modules.filter(item=>item.id!==courseId)),'c7f9133304f41bda518f00560103087e3735c388b18c14805170688fe76319eb');
 assert.equal(hash(raw.evidence.filter(item=>item.moduleId===courseId&&item.lessonId!==lessonId)),'aa1d33df95699b2af412861aee1b3e7851b29b3059a3b8e0703828820ce830af');
 assert.equal(hash(beforeAddition(course)),'a286c7fdcd67dbab197a5e5993d42ea40d541f1fd026d764e48fe1230fc3a6c8');
 assert.deepEqual(beforeAddition(course).lessons.map(item=>item.id),['einstandswechsel','querungssystem','amphibienwege','fischwege']);
 assert.equal(raw.reviewedOn,'2026-10-16');assert.equal(course.reviewedOn,'2026-10-16');
});
test('One126-word fifth lesson has exactly two independently scoped institutional sources and visible limits',()=>{
 assert.equal(course.lessons.length,5);assert.equal(course.questions.length,33);assert.equal(course.sources.length,13);
 assert.equal(lesson.id,lessonId);assert.equal(lesson.reviewedOn,'2026-10-27');assert.equal(lesson.flashcardExpansion,true);
 assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length,126);
 assert.match(lesson.paragraphs[0],/^Viele Fische/);assert.match(lesson.paragraphs[0],/Sinneshaarzellen.*Bewegungen des Wassers/);
 assert.match(lesson.paragraphs[1],/keine Leistungswerte für jede heimische Fischart/);
 assert.match(lesson.paragraphs[2],/laterale Gewässervernetzung betrifft räumliche Verbindungen/);
 assert.match(lesson.paragraphs[2],/keine Aussage, ob ein bestimmtes Querbauwerk passierbar ist/);
 assert.doesNotMatch(lesson.paragraphs.join(' '),/\d|Elektro|Reflexwellen|Haiherz|Köder|Fanggarantie|Hz|Dezibel/);
 assert.equal(lesson.image,undefined);assert.equal(lesson.diagram,undefined);
 assert.deepEqual(course.sources.slice(-2).map(source=>source.url),sourceURLs);
 for(const source of course.sources.slice(-2)){assert.equal(source.checkedOn,'2026-10-27');assert.deepEqual(source.lessonIds,[lessonId]);}
 assert.deepEqual(lesson.evidence.map(record=>record.sources.map(source=>source.url)),[sourceURLs,sourceURLs]);
 const evidence=raw.evidence.find(item=>item.moduleId===courseId&&item.lessonId===lessonId);assert.equal(evidence.claims.length,2);
 for(const claim of evidence.claims){assert.deepEqual(claim.sourceUrls,sourceURLs);assert.deepEqual(Object.keys(claim.sourceRoles),sourceURLs);}
});
test('All198 old full courses and1721 old complete cards retain their contents and order, including116starters',()=>{
 assert.equal(learningModules.length,198);assert.equal(hash(learningModules.map(beforeAddition)),'a3f8cfd9e73b8527f890aae2a51361929a9cc60673320323633fdb42c1bdf5c2');
 const oldCards=cards.filter(card=>card.id!==cardId);assert.equal(oldCards.length,1721);assert.equal(hash(oldCards),'c3806cd2ed5a768657aab506eec3554d14fdfa3582f37ec8059a1c5afb42f6c8');
 assert.equal(hash(cards.filter(card=>card.moduleId===courseId&&card.id!==cardId)),'f45c89f40743a447bbb5cc6f5c447fe28d70b0351968ca465664493c61b12f24');
 assert.equal(hash(cards.slice(0,116)),'54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
 assert.equal(cards.filter(card=>card.moduleId===courseId).length,31);
});
test('One own question becomes one exact dated card and stays in each existing shared country quiz pool',()=>{
 const questions=course.questions.filter(item=>item.lessonId===lessonId);assert.equal(questions.length,1);const[question]=questions;
 assert.equal(question.id,`${courseId}-${questionId}`);assert.equal(new Set(question.answers.map(answer=>answer.text)).size,4);
 assert.equal(learningModules.flatMap(item=>item.questions).filter(item=>item.q===question.q).length,1);
 const selected=cards.filter(card=>card.id===cardId);assert.equal(selected.length,1);const[card]=selected;
 assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);assert.equal(card.explanation,question.explain);
 assert.equal(card.sourceScope,'lesson');assert.equal(card.reviewedOn,'2026-10-27');assert.deepEqual(card.sources,lesson.evidence[0].sources);
 assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${lessonId}`);assert.equal(card.options,undefined);
 const bank=load('data/questions-full.js').QUESTIONS,{quizLearningPool}=load('lib/quiz-learning-scope.js');
 for(const country of ['DE','AT','CH'])assert.ok(quizLearningPool(bank,{country,topic:'Hege/Naturschutz'}).some(item=>item.id===question.id));
});
test('Existing topic branch, search and static course props expose the same exact new lesson without a new route',()=>{
 const location=load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);assert.equal(location.categorySlug,'tierschutz-verantwortung');assert.equal(location.groupId,'tierbewegungen-verbindungen');
 const result=load('lib/learning-search.js').searchLearning({query:'Seitenliniensinn',type:'course'}).results.find(item=>item.id===`course:${courseId}`);
 assert.ok(result);assert.equal(result.href,`/kurse/${courseId}#lesson-${lessonId}`);assert.equal(result.lessonTitle,lesson.title);
 const props=load('pages/kurse/[slug].js').getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module.lessons.at(-1),lesson);assert.equal(props.flashcards.lessons[lessonId],1);
});
test('Offline delivery retains the full exact new lesson, question and evidence without renewing the inherited course date or access',()=>{
 const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-fish-lateral-line-offline';
 try{const now=Date.parse('2026-10-27T14:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-10-29T14:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');
  assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.deepEqual(pack.courses[0].lessons.at(-1).evidence,lesson.evidence);assert.equal(pack.courses[0].reviewedOn,'2026-10-16');assert.equal(pack.courses[0].lessons.at(-1).reviewedOn,'2026-10-27');
 }finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});
test('The actual course reader displays the full fifth lesson above its closed final source evidence with the lesson review date',()=>{
 const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');let cursor=0;
 const hooks={...React,useState(initial){return[cursor++===1?4:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
 const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonId}`})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
 const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId)})),start=html.indexOf('<details id="quellen"');assert.ok(start>0);
 for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,start).includes(paragraph));for(const url of sourceURLs){assert.ok(html.slice(start).includes(url));assert.ok(!html.slice(0,start).includes(url));}
 assert.match(html,/Lektion 5 von 5/);assert.match(html.slice(start),/27\. Oktober 2026/);assert.doesNotMatch(html.slice(start),/16\. Oktober 2026/);assert.ok(!html.slice(start).split('>')[0].includes('open'));
});
