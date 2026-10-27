// Structural/preservation checks do not replace the separately recorded source review.
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const{createLoader,local,root}=require('./helpers/project-module.cjs');
const{courseId,lessonIds,questionIds,sourceURLs,stripFirearmTermsAddition:strip,stripFirearmTermsDataset:stripDataset,isFirearmTermsCard,firearmTermsBaselineFixture}=require('./helpers/firearm-terms-additions-oct27.cjs');
const baseline='ab9a2143417ce5f8bd0aeb92c431bd16eddfe492',datasetPath='data/learning-expansion-field-science-2026-10-17.json';
const raw=require(`../${datasetPath}`),oldRaw=JSON.parse(execFileSync('git',['show',`${baseline}:${datasetPath}`],{cwd:root,encoding:'utf8'}));
const oldCourse=oldRaw.modules.find(item=>item.id===courseId),load=createLoader(),baselineLoad=createLoader({'../data/learning-expansion-field-science-2026-10-17.json':oldRaw});
const modules=load('lib/learning-curriculum.js').learningModules,previous=baselineLoad('lib/learning-curriculum.js').learningModules,course=modules.find(item=>item.id===courseId),lessons=course.lessons.slice(-2);
const cards=load('lib/learning-flashcards.js').getFlashcards(),previousCards=baselineLoad('lib/learning-flashcards.js').getFlashcards(),newCards=cards.filter(isFirearmTermsCard);

test('Every pre-existing field-science object is retained exactly, including all six lessons, 27 questions, 19 sources and date roles',()=>{
  assert.deepEqual(stripDataset(raw),oldRaw);assert.deepEqual(strip(course),previous.find(item=>item.id===courseId));
  assert.equal(oldCourse.lessons.length,6);assert.equal(oldCourse.questions.length,27);assert.equal(oldCourse.sources.length,19);
  assert.deepEqual(course.lessons.slice(0,6),previous.find(item=>item.id===courseId).lessons);assert.deepEqual(raw.modules.find(item=>item.id===courseId).questions.slice(0,27),oldCourse.questions);
  assert.equal(raw.reviewedOn,'2026-10-17');assert.equal(course.reviewedOn,'2026-10-17');assert.equal(course.lessons[4].reviewedOn,'2026-10-26');assert.equal(course.lessons[5].reviewedOn,'2026-10-27');
});

test('All 198 complete old course objects, old cards and 116 starters keep their order and every field',()=>{
  // A concurrent independently owned feather appendix is present identically in both loaders.
  assert.equal(modules.length,198);assert.deepEqual(modules.map(strip),previous);assert.deepEqual(cards.filter(card=>!isFirearmTermsCard(card)),previousCards);assert.deepEqual(cards.slice(0,116),previousCards.slice(0,116));
  assert.deepEqual(newCards.map(card=>card.id),questionIds.map(id=>`flash-${courseId}-${id}`));
});

test('Two concise scope-limited terminology lessons append exactly four own questions without media or practical instructions',()=>{
  assert.deepEqual(lessons.map(lesson=>lesson.id),lessonIds);assert.deepEqual(lessons.map(lesson=>lesson.title),['Züge und Felder','Schrot und Einzelgeschoss']);
  assert.equal(course.lessons.length,8);assert.equal(course.questions.length,31);assert.equal(course.sources.length,27);
  const [profile,shells]=lessons.map(lesson=>lesson.paragraphs.join(' '));assert.deepEqual(lessons.map(lesson=>lesson.paragraphs.join(' ').split(/\s+/).length),[157,173]);
  assert.match(profile,/Vertiefungen heißen Züge/);assert.match(profile,/erhöhten Bereiche heißen Felder/);assert.match(profile,/eigene Längsachse/);assert.match(profile,/dient der Stabilisierung/);assert.match(profile,/nicht jede mögliche Innenkontur/);
  assert.match(shells,/mehrere kleine Schrotkugeln/);assert.match(shells,/Einzelgeschoss/);assert.match(shells,/Zwischenmittel/);assert.match(shells,/zwischen Treibladung und Schrotladung/);assert.match(shells,/ohne Öffnen oder Bearbeiten/);
  for(const lesson of lessons){assert.equal(lesson.reviewedOn,'2026-10-27');assert.equal(lesson.flashcardExpansion,true);assert.equal(lesson.image,undefined);assert.equal(lesson.diagram,undefined);assert.doesNotMatch(lesson.paragraphs.join(' '),/\d|m\/s|Joule|Ladungsgewicht|Millimeter|Schrotgröße|Dralllänge.*beträgt/);}
  const selected=course.questions.filter(question=>lessonIds.includes(question.lessonId));assert.deepEqual(selected.map(question=>question.id),questionIds.map(id=>`${courseId}-${id}`));
  for(const question of selected){assert.equal(new Set(question.answers.map(answer=>answer.text)).size,4);assert.equal(question.correct.length,1);assert.equal(modules.flatMap(item=>item.questions).filter(item=>item.q===question.q).length,1);}
});

test('Each exact new claim has concrete independent organization scopes, with no new source leaking into old lessons',()=>{
  assert.deepEqual(course.sources.slice(-8).map(source=>source.url),sourceURLs);
  for(const source of course.sources.slice(-8)){assert.equal(source.checkedOn,'2026-10-27');assert.ok(source.lessonIds.every(id=>lessonIds.includes(id)));}
  assert.deepEqual(course.sources.at(-1).lessonIds,['flintenpatronen']);assert.ok(course.sources.at(-1).url.endsWith('#page=48'));
  for(const lesson of course.lessons.slice(0,6))assert.ok(lesson.evidence.every(claim=>claim.sources.every(source=>!sourceURLs.includes(source.url))));
  const records=raw.evidence.filter(record=>record.moduleId===courseId&&lessonIds.includes(record.lessonId));assert.equal(records.length,2);
  for(const record of records){assert.equal(record.claims.length,2);for(const claim of record.claims){assert.deepEqual(Object.keys(claim.sourceRoles),claim.sourceUrls);assert.ok(claim.sourceUrls.length>=2);for(const url of claim.sourceUrls)assert.ok(course.sources.find(source=>source.url===url).lessonIds.includes(record.lessonId));}}
  assert.deepEqual(lessons[0].evidence.map(claim=>claim.sources.map(source=>source.url)),[[sourceURLs[1],sourceURLs[2]],[sourceURLs[0],sourceURLs[1],sourceURLs[2]]]);
  assert.deepEqual(lessons[1].evidence.map(claim=>claim.sources.map(source=>source.url)),[[sourceURLs[3],sourceURLs[4],sourceURLs[5]],[sourceURLs[7],sourceURLs[6],sourceURLs[2]]]);
});

test('Four dated cards preserve each actual answer ID, full explanation, exact lesson target and only its evidence sources',()=>{
  assert.equal(newCards.length,4);
  const {quizLearningPool}=load('lib/quiz-learning-scope.js'),bank=load('data/questions-full.js').QUESTIONS;
  for(const card of newCards){const question=course.questions.find(item=>`flash-${item.id}`===card.id);assert.ok(question);assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);assert.equal(card.explanation,question.explain);assert.equal(card.reviewedOn,'2026-10-27');assert.equal(card.sourceScope,'lesson');assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${question.lessonId}`);assert.equal(card.options,undefined);
    const expected=[...new Set(course.lessons.find(item=>item.id===question.lessonId).evidence.flatMap(claim=>claim.sources.map(source=>source.url)))];assert.deepEqual(card.sources.map(source=>source.url),expected);
    for(const country of ['DE','AT','CH'])assert.ok(quizLearningPool(bank,{country,topic:'Waffen & Sicherheit'}).some(item=>item.id===question.id));
  }
});

test('The existing category branch, course payload and precise searches reach each appended lesson',()=>{
  const location=load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);assert.equal(location.categorySlug,'waffen-sicherheit');assert.equal(location.groupId,'pflege-kennzeichnung');
  const search=load('lib/learning-search.js').searchLearning;
  for(const [query,lesson]of [['Zug-Feld-Profil',lessons[0]],['Zwischenmittel',lessons[1]]]){const found=search({query,type:'course'}).results.find(item=>item.id===`course:${courseId}`);assert.ok(found);assert.equal(found.href,`/kurse/${courseId}#lesson-${lesson.id}`);assert.equal(found.lessonTitle,lesson.title);}
  const props=load('pages/kurse/[slug].js').getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module.lessons.slice(-2),lessons);for(const id of lessonIds)assert.equal(props.flashcards.lessons[id],2);
});

test('The actual course reader places each complete lesson before its closed final evidence with its actual review date',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
  for(let i=0;i<2;i++){let cursor=0;const hooks={...React,useState(initial){return[cursor++===1?6+i:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
    const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonIds[i]}`})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
    const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId)})),start=html.indexOf('<details id="quellen"');assert.ok(start>0);for(const paragraph of lessons[i].paragraphs)assert.ok(html.slice(0,start).includes(paragraph));const expected=[...new Set(lessons[i].evidence.flatMap(claim=>claim.sources.map(source=>source.url)))];for(const url of expected){assert.ok(html.slice(start).includes(url));assert.ok(!html.slice(0,start).includes(url));}assert.ok(!html.slice(start).split('>')[0].includes('open'));assert.match(html.slice(start),/27\. Oktober 2026/);assert.doesNotMatch(html.slice(start),/17\. Oktober 2026|26\. Oktober 2026/);
  }
});

test('Print/PDF keeps the four complete own questions, answers and explanations before the source appendix',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
  const Print=createLoader({'next/router':{useRouter:()=>({query:{},isReady:true})},'../../components/LearningToolLayout':{__esModule:true,default:({children})=>children},'../../components/PageMenu':{__esModule:true,default:()=>null,closePageMenu(){}},'../../components/useFlashcardDeck':{__esModule:true,default:props=>({...props,incomplete:false,loading:false})}})('pages/lernen/lernkarten-drucken.js').default;
  const html=renderToStaticMarkup(React.createElement(Print,{cards:newCards,categories:[{id:'waffen-sicherheit',title:'Waffen & Sicherheit',count:4}]})),start=html.indexOf('<h2 id="lernkarten-quellen">');assert.ok(start>0);for(const card of newCards)for(const text of [card.question,card.answer,card.explanation])assert.ok(html.slice(0,start).includes(text));for(const url of sourceURLs)assert.ok(html.indexOf(url)>start);assert.match(html,/27\.10\.2026/);
});

test('A synthetic authenticated expiring offline pack retains full old/new lessons, questions and date roles without real storage or network',()=>{
  const saved=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-firearm-terms-offline';
  try{const now=Date.parse('2026-10-27T15:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-10-29T15:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.equal(pack.courses[0].reviewedOn,'2026-10-17');assert.deepEqual(pack.courses[0].lessons.slice(-2),lessons);assert.equal(pack.courses[0].lessons[4].reviewedOn,'2026-10-26');}
  finally{if(saved===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=saved;}
});

test('The historical fixture composes an explicit previous JSON override without hiding unknown fields or similarly named future content',()=>{
  const key='../data/learning-expansion-field-science-2026-10-17.json',custom=structuredClone(raw),selected=custom.modules.find(item=>item.id===courseId);
  custom.futureTop={kept:true};selected.futureField={kept:true};selected.lessons.push({id:'laufprofil-extra',paragraphs:['Unrelated fixture text.']});selected.questions.push({id:'laufprofil-zug-feld-extra',lessonId:'laufprofil-extra',q:'Unrelated fixture question.'});selected.sources.push({url:`${sourceURLs[0]}?unrelated=true`,label:'Unrelated fixture source.'});custom.evidence.push({moduleId:'unrelated-course',lessonId:'laufprofil',claims:[]});
  const input=structuredClone(custom),token={},result=firearmTermsBaselineFixture({[key]:custom,unrelated:token});assert.deepEqual(custom,input);assert.equal(result.unrelated,token);assert.deepEqual(result[key],stripDataset(custom));
  assert.deepEqual(result[key].futureTop,{kept:true});const kept=result[key].modules.find(item=>item.id===courseId);assert.deepEqual(kept.futureField,{kept:true});assert.ok(kept.lessons.some(item=>item.id==='laufprofil-extra'));assert.ok(kept.questions.some(item=>item.id==='laufprofil-zug-feld-extra'));assert.ok(kept.sources.some(source=>source.url.endsWith('?unrelated=true')));assert.ok(result[key].evidence.some(record=>record.moduleId==='unrelated-course'&&record.lessonId==='laufprofil'));
});
