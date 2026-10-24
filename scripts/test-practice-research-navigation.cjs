const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const data = load('lib/practice-research-server.js').getPracticeResearchData();
const file = 'components/ResearchForPractice.js';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const dossier = h => h.nodes(node => node.type?.name === 'ResearchDossier')[0];
const round = h => h.nodes(node => node.type?.name === 'ResearchQuestionRound')[0];
const select = h => h.nodes(node => node.type === 'select' && node.props.id === 'revierwissen-topic')[0];
const choose = (h, id) => select(h).props.onChange({ target: { value: id } });
function fixture(t, query, options = {}) {
  const h = setup(file, query, { ...options, props: data });
  t.after(() => h.dispose()); return h;
}
function focusSpy(h) {
  const calls = [];
  h.nodes(node => node.type === 'div' && node.props.ref)[0].props.ref.current = {
    querySelector(selector) { return { setAttribute(name, value) { assert.equal(name, 'tabindex'); assert.equal(value, '-1'); }, focus(options) { calls.push({ selector, options }); }, scrollIntoView() {} }; },
  };
  return calls;
}

test('Bare URL keeps the established first dossier; invalid, empty and repeated topics show a chooser, never a foreign quiz', async t => {
  const bare = fixture(t, {});
  assert.equal(dossier(bare).props.topic.id, data.topics[0].id);
  assert.equal(round(bare).props.questions.length, 20);
  for (const thema of ['', 'unknown', ['wildkameras', 'rehwild-fruehling']]) {
    const h = fixture(t, { thema });
    assert.equal(dossier(h), undefined); assert.equal(round(h), undefined);
    assert.equal(menu(h).props.openInitially, true);
    assert.equal(select(h).props.value, '');
    assert.match(text(h.tree), /Dieses Thema ist nicht verfügbar/);
    await choose(h, 'wildkameras'); h.render();
    assert.equal(dossier(h).props.topic.id, 'wildkameras');
  }
});

test('Hydration cannot flash a default dossier or create stale picker work over the incoming valid URL', async t => {
  const h = fixture(t, {}, { ready: false });
  assert.equal(dossier(h), undefined); assert.equal(round(h), undefined);
  assert.equal(select(h).props.disabled, true); assert.equal(menu(h).props.openInitially, false);
  await choose(h, 'wildkameras'); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.navigate({ thema: 'rehwild-fruehling' });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(dossier(h).props.topic.id, 'rehwild-fruehling'); assert.equal(h.menu.opened, 0);
});

test('Every dossier link restores its exact twenty-question pool and browser history never issues another navigation', t => {
  const h = fixture(t, {});
  for (const item of [...data.topics, data.topics[0], data.topics[2]]) {
    h.navigate({ thema: item.id });
    assert.equal(dossier(h).props.topic, item);
    assert.equal(round(h).key, `questions-${item.id}`);
    assert.deepEqual(round(h).props.questions.map(q => q.id), data.questions.filter(q => q.topicId === item.id).map(q => q.id));
  }
  assert.equal(h.calls.length, 0);
});

test('Menu changes wait for URL commit, keep context and the settled quiz, then focus and close only on the confirmed topic', async t => {
  const h = fixture(t, { thema: 'wildkameras', ref: 'lernen', context: ['a', 'b'] }, { router: { asPath: '/lernen/wissen-fuers-revier?thema=wildkameras#revierwissen-findings' } });
  const focus = focusSpy(h), firstRound = round(h), initialClosed = h.menu.closed;
  let complete;
  h.router.push = (href, as, options) => { h.calls.push({ href, options }); return new Promise(resolve => { complete = resolve; }); };
  const request = choose(h, 'wild-und-stoerung'); h.render();
  assert.equal(dossier(h).props.topic.id, 'wildkameras'); assert.equal(round(h).key, firstRound.key);
  assert.equal(h.menu.closed, initialClosed); assert.equal(focus.length, 0);
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/wissen-fuers-revier', query: { thema: 'wild-und-stoerung', ref: 'lernen', context: ['a', 'b'] }, hash: 'revierwissen-findings' }, options: { shallow: true, scroll: false } });
  h.navigate(h.calls[0].href.query); complete(true); await request;
  assert.equal(dossier(h).props.topic.id, 'wild-und-stoerung'); assert.notEqual(round(h).key, firstRound.key);
  assert.deepEqual(focus.map(call => call.selector), ['#revierwissen-findings']); assert.equal(h.menu.closed, initialClosed + 1);
});

test('Direct question and legacy section targets focus their own content; hash-only movement never resets the question key', t => {
  const h = fixture(t, { thema: 'wildkameras' }, { ready: false });
  const focus = focusSpy(h); h.router.isReady = true;
  const destinations = {
    'revierwissen-fragen': '#revierwissen-quiz-title', 'revierwissen-praxischeck': '#revierwissen-quiz-title',
    'revierwissen-inhalt': '#revierwissen-title', 'revierwissen-title': '#revierwissen-title',
    'revierwissen-practice': '#revierwissen-practice', 'revierwissen-findings': '#revierwissen-findings', 'revierwissen-limits': '#revierwissen-limits',
  };
  for (const [hash, expected] of Object.entries(destinations)) {
    h.router.asPath = `/lernen/wissen-fuers-revier?thema=wildkameras#${hash}`; h.render();
    assert.equal(focus.at(-1).selector, expected); assert.equal(round(h).key, 'questions-wildkameras');
    assert.deepEqual(focus.at(-1).options, { preventScroll: true });
  }
});

test('Current failures retain the dossier and question identity and offer retry; cancellation and unmount remain silent', async t => {
  const h = fixture(t, { thema: 'wildkameras' }); const oldRound = round(h);
  h.router.push = async () => { throw new Error('network'); };
  await choose(h, 'rehwild-fruehling'); h.render();
  assert.equal(dossier(h).props.topic.id, 'wildkameras'); assert.equal(round(h).type, oldRound.type); assert.equal(round(h).key, oldRound.key);
  assert.match(text(h.tree), /konnte nicht geöffnet werden/); assert.equal(h.menu.opened, 1);
  h.router.push = async () => { throw Object.assign(new Error('cancel'), { cancelled: true }); };
  await choose(h, 'rehwild-fruehling'); h.render(); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  let fail, calls = 0; h.router.push = () => { calls++; return new Promise((resolve, reject) => { fail = reject; }); };
  const stale = select(h).props.onChange;
  const request = choose(h, 'wild-und-stoerung'); h.dispose(); fail(new Error('late')); await request; h.render();
  await stale({ target: { value: 'rehwild-fruehling' } });
  assert.equal(calls, 1); assert.equal(h.menu.opened, 1);
});

test('History away and back, including context-only changes, invalidates old failures and captured menu callbacks', async t => {
  for (const changed of [{ thema: 'rehwild-fruehling' }, { thema: 'wildkameras', ref: 'other' }]) {
    const h = fixture(t, { thema: 'wildkameras' }); let fail, calls = 0;
    h.router.push = () => { calls++; return new Promise((resolve, reject) => { fail = reject; }); };
    const stale = select(h).props.onChange;
    const request = choose(h, 'wild-und-stoerung');
    h.navigate(changed); h.navigate({ thema: 'wildkameras' });
    fail(new Error('late old view')); await request; h.render();
    await stale({ target: { value: 'rehwild-fruehling' } });
    assert.equal(calls, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
    assert.equal(dossier(h).props.topic.id, 'wildkameras');
  }
});

test('Re-selecting current content supersedes pending navigation without its older finally clearing newer work', async t => {
  const h = fixture(t, { thema: 'wildkameras' }); const waits = [], originalKey = round(h).key;
  h.router.push = href => new Promise((resolve, reject) => { h.calls.push({ href }); waits.push({ resolve, reject }); });
  const first = choose(h, 'rehwild-fruehling'), second = choose(h, 'wildkameras'); assert.equal(h.calls.length, 2);
  waits[0].resolve(false); await first;
  const third = choose(h, 'wildkameras'); assert.equal(h.calls.length, 3);
  waits[1].reject(new Error('superseded')); await second; h.render(); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  waits[2].resolve(true); await third; h.render(); assert.equal(round(h).key, originalKey);
  await choose(h, 'wildkameras'); assert.equal(h.calls.length, 3, 'Settled same-topic selection does not add a history entry');
});

test('Only the existing lower menu selects a dossier; data, source dates, local quiz and heading-only layout stay unchanged', t => {
  const h = fixture(t, { thema: 'rehwild-fruehling' });
  const content = h.nodes(node => node.type === 'div' && node.props.ref)[0];
  assert.equal(nodes(content, node => node.type === 'select').length, 0);
  assert.equal(nodes(menu(h), node => node.type === 'select').length, 1);
  assert.equal(h.tree.props.headingOnly, true);
  assert.equal(dossier(h).props.topic.reviewedOn, '2026-10-15');
  assert.ok(round(h).props.questions.every(item => item.reviewedOn === '2026-10-16'));
  assert.equal(round(h).props.onRank, undefined);
});
