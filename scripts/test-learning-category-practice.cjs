const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const { learningCategoryDetails } = load('lib/learning-categories.js');
const { getLearningOverviewData } = load('lib/learning-overview-server.js');
const { projectCategoryCoursePractice: project, categoryPracticeLinks } = load('lib/learning-category-practice-server.js');
const { getFlashcards, getFlashcardLessonSummary, getFlashcardExport, flashcardCategories } = load('lib/learning-flashcards.js');
const { getDailyReviewCatalog } = load('lib/daily-review-pool.js');
const { quizLearningPool, quizQuestionTopic, quizQuestionCountries } = load('lib/quiz-learning-scope.js');
const { QUESTIONS } = load('data/questions-full.js');
const { readFlashcardRoute } = load('lib/flashcard-navigation.js');
const { readFlashcardSelection } = load('lib/flashcard-selection.js');
const { lessonHash } = load('lib/learning-lesson-navigation.js');
const { getLearningNavigationLabel } = load('lib/learning-navigation-labels.js');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&#x27;');
const shared = codes => Array.isArray(codes) && codes.length === 3 && ['DE', 'AT', 'CH'].every(code => codes.includes(code));
const byId = new Map(learningModules.map(course => [course.id, course]));
const link = ({ href, children, prefetch, scroll, ...props }) => React.createElement('a', { href, ...props }, children);
const router = { isReady: true, query: {}, asPath: '/lernen' };
const ui = createLoader({
  'next/link': { __esModule: true, default: link },
  'next/router': { useRouter: () => router },
  './ExamProfileSummary': { __esModule: true, default: () => null },
});
const Tree = ui('components/LearningTopicTree.js').default;
const Overview = ui('components/LearningOverview.js').default;
const htmlFor = data => renderToStaticMarkup(React.createElement(Tree, { category: data.categoryInfo, groups: data.topicGroups, modules: data.modules, entries: data.subcategoryTools }));

test('All eleven common categories retain their exact category in existing cards, short rounds and supported quiz entries', async () => {
  const QuizPage = load('app/quiz-app/page.jsx').default;
  const reviews = getDailyReviewCatalog();
  for (const category of learningCategoryDetails) {
    const targets = categoryPracticeLinks(category), data = getLearningOverviewData(category.slug);
    if (category.slug === 'jagdrecht') {
      assert.deepEqual(targets, {});
      assert.equal(data.resources.some(resource => /^\/quiz-app(?:\?|$)/.test(resource.href)), false);
      assert.ok(data.resources.some(resource => resource.href === '/jagdrecht'));
      assert.ok(data.resources.some(resource => resource.href === '/lernen/pruefungsplan'));
      continue;
    }
    assert.deepEqual(Object.keys(targets).sort(), ['cardHref', 'quizHref', 'reviewHref']);
    const cardsURL = new URL(targets.cardHref, 'https://jagdlatein.test');
    assert.equal(cardsURL.pathname, '/lernen/lernkarten');
    const navigation = readFlashcardRoute(cardsURL.searchParams, flashcardCategories);
    assert.equal(navigation.valid, true); assert.equal(navigation.navigation.category, category.slug);
    assert.ok(getFlashcards().some(card => card.categoryId === category.slug));
    const reviewURL = new URL(targets.reviewHref, 'https://jagdlatein.test');
    assert.equal(reviewURL.pathname, '/lernen/fuenf-minuten'); assert.equal(reviewURL.searchParams.get('kategorie'), category.slug);
    assert.equal(reviewURL.searchParams.has('modus'), false); assert.ok(reviews.some(question => question.category === category.slug));
    const quizURL = new URL(targets.quizHref, 'https://jagdlatein.test');
    assert.equal(quizURL.pathname, '/quiz-app'); assert.equal(quizURL.searchParams.get('topic'), category.title); assert.equal(quizURL.searchParams.has('country'), false);
    const page = await QuizPage({ searchParams: Object.fromEntries(quizURL.searchParams) });
    assert.equal(page.props.initialTopic, category.title); assert.equal(page.props.legacyTopic, null);
    assert.ok(quizLearningPool(QUESTIONS, { topic: category.title }).length > 0);
    for (const href of Object.values(targets)) assert.equal(data.resources.filter(resource => resource.href === href).length, 1, `${category.slug}: ${href}`);
  }
  for (const category of [null, {}, [], { slug: 'unknown', title: 'Wildkunde' }, { slug: 'wildkunde', title: 'Fremde Kategorie' }, Object.create({ slug: 'wildkunde', title: 'Wildkunde' })]) assert.deepEqual(categoryPracticeLinks(category), {});
});

test('All198 course summaries carry cloned original objectives and no question, solution, source text or score payload', () => {
  const before = JSON.stringify(learningModules), allowed = ['objectives', 'quizHref', 'questionCount', 'cardHref', 'cardCount'];
  let count = 0;
  for (const category of learningCategoryDetails) for (const summary of getLearningOverviewData(category.slug).modules) {
    const course = byId.get(summary.id); count++;
    assert.deepEqual(summary.practice.objectives, course.objectives, course.id);
    assert.notEqual(summary.practice.objectives, course.objectives);
    assert.ok(Object.keys(summary.practice).every(key => allowed.includes(key)), course.id);
    for (const key of ['questions', 'answers', 'correct', 'explain', 'paragraphs', 'lessons', 'sources', 'score']) assert.equal(Object.hasOwn(summary, key), false, `${course.id}: ${key}`);
    const first = summary.practice.objectives[0]; summary.practice.objectives[0] = 'Changed caller copy';
    assert.equal(project(course).objectives[0], first, course.id);
  }
  assert.equal(count, 198); assert.equal(JSON.stringify(learningModules), before);
  assert.ok(getLearningOverviewData().modules.every(summary => summary.practice === undefined), 'The central directory does not need all course objectives');
});

test('A course check is linked exactly when its entire actual four-answer pool is shared DACH knowledge, including jurisdiction overrides', () => {
  let linked = 0;
  for (const course of learningModules) {
    const expected = course.category !== 'Jagdrecht' && shared(course.countries) && course.questions.length > 0 && course.questions.every(question => quizQuestionTopic(question) !== 'Recht' && shared(quizQuestionCountries(question)));
    const summary = project(course);
    assert.equal(Boolean(summary.quizHref), expected, course.id);
    if (!expected) { assert.equal(summary.questionCount, undefined); continue; }
    linked++; assert.equal(summary.quizHref, `/kurse/${course.id}#wissenscheck`); assert.equal(summary.questionCount, course.questions.length);
    for (const question of course.questions) {
      assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.id)).size, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
      assert.equal(question.correct.length, 1); assert.ok(question.answers.some(answer => answer.id === question.correct[0]));
    }
  }
  assert.equal(linked, 180);
  assert.equal(project(byId.get('wissen-waffensicherheit')).quizHref, undefined, 'The explicit DE jurisdiction override cannot become common DACH practice');
  assert.equal(project(byId.get('wissen-ausbau-wildkameras')).quizHref, undefined, 'A mixed legal course is not silently narrowed');
  assert.ok(project(byId.get('wissen-wetter-wind')).quizHref, 'Existing umlaut lesson IDs remain valid');
});

test('Every course-card shortcut resolves to the complete actual scoped deck with exact counts and no foreign-course cards', () => {
  let linked = 0;
  for (const course of learningModules) {
    const summary = project(course), cards = getFlashcards().filter(card => card.moduleId === course.id);
    if (!summary.cardHref) { assert.equal(cards.length, 0, course.id); assert.equal(summary.cardCount, undefined); continue; }
    linked++; const url = new URL(summary.cardHref, 'https://jagdlatein.test'), selection = readFlashcardSelection(url.searchParams);
    assert.deepEqual(selection, { courseId: course.id, lessonId: '' });
    const deck = getFlashcardExport(selection, { withChoices: true });
    assert.equal(deck.selection.invalid, false); assert.equal(deck.cards.length, summary.cardCount); assert.equal(summary.cardCount, cards.length);
    assert.deepEqual(deck.cards.map(card => card.id), cards.map(card => card.id));
    assert.ok(deck.cards.every(card => card.moduleId === course.id && course.lessons.some(lesson => lesson.id === card.lessonId) && card.choices.length === 4));
  }
  assert.equal(linked, 140);
});

test('Malformed, inherited, stale or invented card counts never advertise a deck; valid objectives and quiz remain independent', () => {
  const course = learningModules.find(item => project(item).cardCount > 2 && project(item).quizHref), real = getFlashcardLessonSummary(course.id);
  const first = Object.keys(real.lessons)[0], inherited = Object.create({ total: real.total, lessons: real.lessons });
  const bad = [null, {}, [], inherited, { total: 0, lessons: {} }, { total: -1, lessons: {} }, { total: 1.5, lessons: { [first]: 1.5 } }, { total: NaN, lessons: real.lessons },
    { total: real.total, lessons: [] }, { total: real.total, lessons: Object.create(real.lessons) }, { total: real.total, lessons: { wrongLesson: real.total } },
    { total: course.questions.length + 1, lessons: { [first]: course.questions.length + 1 } }, { total: real.total - 1, lessons: real.lessons },
    { total: 1, lessons: { [first]: 1 } }, { total: real.total, lessons: { ...real.lessons, unknown: 0 } }];
  for (const cardSummary of bad) {
    const summary = project(course, { cardSummary });
    assert.equal(summary.cardHref, undefined); assert.equal(summary.cardCount, undefined);
    assert.equal(summary.quizHref, `/kurse/${course.id}#wissenscheck`); assert.deepEqual(summary.objectives, course.objectives);
  }
  assert.equal(project(course, { cardSummary: real }).cardCount, real.total);
});

test('Bad course, lesson, answer, country and mixed-law metadata cannot advertise a whole-course shared quiz', () => {
  const original = learningModules.find(course => project(course).quizHref), question = original.questions[0], changes = [
    { id: '../foreign' }, { id: 'invented-course-with-no-page' }, { category: 'Unknown category' }, { countries: ['DE', 'DE', 'CH'] }, { countries: ['DE'] }, { lessons: [] }, { lessons: [...original.lessons, original.lessons[0]] },
    { questions: [] }, { questions: [...original.questions, original.questions[0]] },
    ...[
      { topic: 'Recht' }, { countries: ['AT'] }, { countries: ['DE', 'DE', 'CH'] }, { id: 'wissen-waffensicherheit-4' }, { lessonId: 'missing' },
      { answers: question.answers.slice(0, 3) }, { answers: [question.answers[0], question.answers[0], ...question.answers.slice(2)] }, { correct: ['missing'] },
      { correct: question.answers.slice(0, 2).map(answer => answer.id) }, { q: '' }, { explain: '' },
    ].map(change => ({ questions: [{ ...question, ...change }, ...original.questions.slice(1)] })),
  ];
  for (const change of changes) { const result = project({ ...original, ...change }); assert.equal(result.quizHref, undefined, JSON.stringify(change)); assert.equal(result.questionCount, undefined); }
  for (const invalid of [null, [], {}, Object.create(original)]) assert.equal(project(invalid).quizHref, undefined);
  const objectives = project({ ...original, objectives: [null, ''] }); assert.deepEqual(objectives.objectives, []); assert.ok(objectives.quizHref);
});

test('Every one of63 existing groups keeps exact198 keyword accordions, original objectives and lesson links before its own practice links', () => {
  let groups = 0, courses = 0;
  for (const category of learningCategoryDetails) {
    const data = getLearningOverviewData(category.slug), summaries = new Map(data.modules.map(course => [course.id, course]));
    for (const group of data.topicGroups) {
      groups++; router.query = { bereich: group.id }; router.asPath = `/lernen/${category.slug}?bereich=${group.id}#learning-modules`;
      const html = htmlFor(data), panels = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)];
      assert.equal(panels.length, group.moduleIds.length);
      assert.ok(panels.every(panel => !panel[0].split('>')[0].includes('open=')));
      for (const [index, id] of group.moduleIds.entries()) {
        courses++; const course = byId.get(id), summary = summaries.get(id), panel = panels[index][1];
        assert.ok(panel.includes(escape(getLearningNavigationLabel(course))), id);
        for (const objective of course.objectives) assert.ok(panel.includes(escape(objective)), id);
        const expected = [...course.lessons.map(lesson => `/kurse/${id}${lessonHash(lesson.id)}`), ...[summary.practice.quizHref, summary.practice.cardHref].filter(Boolean)].map(escape);
        assert.deepEqual([...panel.matchAll(/href="([^"]+)"/g)].map(match => match[1]), expected, id);
        assert.ok(panel.indexOf('Lernziele') < panel.indexOf('class="lessonLinks"'), id);
        if (summary.practice.quizHref || summary.practice.cardHref) {
          assert.ok(panel.includes(`data-category-course-practice="${id}"`));
          assert.ok(panel.indexOf('class="lessonLinks"') < panel.indexOf('data-category-course-practice='), id);
        }
        if (summary.practice.quizHref) assert.ok(panel.includes(`${course.questions.length} Fragen · je vier Antworten`), id);
      }
      assert.doesNotMatch(html, /<input|<select|<dialog|<button|<img/);
    }
    router.query = {}; router.asPath = `/lernen/${category.slug}`;
    const rootHTML = htmlFor(data); assert.doesNotMatch(rootHTML, /Lernziele|wissenscheck|data-category-course-practice|\/lernen\/lernkarten\?kurs=/, category.slug);
    const overviewHTML = renderToStaticMarkup(React.createElement(Overview, { data }));
    for (const href of Object.values(categoryPracticeLinks(category))) assert.ok(overviewHTML.includes(`href="${escape(href)}"`), href);
  }
  assert.equal(groups, 63); assert.equal(courses, 198);
});

test('No new client import reaches course question/card corpora and only approved display fields cross the server boundary', () => {
  for (const filename of ['components/LearningOverview.js', 'components/LearningTopicTree.js']) {
    const source = fs.readFileSync(path.join(root, filename), 'utf8');
    assert.doesNotMatch(source, /import[^;]+(?:learning-category-practice-server|learning-curriculum|learning-flashcards|daily-review-pool|questions-full)/);
  }
  const source = fs.readFileSync(path.join(root, 'lib/learning-category-practice-server.js'), 'utf8');
  assert.doesNotMatch(source, /window|localStorage|sessionStorage|fetch\(/);
  for (const category of learningCategoryDetails) for (const module of getLearningOverviewData(category.slug).modules) {
    assert.ok(Object.values(module.practice).every(value => typeof value === 'string' || Number.isSafeInteger(value) || Array.isArray(value) && value.every(item => typeof item === 'string')));
  }
});
