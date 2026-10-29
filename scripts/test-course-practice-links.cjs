const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
local('styled-jsx/style');
const load = createLoader(), { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { gameMeatCases: cases } = load('lib/game-meat-cases.js'), journal = load('lib/dog-training-journal.js');
const exercises = journal.dogTrainingExercises;
const project = load('lib/course-practice-links-server.js').getCoursePracticeLinks, Links = load('components/CoursePracticeLinks.js').default;
const inventory = [
  ...cases.map(item => ({ ...item, linkId: `wildbret-${item.id}`, route: '/lernen/wildbret-fallwerkstatt' })),
  ...exercises.map(item => ({ ...item, linkId: `training-${item.id}`, route: '/lernen/hundetraining-tagebuch' })),
];

test('Only the ten authored case and ten exercise recommendations gain reciprocal whole-course reading links', () => {
  const before = JSON.stringify([learningModules, cases, exercises]);
  assert.equal(cases.length, 10); assert.equal(exercises.length, 10);
  let connections = 0, courses = 0;
  for (const module of learningModules) {
    const links = project(module), expected = inventory.filter(item => item.course === module.id);
    assert.deepEqual(links, expected.map(item => ({ id: item.linkId, title: item.title, href: `${item.route}?eintrag=${encodeURIComponent(item.id)}` })));
    connections += links.length; courses += links.length > 0 ? 1 : 0;
    for (const link of links) {
      const item = expected.find(item => item.linkId === link.id), url = new URL(link.href, 'https://jagdlatein.test');
      assert.equal(url.pathname, item.route); assert.equal(url.searchParams.get('eintrag'), item.id);
      assert.deepEqual([...url.searchParams.keys()], ['eintrag']); assert.equal(url.hash, '');
    }
  }
  assert.equal(connections, 20); assert.equal(courses, 2); assert.equal(new Set(inventory.map(item => item.linkId)).size, 20);
  for (const item of inventory) assert.ok(getLearningModule(item.course));
  assert.equal(JSON.stringify([learningModules, cases, exercises]), before);
});

test('Unknown, missing and empty course values never invent a fallback destination', () => {
  for (const value of [undefined, null, '', [], {}, { id: 'missing', lessons: [{}] }, { id: 'wissen-ausbau-hundelernen' }, { id: 'wissen-ausbau-hundelernen', lessons: [] }, { id: ['wissen-ausbau-hundelernen'], lessons: [{}] }]) assert.deepEqual(project(value), []);
  assert.equal(Links({}), null);
});

test('All 198 SSG payloads retain their prior projections and carry only small id/title/href practice rows', () => {
  const page = load('pages/kurse/[slug].js'), cards = load('lib/learning-flashcards.js');
  const adapters = [['wildlifeLinks', 'lib/course-wildlife-links-server.js', 'getCourseWildlifeLinks'], ['miniCourseLinks', 'lib/course-mini-links-server.js', 'getCourseMiniLinks'], ['glossaryLinks', 'lib/glossary-course-links-server.js', 'getCourseGlossaryLinks'], ['oralExamLinks', 'lib/course-oral-exam-links-server.js', 'getCourseOralExamLinks']];
  assert.equal(learningModules.length, 198);
  for (const module of learningModules) {
    const { props } = page.getStaticProps({ params: { slug: module.id } });
    assert.equal(props.module, module); assert.deepEqual(props.flashcards, cards.getFlashcardLessonSummary(module.id));
    for (const [key, file, method] of adapters) assert.deepEqual(props[key], load(file)[method](module));
    assert.deepEqual(props.practiceLinks, project(module)); assert.equal(page.default(props).props.practiceLinks, props.practiceLinks);
    assert.ok(Buffer.byteLength(JSON.stringify(props.practiceLinks)) < 3000);
    for (const link of props.practiceLinks) assert.deepEqual(Object.keys(link).sort(), ['href', 'id', 'title']);
  }
  assert.deepEqual(page.getStaticProps({ params: { slug: 'unknown-course' } }), { notFound: true });
});

test('Presentation adds internal reading links without answer models, new windows, forms or another disclosure', () => {
  for (const module of learningModules) {
    const links = project(module), tree = Links({ links });
    assert.deepEqual(nodes(tree, node => typeof node.props?.href === 'string').map(node => node.props.href), links.map(link => link.href));
    for (const link of nodes(tree, node => typeof node.props?.href === 'string')) { assert.equal(link.props.prefetch, false); assert.equal(link.props.target, undefined); }
    assert.equal(nodes(tree, node => ['button', 'input', 'select', 'dialog', 'details', 'form'].includes(node.type)).length, 0);
  }
  const SSR = createLoader({ 'next/link': ({ children, href }) => React.createElement('a', { href }, children) })('components/CoursePracticeLinks.js').default;
  const html = renderToStaticMarkup(React.createElement(SSR, { links: project(getLearningModule('wissen-ausbau-hundelernen')) }));
  assert.match(html, /data-course-practice-links/); assert.match(html, /Übungsbeschreibungen/); assert.doesNotMatch(html, /target=|<input|<dialog|Eintrag vorbereiten/);
});

test('The real course owner contributes practice links once to its existing lower menu with complete reading and final closed sources', () => {
  const PageMenu = () => null;
  for (const id of [...new Set(inventory.map(item => item.course))]) {
    const module = getLearningModule(id), practiceLinks = project(module);
    for (const index of [0, module.lessons.length - 1]) {
      let cursor = 0;
      const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? index : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
      const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${id}` }) }, '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() {} } })('components/LearningCourse.js').default;
      const element = Course({ module, practiceLinks }), tree = element.type(element.props), menu = nodes(tree, node => node.type === PageMenu)[0];
      const child = nodes(menu, node => node.type?.name === 'CoursePracticeLinks'); assert.equal(child.length, 1); assert.equal(child[0].props.links, practiceLinks);
      assert.equal(nodes(tree, node => node.type?.name === 'CoursePracticeLinks').length, 1);
      const reading = nodes(tree, node => node.type === 'article' && node.props?.['aria-labelledby'] === 'current-lesson-heading')[0];
      for (const paragraph of module.lessons[index].paragraphs) assert.ok(text(reading).includes(paragraph));
      const last = nodes(tree, node => node.type === 'details').at(-1); assert.equal(last.props.id, 'quellen'); assert.equal(last.props.open, false);
    }
  }
});

test('All ten case links reach the actual complete reading case, preserving legacy IDs and their explanations', () => {
  for (const item of cases) {
    const link = project(getLearningModule(item.course)).find(link => link.id === `wildbret-${item.id}`), url = new URL(link.href, 'https://jagdlatein.test');
    const h = setup('components/GameMeatCases.js', Object.fromEntries(url.searchParams), { router: { asPath: link.href } });
    try {
      assert.equal(text(h.nodes(node => node.props?.id === 'game-meat-title')[0]), item.title);
      const content = text(h.nodes(node => node.props?.id === 'game-meat-content')[0]);
      for (const value of [item.situation, item.question, item.choices[item.answer].explanation, item.takeaway, ...item.checklist]) assert.ok(content.includes(value), item.id);
    } finally { h.dispose(); }
  }
});

test('All ten journal links only read the exercise and retain a synthetic stored draft and records without extra persistence', () => {
  const saved = { version: 1, records: [], draft: { ...journal.createDogJournalDraft(new Date('2026-10-04T12:00:00Z')), dog: 'Synthetic team', exerciseId: 'ruheplatz', observation: 'Synthetic private note', nextStep: 'Synthetic next step' } };
  const previousWindow = global.window;
  function render(query, asPath) {
    const writes = [], reads = [], initial = JSON.stringify(saved);
    global.window = { location: { search: '', hash: '' }, localStorage: { getItem(key) { assert.equal(key, journal.DOG_JOURNAL_KEY); reads.push(key); return initial; }, setItem(key, value) { assert.equal(key, journal.DOG_JOURNAL_KEY); writes.push(value); } } };
    const h = setup('components/DogTrainingJournal.js', query, { router: { asPath } });
    return { h, writes, reads };
  }
  try {
    const control = render({}, '/lernen/hundetraining-tagebuch');
    const expectedWrites = [...control.writes], expectedReads = [...control.reads]; control.h.dispose();
    for (const item of exercises) {
      const link = project(getLearningModule(item.course)).find(link => link.id === `training-${item.id}`), url = new URL(link.href, 'https://jagdlatein.test');
      const { h, writes, reads } = render(Object.fromEntries(url.searchParams), link.href);
      try {
        assert.equal(text(h.nodes(node => node.props?.id === 'exercise-title')[0]), item.title);
        assert.deepEqual(writes, expectedWrites); assert.deepEqual(reads, expectedReads);
        for (const value of writes) assert.deepEqual(JSON.parse(value), saved);
        const draftField = h.nodes(node => node.type === 'label' && text(node).startsWith('Geübte Aufgabe'))[0];
        assert.equal(nodes(draftField, node => node.type === 'select')[0].props.value, saved.draft.exerciseId);
        assert.ok(h.nodes(node => node.type === 'textarea').some(node => node.props.value === saved.draft.observation));
      } finally { h.dispose(); }
    }
  } finally { global.window = previousWindow; }
});

test('The course client transform excludes both practice banks, private journal helpers and source answer models', () => {
  const filename = path.join(root, 'pages/kurse/[slug].js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /course-practice-links-server|game-meat-cases|dog-training-journal|gameMeatCases|dogTrainingExercises/);
  for (const file of ['components/CoursePracticeLinks.js', 'components/LearningCourse.js']) assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /course-practice-links-server|game-meat-cases|dog-training-journal/);
});

test('The two authored practice catalogs and all existing storage, backup and validation contracts remain exact', () => {
  for (const file of ['lib/game-meat-cases.js', 'lib/dog-training-journal.js']) assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `49b462f:${file}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
});

test('The actual middleware keeps all twenty direct practice destinations behind existing paid access', async () => {
  const { NextRequest } = local('next/server');
  const { middleware } = createLoader({ './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account_session', readAccountSessionEdge: async () => null } })('middleware.js');
  for (const item of inventory) {
    const href = project(getLearningModule(item.course)).find(link => link.id === item.linkId).href;
    const result = await middleware(new NextRequest(`https://jagdlatein.test${href}`));
    assert.equal(result.status, 307); const destination = new URL(result.headers.get('location'));
    assert.equal(destination.pathname, '/preise'); assert.equal(destination.searchParams.get('next'), href);
  }
});
