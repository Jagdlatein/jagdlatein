const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader(), { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { miniCourses } = load('lib/course-catalog.js'), { miniCourseDetails, miniCourseLessonTargets } = load('lib/mini-course-details.js');
const project = load('lib/course-mini-links-server.js').getCourseMiniLinks, Links = load('components/CourseMiniLinks.js').default;

test('Every existing authored mini-course recommendation has its reverse topic link, with no inferred or missing course', () => {
  const before = JSON.stringify([learningModules, miniCourses, miniCourseDetails, miniCourseLessonTargets]);
  let connections = 0, maximumBytes = 0;
  for (const module of learningModules) {
    const links = project(module); assert.equal(new Set(links.map(link => link.id)).size, links.length);
    assert.deepEqual(links.map(link => link.title), links.map(link => link.title).toSorted((a, b) => a.localeCompare(b, 'de')));
    for (const link of links) {
      assert.deepEqual(Object.keys(link).sort(), ['id', 'title', 'href', 'lessonIds'].sort());
      const mini = miniCourses.find(item => item.id === link.id); assert.ok(mini); assert.equal(link.href, mini.href);
      assert.equal(link.title, miniCourseDetails[mini.id].title || mini.title.replace(/^[^\p{L}\p{N}]+/u, ''));
      if (link.lessonIds === null) assert.ok(miniCourseDetails[mini.id].modules.includes(module.id));
      else for (const lessonId of link.lessonIds) assert.ok(miniCourseLessonTargets[mini.id].some(target => target.moduleId === module.id && target.lessonId === lessonId));
      connections++;
    }
    for (const mini of miniCourses) {
      const authored = miniCourseDetails[mini.id].modules.includes(module.id) || (miniCourseLessonTargets[mini.id] || []).some(target => target.moduleId === module.id && module.lessons.some(lesson => lesson.id === target.lessonId));
      assert.equal(links.some(link => link.id === mini.id), authored, `${module.id}: ${mini.id}`);
    }
    maximumBytes = Math.max(maximumBytes, Buffer.byteLength(JSON.stringify(links)));
  }
  assert.ok(connections > 34); assert.ok(maximumBytes < 3000);
  assert.equal(JSON.stringify([learningModules, miniCourses, miniCourseDetails, miniCourseLessonTargets]), before);
});

test('Exact lesson recommendations are visible only at their assigned lesson; broad topic recommendations remain broad', () => {
  const module = getLearningModule('wissen-ausbau-biologie-verdauungsvergleich-2026'), links = project(module);
  assert.deepEqual(links.find(link => link.id === 'federwild').lessonIds, ['gewoelle']);
  for (const lesson of module.lessons) {
    const visible = nodes(Links({ links, lessonId: lesson.id }), node => typeof node.props?.href === 'string').map(node => node.props.href);
    assert.deepEqual(visible, lesson.id === 'gewoelle' ? ['/kurse/federwild', '/kurse/greifvoegel'] : []);
  }
  for (const id of ['gewoelle-suffix', 'prefix-gewoelle', 'Gewoelle']) assert.deepEqual(project({ ...module, lessons: [{ id }] }), []);
  assert.deepEqual(project({ ...module, lessons: [{ id: 'gewoelle' }, { id: 'gewoelle' }] }), []);
  for (const [id, lessonIds, miniIds] of [
    ['wissen-ausbau-federaufbau-funktion-2026', ['schwingen', 'steuerfedern'], ['federwild', 'greifvoegel']],
    ['wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026', ['zuendungsarten', 'laufprofil', 'flintenpatronen'], ['ballistik', 'waffen']],
  ]) {
    const current = getLearningModule(id), selected = project(current);
    for (const miniId of miniIds) assert.deepEqual(selected.find(link => link.id === miniId).lessonIds, lessonIds);
    for (const lesson of current.lessons) {
      const visible = nodes(Links({ links: selected, lessonId: lesson.id }), node => typeof node.props?.href === 'string').map(node => node.props.href);
      assert.deepEqual(visible, lessonIds.includes(lesson.id) ? miniIds.map(miniId => `/kurse/${miniId}`) : []);
    }
  }
  const broad = project(getLearningModule('wissen-waffensicherheit')); assert.ok(broad.length > 0); assert.ok(broad.every(link => link.lessonIds === null));
  assert.equal(nodes(Links({ links: broad, lessonId: 'any-current-lesson' }), node => typeof node.props?.href === 'string').length, broad.length);
});

test('Unknown and malformed courses have no fallback links or empty menu window', () => {
  for (const module of [null, undefined, {}, { id: 'unknown', lessons: [{ id: 'gewoelle' }] }, { id: 'constructor', lessons: [{ id: 'a' }] }, { id: 'wissen-waffensicherheit' }, { id: 'wissen-waffensicherheit', lessons: [] }]) assert.deepEqual(project(module), []);
  assert.equal(Links({}), null); assert.equal(Links({ links: [], lessonId: 'any' }), null);
});

test('All course SSG props retain original content and existing links while carrying only the small optional projection', () => {
  const page = load('pages/kurse/[slug].js'), cards = load('lib/learning-flashcards.js'), wildlife = load('lib/course-wildlife-links-server.js');
  for (const module of learningModules) {
    const result = page.getStaticProps({ params: { slug: module.id } });
    assert.equal(result.props.module, module); assert.deepEqual(result.props.flashcards, cards.getFlashcardLessonSummary(module.id));
    assert.deepEqual(result.props.wildlifeLinks, wildlife.getCourseWildlifeLinks(module));
    assert.deepEqual(result.props.miniCourseLinks, project(module));
    assert.equal(page.default(result.props).props.miniCourseLinks, result.props.miniCourseLinks);
  }
  assert.deepEqual(page.getStaticProps({ params: { slug: 'missing' } }), { notFound: true });
});

test('The stateless presentation opens existing internal mini courses without prefetch, another window, copied answers or extra controls', () => {
  const links = project(getLearningModule('wissen-waffensicherheit')), tree = Links({ links, lessonId: 'any' });
  assert.equal(text(nodes(tree, node => node.type === 'h3')[0]), 'Mini-Kurse');
  assert.match(text(tree), /zum Themengebiet/);
  for (const link of nodes(tree, node => typeof node.props?.href === 'string')) { assert.match(link.props.href, /^\/kurse\/[a-z0-9-]+$/); assert.equal(link.props.prefetch, false); assert.equal(link.props.target, undefined); }
  assert.equal(nodes(tree, node => ['button', 'input', 'select', 'dialog', 'details', 'form'].includes(node.type)).length, 0);
  const SSR = createLoader({ 'next/link': ({ href, children, prefetch, ...rest }) => React.createElement('a', { href, ...rest }, children) })('components/CourseMiniLinks.js').default;
  const html = renderToStaticMarkup(React.createElement(SSR, { links, lessonId: 'any' }));
  assert.match(html, /data-course-mini-links/); assert.doesNotMatch(html, /target=|<dialog|<details|Quellen/);
});

test('The client transform excludes the server projection and the presentation imports no curriculum or question bank', () => {
  const filename = path.join(root, 'pages/kurse/[slug].js'), swc = local('next/dist/build/swc');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /course-mini-links-server|mini-course-details|course-catalog|learning-curriculum|learning-flashcards/);
  for (const file of ['components/CourseMiniLinks.js', 'components/LearningCourse.js']) assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /course-mini-links-server|mini-course-details|course-catalog|learning-curriculum/);
});

test('The actual course owner binds reverse links to its current lesson inside the existing lower menu and preserves learning and final sources', () => {
  const module = getLearningModule('wissen-ausbau-biologie-verdauungsvergleich-2026'), links = project(module), PageMenu = () => null;
  for (let index = 0; index < module.lessons.length; index++) {
    let cursor = 0;
    const hooks = { ...React, useState(initial) { const value = cursor++ === 1 ? index : typeof initial === 'function' ? initial() : initial; return [value, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${module.id}` }) }, '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() {} } })('components/LearningCourse.js').default;
    const element = Course({ module, miniCourseLinks: links }), tree = element.type(element.props), menu = nodes(tree, node => node.type === PageMenu)[0];
    const children = nodes(menu, node => node.type?.name === 'CourseMiniLinks'); assert.equal(children.length, 1);
    assert.equal(children[0].props.lessonId, module.lessons[index].id); assert.equal(children[0].props.links, links);
    assert.equal(nodes(tree, node => node.type?.name === 'CourseMiniLinks').length, 1);
    const reading = nodes(tree, node => node.type === 'article' && node.props?.['aria-labelledby'] === 'current-lesson-heading')[0];
    for (const paragraph of module.lessons[index].paragraphs) assert.ok(text(reading).includes(paragraph));
    const details = nodes(tree, node => node.type === 'details'); assert.equal(details.at(-1).props.id, 'quellen'); assert.equal(details.at(-1).props.open, false);
  }
});
