// Real React and effects with an isolated router and DOM. Media never loads;
// the real shared player, spectrogram, detail reader and route wrapper render.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const runtime = local('react/jsx-runtime');
const data = createLoader();
const { animalSounds: sounds } = data('lib/animal-sounds.js');
const { getWildlifeVideoLinks } = data('lib/learning-video-links.js');
const { resolveAnimalSoundRoute } = data('lib/animal-sound-navigation.js');
const TITLE = 'tierstimme-title', SOURCES = 'tierstimme-quellen', base = '/lernen/tierstimmen';
function address(query, hash = '') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const part of Array.isArray(value) ? value : [value]) params.append(key, part);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function walk(node, visit) {
  if (Array.isArray(node)) return node.forEach(child => walk(child, visit));
  if (!React.isValidElement(node)) return;
  visit(node); walk(node.props.children, visit);
}
async function fixture(query = { stimme: 'rothirsch' }, options = {}) {
  const hash = options.hash ?? (Object.hasOwn(query, 'stimme') ? TITLE : '');
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: `https://jagdlatein.test${address(query, hash)}` });
  const { window } = dom, saved = new Map(), pauses = [], scrolls = [], frames = new Map(), writes = [];
  let frame = 0, mounted = true, menuRenders = 0, selectProps, audioProps, sourceProps;
  window.scrollTo = value => scrolls.push(value);
  window.requestAnimationFrame = callback => { frames.set(++frame, callback); return frame; };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLMediaElement.prototype.pause = function () { pauses.push(this); };
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator,
    HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const requests = [], menu = { opened: 0, closed: 0 };
  const router = { isReady: options.ready !== false, query, asPath: address(query, hash),
    push(href, as, pushOptions) {
      const request = { href, as, options: pushOptions }; requests.push(request);
      return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
    },
  };
  const intercept = name => (type, props, key) => {
    if (type === 'audio') audioProps = props;
    if (type === 'source') sourceProps = props;
    return runtime[name](type, props, key);
  };
  const load = createLoader({
    react: { ...React, useState(initial) {
      const [value, setValue] = React.useState(initial);
      return [value, next => { writes.push({ afterUnmount: !mounted }); setValue(next); }];
    } },
    'react/jsx-runtime': { ...runtime, jsx: intercept('jsx'), jsxs: intercept('jsxs') },
    'next/router': { useRouter: () => router },
    'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname }, children),
    './LearningToolLayout': { __esModule: true, default: ({ title, children }) => React.createElement('main', null,
      React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, title), children) },
    './PageMenu': { __esModule: true, default: ({ children }) => {
      menuRenders++;
      walk(children, node => { if (node.props.id === 'tierstimme-auswahl') selectProps = node.props; });
      return React.createElement('aside', { 'data-page-menu': true }, children);
    }, openPageMenu: () => { menu.opened++; }, closePageMenu: () => { menu.closed++; } },
  });
  const Component = load('components/AnimalSoundRoute.js').default;
  const { createRoot } = local('react-dom/client');
  const root = createRoot(window.document.getElementById('root'));
  const render = async () => React.act(async () => { root.render(React.createElement(Component)); });
  const f = {
    window, router, requests, menu, writes, pauses, scrolls, render,
    get document() { return window.document; },
    get selectProps() { return selectProps; },
    get audioProps() { return audioProps; },
    get sourceProps() { return sourceProps; },
    get audio() { return window.document.querySelector('audio'); },
    get article() { return window.document.querySelector('article[aria-labelledby="tierstimme-title"]'); },
    get renderCount() { return menuRenders; },
    alerts() { return [...window.document.querySelectorAll('[role="alert"]')].map(node => node.textContent).join(' '); },
    busy() { return [...window.document.querySelectorAll('[role="status"]')].some(node => node.textContent === 'Die Aufnahme wird geöffnet …'); },
    onward() { return [...window.document.querySelectorAll('nav[aria-label="Zur Tierstimme weiterlernen"] a')].map(node => node.getAttribute('href')); },
    async invoke(callback, value) { await React.act(async () => { callback(value); }); },
    async choose(id) {
      const select = window.document.getElementById('tierstimme-auswahl'); assert.ok(select);
      await React.act(async () => { select.value = id; select.dispatchEvent(new window.Event('change', { bubbles: true })); });
      return requests.at(-1);
    },
    async navigate(next, nextHash = TITLE, ready = true) {
      router.query = next; router.asPath = address(next, nextHash); router.isReady = ready;
      window.history.replaceState(null, '', router.asPath); await render();
    },
    async settle(request, outcome = true) {
      await React.act(async () => {
        if (outcome instanceof Error) request.reject(outcome); else request.resolve(outcome);
        await Promise.resolve();
      });
    },
    async commit(request) { await this.navigate(request.href.query, request.href.hash || ''); await this.settle(request); },
    async flushFrames() { const pending = [...frames.values()]; frames.clear(); await React.act(async () => { pending.forEach(callback => callback(0)); }); },
    async tick() { await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 1)); }); },
    async unmount() { if (!mounted) return; mounted = false; await React.act(async () => root.unmount()); },
    async dispose() {
      await this.unmount(); window.close();
      for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    },
  };
  await render(); return f;
}
function assertDetail(f, sound) {
  assert.equal(f.document.querySelectorAll('audio').length, 1, sound.id);
  assert.ok(f.article, sound.id);
  assert.equal(f.audio.querySelector('source').getAttribute('src'), sound.src);
  assert.equal(f.audio.querySelector('source').getAttribute('type'), 'audio/mpeg');
  assert.equal(f.audio.preload, 'none'); assert.equal(f.audio.controls, true); assert.equal(f.audio.autoplay, false);
  assert.equal(f.document.querySelector('video,iframe'), null);
  for (const text of [sound.name, sound.scientificName, sound.cue, sound.explanation, sound.context, sound.confusion]) assert.ok(f.article.textContent.includes(text), `${sound.id}: original learning text`);
  assert.doesNotMatch(f.article.textContent, /Welche Art hörst du im Vordergrund|Richtige Antwort|Deine Hörrunde/);
  const sources = f.article.querySelector(`#${SOURCES}`);
  assert.equal(f.article.lastElementChild, sources); assert.equal(sources.tagName, 'DETAILS'); assert.equal(sources.open, false);
  for (const text of [sound.author, sound.license, sound.recording, sound.modifications, sound.factsTitle]) assert.ok(sources.textContent.includes(text), `${sound.id}: original credit`);
  const creditHrefs = [...sources.querySelectorAll('a')].map(node => node.getAttribute('href'));
  assert.deepEqual(creditHrefs, [sound.licenseUrl, sound.sourceUrl, sound.factsUrl]);
  const expected = [...new Set([sound.lessonUrl, ...(sound.speciesSlug ? [`/wildkunde/${sound.speciesSlug}`] : []), ...getWildlifeVideoLinks(sound.speciesSlug).map(video => video.href)])];
  assert.deepEqual(f.onward(), expected, `${sound.id}: precise committed learning destinations`);
  assert.equal(new Set(f.onward()).size, f.onward().length, 'The reader does not duplicate a species destination under a course label');
  for (const link of f.document.querySelectorAll('nav[aria-label="Zur Tierstimme weiterlernen"] a')) {
    assert.equal(link.hasAttribute('target'), false);
    if (link.textContent === 'Lernkurs') assert.ok(link.getAttribute('href').startsWith('/kurse/'), 'Only an actual course is called Lernkurs');
  }
}

test('All 37 explicit sound URLs render exactly one original player, complete learning content and final closed sources', async () => {
  assert.equal(sounds.length, 37);
  const f = await fixture();
  try { for (const sound of sounds) { await f.navigate({ stimme: sound.id }); assertDetail(f, sound); } }
  finally { await f.dispose(); }
});

test('Bare ready route keeps the existing library; unready and explicit invalid selectors never flash a foreign recording', async () => {
  const f = await fixture({}, { ready: false, hash: '' });
  try {
    assert.equal(f.document.querySelectorAll('audio').length, 0); assert.equal(f.article, null); assert.match(f.document.body.textContent, /wird geladen/);
    await f.invoke(f.selectProps.onChange, { target: { value: 'rothirsch' } }); assert.equal(f.requests.length, 0);
    await f.navigate({}, '');
    assert.ok(f.document.querySelector('#sound-search')); assert.ok(f.document.querySelectorAll('audio').length > 1);
    for (const id of ['', undefined, null, ['rothirsch'], ['rothirsch', 'fasan'], 'unknown', '__proto__', 'constructor', 'toString']) {
      assert.equal(resolveAnimalSoundRoute({ stimme: id }, true).status, 'invalid');
      await f.navigate({ stimme: id });
      assert.equal(f.document.querySelectorAll('audio').length, 0, JSON.stringify(id)); assert.equal(f.article, null); assert.match(f.alerts(), /ungültig/);
      await f.invoke(f.selectProps.onChange, { target: { value: id } }); assert.equal(f.requests.length, 0);
    }
    await f.navigate({ stimme: 'fasan' }, TITLE, false); assert.equal(f.audio, null);
    await f.navigate({ stimme: 'fasan' }); assertDetail(f, sounds.find(sound => sound.id === 'fasan'));
  } finally { await f.dispose(); }
});

test('A delayed push preserves actual audio, onward links and focus until the exact URL commits', async () => {
  const f = await fixture({ stimme: 'rothirsch', ref: 'kurs', kontext: ['wissen', 'stimme'] });
  try {
    const original = f.audio, onward = f.onward(); original.currentTime = 8;
    const request = await f.choose('fasan');
    assert.deepEqual(request.href, { pathname: base, query: { ref: 'kurs', kontext: ['wissen', 'stimme'], stimme: 'fasan' }, hash: TITLE });
    assert.deepEqual(request.options, { shallow: true, scroll: false }); assert.equal(request.as, undefined);
    assert.equal(f.audio, original); assert.equal(f.audio.currentTime, 8); assert.deepEqual(f.onward(), onward); assert.equal(f.busy(), true);
    assert.equal(f.document.getElementById('tierstimme-auswahl').value, 'rothirsch');
    const sentinel = f.document.getElementById('tierstimme-auswahl'); sentinel.focus();
    await f.settle(request, true);
    assert.equal(f.audio, original); assert.equal(f.busy(), true); assert.equal(f.document.activeElement, sentinel, 'Acceptance alone does not focus uncommitted content');
    await f.navigate(request.href.query, request.href.hash); await f.flushFrames();
    assertDetail(f, sounds.find(sound => sound.id === 'fasan')); assert.equal(f.busy(), false);
    assert.equal(f.document.activeElement, f.document.querySelector('[data-learning-page-start]'));
    assert.ok(f.pauses.includes(original)); assert.notEqual(f.audio, original);
  } finally { await f.dispose(); }
});

test('False, rejected and cancelled navigation keep the displayed sound; latest requests own errors and busy state', async () => {
  const f = await fixture();
  try {
    const original = f.audio, onward = f.onward();
    const falsePush = await f.choose('fasan'); await f.settle(falsePush, false);
    assert.equal(f.audio, original); assert.deepEqual(f.onward(), onward); assert.match(f.alerts(), /konnte nicht geöffnet/); assert.equal(f.busy(), false);
    const failed = await f.choose('fasan'); await f.settle(failed, new Error('isolated failure'));
    assert.equal(f.audio, original); assert.match(f.alerts(), /konnte nicht geöffnet/);
    const cancelled = await f.choose('fasan'); await f.settle(cancelled, Object.assign(new Error('cancelled'), { cancelled: true }));
    assert.equal(f.alerts(), ''); assert.equal(f.audio, original); assert.equal(f.busy(), false);
    const old = await f.choose('fasan'), latest = await f.choose('ringeltaube');
    await f.settle(old, new Error('superseded'));
    assert.equal(f.alerts(), ''); assert.equal(f.busy(), true); assert.equal(f.audio, original);
    await f.commit(latest); assertDetail(f, sounds.find(sound => sound.id === 'ringeltaube'));
  } finally { await f.dispose(); }
});

test('Reselecting the current sound preserves its audio node and supersedes a different pending target', async () => {
  const f = await fixture();
  try {
    const original = f.audio; original.currentTime = 11;
    await f.choose('rothirsch'); assert.equal(f.requests.length, 0); assert.equal(f.audio, original); assert.equal(f.audio.currentTime, 11);
    const old = await f.choose('fasan'), current = await f.choose('rothirsch');
    assert.equal(f.requests.length, 2); await f.settle(current, true);
    assert.equal(f.audio, original); assert.equal(f.busy(), false); assert.equal(f.audio.currentTime, 11);
    await f.settle(old, new Error('superseded target')); assert.equal(f.alerts(), ''); assert.equal(f.audio, original);
    await f.navigate({ stimme: 'rothirsch', ref: 'anderer-kontext' });
    assert.equal(f.audio, original, 'A committed same-sound context change pauses but does not replace the audio element');
  } finally { await f.dispose(); }
});

test('History restores the chosen recording; only the explicit sources hash opens and focuses actual final details', async () => {
  const f = await fixture();
  try {
    await f.navigate({ stimme: 'fasan' }); assertDetail(f, sounds.find(sound => sound.id === 'fasan'));
    await f.navigate({ stimme: 'rothirsch' }); assertDetail(f, sounds[0]);
    const audio = f.audio;
    await f.navigate({ stimme: 'rothirsch' }, SOURCES);
    const panel = f.document.getElementById(SOURCES);
    assert.equal(panel.open, true); assert.equal(f.document.activeElement, panel); assert.equal(f.article.lastElementChild, panel); assert.equal(f.audio, audio);
    const old = f.selectProps.onChange;
    await f.navigate({ stimme: 'ringeltaube' }, TITLE);
    assertDetail(f, sounds.find(sound => sound.id === 'ringeltaube'));
    const current = f.audio; await f.invoke(old, { target: { value: 'fasan' } });
    assert.equal(f.requests.length, 0); assert.equal(f.audio, current);
  } finally { await f.dispose(); }
});

for (const mutation of ['query', 'asPath', 'window address', 'window hash', 'readiness']) {
  test(`Live ${mutation} departure blocks retained selectors and media callbacks before React renders`, async () => {
    const f = await fixture();
    try {
      const select = f.selectProps.onChange, error = f.sourceProps.onError, play = f.audioProps.onPlay, audio = f.audio;
      const count = f.writes.length, renders = f.renderCount, opened = f.menu.opened, closed = f.menu.closed, scrolls = f.scrolls.length;
      const originalUrl = f.window.location.href;
      if (mutation === 'query') f.router.query = { stimme: 'fasan' };
      else if (mutation === 'asPath') f.router.asPath = address({ stimme: 'rothirsch' }, SOURCES);
      else if (mutation === 'window address') f.window.history.replaceState(null, '', address({ stimme: 'fasan' }, TITLE));
      else if (mutation === 'window hash') f.window.history.replaceState(null, '', address({ stimme: 'rothirsch' }, SOURCES));
      else f.router.isReady = false;
      await f.invoke(select, { target: { value: 'ringeltaube' } }); await f.invoke(error); await f.invoke(play, { currentTarget: audio });
      assert.equal(f.requests.length, 0); assert.equal(f.writes.length, count); assert.equal(f.renderCount, renders);
      assert.equal(f.menu.opened, opened); assert.equal(f.menu.closed, closed); assert.equal(f.scrolls.length, scrolls); assert.ok(f.pauses.includes(audio));
      f.router.query = { stimme: 'rothirsch' }; f.router.asPath = address(f.router.query, TITLE); f.router.isReady = true; f.window.history.replaceState(null, '', originalUrl);
      await f.invoke(select, { target: { value: 'fasan' } }); await f.invoke(error); await f.flushFrames();
      assert.equal(f.requests.length, 0); assert.equal(f.writes.length, count); assert.equal(f.scrolls.length, scrolls, 'Observed A–B–A does not revive old delayed focus or handlers');
      await f.render(); const fresh = await f.choose('fasan'); assert.equal(f.requests.length, 1); await f.commit(fresh);
    } finally { await f.dispose(); }
  });
}

test('A late promise from a departed raw URL cannot publish an error or clear busy before the replacement view renders', async () => {
  const f = await fixture();
  try {
    const old = await f.choose('fasan'), writes = f.writes.length, opened = f.menu.opened;
    f.router.query = { stimme: 'ringeltaube' };
    await f.settle(old, new Error('late raw-query failure'));
    assert.equal(f.writes.length, writes); assert.equal(f.menu.opened, opened); assert.equal(f.alerts(), '');
    await f.navigate({ stimme: 'ringeltaube' }); assertDetail(f, sounds.find(sound => sound.id === 'ringeltaube')); assert.equal(f.busy(), false);
    const next = await f.choose('fasan'); await f.navigate({ stimme: 'rothirsch' }); await f.navigate({ stimme: 'ringeltaube' });
    await f.settle(next, false); assert.equal(f.alerts(), ''); assert.equal(f.busy(), false);
  } finally { await f.dispose(); }
});

test('A library player cannot publish local media errors after the live URL has selected a reader but before its render', async () => {
  const f = await fixture({}, { hash: '' });
  try {
    const error = f.sourceProps.onError, play = f.audioProps.onPlay;
    const oldAudio = [...f.document.querySelectorAll('audio')].at(-1), writes = f.writes.length;
    f.router.query = { stimme: 'fasan' }; f.router.asPath = address(f.router.query, TITLE);
    f.window.history.replaceState(null, '', f.router.asPath);
    await f.invoke(error);
    assert.equal(f.writes.length, writes, 'The real shared library player checks its parent URL before a local error setter');
    assert.equal(f.alerts(), '');
    await f.invoke(play, { currentTarget: oldAudio });
    assert.equal(f.writes.length, writes); assert.ok(f.pauses.includes(oldAudio));
    await f.render(); assertDetail(f, sounds.find(sound => sound.id === 'fasan'));
  } finally { await f.dispose(); }
});

test('Unmount revokes retained selection, player, promise and delayed focus work', async () => {
  const f = await fixture();
  try {
    const select = f.selectProps.onChange, play = f.audioProps.onPlay, error = f.sourceProps.onError, audio = f.audio;
    const late = await f.choose('fasan'); await f.unmount();
    const writes = f.writes.length, scrolls = f.scrolls.length, opened = f.menu.opened;
    await f.invoke(select, { target: { value: 'ringeltaube' } }); await f.invoke(error); await f.invoke(play, { currentTarget: audio });
    await f.settle(late, new Error('after unmount')); await f.flushFrames();
    assert.equal(f.requests.length, 1); assert.equal(f.writes.length, writes); assert.equal(f.scrolls.length, scrolls); assert.equal(f.menu.opened, opened);
    assert.ok(f.pauses.includes(audio)); assert.equal(f.document.getElementById('root').textContent, '');
  } finally { await f.dispose(); }
});
