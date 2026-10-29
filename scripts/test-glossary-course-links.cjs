const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader(), { TERMS } = load('data/glossary-terms.js');
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { lessonHash } = load('lib/learning-lesson-navigation.js');
const { getGlossaryCourseLinks: forward, getCourseGlossaryLinks: reverse } = load('lib/glossary-course-links-server.js');
const Links = load('components/CourseGlossaryLinks.js').default;
const expected = [
  ['kugelfang', 'wissen-kugelfang', null],
  ['nachsuche', 'wissen-nachsuche', null],
  ['nachsuchenfuehrer', 'wissen-nachsuche', null],
  ['schweiß', 'wissen-nachsuche', 'anschuss'],
  ['zuwarten', 'wissen-nachsuche', 'anschuss'],
  ['pirschzeichen', 'wissen-ausbau-anschussmeldung', 'spurenraum'],
  ['geweih', 'wissen-vertiefung-geweih-horn-gewebe-2026', 'gewebe'],
  ['hoerner', 'wissen-vertiefung-geweih-horn-gewebe-2026', 'gewebe'],
  ['abwurfstange', 'wissen-vertiefung-geweih-horn-gewebe-2026', 'erneuerung'],
  ['fegen', 'wissen-vertiefung-geweih-horn-gewebe-2026', 'erneuerung'],
  ['federwild', 'wissen-ausbau-federaufbau-funktion-2026', null],
  ['windkante', 'wissen-wetter-wind', 'gelände'],
];

test('Twelve editorial connections point to their exact real course or lesson and have an exact reverse', () => {
  const before = JSON.stringify([TERMS, learningModules]);
  for (const [slug, moduleId, lessonId] of expected) {
    const module = getLearningModule(moduleId), entry = TERMS.find(term => term.slug === slug);
    assert.ok(module && entry);
    const lesson = lessonId === null ? null : module.lessons.find(item => item.id === lessonId); assert.ok(lessonId === null || lesson);
    assert.deepEqual(forward(slug), [{ title: lesson ? lesson.title : module.title, href: `/kurse/${moduleId}${lesson ? lessonHash(lesson.id) : ''}` }]);
    assert.deepEqual(reverse(module).find(item => item.slug === slug), { slug, term: entry.term, href: `/glossar/${encodeURIComponent(slug)}`, lessonIds: lessonId === null ? null : [lessonId] });
  }
  assert.equal(TERMS.filter(entry => forward(entry.slug).length).length, expected.length);
  assert.equal(learningModules.flatMap(reverse).length, expected.length);
  assert.equal(new Set(learningModules.filter(module => reverse(module).length).map(module => module.id)).size, 6);
  assert.equal(JSON.stringify([TERMS, learningModules]), before);
});

test('Similar words, unknown values and ambiguous lesson IDs never invent a connection', () => {
  for (const value of [null, undefined, {}, [], ['geweih'], 'GEWEIH', 'geweih-extra', 'constructor', '__proto__', '.windkante', '<script>', 'schweiss']) assert.deepEqual(forward(value), []);
  const module = getLearningModule('wissen-wetter-wind');
  for (const value of [null, {}, { id: 'missing', lessons: module.lessons }, { id: module.id }, { id: module.id, lessons: [] }, { ...module, lessons: [{ id: 'gelände' }, { id: 'gelände' }] }, { ...module, lessons: [{ id: 'gelaende' }] }]) assert.deepEqual(reverse(value), []);
  for (const term of TERMS.filter(term => !expected.some(([slug]) => slug === term.slug))) assert.deepEqual(forward(term.slug), []);
});

test('Course payload is a small exact projection and retains full existing content, cards and other connections', () => {
  const page = load('pages/kurse/[slug].js'), cards = load('lib/learning-flashcards.js');
  const wildlife = load('lib/course-wildlife-links-server.js'), mini = load('lib/course-mini-links-server.js');
  for (const module of learningModules) {
    const props = page.getStaticProps({ params: { slug: module.id } }).props;
    assert.equal(props.module, module); assert.deepEqual(props.flashcards, cards.getFlashcardLessonSummary(module.id));
    assert.deepEqual(props.wildlifeLinks, wildlife.getCourseWildlifeLinks(module)); assert.deepEqual(props.miniCourseLinks, mini.getCourseMiniLinks(module));
    assert.deepEqual(props.glossaryLinks, reverse(module)); assert.equal(page.default(props).props.glossaryLinks, props.glossaryLinks);
    assert.ok(Buffer.byteLength(JSON.stringify(props.glossaryLinks)) < 1300);
    for (const row of props.glossaryLinks) assert.deepEqual(Object.keys(row).sort(), ['slug', 'term', 'href', 'lessonIds'].sort());
  }
});

test('Paid access is checked before projecting every glossary destination, including unknown and legacy slugs', async () => {
  let calls = 0, result = { redirect: { destination: '/preise', permanent: false } };
  const page = createLoader({ '../../lib/account-access': { getPaidPageProps: async () => { calls++; return result; } } })('pages/glossar/[slug].js');
  for (const slug of ['geweih', 'unknown', '.windkante', ['geweih']]) assert.equal(await page.getServerSideProps({ params: { slug } }), result);
  result = { props: {} };
  for (const entry of TERMS) {
    const props = (await page.getServerSideProps({ params: { slug: entry.slug } })).props;
    assert.deepEqual(props, { slug: entry.slug, ...(forward(entry.slug).length ? { studyLinks: forward(entry.slug) } : {}) });
  }
  assert.deepEqual(await page.getServerSideProps({ params: { slug: '.windkante' } }), { props: { slug: 'windkante', studyLinks: forward('windkante') } });
  for (const slug of ['unknown', '', ['geweih'], '__proto__']) assert.deepEqual(await page.getServerSideProps({ params: { slug } }), { notFound: true });
  assert.equal(calls, TERMS.length + 9);
});

test('Course glossary links show only relevant lesson bindings without another window, search or disclosure', () => {
  assert.equal(Links({}), null);
  for (const module of learningModules) for (const lesson of module.lessons) {
    const links = reverse(module), tree = Links({ links, lessonId: lesson.id });
    const visible = links.filter(link => link.lessonIds === null || link.lessonIds.includes(lesson.id));
    assert.deepEqual(nodes(tree, node => typeof node.props?.href === 'string').map(node => node.props.href), visible.map(link => link.href));
    for (const anchor of nodes(tree, node => typeof node.props?.href === 'string')) { assert.equal(anchor.props.prefetch, false); assert.equal(anchor.props.target, undefined); }
    assert.equal(nodes(tree, node => ['button', 'input', 'select', 'dialog', 'details', 'form'].includes(node.type)).length, 0);
  }
  assert.ok(reverse(getLearningModule('wissen-nachsuche')).some(link => link.href === '/glossar/schwei%C3%9F'));
});

test('Every definition remains first and exact; study links and alphabetical neighbors stay in the existing lower menu', () => {
  const PageMenu = () => null;
  const page = createLoader({ '../../lib/account-access': { getPaidPageProps: async () => ({ props: {} }) }, '../../components/PageMenu': { __esModule: true, default: PageMenu } })('pages/glossar/[slug].js');
  for (const entry of TERMS) {
    const tree = page.default({ slug: entry.slug, studyLinks: forward(entry.slug) }), menu = nodes(tree, node => node.type === PageMenu)[0];
    assert.ok(menu); const html = renderToStaticMarkup(tree);
    assert.ok(text(tree).includes(entry.def)); assert.doesNotMatch(html, /data-glossary-course-links|Verwandte Begriffe|<nav|<input/);
    const navigation = nodes(menu, node => node.props?.['data-glossary-course-links'] !== undefined);
    assert.equal(navigation.length, forward(entry.slug).length ? 1 : 0);
    for (const anchor of nodes(navigation, node => typeof node.props?.href === 'string')) { assert.equal(anchor.props.prefetch, false); assert.equal(anchor.props.target, undefined); }
    const neighbors = TERMS.filter(other => other.slug !== entry.slug && other.term[0].toLowerCase() === entry.term[0].toLowerCase());
    assert.equal(text(menu).includes(`Weitere Begriffe mit ${entry.term[0].toUpperCase()}`), neighbors.length > 0);
  }
});

test('Actual course owner contributes the projection once to the lower menu and keeps full reading and final closed sources', () => {
  const module = getLearningModule('wissen-nachsuche'), glossaryLinks = reverse(module), PageMenu = () => null;
  for (let index = 0; index < module.lessons.length; index++) {
    let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? index : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${module.id}` }) }, '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() {} } })('components/LearningCourse.js').default;
    const element = Course({ module, glossaryLinks }), tree = element.type(element.props), menu = nodes(tree, node => node.type === PageMenu)[0];
    const child = nodes(menu, node => node.type?.name === 'CourseGlossaryLinks'); assert.equal(child.length, 1);
    assert.equal(child[0].props.links, glossaryLinks); assert.equal(child[0].props.lessonId, module.lessons[index].id);
    assert.equal(nodes(tree, node => node.type?.name === 'CourseGlossaryLinks').length, 1);
    const reading = nodes(tree, node => node.type === 'article' && node.props?.['aria-labelledby'] === 'current-lesson-heading')[0];
    for (const paragraph of module.lessons[index].paragraphs) assert.ok(text(reading).includes(paragraph));
    const last = nodes(tree, node => node.type === 'details').at(-1); assert.equal(last.props.id, 'quellen'); assert.equal(last.props.open, false);
  }
});

test('Neither page client transform imports the server curriculum projection', () => {
  for (const entry of ['pages/kurse/[slug].js', 'pages/glossar/[slug].js']) {
    const filename = path.join(root, entry), { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    assert.doesNotMatch(code, /glossary-course-links-server|learning-curriculum|learning-flashcards/);
  }
  for (const entry of ['components/CourseGlossaryLinks.js', 'components/LearningCourse.js']) assert.doesNotMatch(fs.readFileSync(path.join(root, entry), 'utf8'), /glossary-course-links-server|learning-curriculum/);
});

test('All existing glossary objects and their historical review date remain byte for byte unchanged', () => {
  assert.equal(fs.readFileSync(path.join(root, 'data/glossary-terms.js'), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', '647e2df:data/glossary-terms.js'], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
});
