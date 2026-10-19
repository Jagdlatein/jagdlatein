// Content/source review is documented separately; these checks cover delivery and integration.
const test=require('node:test'),assert=require('node:assert/strict');
const {createLoader,local}=require('./helpers/project-module.cjs');
const load=createLoader(),{round6ExpansionModules:added}=load('lib/learning-round6-oct18.js');
const {learningModules,learningPaths}=load('lib/learning-curriculum.js');
const cards=load('lib/learning-flashcards.js').getFlashcards();
const reviewDate=course=>['wissen-vertiefung-laserklassen-round6-2026','wissen-vertiefung-lawinenprobleme-round6-2026','wissen-vertiefung-jagdbezirke-de-round6-2026','wissen-vertiefung-tiernamen-taxonomie-round6-2026'].includes(course.id)?'2026-10-19':'2026-10-18';

test('The reading expansion adds twelve courses and 48 substantial lessons, with only one accompanying question per lesson',()=>{
  assert.equal(added.length,12);assert.equal(added.flatMap(c=>c.lessons).length,48);assert.equal(added.flatMap(c=>c.questions).length,48);
  const categories=load('lib/learning-categories.js').learningCategoryDetails;
  assert.deepEqual(added.map(c=>c.category).sort(),categories.map(c=>c.title).sort(),'Every existing category receives one new substantial course');
  const prior=new Set(learningModules.filter(c=>!added.some(a=>a.id===c.id)).flatMap(c=>c.questions.map(q=>q.q.trim().toLocaleLowerCase('de')))),seen=new Set();
  for(const course of added){
    assert.equal(course.reviewedOn,reviewDate(course));assert.equal(course.lessons.length,4);assert.equal(course.questions.length,4);
    assert.equal(course.showCategoryDiagram,false);const positions=[0,0,0,0];
    for(const lesson of course.lessons){
      assert.ok(lesson.paragraphs.length>=3&&lesson.paragraphs.join(' ').length>900,`${course.id}/${lesson.id}`);
      assert.ok(lesson.takeaway&&lesson.exercise&&lesson.evidence.length);
      assert.equal(course.questions.filter(q=>q.lessonId===lesson.id).length,1);
      for(const evidence of lesson.evidence){assert.ok(evidence.claim&&new Set(evidence.sources.map(s=>s.url)).size>=2);assert.ok(evidence.sources.every(s=>course.sources.some(original=>original.url===s.url)));}
    }
    for(const question of course.questions){const stem=question.q.trim().toLocaleLowerCase('de');assert.ok(!prior.has(stem)&&!seen.has(stem),question.q);seen.add(stem);assert.equal(new Set(question.options).size,4);assert.ok(question.explain.length>40);positions[question.answer]++;}
    assert.deepEqual(positions,[1,1,1,1]);
  }
});

test('New reading is visible in its course and directly reachable from the category and search',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
  const pageLoad=createLoader({'next/router':{useRouter:()=>({query:{},asPath:'/kurse/test'})},'next/head':()=>null});
  const Page=pageLoad('pages/kurse/[slug].js'),{searchLearning}=load('lib/learning-search.js'),{getLearningCategoryByTitle}=load('lib/learning-categories.js'),{getLearningOverviewData}=load('lib/learning-overview-server.js');
  const {lessonHash}=load('lib/learning-lesson-navigation.js');
  for(const course of added){
    const category=getLearningCategoryByTitle(course.category);assert.ok(category);
    const html=renderToStaticMarkup(React.createElement(Page.default,Page.getStaticProps({params:{slug:course.id}}).props));
    assert.ok(html.includes(course.lessons[0].paragraphs[0].replaceAll('&','&amp;')));
    assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?')&&html.includes(course.sources[0].url.replaceAll('&','&amp;')));
    assert.ok(searchLearning({query:course.title,type:'course'}).results.some(r=>r.id===`course:${course.id}`));
    if(course.category==='Jagdrecht')for(const country of ['AT','CH'])assert.ok(!searchLearning({query:course.title,category:'jagdrecht',country,type:'course'}).results.some(r=>r.id===`course:${course.id}`));
    const summary=getLearningOverviewData(category.slug).modules.find(c=>c.id===course.id);
    assert.equal(summary.coverIndex,null);assert.ok(!summary.lessons&&!summary.questions);
    assert.deepEqual(summary.topics,course.lessons.map(l=>({title:l.title,href:`/kurse/${course.id}${lessonHash(l.id)}`})));
    assert.ok(learningPaths.find(p=>p.id===`vertiefung-${category.slug}`).moduleIds.includes(course.id));
  }
});

test('The 44 optional DACH cards preserve the standalone knowledge and evidence without converting regional law to shared cards',()=>{
  assert.equal(cards.filter(card=>added.some(course=>course.id===card.moduleId)).length,44);
  for(const course of added){const deck=cards.filter(card=>card.moduleId===course.id);
    if(course.category==='Jagdrecht'){assert.deepEqual(course.countries,['DE']);assert.equal(deck.length,0);continue;}
    assert.equal(deck.length,4);
    for(const lesson of course.lessons)assert.equal(deck.filter(card=>card.lessonId===lesson.id).length,1);
    for(const card of deck){assert.ok(card.answer&&card.explanation&&card.sources.length>=2);assert.equal(card.reviewedOn,reviewDate(course));assert.ok(card.learningHref.startsWith(`/kurse/${course.id}#lesson-`));assert.ok(!card.options&&!card.correct);}
  }
});

test('New lessons retain their source evidence in offline packs and shared review without widening limits',()=>{
  const review=load('lib/daily-review-pool.js'),pool=review.getDailyReviewPool(),catalog=review.getDailyReviewCatalog();
  for(const course of added)for(const question of learningModules.find(c=>c.id===course.id).questions){
    if(course.category==='Jagdrecht'){
      assert.deepEqual(question.countries,['DE']);
      assert.ok(!pool.some(item=>item.id===question.id)&&!catalog.some(item=>item.id===question.id));
      assert.throws(()=>review.getDailyReviewQuestions([question.id]),/Ungültige Wiederholungsfragen/);
      continue;
    }
    const entry=pool.find(item=>item.id===question.id);assert.ok(entry&&entry.reading&&entry.sourceScope==='lesson');
    assert.ok(catalog.some(item=>item.id===question.id));assert.deepEqual(review.getDailyReviewQuestions([question.id]),[entry]);
  }
  const previous=process.env.JL_SESSION_SECRET;process.env.JL_SESSION_SECRET='unit-test-only-secret-not-an-authentication-credential';
  try{const {createOfflinePack}=load('lib/offline-learning-server.js'),now=Date.parse('2026-10-18T14:00:00Z');
    for(const courses of [added.slice(0,6),added.slice(6)]){
      const pack=createOfflinePack({courseIds:courses.map(c=>c.id),sounds:false},{email:'learner@example.invalid',trialUntil:'2026-10-20T14:00:00Z'},now);
      assert.equal(pack.courses.length,courses.length);assert.equal(pack.photos.length,0);assert.equal(pack.sounds.length,0);assert.equal(pack.expiresAt,Date.parse('2026-10-20T14:00:00Z'));
      assert.ok(pack.courses.every(c=>c.lessons.every(l=>l.evidence.length)));
    }
  }finally{if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});


test('Every delivered course has exactly one category and subcategory, without outstanding reservations', () => {
  const tree=load('lib/learning-topic-tree.js');
  assert.doesNotThrow(()=>tree.validateLearningTopicTree(learningModules,{allowReserved:false}));
  for(const course of added){
    const location=tree.getLearningTopicLocation(course.id);
    assert.ok(location?.categorySlug && location.groupId && location.groupTitle);
    const groups=tree.getLearningTopicGroups(location.categorySlug,learningModules.filter(c=>load('lib/learning-categories.js').getLearningCategoryByTitle(c.category)?.slug===location.categorySlug));
    assert.equal(groups.filter(g=>g.moduleIds.includes(course.id)).length,1);
  }
});
