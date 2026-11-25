// Preserve this historical view after the exact separately tested Guttation append.
const { guttationBaselineFixture } = require('./helpers/guttation-addition-nov25.cjs');
// This historical snapshot projects only the separately tested Nov25 fish-gill appendix.
const { fishGillBaselineFixture } = require('./helpers/fish-gill-addition-nov25.cjs');
// Keep the historical contract exact; the named Nov25 bird appendix has
// positive whole-corpus/card preservation in its own live-data suite.
const { woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
// Independent whole-category integration checks against the actual maintained
// readers and question/card pools; no account or browser storage is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { dogExtinctionBaselineFixture } = require('./helpers/dog-extinction-addition-nov17.cjs');
const { capercaillieToeBaselineFixture } = require('./helpers/capercaillie-toe-addition-nov17.cjs');
const { insectRespirationBaselineFixture } = require('./helpers/insect-respiration-addition-nov25.cjs');
const { redDeerFlehmenBaselineFixture } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
// This historical release still checks its exact four appendices. New named
// appendices have their own positive whole-object baseline against a0b078b.
const createLoader = overrides => createProjectLoader(dogExtinctionBaselineFixture(capercaillieToeBaselineFixture(insectRespirationBaselineFixture(woodpeckerFootBaselineFixture(redDeerFlehmenBaselineFixture(fishGillBaselineFixture(guttationBaselineFixture(overrides))))))));
const load = createLoader();
const { learningCategoryDetails: categories } = load('lib/learning-categories.js');
const { learningModules: courses } = load('lib/learning-curriculum.js');
const { getLearningOverviewData: overview } = load('lib/learning-overview-server.js');
const { getFlashcards } = load('lib/learning-flashcards.js');
const { getDailyReviewCatalog } = load('lib/daily-review-pool.js');
const { readFlashcardSelection } = load('lib/flashcard-selection.js');
const { quizQuestionTopic, quizQuestionCountries, quizLearningPool } = load('lib/quiz-learning-scope.js');
const { QUESTIONS } = load('data/questions-full.js');
const { lessonHash } = load('lib/learning-lesson-navigation.js');
const baseline = 'b9ed55f832c73b5cb7805759ed0b0809267e7e20';
const dach = values => Array.isArray(values) && values.length === 3 && ['DE', 'AT', 'CH'].every(code => values.includes(code));
const cards = getFlashcards();

function oldLoader() {
  const cache = new Map();
  return function old(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? old(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  };
}

test('All twelve actual category pages preserve their exact lessons and expose only sourced course objectives and real, scoped practice metadata', () => {
  assert.equal(categories.length, 12); assert.equal(courses.length, 198);
  let groups = 0, seen = new Set(), quizCount = 0, cardCount = 0;
  for (const category of categories) {
    const data = overview(category.slug);
    groups += data.topicGroups.length;
    for (const module of data.modules) {
      assert.ok(!seen.has(module.id)); seen.add(module.id);
      const course = courses.find(item => item.id === module.id), practice = module.practice;
      assert.equal(course.category, category.title);
      assert.deepEqual(practice.objectives, course.objectives);
      assert.notEqual(practice.objectives, course.objectives);
      assert.deepEqual(module.topics, course.lessons.map(lesson => ({ title: lesson.title, href: `/kurse/${course.id}${lessonHash(lesson.id)}` })));
      assert.ok(Object.keys(practice).every(key => ['objectives', 'quizHref', 'questionCount', 'cardHref', 'cardCount'].includes(key)));
      if (practice.quizHref) {
        quizCount++;
        assert.equal(practice.quizHref, `/kurse/${course.id}#wissenscheck`);
        assert.notEqual(category.slug, 'jagdrecht'); assert.ok(dach(course.countries));
        assert.equal(practice.questionCount, course.questions.length);
        for (const question of course.questions) {
          assert.ok(dach(quizQuestionCountries(question)), question.id); assert.notEqual(quizQuestionTopic(question), 'Recht', question.id);
          assert.equal(question.answers.length, 4); assert.equal(question.correct.length, 1);
          assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
        }
      } else assert.equal(practice.questionCount, undefined);
      if (practice.cardHref) {
        cardCount++;
        const url = new URL(practice.cardHref, 'https://test.invalid'), selection = readFlashcardSelection(Object.fromEntries(url.searchParams));
        assert.equal(url.pathname, '/lernen/lernkarten'); assert.equal(url.searchParams.size, 1); assert.equal(url.searchParams.get('kurs'), course.id);
        assert.ok(!selection.invalid); assert.equal(selection.courseId, course.id);
        const actual = cards.filter(card => card.moduleId === course.id);
        assert.equal(practice.cardCount, actual.length); assert.ok(actual.length > 0);
        for (const card of actual) {
          const question = course.questions.find(item => card.id === `flash-${item.id}`);
          assert.ok(question, card.id); assert.equal(card.lessonId, question.lessonId);
          assert.equal(card.question, question.q); assert.equal(card.explanation, question.explain);
          assert.ok(dach(quizQuestionCountries(question))); assert.notEqual(quizQuestionTopic(question), 'Recht');
        }
      } else assert.equal(practice.cardCount, undefined);
      if (category.slug === 'jagdrecht') assert.deepEqual(practice, { objectives: course.objectives });
      for (const key of ['questions', 'answers', 'correct', 'explain', 'paragraphs', 'evidence']) assert.equal(Object.hasOwn(module, key), false);
    }
  }
  assert.equal(groups, 63); assert.equal(seen.size, 198); assert.equal(quizCount, 180); assert.equal(cardCount, 140);
});

test('Every shared-category shortcut opens an actual matching card, review or quiz scope; regional law keeps its own destinations', () => {
  const review = getDailyReviewCatalog();
  for (const category of categories) {
    const resources = overview(category.slug).resources;
    const byPath = pathname => resources.filter(item => new URL(item.href, 'https://test.invalid').pathname === pathname);
    if (category.slug === 'jagdrecht') {
      assert.equal(byPath('/lernen/lernkarten').length, 0); assert.equal(byPath('/lernen/fuenf-minuten').length, 0); assert.equal(byPath('/quiz-app').length, 0);
      for (const country of ['ch', 'at', 'de']) assert.ok(resources.some(item => item.href === `/jagdrecht/${country}`));
      assert.ok(resources.some(item => item.href === '/lernen/pruefungsplan')); continue;
    }
    for (const pathname of ['/lernen/lernkarten', '/lernen/fuenf-minuten', '/quiz-app']) {
      const [resource] = byPath(pathname); assert.equal(byPath(pathname).length, 1, `${category.slug} ${pathname}`);
      const url = new URL(resource.href, 'https://test.invalid'); assert.equal(url.searchParams.size, 1);
      if (pathname === '/quiz-app') { assert.equal(url.searchParams.get('topic'), category.title); assert.ok(quizLearningPool(QUESTIONS, { topic: category.title }).length); }
      else { assert.equal(url.searchParams.get('kategorie'), category.slug); assert.ok((pathname === '/lernen/lernkarten' ? cards.some(card => card.categoryId === category.slug) : review.some(item => item.category === category.slug))); }
    }
  }
  const rootData = overview(); assert.ok(rootData.modules.every(module => !Object.hasOwn(module, 'practice')));
  assert.equal(overview('unknown-category'), null);
});

test('Existing categories, topic groups, all old courses and cards retain their exact substantive objects and order after only four appended lessons', () => {
  const old = oldLoader(), before = old('lib/learning-curriculum.js').learningModules;
  assert.deepEqual(categories, old('lib/learning-categories.js').learningCategoryDetails);
  assert.deepEqual(load('lib/learning-topic-tree.js').learningTopicTree, old('lib/learning-topic-tree.js').learningTopicTree);
  assert.deepEqual(courses.map(course => course.id), before.map(course => course.id));
  const additions = new Map([
    ['wissen-optik', 'fernglas-einstellungen'], ['wissen-wildbrethygiene', 'messort-temperatur'],
    ['wissen-ausbau-waldverjuengung-verbiss', 'haehersaat'], ['wissen-ausbau-habitat-insektenentwicklung-2026', 'buchdrucker-brutbild'],
  ]);
  let newLessons = 0, newQuestions = 0;
  for (const previous of before) {
    const current = courses.find(course => course.id === previous.id), allowed = additions.get(current.id);
    if (!allowed) { assert.deepEqual(current, previous, current.id); continue; }
    const restored = JSON.parse(JSON.stringify(current));
    const appended = restored.lessons.splice(previous.lessons.length); newLessons += appended.length;
    assert.equal(appended.length, 1); assert.equal(appended[0].id, allowed); assert.equal(appended[0].reviewedOn, '2026-11-17');
    const questions = restored.questions.splice(previous.questions.length); newQuestions += questions.length;
    assert.equal(questions.length, 2); assert.ok(questions.every(question => question.lessonId === allowed && question.answers.length === 4));
    const sources = restored.sources.splice(previous.sources.length); assert.ok(sources.length >= 2);
    assert.ok(sources.every(source => Array.isArray(source.lessonIds) && source.lessonIds.length === 1 && source.lessonIds[0] === allowed));
    if (!Object.hasOwn(previous, 'contentAddedOn')) delete restored.contentAddedOn;
    assert.deepEqual(restored, previous, `Only explicit append allowed: ${current.id}`);
  }
  assert.equal(newLessons, 4); assert.equal(newQuestions, 8);
  const oldCards = old('lib/learning-flashcards.js').getFlashcards(), oldIds = new Set(oldCards.map(card => card.id));
  assert.deepEqual(cards.filter(card => oldIds.has(card.id)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  const newCards = cards.filter(card => !oldIds.has(card.id)); assert.equal(newCards.length, 8);
  for (const card of newCards) { assert.equal(additions.get(card.moduleId), card.lessonId); assert.equal(card.reviewedOn, '2026-11-17'); assert.equal(card.sourceScope, 'lesson'); }
});

test('The category client and page wrappers import no question, card, source or legal server corpus', () => {
  for (const relative of ['components/LearningOverview.js', 'components/LearningTopicTree.js', 'pages/lernen/[category].js']) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    if (relative.startsWith('components/')) assert.doesNotMatch(source, /import[^;]+(?:learning-category-practice-server|learning-curriculum|learning-flashcards|daily-review-pool|questions-full|regional-law-data)/);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  }
});
