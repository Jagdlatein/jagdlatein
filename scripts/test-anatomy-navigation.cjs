// Parent URL/history and current learning-round continuity only. All routing,
// refs and window values are isolated doubles; no browser or user data is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader, local } = require('./helpers/project-module.cjs');
local('styled-jsx/style');
const React = local('react');
const load = createLoader();
const { anatomyModels: models, anatomyQuestions: questions, anatomySources: sources } = load('lib/anatomy-explorer.js');
const { digestiveTopics } = load('lib/digestive-learning.js');
const file = 'components/AnatomyExplorer.js', base = '/lernen/anatomie';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const selector = h => nodes(menu(h), node => node.type === 'select')[0];
const digestive = h => h.nodes(node => node.type?.name === 'DigestiveLearning')[0];
const modelPanel = h => h.nodes(node => node.props?.['aria-labelledby'] === 'anatomie-modell')[0];
const alerts = h => h.nodes(node => node.props?.role === 'alert');
const choose = (h, id) => selector(h).props.onChange({ target: { value: id } });
function address(query, hash = '') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function environment(t) {
  const previousWindow = global.window, harnesses = [];
  global.window = { location: { search: '?eintrag=vorderlauf', hash: '#unrelated-device-state' } };
  t.after(() => { for (const h of harnesses.reverse()) h.dispose(); global.window = previousWindow; });
  return { harnesses };
}
function fixture(env, query = { eintrag: 'schaedel' }, options = {}) {
  const slots = [], effects = [], cleanups = [], calls = [], focus = [], scroll = [];
  let cursor = 0, changed = false, disposed = false, writesAfterDispose = 0, tree;
  const refs = new Map(), menuState = { closed: 0, opened: 0 };
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, input => {
        if (disposed) { writesAfterDispose++; return; }
        const next = typeof input === 'function' ? input(slots[i].value) : input;
        changed ||= !Object.is(next, slots[i].value); slots[i].value = next;
      }];
    },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { current: initial }; return slots[i]; },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || !deps || !previous.deps || deps.length !== previous.deps.length || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
        slots[i] = { deps }; effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); });
      }
    },
  };
  const router = { isReady: options.ready !== false, pathname: base, asPath: address(query), query: { ...query }, async push(href, as, pushOptions) {
    calls.push({ href, as, options: pushOptions }); router.query = href.query; router.asPath = address(href.query, href.hash); return true;
  }, ...options.router };
  function PageMenu({ children }) { return React.createElement('aside', null, children); }
  const Component = createLoader({ react: hooks, 'next/router': { useRouter: () => router },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: PageMenu, closePageMenu: () => { menuState.closed++; }, openPageMenu: () => { menuState.opened++; } },
  })(file).default;
  function render() {
    for (let pass = 0; pass < 12; pass++) {
      cursor = 0; changed = false; tree = Component();
      if (!disposed) for (const node of nodes(tree, node => node.props?.ref && node.type !== 'model-viewer')) {
        const ref = node.props.ref;
        if (!refs.has(ref)) refs.set(ref, { focus(settings) { focus.push({ label: this.label, options: settings }); }, scrollIntoView(settings) { scroll.push({ label: this.label, options: settings }); } });
        ref.current = refs.get(ref); ref.current.label = node.props.id || node.props['aria-label'];
      }
      effects.splice(0).forEach(callback => callback());
      if (!changed) return tree;
    }
    throw new Error('Anatomy hook fixture did not settle.');
  }
  function dispose() { if (disposed) return; disposed = true; cleanups.forEach(callback => callback?.()); for (const ref of refs.keys()) ref.current = null; }
  const h = { router, calls, focus, scroll, menu: menuState, get tree() { return tree; }, get writesAfterDispose() { return writesAfterDispose; }, render,
    nodes: predicate => nodes(tree, predicate), navigate(nextQuery) { router.query = nextQuery; render(); }, dispose };
  env.harnesses.push(h); render(); return h;
}
function history(h, query, hash = '') { h.router.asPath = address(query, hash); h.navigate(query); }
function pendingRouter(h) {
  const requests = [];
  h.router.push = (href, as, options) => {
    const request = { href, as, options }; requests.push(request); h.calls.push({ href, options });
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  };
  return requests;
}
async function commit(h, request, action) {
  history(h, request.href.query, request.href.hash); request.resolve(true); await action; h.render();
}
function button(h, label) {
  const result = h.nodes(node => node.type === 'button' && text(node) === label)[0];
  assert.ok(result, `Missing button ${label}`); return result;
}
function fire(h, label) {
  const control = button(h, label); assert.ok(!control.props.disabled, `Disabled button ${label}`);
  const result = control.props.onClick(); h.render(); return result;
}
function quiz(h) { return h.nodes(node => node.type === 'details' && text(node.props.children[0]).startsWith('Wissen zum Modell'))[0]; }
function toggleQuiz(h, open) { quiz(h).props.onToggle({ currentTarget: { open } }); h.render(); }
function focusProbe(h) {
  const initialFocus = h.focus.length, initialScroll = h.scroll.length;
  return { get focus() { return h.focus.length - initialFocus; }, get scroll() { return h.scroll.length - initialScroll; } };
}

function startCurrentRound(h) {
  toggleQuiz(h, true);
  const currentQuestions = questions.filter(question => question.modelId === selector(h).props.value);
  fire(h, currentQuestions[0].choices[currentQuestions[0].answer]);
  fire(h, 'Nächste Frage');
  assert.match(text(quiz(h)), /Frage 2 von 2 · 1 beantwortet · 1 richtig/);
  return currentQuestions;
}

test('All three original museum URLs preserve every model, structure, exact question assignment, provenance and teaching limit', t => {
  const env = environment(t), h = fixture(env);
  assert.equal(models.length, 3); assert.equal(questions.length, 6);
  for (const model of models) {
    history(h, { eintrag: model.id });
    assert.equal(selector(h).props.value, model.id); assert.equal(digestive(h), undefined);
    assert.ok(text(modelPanel(h)).includes(model.description)); assert.ok(text(modelPanel(h)).includes(model.size));
    assert.match(text(h.tree), /Weißwedelhirsches.*kein Reh oder Rotwild/);
    assert.match(text(h.tree), /verschiedenen Exemplaren.*nicht maßstabsgleich/);
    assert.ok(nodes(modelPanel(h), node => node.props?.href === model.source).length);
    assert.ok(nodes(modelPanel(h), node => node.props?.href === 'https://creativecommons.org/publicdomain/zero/1.0/').length);
    for (const feature of model.features) { fire(h, feature.title); assert.ok(text(modelPanel(h)).includes(feature.explanation)); }
    assert.match(text(modelPanel(h)), /keine automatische Messung/);
    const currentQuestions = questions.filter(question => question.modelId === model.id);
    assert.equal(quiz(h).props.open, false); toggleQuiz(h, true);
    for (const [index, question] of currentQuestions.entries()) {
      assert.ok(text(quiz(h)).includes(question.question));
      for (const other of questions.filter(entry => entry.modelId !== model.id)) assert.ok(!text(quiz(h)).includes(other.question));
      fire(h, question.choices[question.answer]); assert.ok(text(quiz(h)).includes(question.explanation));
      if (index < currentQuestions.length - 1) fire(h, 'Nächste Frage');
    }
    assert.match(text(quiz(h)), /Runde abgeschlossen: 2 von 2 richtig/);
    const credits = h.nodes(node => node.type === 'details' && text(node.props.children[0]) === 'Fachliche Quellen und Modellnachweise')[0];
    assert.ok(credits && !credits.props.open);
    assert.deepEqual(nodes(credits, node => node.type === 'a').slice(0, sources.length).map(node => ({ title: text(node), url: node.props.href })), sources);
    assert.match(text(credits), /4\. Oktober 2026/); assert.match(text(credits), /keine Altersbestimmung, medizinische Diagnose/);
    assert.match(text(credits), /Übertragung exakter Größen auf heimische Wildarten/);
    assert.ok(nodes(credits, node => node.props?.href === '/lernen/anatomie/MODEL-VIEWER-LICENSE.txt').length);
  }
  assert.equal(h.calls.length, 0);
});

test('Bare, explicit museum and every original digestion link retain their documented defaults and exact child topic', t => {
  const env = environment(t), bare = fixture(env, {});
  assert.equal(selector(bare).props.value, 'schaedel'); assert.equal(bare.focus.length, 0);
  history(bare, { bereich: 'museum' }); assert.equal(selector(bare).props.value, 'schaedel');
  for (const model of models) { history(bare, { bereich: 'museum', eintrag: model.id }); assert.equal(selector(bare).props.value, model.id); }
  history(bare, { bereich: 'verdauung' }); assert.equal(digestive(bare).props.selectedId, digestiveTopics[0].id);
  for (const topic of digestiveTopics) {
    history(bare, { bereich: 'verdauung', thema: topic.id }, 'anatomie-verdauung');
    const child = digestive(bare); assert.equal(child.props.selectedId, topic.id); assert.equal(child.props.hideSelector, true); assert.equal(child.key, topic.id);
    assert.equal(modelPanel(bare), undefined); assert.equal(quiz(bare), undefined);
    assert.equal(bare.focus.at(-1).label, topic.title);
  }
  assert.deepEqual(nodes(menu(bare), node => node.type === 'optgroup').map(node => node.props.label), ['Verdauung verstehen', 'Museumsscans drehen']);
  assert.equal(nodes(bare.tree, node => node.type === 'select').length, 1);
  assert.equal(bare.calls.length, 0);
});

test('Unready and explicitly invalid, empty, repeated or contradictory URL fields cannot show a substitute lesson', async t => {
  const env = environment(t), h = fixture(env, { eintrag: 'unterkiefer' }, { ready: false });
  assert.equal(modelPanel(h), undefined); assert.equal(digestive(h), undefined); assert.equal(selector(h).props.disabled, true);
  assert.equal(menu(h).props.openInitially, false); assert.match(text(h.tree), /gewählte Thema wird geladen/);
  await choose(h, 'vorderlauf'); h.render(); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.render(); assert.equal(selector(h).props.value, 'unterkiefer');
  const invalid = [
    ...['', null, 'unbekannt', ['museum'], ['museum', 'verdauung']].map(bereich => ({ bereich })),
    ...['', null, 'unknown', ['schaedel'], ['schaedel', 'unterkiefer']].map(eintrag => ({ eintrag })),
    ...['', null, 'unknown', ['wiederkaeuer-verdauung'], ['wiederkaeuer-verdauung', 'schwarzwild-verdauung']].map(thema => ({ bereich: 'verdauung', thema })),
    { thema: 'wiederkaeuer-verdauung' }, { bereich: 'museum', thema: 'wiederkaeuer-verdauung' },
    { bereich: 'verdauung', eintrag: 'schaedel' }, { bereich: 'verdauung', thema: 'schwarzwild-verdauung', eintrag: 'schaedel' },
  ];
  for (const query of invalid) {
    const bad = fixture(env, query);
    assert.equal(modelPanel(bad), undefined, JSON.stringify(query)); assert.equal(digestive(bad), undefined);
    assert.equal(selector(bad).props.value, ''); assert.equal(menu(bad).props.openInitially, true);
    assert.match(text(bad.tree), /Dieses Thema ist nicht verfügbar/);
    history(bad, { eintrag: 'schaedel' }); await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(bad.menu.opened, 0);
  }
  const departed = fixture(env, { eintrag: 'missing' }); departed.dispose(); await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(departed.menu.opened, 0); assert.equal(departed.writesAfterDispose, 0);
});

test('Museum and digestion pushes use their exact canonical fields and anchors while retaining unrelated search context', async t => {
  const env = environment(t), h = fixture(env, { bereich: 'museum', eintrag: 'schaedel', ref: 'suche', q: 'Kiefer' }, { router: { pathname: '/wrong-path' } });
  const requests = pendingRouter(h), focus = focusProbe(h), action = choose(h, 'schwarzwild-verdauung'); h.render();
  assert.deepEqual(requests[0].href, { pathname: base, query: { ref: 'suche', q: 'Kiefer', bereich: 'verdauung', thema: 'schwarzwild-verdauung' }, hash: 'anatomie-verdauung' });
  assert.deepEqual(requests[0].options, { shallow: true, scroll: false }); assert.equal(requests[0].as, undefined);
  assert.equal(selector(h).props.value, 'schaedel'); assert.equal(digestive(h), undefined); assert.equal(focus.focus, 0);
  await commit(h, requests[0], action); assert.equal(digestive(h).props.selectedId, 'schwarzwild-verdauung'); assert.equal(focus.focus, 1);
  const modelAction = choose(h, 'unterkiefer');
  assert.deepEqual(requests[1].href, { pathname: base, query: { ref: 'suche', q: 'Kiefer', eintrag: 'unterkiefer' }, hash: 'anatomie-modell' });
  assert.equal(digestive(h).props.selectedId, 'schwarzwild-verdauung'); await commit(h, requests[1], modelAction);
  assert.equal(selector(h).props.value, 'unterkiefer'); assert.equal(digestive(h), undefined);
  for (const event of h.focus) assert.deepEqual(event.options, { preventScroll: true });
  for (const event of h.scroll) assert.deepEqual(event.options, { block: 'start', behavior: 'auto' });
  history(h, requests[0].href.query, requests[0].href.hash); assert.equal(digestive(h).props.selectedId, 'schwarzwild-verdauung');
  history(h, requests[1].href.query, requests[1].href.hash); assert.equal(selector(h).props.value, 'unterkiefer');
  const reload = fixture(env, h.router.query, { router: { asPath: h.router.asPath } }); assert.equal(selector(reload).props.value, 'unterkiefer');
});

test('Accepting a push before its URL commit does not optimistically alter the lesson or running model answers', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h); startCurrentRound(h);
  const before = text(quiz(h)), focus = focusProbe(h), action = choose(h, 'unterkiefer');
  requests[0].resolve(true); await action; h.render();
  assert.equal(selector(h).props.value, 'schaedel'); assert.equal(text(quiz(h)), before); assert.equal(focus.focus, 0);
  history(h, requests[0].href.query, requests[0].href.hash);
  assert.equal(selector(h).props.value, 'unterkiefer'); assert.equal(quiz(h).props.open, false); assert.equal(focus.focus, 1);
  toggleQuiz(h, true); assert.match(text(quiz(h)), /Frage 1 von 2 · 0 beantwortet · 0 richtig/);
});

test('A failed, cancelled or refused topic switch preserves the exact current question, answers, open round and feature', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h); startCurrentRound(h);
  fire(h, models[0].features[1].title); const before = text(quiz(h)), focus = focusProbe(h);
  const failed = choose(h, 'unterkiefer'); h.render(); assert.equal(text(quiz(h)), before);
  requests[0].reject(new Error('offline')); await failed; h.render();
  assert.equal(selector(h).props.value, 'schaedel'); assert.equal(text(quiz(h)), before); assert.ok(text(modelPanel(h)).includes(models[0].features[1].explanation));
  assert.match(text(alerts(h)[0]), /Thema konnte nicht geöffnet/); assert.equal(h.menu.opened, 1); assert.equal(focus.focus, 0);
  const cancelled = choose(h, 'vorderlauf'); requests[1].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  const refused = choose(h, 'schwarzwild-verdauung'); requests[2].resolve(false); await refused; h.render();
  assert.equal(text(quiz(h)), before); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 1); assert.equal(focus.focus, 0);
});

test('Reselecting the current model supersedes pending navigation and preserves the real current round without redundant history', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h); startCurrentRound(h);
  const before = text(quiz(h)), focus = focusProbe(h);
  const first = choose(h, 'unterkiefer'), second = choose(h, 'vorderlauf');
  requests[0].reject(Object.assign(new Error('old cancelled'), { cancelled: true })); await first;
  const current = choose(h, 'schaedel'); assert.equal(requests.length, 3); assert.equal(requests[2].href.query.eintrag, 'schaedel');
  requests[1].reject(new Error('superseded')); await second; requests[2].resolve(true); await current; h.render();
  assert.equal(text(quiz(h)), before); assert.equal(alerts(h).length, 0); assert.equal(focus.focus, 1);
  await choose(h, 'schaedel'); h.render(); assert.equal(requests.length, 3); assert.equal(text(quiz(h)), before); assert.equal(focus.focus, 2);
});

test('Hash/context commits preserve answers and question index but retire old selection, answer and quiz-toggle handlers', async t => {
  const env = environment(t), h = fixture(env), currentQuestions = startCurrentRound(h);
  const original = { eintrag: 'schaedel' };
  for (const visit of [
    () => history(h, { ...original, ref: 'context' }, 'anatomie-modell'),
    () => { h.router.query = { ...h.router.query, q: 'query-only' }; h.render(); },
    () => { h.router.asPath = address(h.router.query, 'another-anchor'); h.render(); },
  ]) {
    const before = text(quiz(h)), oldSelect = selector(h).props.onChange, oldToggle = quiz(h).props.onToggle;
    const oldAnswer = button(h, currentQuestions[1].choices[currentQuestions[1].answer]).props.onClick;
    visit(); assert.equal(text(quiz(h)), before);
    const count = h.calls.length; await oldSelect({ target: { value: 'unterkiefer' } }); oldAnswer(); oldToggle({ currentTarget: { open: false } }); h.render();
    assert.equal(h.calls.length, count); assert.equal(text(quiz(h)), before);
  }
  fire(h, currentQuestions[1].choices[currentQuestions[1].answer]); assert.match(text(quiz(h)), /2 beantwortet · 2 richtig/);
});

test('History away-and-back, raw URL changes and readiness changes invalidate pending failures and old actions by origin identity', async t => {
  const env = environment(t), initial = { eintrag: 'schaedel' };
  for (const visit of [
    h => history(h, { ...initial, ref: 'independent' }),
    h => { h.router.query = { ...initial, q: 'query-only' }; h.render(); },
    h => { h.router.asPath = address(initial, 'another-anchor'); h.render(); },
    h => { history(h, { eintrag: 'unterkiefer' }); history(h, initial); },
    h => { h.router.isReady = false; h.render(); h.router.isReady = true; h.render(); },
  ]) {
    const h = fixture(env), requests = pendingRouter(h), oldSelect = selector(h).props.onChange;
    const action = choose(h, 'unterkiefer'); visit(h); const focus = h.focus.length;
    requests[0].reject(new Error('late failure')); await action; await oldSelect({ target: { value: 'schaedel' } }); await oldSelect({ target: { value: 'vorderlauf' } }); h.render();
    assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.equal(h.focus.length, focus);
  }
});

test('The old explicit question anchor opens the chosen model round and focuses its actual question heading', t => {
  const env = environment(t), h = fixture(env, { eintrag: 'unterkiefer' }, { router: { asPath: address({ eintrag: 'unterkiefer' }, 'anatomie-fragen') } });
  assert.equal(selector(h).props.value, 'unterkiefer'); assert.equal(quiz(h).props.open, true);
  assert.equal(h.focus.at(-1).label, 'anatomie-fragen'); assert.equal(h.scroll.at(-1).label, 'anatomie-fragen');
  assert.equal(h.calls.length, 0);
});

test('A real unmount retires pending navigation and both current/foreign retained selections before state, URL or focus writes', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h), focus = focusProbe(h);
  startCurrentRound(h); const oldSelect = selector(h).props.onChange;
  const oldAnswer = button(h, questions[1].choices[questions[1].answer]).props.onClick, oldToggle = quiz(h).props.onToggle;
  const action = choose(h, 'unterkiefer'); h.dispose(); requests[0].reject(new Error('late unmount')); await action;
  await oldSelect({ target: { value: 'schaedel' } }); await oldSelect({ target: { value: 'vorderlauf' } }); oldAnswer(); oldToggle({ currentTarget: { open: false } });
  assert.equal(requests.length, 1); assert.equal(h.writesAfterDispose, 0); assert.equal(h.menu.opened, 0); assert.equal(alerts(h).length, 0);
  assert.equal(focus.focus, 0); assert.equal(focus.scroll, 0);
});
