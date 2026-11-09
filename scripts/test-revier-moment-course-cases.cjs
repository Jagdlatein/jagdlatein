// Isolated public teaching data and synthetic DOM/router/account guards only.
// No actual account, storage, network, provider action or media playback.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToString, renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const load = createLoader(), selection = load('lib/revier-moment-cases-server.js'), cases = selection.getRevierMomentCases();
const pool = load('lib/daily-review-pool.js').getDailyReviewPool(), modules = load('lib/learning-curriculum.js').learningModules;
const { getLessonReviewDate } = load('lib/learning-review-date.js');
const stamp = item => ({ dateKey: '2026-11-08', displayDate: '8. November 2026', ...item });
function component() {
  return createLoader({
    'next/link': ({ children, href, prefetch, ...props }) => React.createElement('a', { href, ...props }, children),
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  })('components/RevierMoment.js').default;
}

test('Sixty explicit unique IDs span eleven common DACH subjects, with no country-specific or legal question inferred', () => {
  assert.equal(selection.REVIER_MOMENT_IDS.length, 60); assert.equal(new Set(selection.REVIER_MOMENT_IDS).size, 60);
  assert.deepEqual(cases.map(item => item.question.id), selection.REVIER_MOMENT_IDS);
  assert.equal(new Set(cases.map(item => pool.find(question => question.id === item.question.id).category)).size, 11);
  for (const item of cases) {
    const owner = modules.find(course => course.questions.some(question => question.id === item.question.id));
    const original = owner.questions.find(question => question.id === item.question.id);
    assert.deepEqual([...original.countries].sort(), ['AT', 'CH', 'DE']); assert.notEqual(original.topic, 'Recht'); assert.notEqual(owner.category, 'Jagdrecht');
  }
});

test('Every prompt, four complete answer records, correct ID and explanation are copied literally from its actual course', () => {
  for (const item of cases) {
    const owner = modules.find(course => course.questions.some(question => question.id === item.question.id));
    const original = owner.questions.find(question => question.id === item.question.id), lesson = owner.lessons.find(lesson => lesson.id === original.lessonId);
    assert.equal(item.question.prompt, original.q); assert.deepEqual(item.question.options, original.answers); assert.deepEqual(item.question.correctIds, original.correct); assert.equal(item.question.explanation, original.explain);
    assert.equal(item.question.format, 'single'); assert.equal(item.question.options.length, 4); assert.equal(item.question.correctIds.length, 1);
    assert.equal(item.question.reviewedOn, getLessonReviewDate(lesson, owner.reviewedOn));
    assert.deepEqual(item.reading.paragraphs, lesson.paragraphs); assert.equal(item.reading.takeaway, lesson.takeaway); assert.equal(item.reading.exercise, lesson.exercise);
    assert.equal(item.href, `/kurse/${owner.id}#lesson-${encodeURIComponent(lesson.id)}`);
  }
});

test('Scoped lesson or course references retain exact existing source labels/URLs without invented statement-level source claims', () => {
  let lessonCount = 0, courseCount = 0;
  for (const item of cases) {
    const original = pool.find(question => question.id === item.question.id);
    assert.equal(item.sourceScope, original.sourceScope);
    assert.deepEqual(item.topic.sources, original.sources.map((source, index) => ({ id: `daily-source-${index + 1}`, title: source.label, url: source.url })));
    assert.deepEqual(item.question.sourceIds, item.topic.sources.map(source => source.id));
    if (item.sourceScope === 'lesson') lessonCount++; else courseCount++;
  }
  assert.equal(lessonCount, 19); assert.equal(courseCount, 41);
});

test('All sixty daily cases start with four choices and the topic, without the lesson heading giving a hint', () => {
  const Component = component();
  for (const item of cases) {
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component, { moment: stamp(item) })));
    try {
      const document = dom.window.document, main = document.querySelector('main'), source = document.querySelector('#reviermoment-quellen');
      assert.equal(document.querySelectorAll('.answerOptions button').length, 4); assert.equal(document.querySelectorAll('input[type="checkbox"],select').length, 0);
      assert.equal(document.querySelectorAll('details').length, 1); assert.equal(source.open, false); assert.equal(main.lastElementChild, source);
      assert.equal(document.querySelector('img,video,figure,audio,iframe'), null);
      assert.equal(document.querySelector('.topic').textContent, `Thema ${item.topic.title}`);
      assert.ok(document.querySelector('.topic').compareDocumentPosition(document.querySelector('#revierwissen-tagesfall')) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      assert.equal(document.querySelector('section[aria-labelledby="moment-deeper-title"]'), null, 'Read first by answering or consciously skipping, then show the full explanation');
      for (const paragraph of item.reading.paragraphs) assert.equal(main.textContent.includes(paragraph), false);
      assert.deepEqual([...source.querySelectorAll('a')].map(link => link.getAttribute('href')), item.topic.sources.map(source => source.url));
      assert.match(source.textContent, /Übernommener Prüfstand/); assert.match(source.textContent, /keine neue fachliche Prüfung/);
      if (item.sourceScope === 'course') assert.match(source.textContent, /keine zusätzliche Einzelzuordnung/);
      assert.match(main.textContent, /Deutschland, Österreich und die Schweiz/); assert.match(main.textContent, /keine amtliche Prüfungsfrage/);
    } finally { dom.window.close(); }
  }
});

test('The SSR page completes the existing paid guard before materializing any protected case and preserves denials exactly', async () => {
  let calls = 0;
  for (const denial of [{ redirect: { destination: '/login?next=%2Ftagesquiz', permanent: false } }, { redirect: { destination: '/preise?next=%2Ftagesquiz', permanent: false } }, { redirect: { destination: '/konto?access=unavailable', permanent: false } }, { notFound: true }]) {
    const context = { req: {}, res: { setHeader() {} }, resolvedUrl: '/tagesquiz' };
    const page = createLoader({ '../lib/account-access': { getPaidPageProps: async received => { assert.equal(received, context); return denial; } }, '../lib/revier-moment-server': { getRevierMoment() { calls++; throw Error('Denied content must never be projected'); } } })('pages/tagesquiz.js');
    assert.equal(await page.getServerSideProps(context), denial);
  }
  assert.equal(calls, 0);
  const headers = new Map(), context = { req: {}, res: { setHeader: (key, value) => headers.set(key, value) }, resolvedUrl: '/tagesquiz' }, events = [];
  const page = createLoader({ '../lib/account-access': { getPaidPageProps: async received => { assert.equal(received, context); headers.set('Cache-Control', 'private, no-store, max-age=0'); events.push('guard'); return { props: {} }; } }, '../lib/revier-moment-server': { getRevierMoment() { events.push('case'); return stamp(cases[0]); } } })('pages/tagesquiz.js');
  const result = await page.getServerSideProps(context); assert.deepEqual(events, ['guard', 'case']); assert.deepEqual(Object.keys(result.props), ['moment']); assert.equal(headers.get('Cache-Control'), 'private, no-store, max-age=0');
});

test('Next client transforms exclude the curated bank and complete curriculum from daily reader and public teaser pages', () => {
  for (const file of ['pages/tagesquiz.js', 'pages/index.js']) {
    const filename = path.join(root, file), { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    assert.match(code, /__N_SSP/); assert.doesNotMatch(code, /revier-moment-server|revier-moment-cases-server|learning-curriculum|daily-review-pool|account-access/);
  }
});

test('The real unsigned SSR guard returns login and no protected data even for a direct Next data request', async () => {
  const headers = new Map(); let projections = 0;
  const page = createLoader({ '../lib/revier-moment-server': { getRevierMoment() { projections++; throw Error('No unsigned projection'); } } })('pages/tagesquiz.js');
  const result = await page.getServerSideProps({ req: { url: '/_next/data/synthetic/tagesquiz.json', cookies: {}, headers: {} }, res: { setHeader: (key, value) => headers.set(key, value) }, resolvedUrl: '/tagesquiz' });
  assert.deepEqual(result, { redirect: { destination: '/login?next=%2Ftagesquiz', permanent: false } }); assert.equal(projections, 0); assert.match(headers.get('Cache-Control'), /private, no-store/);
});

test('Actual hydration, answer/skip and day/case remount keep four choices, current explanation and final-only sources without persistence', async () => {
  const Component = component(), first = stamp(cases[0]), next = { ...stamp(cases[1]), dateKey: '2026-11-09', displayDate: '9. November 2026' };
  const html = renderToString(React.createElement(Component, { moment: first })), dom = new JSDOM('<!doctype html><div id="root">' + html + '</div>', { url: 'https://jagdlatein.test/tagesquiz' });
  const saved = new Map(), warnings = []; let reactRoot;
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  Object.defineProperty(dom.window, 'localStorage', { get() { throw Error('Daily never reads or writes private storage'); } });
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const previousError = console.error; console.error = (...values) => warnings.push(values.map(String).join(' '));
  try {
    const { hydrateRoot } = local('react-dom/client'), container = dom.window.document.getElementById('root');
    await React.act(async () => { reactRoot = hydrateRoot(container, React.createElement(Component, { moment: first })); });
    assert.equal(warnings.length, 0); const choices = () => [...dom.window.document.querySelectorAll('.answerOptions button')]; assert.equal(choices().length, 4);
    const oldButton = choices().find(button => button.textContent === first.question.options.find(option => option.id === first.question.correctIds[0]).text);
    await React.act(async () => oldButton.click()); assert.ok(dom.window.document.querySelector('.quizFeedback').textContent.includes(first.question.explanation)); assert.ok(choices().every(button => button.disabled)); assert.equal(dom.window.document.querySelectorAll('details').length, 1);
    const firstReading = dom.window.document.querySelector('section[aria-labelledby="moment-deeper-title"]'); assert.ok(firstReading); for (const paragraph of first.reading.paragraphs) assert.ok(firstReading.textContent.includes(paragraph)); assert.equal(firstReading.closest('[role="status"]'), null);
    await React.act(async () => reactRoot.render(React.createElement(Component, { moment: next }))); assert.equal(choices().length, 4); assert.ok(choices().every(button => !button.disabled)); assert.equal(dom.window.document.querySelector('.quizFeedback'), null);
    assert.equal(dom.window.document.querySelector('section[aria-labelledby="moment-deeper-title"]'), null);
    await React.act(async () => oldButton.click()); assert.equal(dom.window.document.querySelector('.quizFeedback'), null);
    const skip = [...dom.window.document.querySelectorAll('button')].find(button => button.textContent === 'Weiß ich noch nicht');
    await React.act(async () => skip.click()); assert.ok(dom.window.document.querySelector('.quizFeedback').textContent.includes(next.question.explanation)); assert.equal(dom.window.document.querySelectorAll('details').length, 1);
    const nextReading = dom.window.document.querySelector('section[aria-labelledby="moment-deeper-title"]'); assert.ok(nextReading); for (const paragraph of next.reading.paragraphs) assert.ok(nextReading.textContent.includes(paragraph)); assert.equal(nextReading.querySelector('a').getAttribute('href'), next.href);
    const main = dom.window.document.querySelector('main'); assert.equal(main.lastElementChild.id, 'reviermoment-quellen');
    await React.act(async () => reactRoot.unmount()); reactRoot = null; await React.act(async () => oldButton.click()); assert.equal(container.textContent, '');
    assert.equal(warnings.length, 0);
  } finally {
    if (reactRoot) await React.act(async () => reactRoot.unmount()); console.error = previousError; dom.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});

test('All sixty actual answered readers reveal every literal paragraph, takeaway/exercise and exact lesson link only after feedback', async () => {
  const Component = component(), dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://jagdlatein.test/tagesquiz' });
  const saved = new Map(); let reactRoot;
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  Object.defineProperty(dom.window, 'localStorage', { get() { throw Error('No private storage is part of a daily case'); } });
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  try {
    const { createRoot } = local('react-dom/client'); reactRoot = createRoot(dom.window.document.getElementById('root'));
    for (const item of cases) {
      await React.act(async () => reactRoot.render(React.createElement(Component, { moment: stamp(item) })));
      const document = dom.window.document;
      assert.equal(document.querySelector('section[aria-labelledby="moment-deeper-title"]'), null);
      assert.equal(document.querySelectorAll('.answerOptions button').length, 4);
      await React.act(async () => document.querySelector('.answerOptions button').click());
      const feedback = document.querySelector('.quizFeedback'), reading = document.querySelector('section[aria-labelledby="moment-deeper-title"]');
      assert.ok(feedback.textContent.includes(item.question.explanation)); assert.ok(reading); assert.equal(reading.closest('[role="status"]'), null);
      assert.equal(reading.querySelector('h2').textContent, item.reading.title);
      assert.ok(feedback.compareDocumentPosition(reading) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      for (const paragraph of item.reading.paragraphs) assert.ok(reading.textContent.includes(paragraph));
      for (const key of ['takeaway', 'exercise']) if (item.reading[key]) assert.ok(reading.textContent.includes(item.reading[key]));
      assert.equal(reading.querySelector('a').getAttribute('href'), item.href);
      assert.equal(document.querySelectorAll('details').length, 1); assert.equal(document.querySelector('main').lastElementChild.id, 'reviermoment-quellen');
    }
  } finally {
    if (reactRoot) await React.act(async () => reactRoot.unmount()); dom.window.close();
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
});

test('Three-format research reducer and original research catalogs are untouched; optional reading never appears in ordinary rounds', () => {
  for (const file of ['lib/research-question-round.js', 'lib/practice-research.js', 'lib/practice-research-server.js']) assert.equal(fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `f1fa75548e5c3686c1024eed99a16014e2446407:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 5000000 }).replaceAll('\r\n', '\n'));
  const Round = load('components/ResearchQuestionRound.js').default;
  const html = renderToStaticMarkup(React.createElement(Round, { questions: [cases[0].question], sources: cases[0].topic.sources, afterAnswer: React.createElement('p', null, 'Synthetic daily-only reading') }));
  assert.doesNotMatch(html, /Synthetic daily-only reading/);
  const source = fs.readFileSync(path.join(root, 'components/ResearchQuestionRound.js'), 'utf8').replaceAll('\r\n', '\n');
  const withoutOptionalDailyNode = source.replace(', afterAnswer })', ' })').replace('      {daily && result ? afterAnswer : null}\n', '');
  assert.equal(withoutOptionalDailyNode, execFileSync('git', ['show', 'f1fa75548e5c3686c1024eed99a16014e2446407:components/ResearchQuestionRound.js'], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
});
