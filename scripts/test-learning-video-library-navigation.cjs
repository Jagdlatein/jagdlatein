// Real React effects and DOM events against an isolated router. No browser,
// account, persistent storage or network is used by this directory regression.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const data = createLoader();
const videos = data('lib/learning-video-library.js').getLearningVideoLibrary();
const { filterLearningVideos } = data('lib/video-library-search.js');
const expected = (query = '', group = 'all') => filterLearningVideos(videos, query, group).map(item => item.id);
const base = '/lernen/videos';
function address(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, entry);
  }
  return `${base}${params.size ? `?${params}` : ''}`;
}
function walkElements(node, visit) {
  if (Array.isArray(node)) return node.forEach(child => walkElements(child, visit));
  if (!React.isValidElement(node)) return;
  visit(node); walkElements(node.props.children, visit);
}

async function fixture(query = {}, options = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: `https://jagdlatein.test${address(query)}` });
  const { window } = dom, saved = new Map(), scrolls = [], frames = new Map();
  let frame = 0, mounted = true;
  window.scrollTo = value => scrolls.push(value);
  window.requestAnimationFrame = callback => { frames.set(++frame, callback); return frame; };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator,
    HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const requests = [], menu = { closed: 0, opened: 0 };
  let handlers, menuRenders = 0;
  const router = { isReady: options.ready !== false, query, asPath: address(query),
    push(href, as, pushOptions) {
      const request = { href, as, options: pushOptions };
      requests.push(request);
      return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
    },
  };
  const load = createLoader({
    'next/router': { useRouter: () => router },
    'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname }, children),
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null,
      React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, 'Jagdvideos zum Lernen'), children) },
    './PageMenu': { __esModule: true, default: ({ children }) => {
      menuRenders++;
      handlers = {};
      // Capture public child handlers at their rendered boundary. Retaining
      // these functions models an event already queued before a route change.
      walkElements(children, element => {
        if (element.props.id === 'video-query') handlers.query = element.props.onChange;
        if (element.props.id === 'video-bereich') handlers.group = element.props.onChange;
        if (element.type === 'form') handlers.submit = element.props.onSubmit;
        if (element.type === 'button' && element.props.type === 'button') handlers.reset = element.props.onClick;
      });
      return React.createElement('aside', { 'data-page-menu': true }, children);
    },
      closePageMenu: () => { menu.closed++; }, openPageMenu: () => { menu.opened++; } },
  });
  const Component = load('components/LearningVideoLibrary.js').default;
  const { createRoot } = local('react-dom/client');
  const root = createRoot(window.document.getElementById('test-root'));
  const render = async () => React.act(async () => { root.render(React.createElement(Component, { videos })); });
  const f = {
    window, router, requests, menu, scrolls, render,
    get document() { return window.document; },
    get handlers() { return handlers; },
    get renderCount() { return menuRenders; },
    ids() { return [...window.document.querySelectorAll('[data-video-id]')].map(node => node.getAttribute('data-video-id')); },
    alerts() { return [...window.document.querySelectorAll('[role="alert"]')].map(node => node.textContent).join(' '); },
    busy() { return [...window.document.querySelectorAll('[role="status"]')].some(node => node.textContent === 'Die Videosuche wird geöffnet …'); },
    async invoke(callback, value) {
      await React.act(async () => {
        // Do not await an async navigation handler: the isolated router promise
        // deliberately remains pending until the test delivers its outcome.
        callback(value);
      });
    },
    async draft({ q, bereich } = {}) {
      await React.act(async () => {
        if (q !== undefined) {
          const input = window.document.getElementById('video-query');
          assert.ok(input, 'The single directory search has its stable label target');
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, q);
          input.dispatchEvent(new window.Event('input', { bubbles: true }));
        }
        if (bereich !== undefined) {
          const select = window.document.getElementById('video-bereich');
          assert.ok(select); select.value = bereich;
          select.dispatchEvent(new window.Event('change', { bubbles: true }));
        }
      });
    },
    async submit() {
      const form = window.document.querySelector('form[aria-label="Videos filtern"]');
      assert.ok(form, 'Filters belong to one named submit form');
      await React.act(async () => { form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
      return requests.at(-1);
    },
    async navigate(next, ready = true) {
      router.query = next; router.asPath = address(next); router.isReady = ready;
      window.history.replaceState(null, '', router.asPath);
      await render();
    },
    async settle(request, outcome = true) {
      await React.act(async () => {
        if (outcome instanceof Error) request.reject(outcome); else request.resolve(outcome);
        await Promise.resolve();
      });
    },
    async commit(request) {
      await this.navigate(request.href.query || {});
      await this.settle(request);
    },
    async flushFrames() {
      const pending = [...frames.values()]; frames.clear();
      await React.act(async () => { pending.forEach(callback => callback(0)); });
    },
    async unmount() {
      if (!mounted) return; mounted = false;
      await React.act(async () => root.unmount());
    },
    async dispose() {
      await this.unmount(); window.close();
      for (const [key, previous] of saved) {
        if (previous) Object.defineProperty(globalThis, key, previous); else delete globalThis[key];
      }
    },
  };
  await render();
  return f;
}

test('Ready URL controls discovery; one search and both subject choices live in the lower menu', async () => {
  const f = await fixture({ bereich: 'hund', q: 'Spurlaut' }, { ready: false });
  try {
    assert.deepEqual(f.ids(), [], 'An unready router cannot expose guessed all-video results');
    assert.equal(f.requests.length, 0);
    await f.navigate({ bereich: 'hund', q: 'Spurlaut' });
    assert.deepEqual(f.ids(), expected('Spurlaut', 'hund'));
    assert.ok(f.ids().includes('hund-labrador-signal'), 'A concept taught by this lesson can find the precise clip');
    const searches = f.document.querySelectorAll('input[type="search"]');
    assert.equal(searches.length, 1);
    assert.ok(searches[0].closest('aside[data-page-menu]'));
    assert.equal(searches[0].maxLength, 160);
    assert.equal(searches[0].value, 'Spurlaut');
    const select = f.document.getElementById('video-bereich');
    assert.equal(select.value, 'hund');
    assert.deepEqual([...select.options].map(option => [option.value, option.textContent]), [['all', 'Alle Videos'], ['wild', 'Wildkunde'], ['hund', 'Hundewesen']]);
    assert.ok(f.document.querySelector('[data-video-results="true"]'));
    assert.equal(f.document.querySelectorAll('video,iframe').length, 0);
    for (const image of f.document.querySelectorAll('img')) {
      assert.ok(image.getAttribute('src').startsWith('/lernen/'));
      assert.equal(image.getAttribute('loading'), 'lazy');
    }
  } finally { await f.dispose(); }
});

test('Draft filters wait for URL commit; accepted navigation and history restore results and page-start focus', async () => {
  const f = await fixture();
  try {
    const all = f.ids(); assert.deepEqual(all, expected());
    await f.draft({ q: '  Fuchs  ', bereich: 'wild' });
    assert.deepEqual(f.ids(), all, 'Typing never presents results for an uncommitted URL');
    const request = await f.submit();
    assert.equal(request.href.pathname, base);
    assert.deepEqual(request.href.query, { bereich: 'wild', q: 'Fuchs' });
    assert.deepEqual(request.options, { shallow: true, scroll: false });
    assert.deepEqual(f.ids(), all);
    await f.commit(request); await f.flushFrames();
    assert.deepEqual(f.ids(), expected('Fuchs', 'wild'));
    assert.equal(f.document.activeElement, f.document.querySelector('[data-learning-page-start]'));
    assert.ok(f.scrolls.some(value => value.top === 0));
    await f.navigate({ bereich: 'hund', q: 'Retriever' });
    assert.deepEqual(f.ids(), expected('Retriever', 'hund'));
    assert.equal(f.document.getElementById('video-query').value, 'Retriever');
    assert.equal(f.document.getElementById('video-bereich').value, 'hund');
    await f.navigate({ bereich: 'wild', q: 'Fuchs' });
    assert.deepEqual(f.ids(), expected('Fuchs', 'wild'), 'Back/forward restores the committed filter');
    await f.draft({ q: '', bereich: 'all' });
    const reset = await f.submit(); assert.deepEqual(reset.href.query, {}, 'Default filters keep the canonical URL bare');
    await f.commit(reset); assert.deepEqual(f.ids(), all);
  } finally { await f.dispose(); }
});

test('Invalid, explicitly empty and repeated URL values show recovery help and never unrelated results', async () => {
  const f = await fixture();
  try {
    for (const query of [
      { bereich: '' }, { bereich: 'unknown' }, { bereich: ['wild', 'hund'] },
      { q: '' }, { q: '   ' }, { q: ['Fuchs', 'Reh'] }, { q: 'x'.repeat(161) },
    ]) {
      await f.navigate(query);
      assert.deepEqual(f.ids(), [], JSON.stringify(query));
      assert.match(f.document.querySelector('main').textContent, /Such|Bereich|Filter|Adresse/);
      assert.ok(f.alerts().trim(), `Invalid selection has explicit help: ${JSON.stringify(query)}`);
      assert.equal(f.requests.length, 0, 'Invalid addresses are explained without silently rewriting history');
    }
    await f.navigate({}); assert.deepEqual(f.ids(), expected());
    await f.navigate({ bereich: 'all' }); assert.deepEqual(f.ids(), expected(), 'The documented all selector is valid even though submissions omit its default');
  } finally { await f.dispose(); }
});

test('Rejected and false pushes preserve the displayed directory; stale failures cannot replace a later committed view', async () => {
  const f = await fixture({ bereich: 'wild', q: 'Fuchs' });
  try {
    const initial = f.ids();
    await f.draft({ q: 'Retriever', bereich: 'hund' });
    const failed = await f.submit(); await f.settle(failed, new Error('isolated failure'));
    assert.deepEqual(f.ids(), initial); assert.ok(f.alerts().trim());
    const refused = await f.submit(); await f.settle(refused, false);
    assert.deepEqual(f.ids(), initial); assert.ok(f.alerts().trim());
    await f.draft({ q: 'Rute', bereich: 'hund' }); const old = await f.submit();
    await f.draft({ q: 'Retriever', bereich: 'hund' }); const latest = await f.submit();
    assert.notEqual(old, latest);
    await f.settle(old, new Error('stale failure'));
    assert.equal(f.alerts(), '', 'An earlier failure does not interrupt the newest request');
    await f.commit(latest);
    assert.deepEqual(f.ids(), expected('Retriever', 'hund'));
    assert.equal(f.alerts(), '');
    await f.draft({ q: 'Fuchs', bereich: 'wild' }); const abandoned = await f.submit();
    await f.navigate({ q: 'Rute', bereich: 'hund' });
    const restored = f.ids(), focus = f.document.activeElement;
    await f.settle(abandoned, new Error('failure from a departed URL'));
    assert.deepEqual(f.ids(), restored); assert.equal(f.alerts(), ''); assert.equal(f.document.activeElement, focus);
  } finally { await f.dispose(); }
});

test('Cancelled requests stay quiet and callbacks after unmount cannot revive the directory or focus work', async () => {
  const f = await fixture();
  try {
    await f.draft({ q: 'Fuchs' }); const cancelled = await f.submit();
    const error = new Error('cancelled'); error.cancelled = true;
    await f.settle(cancelled, error); assert.equal(f.alerts(), '');
    const late = await f.submit(); await f.unmount();
    const scrolls = f.scrolls.length;
    await f.settle(late, new Error('completion after unmount')); await f.flushFrames();
    assert.equal(f.document.getElementById('test-root').textContent, '');
    assert.equal(f.scrolls.length, scrolls);
  } finally { await f.dispose(); }
});

test('Retained submit handlers use the latest draft on the same origin and preserve incidental query fields', async () => {
  const incidental = { eingang: 'menue', filter: ['wissen', 'video'] };
  const f = await fixture({ ...incidental, q: 'Fuchs', bereich: 'wild' });
  try {
    f.window.history.replaceState(null, '', `${f.router.asPath}#alter-anker`); await f.render();
    const old = f.handlers;
    await f.draft({ q: 'Retriever', bereich: 'hund' });
    await f.invoke(old.submit, { preventDefault() {} });
    const changed = f.requests.at(-1);
    assert.deepEqual(changed.href.query, { ...incidental, q: 'Retriever', bereich: 'hund' }, 'A queued submit reads the latest user edits, including both fields');
    assert.equal(Object.hasOwn(changed.href, 'hash'), false, 'Directory submissions clear incidental anchors');
    assert.deepEqual(f.ids(), expected('Fuchs', 'wild'));
    await f.settle(changed, false);
    await f.draft({ q: '', bereich: 'all' });
    await f.invoke(old.submit, { preventDefault() {} });
    const cleared = f.requests.at(-1);
    assert.deepEqual(cleared.href.query, incidental, 'Only the owned q/bereich fields are replaced or removed');
    assert.equal(Object.hasOwn(cleared.href, 'hash'), false);
    await f.commit(cleared); assert.deepEqual(f.ids(), expected());
  } finally { await f.dispose(); }
});

for (const mutation of ['query', 'asPath', 'raw hash', 'readiness']) {
  test(`Queued change/reset/submit ignore a changed live ${mutation} before React rerenders`, async () => {
    const f = await fixture({ q: 'Fuchs', bereich: 'wild' });
    try {
      const retained = f.handlers, renders = f.renderCount;
      const closed = f.menu.closed, opened = f.menu.opened, scrolls = f.scrolls.length;
      const focus = f.document.activeElement;
      if (mutation === 'query') f.router.query = { q: 'Rute', bereich: 'hund' };
      else if (mutation === 'asPath') f.router.asPath = `${f.router.asPath}#andere-ansicht`;
      else if (mutation === 'raw hash') f.window.history.replaceState(null, '', `${f.window.location.pathname}${f.window.location.search}#andere-ansicht`);
      else f.router.isReady = false;
      await f.invoke(retained.query, { target: { value: 'Retriever' } });
      await f.invoke(retained.group, { target: { value: 'hund' } });
      await f.invoke(retained.reset);
      await f.invoke(retained.submit, { preventDefault() {} });
      assert.equal(f.requests.length, 0, 'No event from the departed URL may push a new route');
      assert.equal(f.renderCount, renders, 'Stale handlers cannot schedule draft/error/loading writes');
      assert.equal(f.document.getElementById('video-query').value, 'Fuchs');
      assert.equal(f.document.getElementById('video-bereich').value, 'wild');
      assert.equal(f.document.activeElement, focus);
      assert.equal(f.menu.closed, closed); assert.equal(f.menu.opened, opened); assert.equal(f.scrolls.length, scrolls);
      await f.render();
      assert.deepEqual(f.ids(), mutation === 'readiness' ? [] : mutation === 'query' ? expected('Rute', 'hund') : expected('Fuchs', 'wild'));
      assert.equal(f.alerts(), '');
    } finally { await f.dispose(); }
  });
}

test('Observing a departed raw hash permanently invalidates queued handlers even when the same URL returns before render', async () => {
  const f = await fixture({ q: 'Fuchs', bereich: 'wild' });
  try {
    const retained = f.handlers, renders = f.renderCount;
    const originalUrl = f.window.location.href, focus = f.document.activeElement;
    const opened = f.menu.opened, closed = f.menu.closed, scrolls = f.scrolls.length;
    f.window.history.replaceState(null, '', `${f.window.location.pathname}${f.window.location.search}#verlassene-ansicht`);
    await f.invoke(retained.query, { target: { value: 'Retriever' } });
    assert.equal(f.renderCount, renders, 'The first observed mismatch invalidates the origin without a state write');
    f.window.history.replaceState(null, '', originalUrl);
    await f.invoke(retained.submit, { preventDefault() {} });
    await f.invoke(retained.reset);
    await f.invoke(retained.group, { target: { value: 'hund' } });
    await f.flushFrames();
    assert.equal(f.requests.length, 0, 'Restoring identical URL bytes cannot revive events from the invalidated origin');
    assert.equal(f.renderCount, renders);
    assert.equal(f.document.getElementById('video-query').value, 'Fuchs');
    assert.equal(f.document.getElementById('video-bereich').value, 'wild');
    assert.equal(f.document.activeElement, focus); assert.equal(f.menu.opened, opened); assert.equal(f.menu.closed, closed);
    assert.equal(f.scrolls.length, scrolls, 'The observed departure also cancels delayed focus work before identical URL bytes return');
    await f.render();
    assert.deepEqual(f.ids(), expected('Fuchs', 'wild'));
    await f.draft({ q: 'Retriever', bereich: 'hund' });
    const fresh = await f.submit();
    assert.equal(f.requests.length, 1, 'The freshly rendered origin can accept a new user action');
    assert.deepEqual(fresh.href.query, { q: 'Retriever', bereich: 'hund' });
    await f.commit(fresh); assert.deepEqual(f.ids(), expected('Retriever', 'hund'));
  } finally { await f.dispose(); }
});

for (const outcome of ['rejected', 'false']) {
  test(`A ${outcome} push from the old URL cannot publish errors before the replacement URL rerenders`, async () => {
    const f = await fixture({ q: 'Fuchs', bereich: 'wild' });
    try {
      await f.draft({ q: 'Retriever', bereich: 'hund' }); const request = await f.submit();
      assert.equal(f.busy(), true);
      const renders = f.renderCount, opened = f.menu.opened, closed = f.menu.closed, scrolls = f.scrolls.length;
      const focus = f.document.activeElement;
      f.router.query = { q: 'Rute', bereich: 'hund' };
      await f.settle(request, outcome === 'rejected' ? new Error('failure from an already departed raw query') : false);
      assert.equal(f.renderCount, renders, 'Live-origin guard runs before error or busy state setters');
      assert.equal(f.alerts(), ''); assert.equal(f.menu.opened, opened); assert.equal(f.menu.closed, closed);
      assert.equal(f.scrolls.length, scrolls); assert.equal(f.document.activeElement, focus);
      await f.render();
      assert.deepEqual(f.ids(), expected('Rute', 'hund'));
      assert.equal(f.busy(), false, 'A new committed origin hides the previous attempt');
      assert.equal(f.alerts(), '');
    } finally { await f.dispose(); }
  });
}

test('A true push keeps the busy notice until URL commit; a matching-current retry supersedes the outstanding request', async () => {
  const f = await fixture();
  try {
    const startUrl = f.window.location.href, all = f.ids();
    await f.draft({ q: 'Fuchs', bereich: 'wild' }); const accepted = await f.submit();
    assert.equal(f.busy(), true); await f.settle(accepted, true);
    assert.equal(f.busy(), true, 'Router acceptance alone does not claim the destination has committed');
    assert.equal(f.window.location.href, startUrl); assert.deepEqual(f.ids(), all);
    assert.equal(f.document.getElementById('video-query').value, 'Fuchs');
    assert.equal(f.document.getElementById('video-bereich').value, 'wild');
    await f.draft({ q: '', bereich: 'all' }); const sameCurrent = await f.submit();
    assert.equal(f.requests.length, 2, 'A busy attempt prevents the matching-current shortcut');
    assert.deepEqual(sameCurrent.href.query, {}); assert.equal(f.busy(), true);
    await f.draft({ q: 'Retriever', bereich: 'hund' }); const newest = await f.submit();
    assert.equal(f.requests.length, 3); await f.settle(sameCurrent, false);
    assert.equal(f.busy(), true, 'A superseded completion cannot clear the newest busy notice');
    assert.equal(f.alerts(), ''); assert.deepEqual(f.ids(), all);
    await f.commit(newest); assert.equal(f.busy(), false);
    assert.deepEqual(f.ids(), expected('Retriever', 'hund'));
    assert.equal(f.alerts(), '');
  } finally { await f.dispose(); }
});

test('An accepted matching-current retry finishes without waiting for an impossible address change', async () => {
  const f = await fixture();
  try {
    const all = f.ids();
    await f.draft({ q: 'Fuchs', bereich: 'wild' }); const abandoned = await f.submit();
    await f.draft({ q: '', bereich: 'all' }); const current = await f.submit();
    assert.equal(f.busy(), true); assert.equal(f.requests.length, 2);
    await f.settle(current, true);
    assert.equal(f.busy(), false, 'The accepted address is already the actual current address');
    assert.deepEqual(f.ids(), all);
    assert.equal(f.document.activeElement, f.document.querySelector('[data-learning-page-start]'));
    await f.settle(abandoned, new Error('superseded different target'));
    assert.equal(f.busy(), false); assert.equal(f.alerts(), ''); assert.deepEqual(f.ids(), all);
  } finally { await f.dispose(); }
});
