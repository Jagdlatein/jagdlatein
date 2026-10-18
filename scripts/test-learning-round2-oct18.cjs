// Integration tests do not replace the independent source reviews.
const test = require('node:test');
const assert = require('node:assert/strict');
const {createLoader, local} = require('./helpers/project-module.cjs');
const load = createLoader();
const {round2ExpansionModules: added} = load('lib/learning-round2-oct18.js');
const {learningModules, learningPaths} = load('lib/learning-curriculum.js');
const {getLearningCategoryByTitle} = load('lib/learning-categories.js');
const cards = load('lib/learning-flashcards.js').getFlashcards();

test('Six substantive courses add 24 lessons and 96 distinct explained questions in existing categories', () => {
  assert.equal(added.length, 6);
  assert.equal(added.flatMap(course=>course.lessons).length,24);
  assert.equal(added.flatMap(course=>course.questions).length,96);
  const old = new Set(learningModules.filter(course=>!added.some(item=>item.id===course.id)).flatMap(course=>course.questions.map(question=>question.q.trim().toLocaleLowerCase('de'))));
  const stems = new Set();
  for (const course of added) {
    assert.ok(getLearningCategoryByTitle(course.category));
    assert.equal(course.lessons.length,4);assert.equal(course.questions.length,16);
    assert.equal(course.reviewedOn,'2026-10-18');assert.equal(course.showCategoryDiagram,false);
    const positions=[0,0,0,0];
    for (const lesson of course.lessons) {
      assert.ok(lesson.paragraphs.length>=2 && lesson.paragraphs.join(' ').length>600,`${course.id}/${lesson.id}`);
      assert.ok(lesson.takeaway && lesson.exercise && lesson.evidence.length);
      assert.equal(course.questions.filter(question=>question.lessonId===lesson.id).length,4);
      for (const evidence of lesson.evidence) {
        assert.ok(evidence.claim && new Set(evidence.sources.map(source=>source.url)).size>=2);
        assert.ok(evidence.sources.every(source=>course.sources.some(item=>item.url===source.url)));
      }
    }
    for (const question of course.questions) {
      const stem=question.q.trim().toLocaleLowerCase('de');
      assert.ok(!old.has(stem) && !stems.has(stem),question.q);stems.add(stem);
      assert.equal(question.options.length,4);assert.equal(new Set(question.options).size,4);
      assert.ok(question.explain.length>40);positions[question.answer]++;
    }
    assert.deepEqual(positions,[4,4,4,4]);
  }
});

test('New knowledge renders in real course pages and is found through categories, search and shared quiz', () => {
  const React=local('react'), {renderToStaticMarkup}=local('react-dom/server');
  const pageLoad=createLoader({'next/router':{useRouter:()=>({query:{},asPath:'/kurse/test'})},'next/head':()=>null});
  const Page=pageLoad('pages/kurse/[slug].js');
  const {searchLearning}=load('lib/learning-search.js');
  const {getLearningOverviewData}=load('lib/learning-overview-server.js');
  const {QUESTIONS}=load('data/questions-full.js');
  const {quizLearningPool}=load('lib/quiz-learning-scope.js');
  for (const course of added) {
    const prepared=learningModules.find(item=>item.id===course.id), category=getLearningCategoryByTitle(course.category);
    const props=Page.getStaticProps({params:{slug:course.id}}).props;
    const html=renderToStaticMarkup(React.createElement(Page.default,props));
    assert.ok(html.includes(course.lessons[0].title));
    assert.ok(html.includes('Welche Aussagen wurden gegengeprüft?'));
    assert.ok(html.includes(course.sources[0].url.replaceAll('&','&amp;')));
    assert.ok(searchLearning({query:course.title,type:'course'}).results.some(item=>item.id===`course:${course.id}`));
    assert.ok(getLearningOverviewData(category.slug).modules.some(item=>item.id===course.id && item.coverIndex===null));
    assert.ok(learningPaths.find(path=>path.id===`vertiefung-${category.slug}`).moduleIds.includes(course.id));
    const pool=new Set(quizLearningPool(QUESTIONS,{topic:course.category}).map(question=>question.id));
    assert.ok(prepared.questions.every(question=>pool.has(question.id)));
  }
});

test('Standalone cards retain answer, original context, actual sources and exact lesson targets', () => {
  for (const course of added) {
    const deck=cards.filter(card=>card.moduleId===course.id);
    assert.ok(deck.length>=12,`${course.id}: ${deck.length} standalone cards`);
    assert.ok(course.lessons.every(lesson=>deck.some(card=>card.lessonId===lesson.id)));
    for (const card of deck) {
      assert.ok(card.answer && card.explanation && card.sources.length>=2);
      assert.equal(card.reviewedOn,'2026-10-18');
      assert.ok(card.learningHref.startsWith(`/kurse/${course.id}#lesson-`));
      assert.ok(!card.options && !card.correct);
    }
  }
});

test('The new material shares existing protected short rounds and expiring offline lessons', () => {
  const {getDailyReviewPool}=load('lib/daily-review-pool.js');
  const pool=getDailyReviewPool();
  for (const course of added) {
    const prepared=learningModules.find(item=>item.id===course.id);
    for (const question of prepared.questions) {
      const entry=pool.find(item=>item.id===question.id);
      assert.ok(entry && entry.reading && entry.sourceScope==='lesson');
      assert.equal(entry.reading.title,course.lessons.find(lesson=>lesson.id===question.lessonId).title);
    }
  }
  const previous=process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET='unit-test-only-secret-not-an-authentication-credential';
  try {
    const {createOfflinePack}=load('lib/offline-learning-server.js');
    const now=Date.parse('2026-10-18T11:00:00Z');
    const pack=createOfflinePack({courseIds:added.map(course=>course.id),sounds:false},{email:'learner@example.invalid',trialUntil:'2026-10-20T11:00:00Z'},now);
    assert.equal(pack.courses.length,6);assert.equal(pack.photos.length,0);
    assert.equal(pack.expiresAt,Date.parse('2026-10-20T11:00:00Z'));
    const compass=pack.courses.find(course=>course.id==='wissen-vertiefung-kompass-nordrichtungen-2026');
    assert.equal(compass.lessons.find(lesson=>lesson.id==='richtungswinkel').diagram.type,'compass-learning');
  } finally {if(previous===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=previous;}
});
