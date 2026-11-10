// Real React DOM with synthetic profile and network responses only.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const { nativeProps, deferred } = require('./helpers/account-exam-dom.cjs');

const route = '/api/lernen/jagdlatein-chat';
const zurich = { country: 'CH', region: 'ZH' };
const wrap = value => ({ __esModule: true, default: value });
const submitEvent = () => ({ preventDefault() {} });
const answer = {
  kind: 'region',
  text: 'Antwort aus dem vorhandenen Zürcher Lerninhalt.',
  links: [
    { href: '/jagdrecht/ch?region=ZH', label: 'Zürcher Lerninhalt öffnen' },
    { href: 'https://example.invalid/quelle', label: 'Fachquelle' },
    { href: 'javascript:alert(1)', label: 'Unsichere URL' },
  ],
};

async function fixture(t, { exam = { profile: zurich, ready: true } } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.invalid/lernen/jagdlatein-chat' });
  const calls = [], globals = new Map();
  const fetcher = (url, options) => {
    const pending = deferred();
    calls.push({ url, options, ...pending });
    return pending.promise;
  };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true, fetch: fetcher })) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const Chat = createLoader({
    '../../lib/use-exam-profile': { useExamProfile: () => exam },
    '../../lib/account-access': { getPaidPageProps: async () => ({ props: {} }) },
    '../../components/LearningToolLayout': wrap(({ title, children }) => React.createElement('main', {}, React.createElement('h1', {}, title), children)),
    'next/link': wrap(({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)),
  })('pages/lernen/jagdlatein-chat.js').default;
  const container = dom.window.document.getElementById('root');
  const root = local('react-dom/client').createRoot(container);
  const act = action => React.act(async () => { action(); });
  let mounted = true;
  async function unmount() {
    if (mounted) { await act(() => root.unmount()); mounted = false; }
  }
  t.after(async () => {
    await unmount();
    dom.window.close();
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const render = () => act(() => root.render(React.createElement(Chat)));
  await render();
  return {
    act, calls, container, unmount,
    get input() { return container.querySelector('#jagdlatein-chat-question'); },
    get button() { return container.querySelector('button[type="submit"]'); },
    get form() { return container.querySelector('form'); },
    async setExam(snapshot) { exam = snapshot; await render(); },
    async type(value) { await act(() => nativeProps(this.input).onChange({ target: { value } })); },
    async submit() { await act(() => { nativeProps(this.form).onSubmit(submitEvent()); }); },
    async reply(index, data, status = 200) { await act(() => calls[index].resolve(Response.json(data, { status }))); },
  };
}

test('The learning chat opens with a single empty question form and sends only the current question with its exam region', async t => {
  const h = await fixture(t);
  assert.equal(h.container.querySelectorAll('form').length, 1);
  assert.equal(h.container.querySelectorAll('textarea').length, 1);
  assert.equal(h.input.labels.length, 1);
  assert.equal(h.input.value, '');
  assert.equal(h.button.disabled, true);
  assert.equal(h.calls.length, 0);
  assert.equal(h.container.querySelector('article, iframe, dialog'), null);
  assert.match(h.form.textContent, /Prüfungsregion: Zürich/);

  await h.type('  Welche Regel gilt in Zürich?  ');
  assert.equal(h.button.disabled, false);
  const submit = nativeProps(h.form).onSubmit;
  await h.act(() => { submit(submitEvent()); submit(submitEvent()); });
  assert.equal(h.calls.length, 1, 'two same-tick submissions send one request');
  assert.equal(h.form.getAttribute('aria-busy'), 'true');
  assert.equal(h.button.disabled, true);
  assert.equal(h.input.readOnly, true);
  assert.equal(h.container.querySelector('article'), null, 'no answer while waiting');
  const first = h.calls[0];
  assert.equal(first.url, route);
  assert.equal(first.options.method, 'POST');
  assert.equal(first.options.credentials, 'same-origin');
  assert.equal(new Headers(first.options.headers).get('content-type'), 'application/json');
  assert.deepEqual(JSON.parse(first.options.body), { question: 'Welche Regel gilt in Zürich?', examProfile: zurich });

  await h.reply(0, answer);
  const firstTurn = h.container.querySelector('article');
  assert.ok(firstTurn);
  assert.match(firstTurn.textContent, /Welche Regel gilt in Zürich\?/);
  assert.ok(firstTurn.textContent.includes(answer.text));
  assert.equal(h.input.value, '');
  assert.equal(h.form.getAttribute('aria-busy'), 'false');
  const sources = firstTurn.querySelector('details');
  assert.ok(sources);
  assert.equal(sources.open, false);
  assert.equal(sources.querySelector('summary').textContent.trim(), 'Quellen');
  assert.equal(firstTurn.lastElementChild, sources);
  assert.equal(sources.querySelector('a').getAttribute('href'), 'https://example.invalid/quelle');
  assert.doesNotMatch(sources.textContent, /Unsichere URL/);
  assert.equal(firstTurn.querySelector('a').getAttribute('href'), '/jagdrecht/ch?region=ZH');

  await h.type('Wie verdaut ein Wiederkäuer?'); await h.submit();
  assert.equal(h.calls.length, 2);
  assert.deepEqual(JSON.parse(h.calls[1].options.body), { question: 'Wie verdaut ein Wiederkäuer?', examProfile: zurich });
  assert.equal(h.container.querySelectorAll('article').length, 1);
  await h.reply(1, { kind: 'lesson', text: 'Die zweite Frage hat eine eigene Antwort.', links: [] });
  const turns = h.container.querySelectorAll('article');
  assert.equal(turns.length, 2);
  assert.match(turns[0].textContent, /Wie verdaut ein Wiederkäuer\?/);
  assert.match(turns[1].textContent, /Welche Regel gilt in Zürich\?/);
});

test('A loading exam profile delays submission and an unavailable one allows a general question', async t => {
  const h = await fixture(t, { exam: { profile: null, ready: false, phase: 'loading' } });
  await h.type('Wie verdaut ein Wiederkäuer?');
  assert.equal(h.button.disabled, true);
  await h.submit();
  assert.equal(h.calls.length, 0);
  await h.setExam({ profile: null, ready: false, phase: 'error' });
  assert.equal(h.button.disabled, false);
  await h.submit();
  assert.deepEqual(JSON.parse(h.calls[0].options.body), { question: 'Wie verdaut ein Wiederkäuer?', examProfile: null });
  await h.reply(0, { kind: 'lesson', text: 'Ein allgemeiner Lerninhalt.', links: [] });
  assert.match(h.container.querySelector('article').textContent, /Ein allgemeiner Lerninhalt/);
});

test('Network and access failures leave the draft available and expose no answer or private error payload', async t => {
  const h = await fixture(t);
  const question = 'Was ist eine Sasse?';
  await h.type(question); await h.submit();
  await h.act(() => h.calls[0].reject(new Error('isolierter interner Fehlertext')));
  assert.match(h.form.querySelector('[role="alert"]').textContent, /erneut/);
  assert.doesNotMatch(h.container.textContent, /isolierter interner Fehlertext/);
  assert.equal(h.container.querySelector('article'), null);
  assert.equal(h.input.value, question);
  assert.equal(h.button.disabled, false);

  await h.submit();
  await h.reply(1, { text: 'isolierte vertrauliche Antwort', message: 'isolierter privater Fehler' }, 403);
  assert.match(h.form.querySelector('[role="alert"]').textContent, /aktiven Lernzugang/);
  assert.doesNotMatch(h.container.textContent, /isolierte vertrauliche Antwort|isolierter privater Fehler/);
  assert.equal(h.container.querySelector('article'), null);
  assert.equal(h.input.value, question);
  assert.equal(h.button.disabled, false);
});

test('Editing the question invalidates a retained submit before it can send an old draft', async t => {
  const h = await fixture(t);
  await h.type('Erste Frage');
  const oldSubmit = nativeProps(h.form).onSubmit;
  await h.type('Aktuelle Frage');
  await h.act(() => { oldSubmit(submitEvent()); });
  assert.equal(h.calls.length, 0);
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(JSON.parse(h.calls[0].options.body).question, 'Aktuelle Frage');
  await h.reply(0, answer);
});

test('Unmount aborts the request, ignores its late body and rejects a retained submit', async t => {
  const h = await fixture(t);
  await h.type('Welche Frage bleibt auf dieser Seite?');
  const oldSubmit = nativeProps(h.form).onSubmit;
  await h.submit();
  const pendingBody = deferred();
  let bodyStarted = false, lateAnswerRead = false;
  await h.act(() => h.calls[0].resolve({ ok: true, status: 200, json() { bodyStarted = true; return pendingBody.promise; } }));
  assert.equal(bodyStarted, true);

  await h.unmount();
  assert.equal(h.calls[0].options.signal.aborted, true);
  await h.act(() => pendingBody.resolve({ get text() { lateAnswerRead = true; return 'Verspäteter Antworttext'; } }));
  assert.equal(lateAnswerRead, false);
  assert.equal(h.container.querySelector('article'), null);
  await h.act(() => { oldSubmit(submitEvent()); });
  assert.equal(h.calls.length, 1);
});
