// Real player output and hook/DOM lifecycles, with public curriculum and
// synthetic routers, storage and media. No user data or network is accessed.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { huntingDogVideoLessons: lessons, dogVideoSources } = load('lib/hunting-dog-video-lessons.js');
const { learningVideoLinks, getCourseVideoLinks } = load('lib/learning-video-links.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const project = load('lib/hunting-dog-video-course-links-server.js').getHuntingDogVideoCourseLinks;
const courseLinks = project(), base = '/lernen/jagdhund-videos';
const expected = {
  'basset-faehrtenende': ['wissen-ausbau-hundeteam'],
  'labrador-signal': ['wissen-ausbau-hundelernen', 'wissen-wachstum-hund-signale-kontext-2026'],
  'golden-wasser': ['wissen-ausbau-hundeteam'],
  'rute-kontext': ['wissen-ausbau-hund-koerpersprache-2026'],
};
function courses(h) { return h.nodes(node => node.props?.['data-dog-video-courses'])[0]; }
function destinations(h) { return nodes(courses(h), node => node.props?.href).map(node => node.props.href); }
function selector(h) { return h.nodes(node => node.type?.name === 'MenuChoice')[0]; }
function address(id) { return `${base}?eintrag=${id}#hundevideo-film`; }

test('Exactly five existing authored edges for four films gain their actual course titles and reciprocal destinations', () => {
  assert.deepEqual(Object.keys(courseLinks), lessons.map(lesson => lesson.id));
  for (const lesson of lessons) {
    const authored = learningVideoLinks.find(link => link.kind === 'hund' && link.id === lesson.id);
    assert.deepEqual(authored.moduleIds, expected[lesson.id]);
    assert.deepEqual(courseLinks[lesson.id], expected[lesson.id].map(id => ({ id, title: getLearningModule(id).title, href: `/kurse/${id}` })));
    for (const link of courseLinks[lesson.id]) assert.ok(getCourseVideoLinks(link.id).some(item => item.id === lesson.id));
  }
  assert.equal(Object.values(courseLinks).flat().length, 5);
});

test('Static props carry only small id/title/href rows, never curriculum, questions, source records or media', () => {
  const page = load('pages/lernen/jagdhund-videos.js'), props = page.getStaticProps().props;
  assert.deepEqual(Object.keys(props), ['courseLinks']); assert.deepEqual(props.courseLinks, courseLinks);
  assert.ok(Buffer.byteLength(JSON.stringify(props)) < 1800);
  for (const row of Object.values(props.courseLinks).flat()) assert.deepEqual(Object.keys(row), ['id', 'title', 'href']);
  assert.doesNotMatch(JSON.stringify(props), /"lessons"|"questions"|"answer"|"sources"|"media"|"transcript"|\.mp4|\.vtt|\.webm/);
  assert.equal(typeof page.default, 'function');
});

test('Only uniquely existing courses and uniquely owned primary lesson anchors survive projection', () => {
  const make = (course, modules) => createLoader({
    './hunting-dog-video-lessons': { huntingDogVideoLessons: [{ id: 'synthetic-dog', course }] },
    './learning-video-links': { learningVideoLinks: [{ id: 'synthetic-dog', kind: 'hund', moduleIds: ['one', 'two', 'missing', 'empty', 'ambiguous', 'one'] }] },
    './learning-curriculum': { learningModules: modules },
  })('lib/hunting-dog-video-course-links-server.js').getHuntingDogVideoCourseLinks()['synthetic-dog'];
  const modules = [{ id: 'one', title: 'One', lessons: [{ id: 'intro' }] }, { id: 'two', title: 'Two', lessons: [{ id: 'intro' }] }, { id: 'empty', title: 'Empty', lessons: [] }, { id: 'ambiguous', lessons: [{}] }, { id: 'ambiguous', lessons: [{}] }];
  assert.deepEqual(make('/kurse/one#lesson-intro', modules).map(row => row.href), ['/kurse/one#lesson-intro', '/kurse/two']);
  for (const course of ['/kurse/one#lesson-missing', '/kurse/one#lesson-%ZZ', 'https://evil.test/kurse/one#lesson-intro']) assert.deepEqual(make(course, modules).map(row => row.href), ['/kurse/one', '/kurse/two']);
  const duplicateLessons = modules.map(module => module.id === 'one' ? { ...module, lessons: [{ id: 'intro' }, { id: 'intro' }] } : module);
  assert.equal(make('/kurse/one#lesson-intro', duplicateLessons)[0].href, '/kurse/one');
});

test('All four real selected players show their course links after complete learning and questions, before final closed sources', () => {
  let router;
  const Component = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': ({ children, href, prefetch, ...props }) => React.createElement('a', { href, 'data-prefetch': String(prefetch), ...props }, children),
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
  })('components/HuntingDogVideos.js').default;
  for (const lesson of lessons) {
    router = { isReady: true, query: { eintrag: lesson.id }, asPath: address(lesson.id) };
    const html = renderToStaticMarkup(React.createElement(Component, { courseLinks }));
    const navStart = html.indexOf('aria-label="Zum Hundevideo weiterlernen"'), navEnd = html.indexOf('</nav>', navStart), nav = html.slice(navStart, navEnd);
    assert.ok(navStart > html.indexOf('aria-label="Beobachtung prüfen"'));
    assert.ok(navEnd < html.indexOf('<summary>Fachquellen, Bildnachweis und Prüfstand</summary>'));
    for (const link of courseLinks[lesson.id]) assert.ok(nav.includes(`href="${link.href}" data-prefetch="false"`) && nav.includes(link.title.replaceAll('&', '&amp;')));
    assert.equal((nav.match(/<a /g) || []).length, courseLinks[lesson.id].length); assert.doesNotMatch(nav, /target=|<details|<button|<select|<input|<dialog/);
    for (const exact of [lesson.context, lesson.lesson, lesson.practice, lesson.transcript]) assert.ok(html.includes(exact.replaceAll('&', '&amp;')));
    assert.equal((html.match(/<video\b/g) || []).length, 1); assert.ok(html.includes(`src="${lesson.captions}"`));
    assert.equal((html.match(/type="radio"/g) || []).length, lesson.questions.flatMap(question => question.choices).length);
    assert.match(html, /geprüft am 12\. Oktober 2026/); assert.doesNotMatch(html, /<details[^>]*open/);
  }
});

test('Bare entry has only the first scene links; unready, unknown, empty and repeated selections reveal no unrelated courses', t => {
  for (const [query, ready, expectedHrefs] of [[{}, true, courseLinks[lessons[0].id].map(row => row.href)], [{ eintrag: lessons[1].id }, false, []], [{ eintrag: 'missing' }, true, []], [{ eintrag: '' }, true, []], [{ eintrag: [lessons[0].id] }, true, []], [{ eintrag: [lessons[0].id, lessons[1].id] }, true, []]]) {
    const h = setup('components/HuntingDogVideos.js', query, { ready, props: { courseLinks }, router: { asPath: base } }); t.after(() => h.dispose());
    assert.deepEqual(destinations(h), expectedHrefs); assert.equal(h.calls.length, 0);
  }
  const absentProps = setup('components/HuntingDogVideos.js', { eintrag: lessons[1].id }); t.after(() => absentProps.dispose()); assert.equal(courses(absentProps), undefined);
});

test('Deferred, rejected, false and pre-commit accepted selection never switch course links before the actual URL', async t => {
  const h = setup('components/HuntingDogVideos.js', { eintrag: lessons[0].id }, { props: { courseLinks }, router: { asPath: address(lessons[0].id) } }); t.after(() => h.dispose());
  const original = destinations(h), pending = [];
  h.router.push = href => new Promise((resolve, reject) => pending.push({ href, resolve, reject }));
  const choose = id => selector(h).props.onChange({ target: { value: id } });
  let action = choose(lessons[1].id); h.render(); assert.deepEqual(destinations(h), original); pending[0].reject(Error('Synthetic offline')); await action; h.render(); assert.deepEqual(destinations(h), original);
  action = choose(lessons[1].id); pending[1].resolve(false); await action; h.render(); assert.deepEqual(destinations(h), original);
  action = choose(lessons[1].id); pending[2].resolve(true); await action; h.render(); assert.deepEqual(destinations(h), original, 'Promise acceptance does not commit the address');
  h.router.asPath = address(lessons[1].id); h.navigate({ eintrag: lessons[1].id }); assert.deepEqual(destinations(h), courseLinks[lessons[1].id].map(row => row.href));
  h.router.asPath = address(lessons[0].id); h.navigate({ eintrag: lessons[0].id }); assert.deepEqual(destinations(h), original, 'History restoration resolves the URL-owned scene');
});

test('Actual React rerenders preserve the real player, time and answered question when only projected links refresh', async () => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.test' + address(lessons[1].id) });
  const saved = new Map(), pauses = []; let reactRoot;
  dom.window.HTMLMediaElement.prototype.pause = function () { pauses.push(this); };
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.scrollTo = () => {};
  dom.window.requestAnimationFrame = fn => dom.window.setTimeout(fn, 0); dom.window.cancelAnimationFrame = id => dom.window.clearTimeout(id);
  Object.defineProperty(dom.window, 'localStorage', { value: { getItem() { return null; }, setItem() { throw Error('No writes expected'); } } });
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  try {
    const router = { isReady: true, query: { eintrag: lessons[1].id }, asPath: address(lessons[1].id), push() { throw Error('No navigation expected'); } };
    const Component = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': ({ children, href, prefetch, ...props }) => React.createElement('a', { href, ...props }, children),
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
    })('components/HuntingDogVideos.js').default;
    const { createRoot } = local('react-dom/client'); reactRoot = createRoot(dom.window.document.getElementById('root'));
    await React.act(async () => reactRoot.render(React.createElement(Component, { courseLinks })));
    const player = dom.window.document.querySelector('video'), choice = dom.window.document.querySelector('input[type="radio"]'); player.currentTime = 7;
    await React.act(async () => choice.click()); assert.equal(choice.checked, true);
    const pauseCount = pauses.length;
    await React.act(async () => reactRoot.render(React.createElement(Component, { courseLinks: JSON.parse(JSON.stringify(courseLinks)) })));
    assert.equal(dom.window.document.querySelector('video'), player); assert.equal(player.currentTime, 7); assert.equal(pauses.length, pauseCount); assert.equal(dom.window.document.querySelector('input[type="radio"]'), choice); assert.equal(choice.checked, true);
    assert.deepEqual([...dom.window.document.querySelectorAll('[data-dog-video-courses] a')].map(link => link.getAttribute('href')), courseLinks[lessons[1].id].map(row => row.href));
  } finally {
    if (reactRoot) await React.act(async () => reactRoot.unmount()); dom.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});

test('The Next client transform drops the server projection and its raw curriculum imports', () => {
  const filename = path.join(root, 'pages/lernen/jagdhund-videos.js');
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /hunting-dog-video-course-links-server|learning-curriculum|learning-video-library/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'components/HuntingDogVideos.js'), 'utf8'), /learning-curriculum|learning-video-library|course-links-server/);
});

test('All original dog scene objects, questions, captions and source catalog remain byte-for-byte intact', () => {
  const file = 'lib/hunting-dog-video-lessons.js';
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `f1fa75548e5c3686c1024eed99a16014e2446407:${file}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
  assert.equal(lessons.length, 4); assert.equal(lessons.flatMap(lesson => lesson.questions).length, 8); assert.ok(Object.keys(dogVideoSources).length > 0);
});
