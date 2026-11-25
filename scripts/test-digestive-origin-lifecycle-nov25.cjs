// Real mounted DigestiveLearning/native inputs with a local parent predicate.
// No account, external request, browser control, real storage or model viewer.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the existing isolated jsdom module.', { cause: error }); }
const React = local('react');
const load = createLoader({ 'next/image': ({ priority, fill, ...props }) => React.createElement('img', props) });
const Component = load('components/DigestiveLearning.js').default;
const { digestiveTopics } = load('lib/digestive-learning.js');

async function fixture({ selectedId = digestiveTopics[0].id, hideSelector = true, standalone = false, defaultPredicate = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'https://jagdlatein.test/lernen/anatomie' });
  const { window } = dom, saved = new Map();
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = local('react-dom/client'), host = window.document.getElementById('test-root'), root = createRoot(host);
  const state = { allowed: true, origin: 'origin-A', predicateCalls: [], selectedCalls: [], selectedId, hideSelector, hidden: false, predicateOverride: null };
  let unmounted = false, disposed = false;
  async function render() {
    const origin = state.origin;
    const props = { hideSelector: state.hideSelector, onSelect: id => state.selectedCalls.push(id) };
    if (!standalone) props.selectedId = state.selectedId;
    if (!defaultPredicate) props.canAnswer = state.predicateOverride || (() => { state.predicateCalls.push(origin); return state.allowed && state.origin === origin; });
    await React.act(async () => root.render(React.createElement('div', { hidden: state.hidden, inert: state.hidden || undefined }, React.createElement(Component, props))));
  }
  const f = { window, host, state, render,
    get article() { return host.querySelector('#anatomie-verdauung'); },
    get selector() { return host.querySelector('select'); },
    field(questionId) { return [...this.article.querySelectorAll('fieldset')].find(field => field.querySelector('input')?.name === questionId); },
    input(questionId, index) { const input = this.field(questionId).querySelectorAll('input[type="radio"]')[index]; assert.ok(input); return input; },
    handler(element) { const props = element[Object.keys(element).find(key => key.startsWith('__reactProps'))]; assert.equal(typeof props.onChange, 'function'); return props.onChange; },
    async click(questionId, index) { await React.act(async () => this.input(questionId, index).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); },
    async choose(id) { const select = this.selector; assert.ok(select); await React.act(async () => { select.value = id; select.dispatchEvent(new window.Event('change', { bubbles: true })); }); },
    selected(questionId) { return [...this.field(questionId).querySelectorAll('input')].findIndex(input => input.checked); },
    async unmount() { if (unmounted) return; unmounted = true; await React.act(async () => root.unmount()); },
    async dispose() { if (disposed) return; disposed = true; await this.unmount(); window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(global, key, value); else delete global[key]; } },
  };
  await render(); return f;
}

for (const topic of digestiveTopics) test(`The mounted ${topic.id} reader still grades all four native choices for both blind questions and keeps its sources last`, async () => {
  const f = await fixture({ selectedId: topic.id });
  try {
    assert.equal(f.article.querySelectorAll('fieldset').length, 2); assert.equal(f.article.querySelectorAll('input[type="radio"]').length, 8);
    assert.equal(f.article.querySelector('[role="status"]'), null);
    for (const question of topic.questions) for (const index of [3, 0, 1, 2]) {
      await f.click(question.id, index);
      const feedback = f.field(question.id).querySelector('[role="status"]');
      assert.equal(feedback.querySelector('strong').textContent, index === question.answer ? 'Das passt.' : `Passend ist: ${question.choices[question.answer]}`);
      assert.equal(feedback.querySelector('p').textContent, question.explanation); assert.equal(f.selected(question.id), index);
    }
    assert.equal(f.article.lastElementChild.tagName, 'DETAILS'); assert.equal(f.article.lastElementChild.open, false);
    assert.ok(f.article.textContent.includes(topic.limit)); assert.equal(f.state.selectedCalls.length, 0);
  } finally { await f.dispose(); }
});

test('A live parent denial blocks a captured answer before another render, then rollback retains the same reader and its valid prior answers', async () => {
  const f = await fixture(), [first, second] = digestiveTopics[0].questions;
  try {
    await f.click(first.id, 3); const article = f.article, stale = f.handler(f.input(second.id, second.answer));
    f.state.allowed = false;
    await React.act(async () => stale()); assert.equal(f.selected(first.id), 3); assert.equal(f.selected(second.id), -1);
    f.state.hidden = true; await f.render(); assert.equal(f.article, article); assert.equal(f.article.parentElement.hidden, true);
    await React.act(async () => f.handler(f.input(second.id, second.answer))()); assert.equal(f.selected(second.id), -1);
    f.state.allowed = true; f.state.hidden = false; await f.render(); assert.equal(f.article, article); assert.equal(f.selected(first.id), 3);
    await f.click(second.id, second.answer); assert.equal(f.selected(second.id), second.answer);
  } finally { await f.dispose(); }
});

test('Even a true live permission for a new origin cannot revive old answer or selector closures before or after rendering that new origin', async () => {
  const f = await fixture({ hideSelector: false }), question = digestiveTopics[0].questions[0];
  try {
    const oldAnswer = f.handler(f.input(question.id, question.answer)), oldChoose = f.handler(f.selector);
    f.state.origin = 'origin-B'; assert.equal(f.state.allowed, true);
    await React.act(async () => { oldAnswer(); oldChoose({ target: { value: digestiveTopics[1].id } }); });
    assert.equal(f.selected(question.id), -1); assert.deepEqual(f.state.selectedCalls, []);
    await f.render();
    await React.act(async () => { oldAnswer(); oldChoose({ target: { value: digestiveTopics[1].id } }); });
    assert.equal(f.selected(question.id), -1); assert.deepEqual(f.state.selectedCalls, []);
    await f.click(question.id, question.answer); assert.equal(f.selected(question.id), question.answer);
    await f.choose(digestiveTopics[1].id); assert.deepEqual(f.state.selectedCalls, [digestiveTopics[1].id]);
  } finally { await f.dispose(); }
});

test('The functional updater independently rechecks parent ownership after a valid entry check', async () => {
  const f = await fixture(), question = digestiveTopics[0].questions[0];
  try {
    let checks = 0;
    f.state.predicateOverride = () => ++checks === 1;
    await f.render(); await f.click(question.id, question.answer);
    assert.ok(checks >= 2, 'The setter must validate again inside its functional updater');
    assert.equal(f.selected(question.id), -1); assert.equal(f.field(question.id).querySelector('[role="status"]'), null);
  } finally { await f.dispose(); }
});

test('Two current answer updates in the same batch combine, and a later denied answer cannot replace that valid state', async () => {
  const f = await fixture(), [first, second] = digestiveTopics[0].questions;
  try {
    const a = f.handler(f.input(first.id, first.answer)), b = f.handler(f.input(second.id, second.answer));
    await React.act(async () => { a(); b(); });
    assert.equal(f.selected(first.id), first.answer); assert.equal(f.selected(second.id), second.answer);
    const stale = f.handler(f.input(second.id, 3)); f.state.allowed = false;
    await React.act(async () => stale());
    assert.equal(f.selected(first.id), first.answer); assert.equal(f.selected(second.id), second.answer);
  } finally { await f.dispose(); }
});

test('A queued second functional update rechecks origin ownership after a transition was enqueued before the parent origin changed', async () => {
  const f = await fixture(), [first, second] = digestiveTopics[0].questions;
  try {
    const a = f.handler(f.input(first.id, first.answer)), b = f.handler(f.input(second.id, second.answer));
    await React.act(async () => {
      React.startTransition(() => { a(); b(); });
      f.state.origin = 'origin-B';
    });
    // The first update may validly execute eagerly before the drift. The queued
    // second updater must independently reject the now-obsolete A predicate.
    assert.equal(f.selected(second.id), -1); assert.equal(f.field(second.id).querySelector('[role="status"]'), null);
    assert.ok(f.state.predicateCalls.length >= 4, 'Both entry checks and functional checks must actually execute');
  } finally { await f.dispose(); }
});

test('Actual topic replacement and return create blind readers; old answer and outer selector handlers fail their own lifetime scope early', async () => {
  const f = await fixture({ standalone: true, hideSelector: false }), first = digestiveTopics[0].questions[0];
  try {
    await f.click(first.id, 3);
    const oldArticle = f.article, oldAnswer = f.handler(f.input(first.id, first.answer)), oldChoose = f.handler(f.selector);
    await f.choose(digestiveTopics[1].id); assert.notEqual(f.article, oldArticle); assert.equal(f.article.querySelector('[role="status"]'), null);
    const checks = f.state.predicateCalls.length;
    await React.act(async () => { oldAnswer(); oldChoose({ get target() { throw new Error('An obsolete selector must stop before reading its event'); } }); });
    assert.equal(f.state.predicateCalls.length, checks); assert.deepEqual(f.state.selectedCalls, [digestiveTopics[1].id]);
    await f.choose(digestiveTopics[0].id); assert.notEqual(f.article, oldArticle); assert.equal(f.article.querySelector('[role="status"]'), null);
    const afterReturn = f.state.predicateCalls.length; await React.act(async () => oldAnswer());
    assert.equal(f.state.predicateCalls.length, afterReturn); assert.equal(f.selected(first.id), -1);
  } finally { await f.dispose(); }
});

test('Actual unmount rejects captured child and standalone-selector actions before invoking the parent predicate or callback', async () => {
  const f = await fixture({ standalone: true, hideSelector: false }), question = digestiveTopics[0].questions[0];
  try {
    const answer = f.handler(f.input(question.id, question.answer)), choose = f.handler(f.selector);
    await f.unmount(); const checks = f.state.predicateCalls.length;
    await React.act(async () => { answer(); choose({ get target() { throw new Error('Unmount must stop before reading the event'); } }); });
    assert.equal(f.state.predicateCalls.length, checks); assert.deepEqual(f.state.selectedCalls, []); assert.equal(f.host.textContent, '');
  } finally { await f.dispose(); }
});

test('The omitted predicate remains a working standalone default and rejects an invalid selector without changing the topic', async () => {
  const f = await fixture({ standalone: true, hideSelector: false, defaultPredicate: true }), question = digestiveTopics[0].questions[0];
  try {
    await f.click(question.id, question.answer); assert.equal(f.selected(question.id), question.answer);
    await React.act(async () => f.handler(f.selector)({ target: { value: 'unknown' } }));
    assert.equal(f.article.querySelector('h2').textContent, digestiveTopics[0].title); assert.deepEqual(f.state.selectedCalls, []);
    await f.choose(digestiveTopics[1].id); assert.equal(f.article.querySelector('h2').textContent, digestiveTopics[1].title);
    assert.equal(f.article.querySelector('[role="status"]'), null); assert.deepEqual(f.state.selectedCalls, [digestiveTopics[1].id]);
  } finally { await f.dispose(); }
});
