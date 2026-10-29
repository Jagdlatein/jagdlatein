// Executes the real component with isolated route, network and storage doubles.
// It separates a navigation promise from the actual URL commit.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(item => nodes(item, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function words(node) {
  return node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(words).join('')
    : typeof node === 'object' ? words(node.props?.children) : String(node);
}
const norm = { id: 'synthetic-sg', topic: 'pruefung', title: 'Synthetic law article', lawTitle: 'Synthetic law', citation: 'Art. 1', officialTextCitation: 'Art. 1 Abs. 1',
  officialText: 'Synthetic official excerpt.', learningReviewed: true, summary: 'Synthetic reviewed explanation.', reviewedOn: '2026-10-23',
  regionCode: 'SG', regionName: 'St. Gallen', sources: [] };
function bundle(code = 'SG') { return { country: 'CH', region: { code, name: code === 'SG' ? 'St. Gallen' : 'Zürich', officialUrl: 'https://example.invalid', lawTitle: 'Synthetic law' },
  articles: [{ ...norm, regionCode: code }], questions: [{ id: `${code}-question`, topic: 'pruefung', articleId: norm.id, regionCode: code,
    format: 'single', prompt: 'Synthetic legal question', options: [{ id: 'a', text: 'Synthetic correct answer' }, { id: 'b', text: 'Synthetic other answer' }], correctIds: ['a'], explanation: 'Synthetic explanation', sourceIds: [] }], sources: [] }; }

function fixture(initial = '/jagdrecht/ch') {
  const oldWindow = global.window, oldFetch = global.fetch;
  const slots = [], effects = [], calls = [], requests = [], menuOpen = [], writes = [];
  let cursor = 0, dirty = false, tree, active = true, lateWrites = 0;
  let props = { country: 'CH', name: 'Schweiz', regionLabel: 'Kanton', regions: [{ code: 'SG', name: 'St. Gallen' }, { code: 'ZH', name: 'Zürich' }, { code: 'BUND', name: 'Bundesrecht' }] };
  const storageWrites = [];
  const router = { isReady: true, query: {}, asPath: initial, replace: () => Promise.resolve(false),
    push(href, _unused, options) { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); calls.push({ href, options, resolve, reject }); return promise; } };
  function route(href) {
    router.asPath = href;
    const url = new URL(href, 'https://jagdlatein.test');
    window.location = url;
    router.query = Object.fromEntries([...new Set(url.searchParams.keys())].map(key => { const all = url.searchParams.getAll(key); return [key, all.length === 1 ? all[0] : all]; }));
  }
  const window = { location: new URL(initial, 'https://jagdlatein.test'), localStorage: { getItem: () => null, setItem: (key, value) => storageWrites.push([key, value]) } };
  global.window = window;
  route(initial);
  global.fetch = (url, options) => new Promise(resolve => requests.push({ url, signal: options.signal, resolve }));
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { if (!active) { lateWrites++; return; } slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; writes.push(slots[i].value); dirty = true; }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || !deps || deps.some((value, n) => value !== previous.deps?.[n])) {
      slots[i] = { deps, cleanup: previous?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  const PageMenu = () => null;
  const Round = () => null;
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => router },
    '../lib/use-exam-profile': { useExamProfile: () => ({ profile: null, ready: true }) },
    './ExamProfileSummary': { __esModule: true, default: () => null },
    'next/link': ({ href, children, prefetch, shallow, scroll, ...props }) => React.createElement('a', { href, ...props }, children),
    './Seo': { __esModule: true, default: () => null },
    './PageMenu': { __esModule: true, default: PageMenu, openPageMenu: id => menuOpen.push(id), closePageMenu: () => {}, resetPageMenuPosition: () => {} },
    './ResearchQuestionRound': { __esModule: true, default: Round },
  });
  const Component = load('components/RegionalLawLearning.js').default;
  function render() { cursor = 0; dirty = false; tree = Component(props); for (const node of nodes(tree, node => node.props?.ref)) node.props.ref.current = { focus() {}, scrollIntoView() {} }; return tree; }
  function flush() { let limit = 0; do { render(); effects.splice(0).forEach(effect => effect()); } while (dirty && ++limit < 30); assert.ok(limit < 30); }
  async function settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); if (active) flush(); }
  const f = { router, calls, requests, menuOpen, storageWrites, writes, render, flush, settle,
    get tree() { return tree; }, get lateWrites() { return lateWrites; },
    html() { return renderToStaticMarkup(nodes(tree, node => node.type === PageMenu)[0].props.children); },
    button(label) { const found = nodes(tree, node => node.type === 'button' && words(node).replace(/\s+/g, ' ').trim() === label)[0]; assert.ok(found, `Missing ${label}`); return found; },
    click(label) { this.button(label).props.onClick({ button: 0, preventDefault() {} }); flush(); },
    round() { return nodes(tree, node => node.type === Round)[0]; },
    search(value) { const input = nodes(tree, node => node.type === 'input' && node.props.type === 'search')[0]; assert.ok(input); input.props.onChange({ target: { value } }); flush(); },
    async respond(index, data = bundle()) { requests[index].resolve({ ok: true, json: async () => data }); await settle(); },
    async accept(index, value = true) { calls[index].resolve(value); await settle(); },
    async reject(index, error = new Error('private failure')) { calls[index].reject(error); await settle(); },
    commit(href, beforeEffects = false) { route(href); if (beforeEffects) render(); else flush(); },
    country(code) { props = { ...props, country: code, name: code === 'DE' ? 'Deutschland' : 'Schweiz', regionLabel: code === 'DE' ? 'Bundesland' : 'Kanton' }; },
    unmount() { if (!active) return; slots.forEach(slot => slot?.cleanup?.()); active = false; },
    dispose() { this.unmount(); global.window = oldWindow; global.fetch = oldFetch; },
  };
  flush(); return f;
}

test('A country route opens one region list, with no native selector, dialog or second selection stage', () => {
  const f = fixture();
  try {
    assert.match(f.html(), /Schweiz · Kanton/);
    assert.match(f.html(), /St\. Gallen \(SG\)/);
    assert.doesNotMatch(f.html(), /<select|role="dialog"|Lernform|Prüfungsthema/);
    assert.equal(nodes(f.tree, node => node.props?.id === 'regional-law-region').length, 1);
    assert.equal(f.calls.length, 0); assert.equal(f.requests.length, 0); assert.equal(f.storageWrites.length, 0);
    f.click('Land wählen'); assert.match(f.html(), />Land<\/h3>/); assert.doesNotMatch(f.html(), /St\. Gallen \(SG\)/);
    f.click('Kanton wählen'); assert.match(f.html(), /St\. Gallen \(SG\)/); assert.equal(f.calls.length, 0);
    f.click('Land wählen');
    f.click('Schweiz'); assert.match(f.html(), /St\. Gallen \(SG\)/); assert.equal(f.calls.length, 0);
  } finally { f.dispose(); }
});

test('Selecting a region keeps the list until a real URL commit even when its navigation promise resolves first', async () => {
  const f = fixture();
  try {
    f.click('St. Gallen (SG)'); assert.equal(f.calls[0].href, '/jagdrecht/ch?region=SG');
    assert.match(f.html(), /Schweiz · Kanton/); assert.match(f.html(), /Auswahl wird geöffnet/);
    assert.equal(f.requests.length, 0); assert.equal(f.storageWrites.length, 0);
    await f.accept(0); assert.match(f.html(), /Schweiz · Kanton/); assert.equal(f.requests.length, 0);
    f.commit(f.calls[0].href); assert.match(f.html(), /Aktuelle Auswahl/); assert.doesNotMatch(f.html(), /Prüfungsregion auswählen/);
    assert.equal(f.requests.length, 1); assert.equal(f.storageWrites.length, 1);
    await f.respond(0); assert.match(f.html(), /Rechtsthemen/);
  } finally { f.dispose(); }
});

test('Local selection stages preserve search, quiz pool identity and URL without starting another request', async () => {
  const f = fixture('/jagdrecht/ch?region=SG&ansicht=uebung');
  try {
    await f.respond(0); f.search('Synthetic'); const key = f.round().key;
    for (const label of ['Land Schweiz', 'Kanton St. Gallen', 'Lernform Rechtsfragen üben', 'Prüfungsthema Alle Rechtsthemen']) {
      f.click(label); assert.doesNotMatch(f.html(), /Aktuelle Auswahl/);
      f.click('Zur Auswahl'); assert.match(f.html(), /value="Synthetic"/); assert.equal(f.round().key, key);
    }
    assert.equal(f.calls.length, 0); assert.equal(f.requests.length, 1); assert.equal(f.router.asPath, '/jagdrecht/ch?region=SG&ansicht=uebung');
  } finally { f.dispose(); }
});

test('False, rejected and cancelled selection navigations retain the current query, search and question pool', async () => {
  for (const outcome of ['false', 'reject', 'cancel']) {
    const f = fixture('/jagdrecht/ch?region=SG&ansicht=uebung');
    try {
      await f.respond(0); f.search('Synthetic'); const key = f.round().key;
      f.click('Lernform Rechtsfragen üben'); f.click('Fragen & Lösungen');
      if (outcome === 'false') await f.accept(0, false); else await f.reject(0, Object.assign(new Error('private error sentinel'), outcome === 'cancel' ? { cancelled: true } : {}));
      assert.match(f.html(), /regional-law-form/); assert.equal(f.router.query.ansicht, 'uebung');
      assert.doesNotMatch(f.html(), /private error sentinel/);
      if (outcome !== 'cancel') assert.match(f.html(), /role="alert"/);
      f.click('Zur Auswahl'); assert.match(f.html(), /value="Synthetic"/); assert.equal(f.round().key, key);
    } finally { f.dispose(); }
  }
});

test('A commit before promise acknowledgement adopts the URL selection and ignores a later stale failure', async () => {
  const f = fixture('/jagdrecht/ch?region=SG&ansicht=uebung');
  try {
    await f.respond(0); f.search('Synthetic'); f.click('Lernform Rechtsfragen üben'); f.click('Fragen & Lösungen');
    f.commit(f.calls[0].href); assert.equal(f.router.query.ansicht, 'fragen'); assert.match(f.html(), /Aktuelle Auswahl/); assert.match(f.html(), /value=""/);
    await f.reject(0); assert.doesNotMatch(f.html(), /role="alert"/); assert.equal(f.router.query.ansicht, 'fragen');
  } finally { f.dispose(); }
});

test('Reselecting the current region or form returns to the same selection without losing its exact article or quiz scope', async () => {
  for (const href of ['/jagdrecht/ch?region=SG&thema=pruefung&artikel=synthetic-sg', '/jagdrecht/ch?region=SG&thema=pruefung&ansicht=uebung']) {
    const f = fixture(href);
    try {
      await f.respond(0); const key = f.round()?.key;
      f.click('Kanton St. Gallen'); f.click('St. Gallen (SG)');
      assert.match(f.html(), /Aktuelle Auswahl/); assert.equal(f.router.asPath, href); assert.equal(f.calls.length, 0);
      f.click(href.includes('uebung') ? 'Lernform Rechtsfragen üben' : 'Lernform Wissen & Gesetzestexte');
      f.click(href.includes('uebung') ? 'Rechtsfragen üben' : 'Wissen & Gesetzestexte');
      assert.match(f.html(), /Aktuelle Auswahl/); assert.equal(f.router.asPath, href); assert.equal(f.calls.length, 0);
      assert.equal(f.round()?.key, key);
      if (!href.includes('uebung')) assert.match(renderToStaticMarkup(f.tree), /Synthetic reviewed explanation/);
    } finally { f.dispose(); }
  }
});

test('A newer local choice and external history prevent an older navigation error from reopening another selection', async () => {
  const f = fixture('/jagdrecht/ch?region=SG');
  try {
    await f.respond(0); f.click('Kanton St. Gallen'); f.click('Zürich (ZH)');
    f.click('Zur Auswahl'); f.click('Lernform Wissen & Gesetzestexte');
    await f.reject(0); assert.match(f.html(), /regional-law-form/); assert.doesNotMatch(f.html(), /role="alert"/);
    f.click('Fragen & Lösungen'); f.commit('/jagdrecht/ch?region=ZH&ansicht=uebung');
    await f.reject(2); assert.equal(f.router.query.ansicht, 'uebung'); assert.doesNotMatch(f.html(), /role="alert"/);
  } finally { f.dispose(); }
});

test('Old choice handlers are blocked after local replacement, URL away-and-back, and unmount before push or writes', async () => {
  const f = fixture();
  try {
    const old = f.button('St. Gallen (SG)').props.onClick;
    f.click('Land wählen'); old(); f.flush(); assert.equal(f.calls.length, 0);
    f.click('Schweiz'); const oldAgain = f.button('St. Gallen (SG)').props.onClick;
    f.commit('/jagdrecht/ch?region=ZH', true); f.commit('/jagdrecht/ch', true);
    oldAgain(); f.flush(); assert.equal(f.calls.length, 0);
    const unmounted = f.button('St. Gallen (SG)').props.onClick;
    f.unmount(); unmounted(); assert.equal(f.calls.length, 0); assert.equal(f.lateWrites, 0);
  } finally { f.dispose(); }
});

test('An old fetch response cannot revive a region after A-B-A or write state after unmount', async () => {
  const f = fixture('/jagdrecht/ch?region=SG');
  try {
    f.commit('/jagdrecht/ch?region=ZH', true); f.commit('/jagdrecht/ch?region=SG', true);
    await f.respond(0); assert.equal(f.writes.filter(value => value?.bundle).length, 0, 'The obsolete response is rejected before a state write, not merely hidden by a later cleanup');
    assert.match(renderToStaticMarkup(f.tree), /Rechtsinhalte für diese Auswahl werden geladen/);
    f.unmount(); for (const request of f.requests) request.resolve({ ok: true, json: async () => bundle() });
    await f.settle(); assert.equal(f.lateWrites, 0);
  } finally { f.dispose(); }
});

test('An unready router hides stale region choices and rejects an already captured ready click before URL work', () => {
  const f = fixture();
  try {
    const old = f.button('St. Gallen (SG)').props.onClick;
    f.router.isReady = false; f.render();
    assert.doesNotMatch(f.html(), /St\. Gallen \(SG\)/); assert.match(f.html(), /wird vorbereitet/);
    old(); f.flush(); assert.equal(f.calls.length, 0); assert.equal(f.requests.length, 0);
  } finally { f.dispose(); }
});

test('Reselecting the actual choice supersedes a different pending router destination without clearing its context or leaving a pending guard', async () => {
  for (const [stageLabel, other, current, finalStage] of [
    ['Kanton St. Gallen', 'Zürich (ZH)', 'St. Gallen (SG)', 'Aktuelle Auswahl'],
    ['Lernform Rechtsfragen üben', 'Fragen & Lösungen', 'Rechtsfragen üben', 'Aktuelle Auswahl'],
    ['Prüfungsthema Jagdprüfung und Ausbildung', 'Alle Rechtsthemen', 'Jagdprüfung und Ausbildung', 'Aktuelle Auswahl'],
    ['Land Schweiz', 'Deutschland', 'Schweiz', 'Schweiz · Kanton'],
  ]) {
    const href = '/jagdrecht/ch?region=SG&thema=pruefung&ansicht=uebung&q=context#fragen';
    const f = fixture(href);
    try {
      await f.respond(0); f.search('Synthetic'); const key = f.round().key;
      f.click(stageLabel); f.click(other); assert.equal(f.calls.length, 1);
      f.click(current); assert.equal(f.calls.length, 2, 'Next receives a superseding transition, not only a cleared local ref');
      assert.equal(f.calls[1].href, href, 'The current address retains all search/context/hash fields');
      assert.deepEqual(f.calls[1].options, { shallow: true, scroll: false });
      await f.accept(1); await f.reject(0); assert.equal(f.router.asPath, href);
      assert.match(f.html(), new RegExp(finalStage)); assert.doesNotMatch(f.html(), /Auswahl wird geöffnet|role="alert"/);
      assert.equal(f.round().key, key);
    } finally { f.dispose(); }
  }
});

test('A country URL waiting for matching country props cannot display or request the previous country content', async () => {
  const f = fixture('/jagdrecht/ch?region=SG&ansicht=uebung');
  try {
    await f.respond(0); const old = f.button('Land Schweiz').props.onClick;
    f.commit('/jagdrecht/de?region=SG&ansicht=uebung', true);
    assert.match(renderToStaticMarkup(f.tree), /wird vorbereitet/); assert.doesNotMatch(f.html(), /St\. Gallen|Schweiz/);
    assert.equal(f.round(), undefined);
    old(); f.flush(); assert.equal(f.calls.length, 0); assert.equal(f.requests.length, 1);
  } finally { f.dispose(); }
});

test('A retained failed-content retry cannot update state after unmount', async () => {
  const f = fixture('/jagdrecht/ch?region=SG');
  try {
    await f.respond(0, { country: 'AT', region: { code: 'SG' }, articles: [], questions: [], sources: [] });
    const retry = f.button('Erneut laden').props.onClick;
    f.unmount(); retry(); assert.equal(f.lateWrites, 0); assert.equal(f.requests.length, 1);
  } finally { f.dispose(); }
});

test('The real mounted question round keeps an answered question while internal choice lists open, return or fail navigation', async () => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div><details open><summary>Menü</summary><div id="jl-page-menu" data-page-menu-route="/jagdrecht/ch?region=SG&amp;ansicht=uebung"></div></details></body></html>', { url: 'https://jagdlatein.test/jagdrecht/ch?region=SG&ansicht=uebung' });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key));
    Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.scrollTo = () => {};
  const oldFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => bundle() });
  const pushes = [];
  const router = { isReady: true, asPath: '/jagdrecht/ch?region=SG&ansicht=uebung', query: { region: 'SG', ansicht: 'uebung' }, replace: () => Promise.resolve(false),
    push(href) { pushes.push(href); return Promise.resolve(false); } };
  const actual = createLoader({ 'next/router': { useRouter: () => router }, './Seo': { __esModule: true, default: () => null },
    'next/link': ({ href, children, prefetch, shallow, scroll, ...props }) => React.createElement('a', { href, ...props }, children) });
  const Component = actual('components/RegionalLawLearning.js').default;
  const { createRoot } = local('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root'));
  const click = async text => {
    const button = [...dom.window.document.querySelectorAll('button')].find(node => node.textContent.replace(/\s+/g, ' ').trim() === text);
    assert.ok(button, `Missing actual DOM button ${text}`);
    await React.act(async () => { button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, button: 0 })); await Promise.resolve(); });
  };
  try {
    await React.act(async () => {
      root.render(React.createElement(Component, { country: 'CH', name: 'Schweiz', regionLabel: 'Kanton', regions: [{ code: 'SG', name: 'St. Gallen' }, { code: 'ZH', name: 'Zürich' }] }));
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });
    const questionRound = dom.window.document.getElementById('regional-law-practice');
    assert.ok(questionRound);
    await click('Synthetic correct answer');
    assert.match(questionRound.textContent, /Richtig eingeordnet/);
    await click('Lernform Rechtsfragen üben');
    assert.ok(dom.window.document.getElementById('regional-law-form'));
    assert.equal(dom.window.document.querySelectorAll('#jl-page-menu select').length, 0);
    assert.equal(dom.window.document.getElementById('regional-law-practice'), questionRound);
    await click('Zur Auswahl');
    assert.match(questionRound.textContent, /Richtig eingeordnet/);
    await click('Lernform Rechtsfragen üben'); await click('Fragen & Lösungen');
    assert.equal(pushes.length, 1); assert.match(dom.window.document.getElementById('jl-page-menu').textContent, /Auswahl konnte nicht geöffnet/);
    assert.equal(dom.window.document.getElementById('regional-law-practice'), questionRound);
    assert.match(questionRound.textContent, /Richtig eingeordnet/);
  } finally {
    await React.act(async () => root.unmount());
    global.fetch = oldFetch; dom.window.close();
    for (const [key, previous] of saved) { if (previous) Object.defineProperty(global, key, previous); else delete global[key]; }
  }
});
