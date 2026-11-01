// Positive Git-baseline preservation and actual data/reader integrations.
// Original-source review is separate; this is no whole-curriculum certification.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {createLoader,local,root}=require('./helpers/project-module.cjs');
const {courseId,lessonId,questionId:rawQuestionId,sourceURLs,stripBirdLegAddition:strip,stripBirdLegDataset,birdLegBaselineFixture}=require('./helpers/bird-leg-addition-nov01.cjs');
const revision='1bf28f2c4d288a95457a37ca2543a6cdfc1487d9',questionId=`${courseId}-${rawQuestionId}`;
function historicalLoader(){const cache=new Map(),swc=local('next/dist/build/swc');function historic(relative){
  const filename=path.resolve(root,relative),file=path.relative(root,filename).replaceAll('\\','/');assert.ok(file&&!file.startsWith('../')&&!path.isAbsolute(file));
  if(cache.has(filename))return cache.get(filename).exports;
  const source=execFileSync('git',['show',`${revision}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:30000000}),module={exports:{}};cache.set(filename,module);
  if(filename.endsWith('.json')){module.exports=JSON.parse(source.replace(/^\uFEFF/,''));return module.exports;}
  const{code}=swc.transformSync(source,{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  new Function('require','module','exports',code)(id=>id.endsWith('.module.css')?{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})}:id.startsWith('.')?historic(path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`)):local(id),module,module.exports);return module.exports;
}return historic;}
const load=createLoader(),old=historicalLoader(),raw=load('data/learning-expansion-biology-2026-10-16.json');
const curriculum=load('lib/learning-curriculum.js'),course=curriculum.getLearningModule(courseId),lesson=course.lessons.find(item=>item.id===lessonId);
const flashcards=load('lib/learning-flashcards.js'),cards=flashcards.getFlashcards(),isNewCard=card=>card.moduleId===courseId&&card.lessonId===lessonId;
const diagram=load('lib/lesson-diagrams.js').getLessonDiagram(courseId,lessonId),cardURLs=[sourceURLs[0],sourceURLs[2],sourceURLs[1]];

test('Only a tenth tail lesson, one question, three scoped sources and one evidence record extend the complete biology dataset',()=>{
  const previous=old('data/learning-expansion-biology-2026-10-16.json'),before=previous.modules.find(item=>item.id===courseId),current=raw.modules.find(item=>item.id===courseId);
  assert.deepEqual([before.lessons.length,before.questions.length,before.sources.length],[9,39,22]);assert.deepEqual([current.lessons.length,current.questions.length,current.sources.length],[10,40,25]);
  assert.deepEqual(current.lessons.slice(0,9),before.lessons);assert.deepEqual(current.questions.slice(0,39),before.questions);assert.deepEqual(current.sources.slice(0,22),before.sources);
  assert.deepEqual(stripBirdLegDataset(raw),previous);assert.equal(raw.reviewedOn,'2026-10-16');assert.equal(course.reviewedOn,'2026-10-16');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'),'23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All198 old full courses,2751 old rotated questions and1759 ordered cards including116 starters are preserved against Git1bf28f2',()=>{
  const before=old('lib/learning-curriculum.js'),beforeCards=old('lib/learning-flashcards.js').getFlashcards();
  assert.deepEqual(before.learningCounts,{modules:198,lessons:877,questions:2751});assert.deepEqual(curriculum.learningCounts,{modules:198,lessons:878,questions:2752});
  assert.deepEqual(curriculum.learningModules.map(strip),before.learningModules);assert.deepEqual(curriculum.learningQuestions.filter(item=>item.id!==questionId),before.learningQuestions);
  assert.equal(beforeCards.length,1759);assert.equal(cards.length,1760);assert.deepEqual(cards.filter(card=>!isNewCard(card)),beforeCards);assert.deepEqual(cards.slice(0,116),beforeCards.slice(0,116));
  assert.deepEqual(cards.filter(isNewCard).map(item=>item.id),[`flash-${questionId}`]);
});

test('The163-word explanation distinguishes ankle, hidden knee and elongated foot with exact source pairings and no invented measurements',()=>{
  assert.equal(course.lessons.at(-1),lesson);assert.equal(lesson.title,'Knie und Sprunggelenk');assert.equal(lesson.reviewedOn,'2026-11-01');assert.equal(lesson.flashcardExpansion,true);
  const text=lesson.paragraphs.join(' ');assert.equal(text.split(/\s+/).length,163);assert.match(text,/Sprunggelenk, auch Fersengelenk/);assert.match(text,/Knie liegt weiter oben.*meist von Gefieder verdeckt/);
  assert.match(text,/verlängerten Fußabschnitt/);assert.match(text,/Beim normalen Stehen auf den Zehen/);assert.match(text,/Federn oder Wasser verdecktes Gelenk als nicht einsehbar/);assert.match(text,/keine Anleitung.*zu fangen oder ein Gelenk zu bewegen/);assert.match(text,/weder eine sichere Verletzungsdiagnose noch genaue Knochenlängen/);
  assert.doesNotMatch(text,/\d|Prozent|Millimeter|Druckkraft|Tarsometatarsus|Tibiotarsus|Experiment|Originalstudie/);assert.equal(lesson.image,undefined);
  assert.deepEqual(course.sources.slice(-3).map(item=>item.url),sourceURLs);assert.ok(course.sources.slice(-3).every(item=>item.organization&&item.supports&&JSON.stringify(item.lessonIds)==='["vogelbein"]'));
  assert.deepEqual(lesson.evidence.map(item=>item.sources.map(source=>source.url)),[[sourceURLs[0],sourceURLs[2]],sourceURLs]);
  for(const before of course.lessons.slice(0,-1))assert.ok(!(before.evidence||[]).some(record=>record.sources.some(source=>sourceURLs.includes(source.url))));
});

test('One parallel-label joint question becomes one explained standalone card and all51regions retain the same biological quiz pool',()=>{
  const questions=course.questions.filter(item=>item.lessonId===lessonId),card=cards.find(isNewCard);assert.deepEqual(questions.map(item=>item.id),[questionId]);const question=questions[0];
  assert.deepEqual(new Set(question.answers.map(item=>item.text)),new Set(['Das Sprunggelenk.','Das Kniegelenk.','Das Hüftgelenk.','Das Zehengrundgelenk.']));assert.equal(question.answers.find(answer=>question.correct.includes(answer.id)).text,'Das Sprunggelenk.');assert.deepEqual(question.countries,['DE','AT','CH']);assert.equal(load('lib/quiz-learning-scope.js').quizQuestionTopic(question),'Wildkunde');
  assert.equal(card.question,question.q);assert.equal(card.answer,'Das Sprunggelenk.');assert.equal(card.explanation,question.explain);assert.equal(card.reviewedOn,'2026-11-01');assert.equal(card.sourceScope,'lesson');assert.deepEqual(card.sources.map(item=>item.url),cardURLs);assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${lessonId}`);
  const bank=load('data/questions-full.js').QUESTIONS;assert.deepEqual(bank.filter(item=>item.id!==questionId),old('data/questions-full.js').QUESTIONS);
  const{quizLearningPool}=load('lib/quiz-learning-scope.js'),{examCountries}=load('lib/exam-profile.js'),common=quizLearningPool(bank,{topic:'Wildkunde'});assert.equal(examCountries.reduce((sum,item)=>sum+item.regions.length,0),51);
  for(const country of examCountries)for(const region of country.regions){const pool=quizLearningPool(bank,{country:country.code,region:region.code,topic:'Wildkunde'});assert.deepEqual(pool,common);assert.ok(pool.some(item=>item.id===questionId));}
});

test('The own three-step diagram is scoped to this exact lesson; all old diagram objects and photo projections remain exact',()=>{
  assert.deepEqual(diagram,lesson.diagram);assert.equal(diagram.title,'Vom Körper zu den Zehen');assert.match(diagram.note,/Eigenes vereinfachtes Lageschema/);assert.match(diagram.note,/keine maßstäbliche Anatomiezeichnung oder Artbestimmung/);
  assert.deepEqual(diagram.steps.map(item=>item.title),['Knie','Sprunggelenk','Fußabschnitt und Zehen']);assert.ok(diagram.steps.every(item=>item.text));assert.equal(diagram.image,undefined);
  const diagrams=load('lib/lesson-diagrams.js'),previous=old('lib/lesson-diagrams.js');
  for(const module of old('lib/learning-curriculum.js').learningModules)for(const item of module.lessons)assert.deepEqual(diagrams.getLessonDiagram(module.id,item.id),previous.getLessonDiagram(module.id,item.id));
  const projection=load('lib/lesson-photos-server.js').getCourseLessonPhotos,oldProjection=old('lib/lesson-photos-server.js').getCourseLessonPhotos;
  for(const module of curriculum.learningModules)assert.deepEqual(projection(module),oldProjection(old('lib/learning-curriculum.js').getLearningModule(module.id)),module.id);
  assert.equal(projection(course)[lessonId],undefined);
});

test('Search, existing course props, exact quiz/flashcard export, print sources and114guides integrate only the one appendage',()=>{
  const result=load('lib/learning-search.js').searchLearning({query:'Fersengelenk',type:'course'}).results.find(item=>item.id===`course:${courseId}`);assert.ok(result);assert.equal(result.href,`/kurse/${courseId}#lesson-${lessonId}`);
  const page=load('pages/kurse/[slug].js');assert.deepEqual(page.getStaticPaths(),old('pages/kurse/[slug].js').getStaticPaths());const props=page.getStaticProps({params:{slug:courseId}}).props;assert.deepEqual(props.module,course);assert.equal(props.flashcards.lessons[lessonId],1);
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId),old('lib/learning-topic-tree.js').getLearningTopicLocation(courseId));
  const card=cards.find(isNewCard),exported=flashcards.getFlashcardExport({courseId,lessonId});assert.deepEqual(exported.cards,[card]);assert.equal(exported.selection.returnHref,card.courseHref);assert.deepEqual(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex([card]).sourceList.map(item=>item.url),cardURLs);
  const guides=load('lib/wildlife-learning-guide.js'),before=old('lib/wildlife-learning-guide.js');assert.deepEqual(guides.wildlifeGuideTargets,before.wildlifeGuideTargets);const slugs=Object.keys(load('lib/european-wildlife-discovery.js').europeanWildlifeBySlug);assert.equal(slugs.length,114);
  for(const slug of slugs)assert.deepEqual(guides.getWildlifeLearningGuide(slug),before.getWildlifeLearningGuide(slug).map(item=>item.moduleId===courseId?{...item,flashcardCount:item.flashcardCount+1}:item),slug);
});

test('Actual online and stored-course readers render full text and own diagram before closed final sources with only the real lesson review date',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');function hooks(){let cursor=0;return{...React,useState(initial){return[cursor++===1?9:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};}
  const h=hooks(),Course=createLoader({react:h,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonId}`,isReady:true})},'./LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},'./PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},'../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
  const online=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:flashcards.getFlashcardLessonSummary(courseId)}));
  const filename=path.join(root,'components/OfflineLearning.js'),source=fs.readFileSync(filename,'utf8')+'\nexport { OfflineCourse };',offlineHooks=hooks(),loader=createLoader({react:offlineHooks}),mod={exports:{}};
  const{code}=local('next/dist/build/swc').transformSync(source,{filename,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  new Function('require','module','exports',code)(id=>id==='react'?offlineHooks:id.endsWith('.module.css')?{__esModule:true,default:{}}:id.startsWith('.')?loader(path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`)):local(id),mod,mod.exports);
  const offline=renderToStaticMarkup(React.createElement(mod.exports.OfflineCourse,{course,expiresAt:Date.now()+60000,onExpired(){}}));
  for(const html of [online,offline]){const summary=html.indexOf('<summary>Quellen und Prüfstand'),boundary=summary>=0?html.lastIndexOf('<details',summary):html.indexOf('<details id="quellen"');assert.ok(boundary>0);
    for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,boundary).includes(paragraph));assert.ok(html.slice(0,boundary).includes(diagram.note));for(const item of diagram.steps){assert.ok(html.slice(0,boundary).includes(item.title));assert.ok(html.slice(0,boundary).includes(item.text));}
    assert.match(html.slice(boundary),/1\. November 2026/);for(const url of sourceURLs){assert.ok(!html.slice(0,boundary).includes(url));assert.ok(html.slice(boundary).includes(url));}assert.ok(!html.slice(boundary).split('>')[0].includes('open'));}
});

test('Offline pack validation preserves exact full lesson/evidence/diagram/questions and original dates while retaining access expiry',()=>{
  const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-bird-leg-offline';try{
    const now=Date.parse('2026-11-01T15:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-11-03T15:00:00Z'},now),{validateOfflinePack}=load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.deepEqual(pack.courses[0].sources,course.sources);assert.equal(pack.courses[0].reviewedOn,'2026-10-16');assert.equal(pack.courses[0].lessons.at(-1).reviewedOn,'2026-11-01');assert.deepEqual(pack.courses[0].lessons.at(-1).diagram,diagram);assert.ok(!JSON.stringify(pack).includes('synthetic@example.invalid'));
  }finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});

test('The exact historical helper leaves unrelated fields, future rows, sources and evidence visible',()=>{
  assert.deepEqual(createLoader(birdLegBaselineFixture())('lib/learning-curriculum.js').learningModules,old('lib/learning-curriculum.js').learningModules);
  const custom=structuredClone(raw);custom.futureField='keep';const module=custom.modules.find(item=>item.id===courseId);module.lessons.push({id:'vogelbein-extra'});module.questions.push({id:'other-question'});module.sources.push({url:sourceURLs[0],lessonIds:['other']});custom.evidence.push({moduleId:'other',lessonId,claims:[]});const before=structuredClone(custom),result=stripBirdLegDataset(custom);assert.deepEqual(custom,before);assert.equal(result.futureField,'keep');const kept=result.modules.find(item=>item.id===courseId);assert.ok(kept.lessons.some(item=>item.id==='vogelbein-extra'));assert.ok(kept.questions.some(item=>item.id==='other-question'));assert.ok(kept.sources.some(item=>item.lessonIds?.[0]==='other'));assert.ok(result.evidence.some(item=>item.moduleId==='other'&&item.lessonId===lessonId));
});
