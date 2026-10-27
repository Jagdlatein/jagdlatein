// Actual React/DOM lifecycle and isolated localStorage/fetch doubles only.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const review = createLoader()('lib/daily-review.js');
const questions = Array.from({ length: 12 }, (_, index) => ({
  id: `wissen-completion-${index}`, category: index < 9 ? 'wildkunde' : 'hundewesen', q: `Vollständige eigene Testfrage ${index}?`,
  answers: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Antwort ${index}/${id}` })), correct: index % 2 === 0 ? ['a', 'c'] : ['a'],
  explain: `Vollständige vorhandene Erklärung ${index}: Erster Satz. Zweiter Satz mit einem eigenen Beispiel und einer Grenze.`,
  courseTitle: `Vorhandener Kurs ${index}`, href: `/kurse/testkurs-${index}#lesson-testlektion-${index}`,
  sources: [{ url: `https://sources.example.invalid/original-${index}`, label: `Originalquelle ${index}` }, { url: `https://sources.example.invalid/review-${index}`, title: `Einordnung ${index}` }],
  sourceScope: index % 2 === 0 ? 'lesson' : 'course', reviewedOn: '2026-10-12',
  ...(index % 2 === 0 ? { reading: { title: `Vorhandener Wissensabsatz ${index}`, paragraph: `Der vollständige Absatz ${index} bleibt mit allen Details und Grenzen unverändert lesbar.` } } : {}),
}));
const pool = questions.map(({ id, category }) => ({ id, category }));
const settle = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const handler = node => { assert.ok(node); return node[Object.keys(node).find(key => key.startsWith('__reactProps$'))].onClick; };

async function fixture(t) {
  const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.invalid/lernen/fuenf-minuten' });
  const saved = new Map(), values = new Map(), writes = [], records = [], requests = [], navigations = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem(key, value) { values.set(key, value); writes.push({ key, value }); }, removeItem: key => values.delete(key) };
  Object.defineProperty(dom.window, 'localStorage', { value: storage, configurable: true });
  dom.window.HTMLElement.prototype.scrollIntoView = function() {}; dom.window.scrollTo = () => {};
  const router = { isReady: true, query: {}, asPath: '/lernen/fuenf-minuten', push(href) { const pending = { href, ...deferred() }; navigations.push(pending); return pending.promise; } };
  const fetcher = (url, options) => { const pending = { url, options, ...deferred() }; requests.push(pending); return pending.promise; };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, fetch: fetcher, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const wrap = value => ({ __esModule: true, default: value });
  const Component = createLoader({
    'next/router': { useRouter: () => router }, 'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', null, children)), openPageMenu() {}, closePageMenu() {} },
    '../lib/daily-review': { ...review, recordReviewAnswer(...args) { records.push(args); return review.recordReviewAnswer(...args); } },
  })('components/DailyReview.js').default;
  let reactRoot = local('react-dom/client').createRoot(document.getElementById('root'));
  const act = action => React.act(async () => { action(); await settle(); });
  const render = () => act(() => reactRoot.render(React.createElement(Component, { pool })));
  const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
  const click = async text => { assert.ok(button(text), text); await act(() => button(text).click()); };
  const roundIds = (index = requests.length - 1) => new URL(requests[index].url, 'https://example.invalid').searchParams.get('ids').split(',');
  async function resolve(index = requests.length - 1) {
    const ids = roundIds(index);
    await act(() => requests[index].resolve({ ok: true, status: 200, json: async () => ({ questions: ids.map(id => questions.find(question => question.id === id)).reverse() }) }));
    return ids;
  }
  async function finish(wrong = new Set()) {
    const ids = roundIds();
    for (const [index, id] of ids.entries()) {
      const question = questions.find(item => item.id === id), chosen = wrong.has(id) ? 'b' : 'a';
      await click(question.answers.find(answer => answer.id === chosen).text);
      await click(index + 1 === ids.length ? 'Runde abschließen' : 'Nächste Frage');
    }
    return ids;
  }
  async function route(query, hash = '') {
    router.query = query; router.asPath = '/lernen/fuenf-minuten' + (Object.keys(query).length ? '?' + new URLSearchParams(query) : '') + hash;
    dom.window.history.replaceState(null, '', router.asPath); await render();
  }
  async function unmount() { if (reactRoot) { await React.act(async () => reactRoot.unmount()); reactRoot = null; } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, value] of saved) value ? Object.defineProperty(globalThis, key, value) : delete globalThis[key]; });
  await render();
  return { requests, navigations, writes, records, values, act, render, button, click, roundIds, resolve, finish, route, unmount, text: () => document.querySelector('main').textContent };
}

function finalSources() { return [...document.querySelectorAll('#review-content > details')].find(node => /^Quellen (?:zur beantworteten Frage|zu den nachgelesenen Fragen)$/.test(node.querySelector('summary')?.textContent || '')); }

test('A completed mixed round shows every actual mistake, selected ID text, all correct answers and full existing teaching content', async t => {
  const h = await fixture(t); const ids = await h.resolve(), wrong = new Set([ids[0], ids[2]]); await h.finish(wrong);
  assert.match(h.text(), /6 von 8 richtig/); assert.equal(h.records.length, 8);
  const articles = [...document.querySelectorAll('[aria-labelledby="review-mistakes-title"] > article')]; assert.equal(articles.length, 2);
  for (const [index, id] of [...wrong].entries()) {
    const question = questions.find(item => item.id === id), text = articles[index].textContent;
    assert.ok(text.includes(question.q) && text.includes(question.answers.find(answer => answer.id === 'b').text));
    for (const id of question.correct) assert.ok(text.includes(question.answers.find(answer => answer.id === id).text));
    assert.ok(text.includes(question.explain));
    if (question.reading) assert.ok(text.includes(question.reading.title) && text.includes(question.reading.paragraph));
    assert.equal(articles[index].querySelector('a').getAttribute('href'), question.href);
    assert.ok(!articles[index].querySelector('details'));
  }
  for (const id of ids.filter(id => !wrong.has(id))) assert.ok(!articles.some(article => article.textContent.includes(questions.find(item => item.id === id).q)));
  assert.equal(document.activeElement.id, 'review-question-title');
});

test('Sources for feedback and all final mistakes appear once in a closed final block after teaching and round controls', async t => {
  const h = await fixture(t); const ids = await h.resolve(); const first = questions.find(item => item.id === ids[0]);
  assert.equal(finalSources(), undefined); await h.click(first.answers.find(answer => answer.id === 'b').text);
  let sources = finalSources(); assert.ok(sources); assert.equal(sources.open, false); assert.equal(sources, document.getElementById('review-content').lastElementChild);
  assert.ok(h.text().indexOf(first.explain) < h.text().indexOf('Quellen zur beantworteten Frage'));
  assert.equal(sources.querySelectorAll('a').length, first.sources.length);
  await h.click('Nächste Frage'); assert.equal(finalSources(), undefined);
  const remaining = ids.slice(1);
  for (const [index, id] of remaining.entries()) { const question = questions.find(item => item.id === id); await h.click(question.answers.find(answer => answer.id === (index === 0 ? 'b' : 'a')).text); await h.click(index + 1 === remaining.length ? 'Runde abschließen' : 'Nächste Frage'); }
  sources = finalSources(); assert.equal(sources.open, false); assert.equal(sources, document.getElementById('review-content').lastElementChild);
  const reviewed = ids.slice(0, 2).map(id => questions.find(item => item.id === id));
  assert.deepEqual([...sources.querySelectorAll('a')].map(link => link.href), reviewed.flatMap(question => question.sources.map(source => source.url)));
  assert.ok(h.text().indexOf('Neue kurze Runde') < h.text().indexOf('Quellen zu den nachgelesenen Fragen'));
  assert.ok(sources.textContent.includes('Quellen zur passenden Lektion') || sources.textContent.includes('Quellen der Lerneinheit'));
});

test('An all-correct round has a clear short result without an empty mistake section or answer-source block', async t => {
  const h = await fixture(t); await h.resolve(); await h.finish();
  assert.match(h.text(), /8 von 8 richtig/); assert.match(h.text(), /Alle Antworten dieser Runde sind richtig/);
  assert.equal(document.getElementById('review-mistakes-title'), null); assert.equal(finalSources(), undefined);
  assert.ok(h.button('Neue kurze Runde')); assert.equal(h.records.length, 8);
});

test('A deliberately opened question source stays open on the same question but completion starts its own closed source block', async t => {
  const h = await fixture(t); const ids = await h.resolve();
  for (const id of ids.slice(0, -1)) { const question = questions.find(item => item.id === id); await h.click(question.answers.find(answer => answer.id === 'a').text); await h.click('Nächste Frage'); }
  const last = questions.find(item => item.id === ids.at(-1)); await h.click(last.answers.find(answer => answer.id === 'b').text);
  const questionSources = finalSources(); questionSources.open = true;
  await h.render(); assert.equal(finalSources(), questionSources); assert.equal(questionSources.open, true);
  await h.click('Runde abschließen');
  assert.notEqual(finalSources(), questionSources); assert.equal(questionSources.isConnected, false); assert.equal(finalSources().open, false);
  assert.equal(finalSources().querySelector('h3').textContent, last.q);
});

test('Answer IDs remain only in the local round: storage schema and outgoing request fields stay exact', async t => {
  const h = await fixture(t); const ids = await h.resolve(); await h.finish(new Set(ids));
  assert.equal(h.records.length, 8); assert.ok(h.records.every(args => args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'boolean'));
  assert.equal(h.requests.length, 1); assert.deepEqual([...new URL(h.requests[0].url, 'https://example.invalid').searchParams.keys()], ['ids']);
  for (const write of h.writes) {
    assert.equal(write.key, review.REVIEW_STORAGE_KEY); const saved = JSON.parse(write.value); assert.deepEqual(Object.keys(saved).sort(), ['entries', 'version']);
    for (const entry of Object.values(saved.entries)) assert.deepEqual(Object.keys(entry).sort(), ['due', 'lastEvent', 'lastSeen', 'mistakes', 'seen', 'streak']);
    for (const question of questions) for (const answer of question.answers) assert.ok(!write.value.includes(answer.text));
  }
  assert.equal(h.navigations.length, 0); assert.equal(document.querySelectorAll('[aria-labelledby="review-mistakes-title"] > article').length, 8);
});

test('Rapid duplicate/stale answers and advances cannot duplicate either history or the final mistake entry', async t => {
  const h = await fixture(t); const ids = await h.resolve(), first = questions.find(item => item.id === ids[0]);
  const answer = handler(h.button(first.answers.find(item => item.id === 'b').text)); await h.act(() => { answer(); answer(); });
  assert.equal(h.records.length, 1); const next = handler(h.button('Nächste Frage')); await h.act(() => { next(); next(); answer(); }); assert.equal(h.records.length, 1);
  for (const [index, id] of ids.slice(1).entries()) { const question = questions.find(item => item.id === id); await h.click(question.answers.find(item => item.id === 'a').text); await h.click(index === ids.length - 2 ? 'Runde abschließen' : 'Nächste Frage'); }
  await h.act(() => { answer(); next(); });
  assert.equal(h.records.length, 8); assert.equal(document.querySelectorAll('[aria-labelledby="review-mistakes-title"] > article').length, 1);
});

test('Restart clears only the temporary mistake view and old finished controls cannot replace the new round', async t => {
  const h = await fixture(t); const ids = await h.resolve(); await h.finish(new Set([ids[0]])); const restart = handler(h.button('Neue kurze Runde'));
  const before = h.writes.length; await h.act(restart); assert.equal(document.getElementById('review-mistakes-title'), null); assert.equal(finalSources(), undefined);
  assert.equal(h.requests.length, 2); await h.act(restart); assert.equal(h.requests.length, 2); assert.equal(h.writes.length, before);
  await h.resolve(); const question = questions.find(item => item.id === h.roundIds()[0]); await h.click(question.answers.find(item => item.id === 'a').text);
  assert.equal(h.records.length, 9); assert.equal(h.writes.length, before + 1);
});

test('Committed filters replace the temporary completion view while stale old actions and unmounted callbacks stay blocked', async t => {
  const h = await fixture(t); const ids = await h.resolve(); await h.finish(new Set([ids[0]])); const restart = handler(h.button('Neue kurze Runde'));
  const before = h.writes.length; await h.route({ kategorie: 'hundewesen' }); assert.equal(document.getElementById('review-mistakes-title'), null);
  await h.act(restart); assert.equal(h.requests.length, 2); await h.resolve();
  assert.ok(h.roundIds().every(id => questions.find(item => item.id === id).category === 'hundewesen'));
  const answer = handler(h.button(questions.find(item => item.id === h.roundIds()[0]).answers.find(item => item.id === 'b').text));
  await h.unmount(); await h.act(() => { answer(); restart(); }); assert.equal(h.writes.length, before); assert.equal(h.requests.length, 2);
});
