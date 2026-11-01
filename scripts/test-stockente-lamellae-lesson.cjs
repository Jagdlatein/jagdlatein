// Exact preservation and real data/reader integration; scientific source reading
// is recorded separately. These checks do not certify the whole curriculum.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { courseId, lessonId, questionId: rawQuestionId, sourceURLs, stripStockenteLamellaeAddition: strip,
  stockenteLamellaeBaselineFixture } = require('./helpers/stockente-lamellae-addition-nov01.cjs');
const revision = '873c459ffb3ac538301bb3f467cdf8738f3e3a97', questionId = `${courseId}-${rawQuestionId}`;
function historicalLoader() {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function historic(relative) {
    const filename = path.resolve(root, relative), repositoryPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(repositoryPath && !repositoryPath.startsWith('../') && !path.isAbsolute(repositoryPath));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${repositoryPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(filename, module);
    if (filename.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css')
      ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
      : id.startsWith('.') ? historic(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return historic;
}
const load = createLoader(), old = historicalLoader(), curriculum = load('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);
const flashcards = load('lib/learning-flashcards.js'), cards = flashcards.getFlashcards();
const isNewCard = card => card.moduleId === courseId && card.lessonId === lessonId;
const cardURLs = [sourceURLs[0], sourceURLs[2], sourceURLs[1]];

test('Exactly one fourth tail lesson, one question and three narrowly scoped sources extend the full wildlife baseline', () => {
  const raw = load('lib/learning-wildlife.js').wildlifeModules, before = old('lib/learning-wildlife.js').wildlifeModules;
  const current = raw.find(item => item.id === courseId), previous = before.find(item => item.id === courseId);
  assert.deepEqual([previous.lessons.length, previous.questions.length, previous.sources.length], [3,8,4]);
  assert.deepEqual([current.lessons.length, current.questions.length, current.sources.length], [4,9,7]);
  assert.deepEqual(current.lessons.slice(0,3), previous.lessons); assert.deepEqual(current.questions.slice(0,8), previous.questions);
  assert.deepEqual(current.sources.slice(0,4), previous.sources); assert.deepEqual(raw.map(strip), before);
  assert.equal(course.reviewedOn, '2026-10-04'); assert.equal(current.reviewedOn, previous.reviewedOn);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All198 complete old courses and1758 ordered cards including116 starters remain identical to Git873c459', () => {
  const previous = old('lib/learning-curriculum.js'), oldCards = old('lib/learning-flashcards.js').getFlashcards();
  assert.deepEqual(previous.learningCounts, { modules:198, lessons:876, questions:2750 });
  assert.deepEqual(curriculum.learningCounts, { modules:198, lessons:877, questions:2751 });
  assert.deepEqual(curriculum.learningModules.map(strip), previous.learningModules);
  assert.deepEqual(curriculum.learningQuestions.filter(question => question.id !== questionId), previous.learningQuestions);
  assert.equal(oldCards.length,1758); assert.equal(cards.length,1759);
  assert.deepEqual(cards.filter(card => !isNewCard(card)),oldCards); assert.deepEqual(cards.slice(0,116),oldCards.slice(0,116));
  assert.deepEqual(cards.filter(isNewCard).map(card => card.id),[`flash-${questionId}`]);
});

test('The127-word Stockente explanation retains exact independent-source pairings and visible observation limits', () => {
  assert.equal(course.lessons.at(-1),lesson); assert.equal(lesson.title,'Schnabellamellen'); assert.equal(lesson.reviewedOn,'2026-11-01');
  assert.equal(lesson.flashcardExpansion,true); const text=lesson.paragraphs.join(' '); assert.equal(text.split(/\s+/).length,127);
  assert.match(text,/inneren Schnabelrand einer Stockente/); assert.match(text,/kammartige Leisten/); assert.match(text,/keine Zahnreihe zum Zerkauen/);
  assert.match(text,/Nahrungsteilchen zurückhalten.*Wasser wieder aus dem Schnabel abgegeben/);
  assert.match(text,/weder, dass sie ausschließlich.*noch dass alle Vogelarten/); assert.match(text,/untergetauchter Kopf allein zeigt die Lamellen nicht/);
  assert.match(text,/bleibt offen, welche einzelnen Teilchen tatsächlich aufgenommen wurden/);
  assert.doesNotMatch(text,/\d|Prozent|Effizienz|Geschwindigkeit|Millimeter|Sekunde|Oberkiefer|Unterkiefer|Originalstudie|Experiment/);
  assert.equal(lesson.image,undefined); assert.equal(lesson.diagram,undefined);
  assert.deepEqual(course.sources.slice(-3).map(item=>item.url),sourceURLs);
  assert.ok(course.sources.slice(-3).every(source=>JSON.stringify(source.lessonIds)==='["vogel-lamellen"]'));
  assert.deepEqual(lesson.evidence.map(item=>item.sources.map(source=>source.url)),[[sourceURLs[0],sourceURLs[2]],[sourceURLs[1],sourceURLs[2]]]);
  for(const earlier of course.lessons.slice(0,-1)) assert.ok(!(earlier.evidence||[]).some(record=>record.sources.some(source=>sourceURLs.includes(source.url))));
});

test('The own explained question becomes exactly one standalone dated card and remains in every shared DACH quiz scope', () => {
  const selected=course.questions.filter(item=>item.lessonId===lessonId),card=cards.find(isNewCard);
  assert.deepEqual(selected.map(item=>item.id),[questionId]);const question=selected[0];
  assert.equal(new Set(question.answers.map(item=>item.text)).size,4);assert.equal(question.correct.length,1);assert.deepEqual(question.countries,['DE','AT','CH']);
  assert.equal(question.topic,'Wildkunde');assert.equal(card.question,question.q);assert.equal(card.answer,question.answers.find(answer=>question.correct.includes(answer.id)).text);
  assert.equal(card.explanation,question.explain);assert.equal(card.reviewedOn,'2026-11-01');assert.equal(card.sourceScope,'lesson');assert.deepEqual(card.sources.map(source=>source.url),cardURLs);
  assert.equal(card.courseHref,`/kurse/${courseId}#lesson-${lessonId}`);
  const bank=load('data/questions-full.js').QUESTIONS;assert.deepEqual(bank.filter(item=>item.id!==questionId),old('data/questions-full.js').QUESTIONS);
  const {quizLearningPool}=load('lib/quiz-learning-scope.js'),{examCountries}=load('lib/exam-profile.js');
  assert.equal(examCountries.reduce((sum,country)=>sum+country.regions.length,0),51);
  const common=quizLearningPool(bank,{topic:'Wildkunde'});
  for(const country of examCountries)for(const region of country.regions){const pool=quizLearningPool(bank,{country:country.code,region:region.code,topic:'Wildkunde'});assert.deepEqual(pool,common);assert.ok(pool.some(item=>item.id===questionId));}
});

test('Search, course props, topic, quiz, print and exports resolve the existing course and exact appendix without a new photo', () => {
  const result=load('lib/learning-search.js').searchLearning({query:'Schnabellamellen',type:'course'}).results.find(item=>item.id===`course:${courseId}`);
  assert.ok(result);assert.equal(result.href,`/kurse/${courseId}#lesson-${lessonId}`);
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId),old('lib/learning-topic-tree.js').getLearningTopicLocation(courseId));
  const page=load('pages/kurse/[slug].js');assert.deepEqual(page.getStaticPaths(),old('pages/kurse/[slug].js').getStaticPaths());
  const props=page.getStaticProps({params:{slug:courseId}}).props;
  assert.deepEqual(props.module,course);assert.equal(props.flashcards.lessons[lessonId],1);assert.equal(props.lessonPhotos[lessonId],undefined);
  const card=cards.find(isNewCard),exported=flashcards.getFlashcardExport({courseId,lessonId});assert.deepEqual(exported.cards,[card]);assert.equal(exported.selection.returnHref,card.courseHref);
  assert.deepEqual(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex([card]).sourceList.map(source=>source.url),cardURLs);
});

test('All114 wildlife guide objects retain their full fields and existing course assignments apart from the real one-card increase', () => {
  const guides=load('lib/wildlife-learning-guide.js'),previous=old('lib/wildlife-learning-guide.js');
  assert.deepEqual(guides.wildlifeGuideTargets,previous.wildlifeGuideTargets);
  const slugs=Object.keys(load('lib/european-wildlife-discovery.js').europeanWildlifeBySlug);assert.equal(slugs.length,114);
  for(const slug of slugs)assert.deepEqual(guides.getWildlifeLearningGuide(slug),previous.getWildlifeLearningGuide(slug).map(target=>target.moduleId===courseId?{...target,flashcardCount:target.flashcardCount+1}:target),slug);
});

test('The actual reader keeps the entire explanation first and closes its final source panel with the new lesson date', () => {
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');let cursor=0;
  const hooks={...React,useState(initial){return[cursor++===1?3:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
  const Course=createLoader({react:hooks,'next/router':{useRouter:()=>({asPath:`/kurse/${courseId}#lesson-${lessonId}`,isReady:true})},
    './LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},
    './PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){}},
    '../hooks/useCourseProgress':()=>({}),'./CourseProgressNotice':{__esModule:true,default:()=>null}})('components/LearningCourse.js').default;
  const html=renderToStaticMarkup(React.createElement(Course,{module:course,flashcards:flashcards.getFlashcardLessonSummary(courseId)}));
  const boundary=html.indexOf('<details id="quellen"');assert.ok(boundary>0);
  for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,boundary).includes(paragraph));
  for(const url of sourceURLs){assert.ok(!html.slice(0,boundary).includes(url));assert.ok(html.slice(boundary).includes(url));}
  assert.match(html,/Lektion 4 von 4/);assert.match(html.slice(boundary),/1\. November 2026/);assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('The saved offline pack carries the complete lesson, evidence and question without redating the course or changing expiry', () => {
  const previousSecret=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='isolated-stockente-lamellae-offline';
  try{const now=Date.parse('2026-11-01T12:00:00Z'),pack=load('lib/offline-learning-server.js').createOfflinePack({courseIds:[courseId],sounds:false},{email:'synthetic@example.invalid',paidUntil:'2026-11-03T12:00:00Z'},now);
    const{validateOfflinePack}=load('lib/offline-learning.js');assert.equal(validateOfflinePack(pack,now),true);assert.equal(validateOfflinePack(pack,pack.expiresAt),false);
    assert.deepEqual(pack.courses[0].lessons,course.lessons);assert.deepEqual(pack.courses[0].questions,course.questions);assert.deepEqual(pack.courses[0].sources,course.sources);
    assert.equal(pack.courses[0].reviewedOn,'2026-10-04');assert.equal(pack.courses[0].lessons.at(-1).reviewedOn,'2026-11-01');assert.deepEqual(pack.courses[0].lessons.at(-1).evidence,lesson.evidence);
  }finally{if(previousSecret===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previousSecret;}
});

test('The actual stored-course reader renders complete Lamellen text and its precise lesson date before closed final sources', () => {
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');let cursor=0;
  const hooks={...React,useState(initial){return[cursor++===1?3:typeof initial==='function'?initial():initial,()=>{}];},useRef(initial){return{current:initial};},useEffect(){}};
  const filename=path.join(root,'components/OfflineLearning.js'),source=fs.readFileSync(filename,'utf8')+'\nexport { OfflineCourse };';
  const {code}=local('next/dist/build/swc').transformSync(source,{filename,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const module={exports:{}},loader=createLoader({react:hooks});
  new Function('require','module','exports',code)(id=>id==='react'?hooks:id.endsWith('.module.css')?{__esModule:true,default:{}}:id.startsWith('.')?loader(path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`)):local(id),module,module.exports);
  const html=renderToStaticMarkup(React.createElement(module.exports.OfflineCourse,{course,expiresAt:Date.now()+60000,onExpired(){}}));
  const summary=html.indexOf('<summary>Quellen und Prüfstand</summary>'),boundary=html.lastIndexOf('<details',summary);assert.ok(summary>0&&boundary>0);
  for(const paragraph of lesson.paragraphs)assert.ok(html.slice(0,boundary).includes(paragraph));
  assert.match(html.slice(boundary),/1\. November 2026/);assert.doesNotMatch(html.slice(boundary),/4\. Oktober 2026/);
  for(const url of sourceURLs){assert.ok(!html.slice(0,boundary).includes(url));assert.ok(html.slice(boundary).includes(url));}
  assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('The historical helper removes only exact named fields and leaves unrelated lessons and courses visible', () => {
  assert.equal(strip({id:'other',lessons:[{id:lessonId}]}).id,'other');
  assert.deepEqual(createLoader(stockenteLamellaeBaselineFixture())('lib/learning-curriculum.js').learningModules,old('lib/learning-curriculum.js').learningModules);
  const raw=load('lib/learning-wildlife.js').wildlifeModules.find(item=>item.id===courseId), extra={...raw,lessons:[...raw.lessons,{id:'unrelated-new'}],questions:[...raw.questions,{id:'unrelated-question'}],sources:[...raw.sources,{url:sourceURLs[0],lessonIds:['other']} ]};
  const output=strip(extra);assert.ok(output.lessons.some(item=>item.id==='unrelated-new'));assert.ok(output.questions.some(item=>item.id==='unrelated-question'));assert.ok(output.sources.some(item=>item.lessonIds?.[0]==='other'));
});
