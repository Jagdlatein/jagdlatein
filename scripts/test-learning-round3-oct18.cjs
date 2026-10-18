// Integration checks complement, rather than replace, the independent source review.
const test=require('node:test'),assert=require('node:assert/strict');
const {createLoader,local}=require('./helpers/project-module.cjs');
const load=createLoader(),{round3ExpansionModules:added}=load('lib/learning-round3-oct18.js');
const {learningModules,learningPaths}=load('lib/learning-curriculum.js');
const cards=load('lib/learning-flashcards.js').getFlashcards();

test('Round 3 adds six substantive courses, 24 lessons and 96 original explained questions',()=>{
  assert.equal(added.length,6);assert.equal(added.flatMap(c=>c.lessons).length,24);assert.equal(added.flatMap(c=>c.questions).length,96);
  const prior=new Set(learningModules.filter(c=>!added.some(a=>a.id===c.id)).flatMap(c=>c.questions.map(q=>q.q.trim().toLocaleLowerCase('de')))),seen=new Set();
  for(const course of added){
    assert.equal(course.reviewedOn,'2026-10-18');assert.equal(course.lessons.length,4);assert.equal(course.questions.length,16);
    assert.equal(course.showCategoryDiagram,false);const positions=[0,0,0,0];
    for(const lesson of course.lessons){
      assert.ok(lesson.paragraphs.length>=2&&lesson.paragraphs.join(' ').length>600,`${course.id}/${lesson.id}`);
      assert.ok(lesson.takeaway&&lesson.exercise&&lesson.evidence.length);
      assert.equal(course.questions.filter(q=>q.lessonId===lesson.id).length,4);
      for(const evidence of lesson.evidence){assert.ok(evidence.claim&&new Set(evidence.sources.map(s=>s.url)).size>=2);assert.ok(evidence.sources.every(s=>course.sources.some(original=>original.url===s.url)));}
    }
    for(const question of course.questions){const stem=question.q.trim().toLocaleLowerCase('de');assert.ok(!prior.has(stem)&&!seen.has(stem),question.q);seen.add(stem);assert.equal(new Set(question.options).size,4);assert.ok(question.explain.length>40);positions[question.answer]++;}
    assert.deepEqual(positions,[4,4,4,4]);
  }
});

test('Each addition renders its real page and remains findable in existing categories and shared quiz',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
  const pageLoad=createLoader({'next/router':{useRouter:()=>({query:{},asPath:'/kurse/test'})},'next/head':()=>null});
  const Page=pageLoad('pages/kurse/[slug].js'),{searchLearning}=load('lib/learning-search.js'),{getLearningCategoryByTitle}=load('lib/learning-categories.js'),{getLearningOverviewData}=load('lib/learning-overview-server.js');
  const {QUESTIONS}=load('data/questions-full.js'),{quizLearningPool}=load('lib/quiz-learning-scope.js');
  for(const course of added){
    const category=getLearningCategoryByTitle(course.category);assert.ok(category);
    const html=renderToStaticMarkup(React.createElement(Page.default,Page.getStaticProps({params:{slug:course.id}}).props));
    assert.ok(html.includes(course.lessons[0].title)&&html.includes('Welche Aussagen wurden gegengeprüft?'));
    assert.ok(html.includes(course.sources[0].url.replaceAll('&','&amp;')));
    assert.ok(searchLearning({query:course.title,type:'course'}).results.some(r=>r.id===`course:${course.id}`));
    assert.ok(getLearningOverviewData(category.slug).modules.some(c=>c.id===course.id&&c.coverIndex===null));
    assert.ok(learningPaths.find(p=>p.id===`vertiefung-${category.slug}`).moduleIds.includes(course.id));
    const quiz=new Set(quizLearningPool(QUESTIONS,{topic:course.category}).map(q=>q.id));
    assert.ok(learningModules.find(c=>c.id===course.id).questions.every(q=>quiz.has(q.id)));
  }
});

test('All 96 new standalone cards preserve original answers, evidence and exact lesson targets',()=>{
  assert.equal(cards.filter(card=>added.some(course=>course.id===card.moduleId)).length,96);
  for(const course of added){const deck=cards.filter(card=>card.moduleId===course.id);assert.equal(deck.length,16);
    for(const lesson of course.lessons)assert.equal(deck.filter(card=>card.lessonId===lesson.id).length,4);
    for(const card of deck){assert.ok(card.answer&&card.explanation&&card.sources.length>=2);assert.equal(card.reviewedOn,'2026-10-18');assert.ok(card.learningHref.startsWith(`/kurse/${course.id}#lesson-`));assert.ok(!card.options&&!card.correct);}
  }
});

test('New lessons share the existing protected short-round retrieval and expiring offline format',()=>{
  const review=load('lib/daily-review-pool.js'),pool=review.getDailyReviewPool(),catalog=review.getDailyReviewCatalog();
  for(const course of added)for(const question of learningModules.find(c=>c.id===course.id).questions){
    const entry=pool.find(item=>item.id===question.id);assert.ok(entry&&entry.reading&&entry.sourceScope==='lesson');
    assert.ok(catalog.some(item=>item.id===question.id));assert.deepEqual(review.getDailyReviewQuestions([question.id]),[entry]);
  }
  const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='unit-test-only-secret-not-an-authentication-credential';
  try{const {createOfflinePack}=load('lib/offline-learning-server.js'),now=Date.parse('2026-10-18T14:00:00Z');
    const pack=createOfflinePack({courseIds:added.map(c=>c.id),sounds:false},{email:'learner@example.invalid',trialUntil:'2026-10-20T14:00:00Z'},now);
    assert.equal(pack.courses.length,6);assert.equal(pack.photos.length,0);assert.equal(pack.sounds.length,0);assert.equal(pack.expiresAt,Date.parse('2026-10-20T14:00:00Z'));
    assert.ok(pack.courses.every(c=>c.lessons.every(l=>l.evidence.length)));
  }finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});
