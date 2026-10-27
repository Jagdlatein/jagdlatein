// Technical preservation/integration tests; source reading is documented separately.
const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const{createLoader,local}=require('./helpers/project-module.cjs');
const{courseId,lessonId,questionId,sourceURLs,withoutCartridgeIgnitionModule:narrow,withoutCartridgeIgnitionDataset}=require('./helpers/cartridge-ignition-addition.cjs');
const raw=require('../data/learning-expansion-field-science-2026-10-17.json'),load=createLoader(),modules=load('lib/learning-curriculum.js').learningModules,course=modules.find(item=>item.id===courseId),lesson=course.lessons.at(-1),cards=load('lib/learning-flashcards.js').getFlashcards();
const cardId=`flash-${courseId}-${questionId}`,hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// The one other authorized parallel appendix is compared independently by its owner.
const pelletCourse='wissen-ausbau-biologie-verdauungsvergleich-2026',pelletQuestionIds=['gewoelle-muskelmagen','gewoelle-rueckweg'];
const pelletURLs=['https://www.birds.cornell.edu/k12/pellet-teaching-tips/','https://lucec.loyno.edu/natural-history-writings/owl-pellets','https://www.nhm.ac.uk/discover/do-birds-pee.html'];
function beforePellet(module){return module.id!==pelletCourse?module:{...module,sources:module.sources.filter(source=>!pelletURLs.includes(source.url)),lessons:module.lessons.filter(item=>item.id!=='gewoelle'),questions:module.questions.filter(item=>![...pelletQuestionIds,...pelletQuestionIds.map(id=>`${pelletCourse}-${id}`)].includes(item.id))};}

test('Only the exact new lesson, question, four sources and evidence differ from the complete a0a6563 field-science dataset',()=>{
  assert.equal(hash(withoutCartridgeIgnitionDataset(raw)),'680090b246994249ca8b2d61332fbb475a3ee633d7aacc86a5ee62bb4dfbee65');
  assert.equal(hash(narrow(raw.modules.find(item=>item.id===courseId))),'1e7cd4a1186303c640c33264e6b558714723ed727c3313adfd5e4282b3453f73');
  assert.equal(hash(narrow(course)),'1f0c0ae48ce5302147469d8e236609c38cbda7b4b11aefa222ca628355207332');
  assert.deepEqual(narrow(course).lessons.map(item=>item.id),['pruefzweck','identitaet','packung','anerkennung','patrone-geschoss-bauteile']);
  assert.equal(narrow(course).questions.length,26);assert.equal(narrow(course).sources.length,15);
  assert.equal(raw.reviewedOn,'2026-10-17');assert.equal(course.reviewedOn,'2026-10-17');assert.equal(course.lessons.at(-2).reviewedOn,'2026-10-26');
});

test('The 125-word terminology-only appendix has exact position claims, visible scope and no invented practical procedure or media',()=>{
  assert.equal(course.lessons.length,6);assert.equal(course.questions.length,27);assert.equal(course.sources.length,19);assert.equal(lesson.id,lessonId);assert.equal(lesson.reviewedOn,'2026-10-27');assert.equal(lesson.flashcardExpansion,true);
  const text=lesson.paragraphs.join(' ');assert.equal(text.split(/\s+/).length,125);
  assert.match(text,/Zündelement zentral im Hülsenboden/);assert.match(text,/Zündsatz im Hohlraum des Hülsenrands/);assert.match(text,/keine Geschossform/);
  assert.match(text,/begrenzte Ausgangsfall bleibt bestehen/);assert.match(text,/nicht pauschal auf sämtliche Patronenbauformen/);assert.match(text,/keine örtlichen Rechtsvorschriften oder Herstellerangaben/);
  assert.match(text,/weder geöffnet noch bearbeitet/);assert.match(text,/keine Freigabe einer konkreten Patrone/);
  assert.doesNotMatch(text,/\d|Schlagbolzen|Wiederlad|Gasdruck|Joule|Ladungsgewicht|Zündloch|Zündchem|Amboss|Boxer|Berdan|Magnum/);
  assert.equal(lesson.image,undefined);assert.equal(lesson.diagram,undefined);
  assert.deepEqual(course.sources.slice(-4).map(source=>source.url),sourceURLs);
  for(const source of course.sources.slice(-4)){assert.equal(source.checkedOn,'2026-10-27');assert.deepEqual(source.lessonIds,[lessonId]);}
  assert.deepEqual(lesson.evidence.map(item=>item.sources.map(source=>source.url)),[[sourceURLs[0],sourceURLs[2]],[sourceURLs[1],sourceURLs[2],sourceURLs[3]]]);
  for(const old of course.lessons.slice(0,-1))assert.ok(old.evidence.every(claim=>claim.sources.every(source=>!sourceURLs.includes(source.url))));
  const records=raw.evidence.filter(record=>record.moduleId===courseId&&record.lessonId===lessonId);assert.equal(records.length,1);assert.equal(records[0].claims.length,2);
  for(const claim of records[0].claims)assert.deepEqual(Object.keys(claim.sourceRoles),claim.sourceUrls);
});

test('All 198 old full course objects and 1722 complete cards keep order and every field; starters remain exact',()=>{
  assert.equal(modules.length,198);assert.equal(hash(modules.map(item=>beforePellet(narrow(item)))),'78e548ee83b0c39c75fbeec37dfa6ec4698d98f0a692c15436df0702d17b95f5');
  const otherAuthorizedCards=new Set(pelletQuestionIds.map(id=>`flash-${pelletCourse}-${id}`));
  const oldCards=cards.filter(card=>card.id!==cardId&&!otherAuthorizedCards.has(card.id));assert.equal(oldCards.length,1722);assert.equal(hash(oldCards),'ce7971c1e548bdec709dd98ec0c60977909e53970ff8e4b3cbe97097c64b0669');
  assert.equal(hash(cards.slice(0,116)),'54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.equal(hash(cards.filter(card=>card.moduleId===courseId&&card.id!==cardId)),'d3303abb33468d99adc9ffe6c03c6822d3576c836b4f1ee150a0ffacec4bf442');
});

test('One own position-comparison question derives one exact dated card and is available in existing DACH shared quiz pools',()=>{
  const selected=course.questions.filter(item=>item.lessonId===lessonId);assert.equal(selected.length,1);const[question]=selected;assert.equal(question.id,`${courseId}-${questionId}`);
  assert.equal(modules.flatMap(item=>item.questions).filter(item=>item.q===question.q).length,1);assert.equal(new Set(question.answers.map(answer=>answer.text)).size,4);
  const selectedCards=cards.filter(item=>item.id===cardId);assert.equal(selectedCards.length,1);const[card]=selectedCards;
  assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);assert.equal(card.explanation,question.explain);
  assert.equal(card.reviewedOn,'2026-10-27');assert.equal(card.sourceScope,'lesson');assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${lessonId}`);assert.equal(card.options,undefined);
  assert.deepEqual(card.sources.map(source=>source.url),[sourceURLs[0],sourceURLs[2],sourceURLs[1],sourceURLs[3]]);
  const{quizLearningPool}=load('lib/quiz-learning-scope.js'),bank=load('data/questions-full.js').QUESTIONS;
  for(const country of ['DE','AT','CH'])assert.ok(quizLearningPool(bank,{country,topic:'Waffen & Sicherheit'}).some(item=>item.id===question.id));
});

test('Existing category branch, search and static course payload lead to the exact sixth lesson',()=>{
  const location=load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);assert.equal(location.categorySlug,'waffen-sicherheit');assert.equal(location.groupId,'pflege-kennzeichnung');
  const found=load('lib/learning-search.js').searchLearning({query:'Randfeuer',type:'course'}).results.find(item=>item.id===`course:${courseId}`);assert.ok(found);assert.equal(found.href,`/kurse/${courseId}#lesson-${lessonId}`);assert.equal(found.lessonTitle,lesson.title);
  const props=load('pages/kurse/[slug].js').getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module.lessons.at(-1),lesson);assert.equal(props.flashcards.lessons[lessonId],1);
});

test('Actual course reader keeps full terminology text before closed final evidence with only the lesson review date',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');let cursor=0;
  const hooks={...React,useState(initial){return[cursor++===1?5:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
  const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonId}`})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
  const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId)})),start=html.indexOf('<details id="quellen"');assert.ok(start>0);
  for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,start).includes(paragraph));for(const url of sourceURLs){assert.ok(html.slice(start).includes(url));assert.ok(!html.slice(0,start).includes(url));}
  assert.match(html,/Lektion 6 von 6/);assert.match(html.slice(start),/27\. Oktober 2026/);assert.doesNotMatch(html.slice(start),/17\. Oktober 2026|26\. Oktober 2026/);assert.ok(!html.slice(start).split('>')[0].includes('open'));
});

test('Actual print/PDF presentation retains exact new question, answer and explanation before its source appendix',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
  const Print=createLoader({'next/router':{useRouter:()=>({query:{},isReady:true})},'../../components/LearningToolLayout':{__esModule:true,default:({children})=>children},'../../components/PageMenu':{__esModule:true,default:()=>null,closePageMenu(){}},'../../components/useFlashcardDeck':{__esModule:true,default:props=>({...props,incomplete:false,loading:false})}})('pages/lernen/lernkarten-drucken.js').default;
  const selected=cards.filter(card=>card.id===cardId),html=renderToStaticMarkup(React.createElement(Print,{cards:selected,categories:[{id:'waffen-sicherheit',title:'Waffen & Sicherheit',count:1}]})),start=html.indexOf('<h2 id="lernkarten-quellen">');assert.ok(start>0);
  for(const text of [selected[0].question,selected[0].answer,selected[0].explanation])assert.ok(html.slice(0,start).includes(text));for(const url of sourceURLs)assert.ok(html.indexOf(url)>start);assert.match(html,/27\.10\.2026/);
});

test('An isolated expiring offline pack retains exact complete lesson, question and evidence without renewing inherited course dates',()=>{
  const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-cartridge-ignition-offline';
  try{const now=Date.parse('2026-10-27T15:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-10-29T15:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.equal(pack.courses[0].reviewedOn,'2026-10-17');assert.equal(pack.courses[0].lessons.at(-2).reviewedOn,'2026-10-26');assert.equal(pack.courses[0].lessons.at(-1).reviewedOn,'2026-10-27');assert.deepEqual(pack.courses[0].lessons.at(-1).evidence,lesson.evidence);
  }finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});
