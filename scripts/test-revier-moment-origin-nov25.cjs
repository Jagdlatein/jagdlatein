// Actual React/native callbacks with synthetic ready-router/browser identities.
// No account, storage, network, real browser automation or media is involved.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), { execFileSync } = require('node:child_process');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the existing isolated jsdom module.', { cause: error }); }
const React = local('react'), wrap = value => ({ __esModule: true, default: value });
const load = createLoader(), server = load('lib/revier-moment-server.js');
const first = server.getRevierMoment(new Date('2026-11-25T12:00:00Z')), next = server.getRevierMoment(new Date('2026-11-26T12:00:00Z'));
const source = '/tagesquiz?ref=source&ref=second#revierwissen-tagesfall-title';
const foreign = '/lernen/artenwissen?eintrag=gams&ref=new#artenwissen-title';
const tick = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function queryOf(href) { const query = {}, params = new URL(href, 'https://isolated.invalid').searchParams; for (const key of new Set(params.keys())) { const values = params.getAll(key); query[key] = values.length === 1 ? values[0] : values; } return query; }
function native(node, name = 'onClick') { assert.ok(node); const key = Object.keys(node).find(key => key.startsWith('__reactProps$')); assert.ok(key); assert.equal(typeof node[key][name], 'function'); return node[key][name]; }
const withheld = node => Boolean(node?.closest('[hidden][inert][aria-hidden="true"]') && node.closest('[hidden]').style.display === 'none');
async function fixture({ href = source, ready = true, moment = first, roundProps } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://isolated.invalid' + href }), saved = new Map(), focuses = [];
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value }); }
  Object.defineProperty(dom.window, 'localStorage', { get() { throw Error('A daily case must not persist or inspect answers'); } });
  dom.window.HTMLElement.prototype.focus = function () { focuses.push(this.textContent); };
  dom.window.HTMLElement.prototype.scrollIntoView = () => {}; dom.window.scrollTo = () => {};
  const router = { isReady: ready, pathname: '/tagesquiz', asPath: href, query: queryOf(href) };
  const ui = createLoader({ 'next/router': { useRouter: () => router },
    'next/link': wrap(({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children)),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
  });
  const Component = ui(roundProps ? 'components/ResearchQuestionRound.js' : 'components/RevierMoment.js').default;
  const { createRoot } = local('react-dom/client'), host = dom.window.document.getElementById('root'), root = createRoot(host);
  let props = roundProps || { moment }, mounted = true;
  const h = { dom, host, router, focuses,
    async render(value = props) { props = value; await React.act(async () => { root.render(React.createElement(Component, props)); await tick(); }); },
    reader: () => host.querySelector('[data-revier-moment-reader]'), feedback: () => host.querySelector('.quizFeedback'), reading: () => host.querySelector('section[aria-labelledby="moment-deeper-title"]'),
    options: () => [...host.querySelectorAll('.answerOptions button')],
    button(label) { return [...host.querySelectorAll('button')].find(node => node.textContent.trim() === label); },
    answer() { return this.options().find(node => node.textContent === props.moment.question.options.find(option => option.id === props.moment.question.correctIds[0]).text); },
    async invoke(callback, ...args) { await React.act(async () => { callback(...args); await tick(); }); },
    address(value) { dom.window.history.replaceState(null, '', value); },
    adopt(value) { router.asPath = value; router.pathname = new URL(value, 'https://isolated.invalid').pathname; router.query = queryOf(value); },
    async commit(value) { this.address(value); this.adopt(value); await this.render(); },
    async unmount() { if (mounted) { await React.act(async () => root.unmount()); mounted = false; } },
    async cleanup() { await this.unmount(); dom.window.close(); for (const [key, value] of saved) if (value) Object.defineProperty(global, key, value); else delete global[key]; },
  };
  await h.render(); return h;
}

for (const phase of ['browser-first-before-render', 'browser-first-after-render', 'router-first-before-render', 'router-first-after-render']) for (const action of ['answer', 'skip']) test(`Daily ${action} is inert for ${phase}`, async () => {
  const h = await fixture();
  try {
    const callback = native(action === 'answer' ? h.answer() : h.button('Weiß ich noch nicht'));
    assert.equal(h.options().length, 4); assert.equal(h.feedback() === null, true); assert.equal(h.reading() === null, true);
    if (phase.startsWith('browser')) h.address(foreign); else h.adopt(foreign);
    if (phase.endsWith('after-render')) { await h.render(); assert.equal(withheld(h.reader()), true); }
    await h.invoke(callback); assert.equal(h.feedback() === null, true); assert.equal(h.reading() === null, true);
    assert.equal(h.options().every(node => !node.disabled), true);
  } finally { await h.cleanup(); }
});

test('Complete raw hash, unknown duplicate order, query value and readiness mismatches cannot reveal the old case', async () => {
  for (const drift of ['hash', 'duplicate-order', 'query-value', 'ready']) {
    const h = await fixture();
    try {
      const answer = native(h.answer());
      if (drift === 'hash') h.address(source.replace('#revierwissen-tagesfall-title', '#foreign'));
      else if (drift === 'duplicate-order') h.router.query.ref = ['second', 'source'];
      else if (drift === 'query-value') h.router.query.ref = ['source', 'changed'];
      else h.router.isReady = false;
      await h.invoke(answer); assert.equal(h.feedback() === null, true); assert.equal(h.reading() === null, true);
      await h.render(); assert.equal(withheld(h.reader()), true);
    } finally { await h.cleanup(); }
  }
});

test('Native popstate/hashchange withhold a single retained case and restoration preserves an answer and open final sources', async () => {
  for (const event of ['popstate', 'hashchange']) {
    const h = await fixture();
    try {
      await h.invoke(native(h.answer())); const reader = h.reader(), feedback = h.feedback(), reading = h.reading(), sources = h.host.querySelector('#reviermoment-quellen');
      sources.open = true; const text = reader.textContent, destination = event === 'popstate' ? foreign : source.replace('#revierwissen-tagesfall-title', '#other');
      await h.invoke(() => { h.address(destination); h.dom.window.dispatchEvent(new h.dom.window.Event(event)); });
      assert.equal(h.reader() === reader, true); assert.equal(withheld(reader), true); assert.equal(h.host.querySelectorAll('[data-revier-moment-reader]').length, 1);
      await h.commit(source); assert.equal(withheld(reader), false); assert.equal(h.feedback() === feedback, true); assert.equal(h.reading() === reading, true); assert.equal(reader.textContent, text); assert.equal(sources.open, true);
      assert.equal(reader.lastElementChild === sources, true); assert.equal(h.options().every(node => node.disabled), true);
    } finally { await h.cleanup(); }
  }
});

test('A current answer reveals exactly its existing full lesson and replacement day rejects old captured actions', async () => {
  const h = await fixture();
  try {
    const old = native(h.answer()); await h.invoke(old); assert.ok(h.feedback().textContent.includes(first.question.explanation));
    for (const paragraph of first.reading.paragraphs) assert.ok(h.reading().textContent.includes(paragraph));
    await h.render({ moment: next }); assert.equal(h.feedback() === null, true); assert.equal(h.reading() === null, true); await h.invoke(old); assert.equal(h.feedback() === null, true);
    await h.invoke(native(h.answer())); assert.ok(h.feedback().textContent.includes(next.question.explanation));
    await h.unmount(); await h.invoke(old); assert.equal(h.host.textContent, '');
  } finally { await h.cleanup(); }
});

test('Captured links for lesson, review and ranked quiz keep exact targets and reject live drift or unmount', async () => {
  const h = await fixture();
  try {
    await h.invoke(native(h.answer()));
    const targets = [first.href, first.practice.reviewHref, first.practice.quizHref].filter(Boolean), handlers = targets.map(href => {
      const anchor = [...h.host.querySelectorAll('a')].find(node => node.getAttribute('href') === href); assert.ok(anchor); return native(anchor);
    });
    for (const handler of handlers) { let blocked = false; await h.invoke(handler, { preventDefault() { blocked = true; } }); assert.equal(blocked, false); }
    h.address(foreign);
    for (const handler of handlers) { let blocked = false; await h.invoke(handler, { preventDefault() { blocked = true; } }); assert.equal(blocked, true); }
    await h.unmount();
    for (const handler of handlers) { let blocked = false; await h.invoke(handler, { preventDefault() { blocked = true; } }); assert.equal(blocked, true); }
  } finally { await h.cleanup(); }
});

test('A queued transition answer rechecks its original owner when the reducer applies it', async () => {
  const h = await fixture();
  try {
    const answer = native(h.answer());
    await React.act(async () => { React.startTransition(() => answer()); h.address(foreign); await tick(); });
    assert.equal(h.feedback() === null, true); assert.equal(h.reading() === null, true);
    await h.commit(source); await h.invoke(native(h.answer())); assert.ok(h.feedback().textContent.includes(first.question.explanation));
  } finally { await h.cleanup(); }
});

const research = load('lib/practice-research-server.js').getPracticeResearchData();
for (const format of ['single', 'multiple', 'sequence']) test(`Default shared ${format} rounds retain their answer, move, focus and restart behaviour`, async () => {
  const question = research.questions.find(item => item.format === format); assert.ok(question);
  const topic = research.topics.find(item => item.id === question.topicId), h = await fixture({ roundProps: { questions: [question], sources: topic.sources } });
  try {
    assert.equal(h.feedback() === null, true);
    if (format === 'single') await h.invoke(native(h.options().find(node => node.textContent === question.options.find(option => option.id === question.correctIds[0]).text)));
    else if (format === 'multiple') {
      for (const id of question.correctIds) { const label = [...h.host.querySelectorAll('label')].find(node => node.textContent === question.options.find(option => option.id === id).text); await h.invoke(native(label.querySelector('input'), 'onChange')); }
      await h.invoke(native(h.button('Antwort prüfen')));
    } else {
      for (const [position, id] of question.expectedOrder.entries()) await h.invoke(native(h.host.querySelectorAll('select')[position], 'onChange'), { target: { value: id } });
      await h.invoke(native(h.button('Antwort prüfen')));
    }
    assert.ok(h.feedback().textContent.includes(question.explanation)); assert.ok(h.feedback().textContent.includes('Richtig eingeordnet'));
    const old = native(h.button('Runde auswerten')); await h.invoke(old); assert.match(h.host.textContent, /1 von 1 richtig/); assert.ok(h.focuses.length);
    await h.invoke(native(h.button('Neu gemischt üben'))); assert.equal(h.feedback() === null, true); await h.invoke(old); assert.equal(h.feedback() === null, true); assert.doesNotMatch(h.host.textContent, /1 von 1 richtig/);
  } finally { await h.cleanup(); }
});

test('A captured shared predicate cannot adopt a later owner permission; current standalone use remains available', async () => {
  const question = research.questions.find(item => item.format === 'single'), topic = research.topics.find(item => item.id === question.topicId); let owner = true;
  const baseProps = { questions: [question], sources: topic.sources }, h = await fixture({ roundProps: { ...baseProps, canInteract: () => owner } });
  try {
    const answer = native(h.options()[0]); owner = false; await h.render({ ...baseProps, canInteract: () => true }); await h.invoke(answer); assert.equal(h.feedback() === null, true);
    await h.invoke(native(h.options()[0])); assert.ok(h.feedback());
  } finally { await h.cleanup(); }
});

test('SSR route identity preserves ordinary blind content and rejects malformed or partial routes without reading a browser', () => {
  const { revierMomentRoute } = load('lib/revier-moment-navigation.js');
  assert.equal(revierMomentRoute({ isReady: true, asPath: '/tagesquiz', query: {} }).ready, true);
  for (const router of [undefined, {}, { isReady: false, asPath: '/tagesquiz', query: {} }, { isReady: true, asPath: foreign, query: queryOf(foreign) }, { isReady: true, asPath: '//foreign.invalid/tagesquiz', query: {} }, { isReady: true, asPath: '/tagesquiz?ref=a&ref=b', query: { ref: ['b', 'a'] } }, { isReady: true, asPath: '/tagesquiz', query: { unknown: null } }]) assert.equal(revierMomentRoute(router).ready, false);
  const html = local('react-dom/server').renderToStaticMarkup(React.createElement(createLoader({ 'next/router': { useRouter: () => ({ isReady: true, asPath: '/tagesquiz', query: {} }) }, './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)) })('components/RevierMoment.js').default, { moment: first }));
  assert.equal((html.match(/class="answerOption"/g) || []).length, 4); assert.doesNotMatch(html, /class="quizFeedback"|moment-deeper-title/); assert.ok(html.includes('Übernommener Prüfstand'));
});

test('Only the reviewed selection changes; complete adapter code, dates, grading and server access retain their released baseline', () => {
  const baseline = '61019897797d9fe851ff3bb25e46a5a5a534e578';
  for (const file of ['lib/revier-moment-server.js', 'lib/revier-moment-cases-server.js', 'lib/research-question-round.js', 'lib/practice-research.js', 'lib/practice-research-server.js', 'pages/tagesquiz.js']) {
    const actual = fs.readFileSync(repo + '/' + file, 'utf8').replace(/\r\n/g, '\n');
    const expected = execFileSync('git', ['show', baseline + ':' + file], { cwd: repo, encoding: 'utf8', maxBuffer: 5000000 }).replace(/\r\n/g, '\n');
    if (file === 'lib/revier-moment-cases-server.js') {
      const block = /export const REVIER_MOMENT_IDS = Object\.freeze\(\[[\s\S]*?\n\]\);/g;
      const before = [...expected.matchAll(block)], after = [...actual.matchAll(block)];
      assert.equal(before.length, 1); assert.equal(after.length, 1);
      assert.equal(require('node:crypto').createHash('sha256').update(after[0][0]).digest('hex'), '3b13aa27028b612d026e5b54efd9ba183c2d396f6a3412f5cd41e8e0d6edeb06', 'Only the independently reviewed literal60-ID block is permitted');
      assert.equal(actual.replace(after[0][0], before[0][0]), expected, 'The entire original adapter remains exact outside the reviewed selection');
    } else assert.equal(actual, expected);
  }
});
