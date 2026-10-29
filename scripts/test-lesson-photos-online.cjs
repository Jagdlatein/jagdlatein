// Real React lifecycle and isolated DOM/router. No browser, account or user storage.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const load = createLoader();
const course = load('lib/learning-curriculum.js').getLearningModule('wissen-gams-steinbock');
const lessonPhotos = load('lib/lesson-photos-server.js').getCourseLessonPhotos(course);
const wrap = value => ({ __esModule: true, default: value });
const settle = async () => { for (let n = 0; n < 8; n++) await Promise.resolve(); };

async function fixture(t, initialHash = '', module = course, pictures = lessonPhotos) {
  const base = `/kurse/${module.id}`;
  const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: `https://pictures.invalid${base}${initialHash}` });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  dom.window.HTMLElement.prototype.scrollIntoView = () => {}; dom.window.scrollTo = () => {};
  const requests = [];
  const router = { isReady: true, asPath: base + initialHash, replace(href, as, options) {
    return new Promise((resolve, reject) => requests.push({ href, as, options, resolve, reject }));
  } };
  const Component = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children),
    'next/image': ({ unoptimized, priority, fill, ...props }) => React.createElement('img', props),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', null, children)), closePageMenu() {} },
    '../hooks/useSelectionPageStart': wrap(() => ({ focusSelection() {}, cancelSelectionFocus() {} })),
    '../hooks/useCourseProgress': wrap(() => ({ error: null, retry() {} })),
  })('components/LearningCourse.js').default;
  let root = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = action => React.act(async () => { action(); await settle(); });
  const render = () => act(() => root.render(React.createElement(Component, { module, lessonPhotos: pictures })));
  const unmount = async () => { if (root) { await act(() => root.unmount()); root = null; } };
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, descriptor] of saved) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; });
  await render();
  const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
  const route = async hash => { dom.window.history.replaceState(null, '', base + hash); router.asPath = base + hash; await render(); };
  return { act, render, route, requests, button, unmount,
    lesson: () => document.querySelector('article[aria-labelledby="current-lesson-heading"]'),
    feedback: () => document.querySelector('[data-lesson-photos="feedback"]'),
    answer: () => document.querySelector('[aria-labelledby="current-question"] button'),
  };
}

test('Full paragraphs remain in order and exact explanatory photos follow only the matching first paragraph', async t => {
  const h = await fixture(t), article = h.lesson(), first = article.querySelector('[data-lesson-photos="lesson"]');
  assert.ok(first); assert.equal(first.previousElementSibling.textContent, course.lessons[0].paragraphs[0]);
  assert.deepEqual([...article.querySelector('.lessonText').children].map(node => node.firstElementChild.textContent), course.lessons[0].paragraphs);
  assert.deepEqual([...article.querySelectorAll('img')].map(image => image.getAttribute('src')), lessonPhotos['berg-merkmale'].map(photo => photo.src));
  for (const photo of lessonPhotos['berg-merkmale']) {
    const figure = first.querySelector(`[data-lesson-photo="${photo.id}"]`);
    assert.ok(figure.textContent.includes(photo.limit)); assert.ok(figure.textContent.includes('© Giles Laurent'));
    assert.ok(figure.textContent.includes('gileslaurent.com')); assert.ok(figure.textContent.includes('License CC BY-SA 4.0'));
    assert.equal(figure.querySelectorAll('a').length, 0);
    assert.equal(figure.querySelector('img').style.maxWidth, `${photo.width}px`);
  }
  await h.route('#lesson-berg-lebensraum'); assert.equal(h.lesson().querySelectorAll('img').length, 0);
  assert.ok(h.lesson().textContent.includes(course.lessons[1].paragraphs[0]));
  await h.route('#lesson-berg-merkmale'); assert.equal(h.lesson().querySelectorAll('img').length, 2);
});

test('Failed or pending lesson choice never shows the destination picture or removes the committed explanation', async t => {
  const h = await fixture(t);
  await h.act(() => h.button('Nächste Lektion').click()); assert.equal(h.requests.length, 1);
  assert.equal(h.lesson().querySelectorAll('img').length, 2);
  await h.act(() => h.requests[0].reject(new Error('isolated route failure')));
  assert.equal(h.lesson().querySelectorAll('img').length, 2); assert.ok(document.querySelector('[role="alert"]'));
  await h.act(() => h.button('Nächste Lektion').click()); assert.equal(h.requests.length, 2);
  await h.route('#lesson-berg-lebensraum'); assert.equal(h.lesson().querySelectorAll('img').length, 0);
  await h.act(() => h.requests[1].resolve(true)); assert.equal(h.lesson().querySelectorAll('img').length, 0);
});

test('Quiz pictures are absent before answering and follow the question lesson rather than the open reading lesson', async t => {
  const h = await fixture(t, '#lesson-berg-lebensraum');
  await h.act(() => h.button('Wissen prüfen').click());
  assert.ok(h.answer()); assert.equal(h.feedback(), null); assert.equal(h.lesson().querySelectorAll('img').length, 0);
  for (let index = 0; index < 4; index++) {
    assert.equal(h.feedback(), null, 'Each next question hides the previous explanation photos');
    await h.act(() => h.answer().click());
    const question = course.questions[index];
    assert.ok(document.querySelector('#wissenscheck [role="status"]').textContent.includes(question.explain));
    if (question.lessonId === 'berg-merkmale') assert.deepEqual([...h.feedback().querySelectorAll('img')].map(image => image.getAttribute('src')), lessonPhotos['berg-merkmale'].map(photo => photo.src));
    else assert.equal(h.feedback(), null, 'No unrelated picture is invented for a different question');
    assert.equal(h.lesson().querySelectorAll('img').length, 0);
    await h.act(() => h.button('Nächste Frage').click());
  }
});

test('Complete photo sources stay in the last initially closed source section; inline pictures are not duplicated in galleries', async t => {
  const h = await fixture(t), footer = document.getElementById('quellen');
  assert.equal(footer.open, false); assert.equal(document.querySelector('main').lastElementChild, footer);
  for (const link of document.querySelectorAll('main a[href^="https://"]')) assert.ok(footer.contains(link), link.outerHTML);
  for (const photo of lessonPhotos['berg-merkmale']) {
    assert.equal(document.querySelectorAll(`img[src="${photo.src}"]`).length, 1);
    assert.equal(footer.querySelectorAll(`a[href="${photo.sourceUrl}"]`).length, 1);
    assert.equal(footer.querySelectorAll(`a[href="${photo.licenseUrl}"]`).length, 2, 'Two distinct works retain their own shared license link');
    assert.ok(footer.textContent.includes(photo.modifications));
    assert.ok(footer.textContent.includes(decodeURIComponent(new URL(photo.sourceUrl).pathname.split('/wiki/File:')[1]).replaceAll('_', ' ')));
  }
  await h.route('#quellen'); assert.equal(footer.open, true);
});

test('A course without an audited placement retains its full text without a fabricated explanatory photograph', async t => {
  const plain = load('lib/learning-curriculum.js').getLearningModule('wissen-ausbau-biologie-wiederkaeuer-2026');
  const h = await fixture(t, '', plain, {});
  for (const paragraph of plain.lessons[0].paragraphs) assert.ok(h.lesson().textContent.includes(paragraph));
  assert.equal(document.querySelector('[data-lesson-photos]'), null);
  assert.equal(document.querySelector('[aria-label="Bildnachweise zu den Erklärungen"]'), null);
});
