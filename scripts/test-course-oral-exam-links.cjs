const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader(), { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { oralExamQuestions: questions } = load('lib/oral-exam-trainer.js');
const project = load('lib/course-oral-exam-links-server.js').getCourseOralExamLinks;
const Links = load('components/CourseOralExamLinks.js').default;

test('Exactly the twenty existing authored whole-course recommendations gain their reciprocal conversation link', () => {
  const before = JSON.stringify([learningModules, questions]);
  assert.equal(questions.length, 20); assert.equal(new Set(questions.map(item => item.course)).size, 20);
  let count = 0;
  for (const module of learningModules) {
    const expected = questions.filter(question => question.course === module.id);
    const actual = project(module); count += actual.length;
    assert.deepEqual(actual, expected.map(question => ({ id: question.id, title: question.title, href: `/lernen/pruefungsgespraech?eintrag=${encodeURIComponent(question.id)}` })));
    for (const link of actual) {
      const url = new URL(link.href, 'https://jagdlatein.test');
      assert.equal(url.pathname, '/lernen/pruefungsgespraech');
      assert.deepEqual([...url.searchParams.keys()], ['eintrag']);
      assert.equal(questions.find(question => question.id === url.searchParams.get('eintrag')).course, module.id);
    }
  }
  for (const question of questions) assert.ok(getLearningModule(question.course));
  assert.equal(count, 20); assert.equal(JSON.stringify([learningModules, questions]), before);
  // An existing cross-category recommendation must not disappear or copy a
  // contradictory category into the destination's validated URL.
  assert.ok(project(getLearningModule('wissen-spuren-systematisch')).some(link => link.id === 'spurenbegriffe'));
});

test('Unknown, missing and empty course values never invent a question or throw', () => {
  for (const value of [undefined, null, '', [], {}, { id: 'missing', lessons: [{}] }, { id: 'wissen-rehwild-jahreslauf' }, { id: 'wissen-rehwild-jahreslauf', lessons: [] }, { id: ['wissen-rehwild-jahreslauf'], lessons: [{}] }]) assert.deepEqual(project(value), []);
  assert.equal(Links({}), null);
});

test('All course SSG payloads retain the old projections and add only small id/title/href rows', () => {
  const page = load('pages/kurse/[slug].js'), cards = load('lib/learning-flashcards.js');
  const wildlife = load('lib/course-wildlife-links-server.js'), mini = load('lib/course-mini-links-server.js'), glossary = load('lib/glossary-course-links-server.js');
  for (const module of learningModules) {
    const { props } = page.getStaticProps({ params: { slug: module.id } });
    assert.equal(props.module, module); assert.deepEqual(props.flashcards, cards.getFlashcardLessonSummary(module.id));
    assert.deepEqual(props.wildlifeLinks, wildlife.getCourseWildlifeLinks(module)); assert.deepEqual(props.miniCourseLinks, mini.getCourseMiniLinks(module));
    assert.deepEqual(props.glossaryLinks, glossary.getCourseGlossaryLinks(module)); assert.deepEqual(props.oralExamLinks, project(module));
    assert.equal(page.default(props).props.oralExamLinks, props.oralExamLinks);
    assert.ok(Buffer.byteLength(JSON.stringify(props.oralExamLinks)) < 800);
    for (const link of props.oralExamLinks) assert.deepEqual(Object.keys(link).sort(), ['href', 'id', 'title']);
  }
  assert.deepEqual(page.getStaticProps({ params: { slug: 'unknown-course' } }), { notFound: true });
});

test('Presentation remains a plain internal link with no copied model, new window or new selection controls', () => {
  for (const module of learningModules) {
    const links = project(module), tree = Links({ links });
    assert.deepEqual(nodes(tree, node => typeof node.props?.href === 'string').map(node => node.props.href), links.map(link => link.href));
    for (const link of nodes(tree, node => typeof node.props?.href === 'string')) { assert.equal(link.props.prefetch, false); assert.equal(link.props.target, undefined); }
    assert.equal(nodes(tree, node => ['button', 'input', 'select', 'dialog', 'details', 'form'].includes(node.type)).length, 0);
  }
  const SSR = createLoader({ 'next/link': ({ children, href }) => React.createElement('a', { href }, children) })('components/CourseOralExamLinks.js').default;
  const html = renderToStaticMarkup(React.createElement(SSR, { links: project(getLearningModule('wissen-rehwild-jahreslauf')) }));
  assert.match(html, /data-course-oral-exam-links/); assert.match(html, /Themengebiet des Kurses/); assert.doesNotMatch(html, /target=|<input|<dialog|Musterantwort/);
});

test('The actual owner contributes links once to the existing lower menu and keeps full reading before closed final sources', () => {
  const PageMenu = () => null;
  for (const id of ['wissen-rehwild-jahreslauf', 'wissen-kugelfang', 'wissen-spuren-systematisch']) {
    const module = getLearningModule(id), oralExamLinks = project(module);
    for (const index of [0, module.lessons.length - 1]) {
      let cursor = 0;
      const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? index : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
      const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${id}` }) }, '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() {} } })('components/LearningCourse.js').default;
      const element = Course({ module, oralExamLinks }), tree = element.type(element.props), menu = nodes(tree, node => node.type === PageMenu)[0];
      const child = nodes(menu, node => node.type?.name === 'CourseOralExamLinks'); assert.equal(child.length, 1); assert.equal(child[0].props.links, oralExamLinks);
      assert.equal(nodes(tree, node => node.type?.name === 'CourseOralExamLinks').length, 1);
      const reading = nodes(tree, node => node.type === 'article' && node.props?.['aria-labelledby'] === 'current-lesson-heading')[0];
      for (const paragraph of module.lessons[index].paragraphs) assert.ok(text(reading).includes(paragraph));
      const last = nodes(tree, node => node.type === 'details').at(-1); assert.equal(last.props.id, 'quellen'); assert.equal(last.props.open, false);
    }
  }
});

test('Every projected URL opens its exact existing question in the real ready oral trainer', () => {
  for (const question of questions) {
    const link = project(getLearningModule(question.course)).find(item => item.id === question.id), url = new URL(link.href, 'https://jagdlatein.test');
    const h = setup('components/OralExamTrainer.js', Object.fromEntries(url.searchParams), { router: { asPath: link.href } });
    try {
      assert.equal(text(h.nodes(node => node.props?.id === 'exam-question-title')[0]), question.title);
      assert.equal(h.nodes(node => node.type === 'textarea')[0].props.value, '');
      assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
    } finally { h.dispose(); }
  }
});

test('The course client transform excludes question models and the server-only bank projection', () => {
  const filename = path.join(root, 'pages/kurse/[slug].js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /course-oral-exam-links-server|oral-exam-trainer|oralExamQuestions|learning-curriculum/);
  for (const question of questions) assert.ok(!code.includes(question.model));
  for (const file of ['components/CourseOralExamLinks.js', 'components/LearningCourse.js']) assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /course-oral-exam-links-server|oral-exam-trainer|oralExamQuestions/);
});

test('Existing oral prompts, all model answers, dates and source records remain exactly those from 25807fe', () => {
  const file = 'lib/oral-exam-trainer.js';
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `25807fe:${file}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
});

test('The existing middleware keeps all twenty direct conversation links behind the paid-access boundary', async () => {
  const { NextRequest } = local('next/server');
  const { middleware } = createLoader({ './lib/account-session-edge': {
    JL_ACCOUNT_COOKIE: 'jl_account_session', readAccountSessionEdge: async () => null,
  } })('middleware.js');
  for (const question of questions) {
    const href = project(getLearningModule(question.course))[0].href;
    const result = await middleware(new NextRequest(`https://jagdlatein.test${href}`));
    assert.equal(result.status, 307);
    const destination = new URL(result.headers.get('location'));
    assert.equal(destination.pathname, '/preise'); assert.equal(destination.searchParams.get('next'), href);
    assert.notEqual(result.headers.get('x-middleware-next'), '1');
  }
});
