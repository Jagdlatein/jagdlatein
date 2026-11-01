// Real parent React lifetimes; all router/audio events are isolated doubles.
// This does not claim URL-owned library filters or quiz mode, device playback,
// a browser profile, persistent storage, or a new factual audio review.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react'), runtime = local('react/jsx-runtime');
const data = createLoader(), sounds = data('lib/animal-sounds.js').animalSounds;
const byId = data('lib/animal-sounds.js').animalSoundById;
const { filterAnimalSounds } = data('lib/animal-sound-learning.js');
const base = '/lernen/tierstimmen';

async function fixture() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.test' + base });
  const saved = new Map(), handlers = new WeakMap(), players = new Map(), writes = [], pauses = [];
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  dom.window.HTMLMediaElement.prototype.pause = function () { pauses.push(this); };
  let mounted = true;
  const router = { isReady: true, query: {}, asPath: base };
  const intercept = method => (type, attributes, key) => {
    if (['button', 'input', 'select'].includes(type)) {
      const ref = attributes.ref;
      return runtime[method](type, { ...attributes, ref(element) {
        if (element) handlers.set(element, attributes);
        if (typeof ref === 'function') ref(element); else if (ref) ref.current = element;
      } }, key);
    }
    return runtime[method](type, attributes, key);
  };
  function Player(props) {
    players.set(props.sound.id, props);
    return React.createElement('audio', { controls: true, preload: 'none', 'data-sound-id': props.sound.id,
      'data-quiz': typeof props.reveal === 'boolean' ? 'true' : undefined, onPlay: props.onPlay });
  }
  const load = createLoader({
    react: { ...React, useState(initial) {
      const [value, setValue] = React.useState(initial);
      return [value, next => { writes.push({ afterUnmount: !mounted }); setValue(next); }];
    } },
    'react/jsx-runtime': { ...runtime, jsx: intercept('jsx'), jsxs: intercept('jsxs') },
    'next/router': { useRouter: () => router },
    'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href }, children),
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './AnimalSoundPlayer': { SoundPlayer: Player },
  });
  const Library = load('components/AnimalSounds.js').default;
  const { createRoot } = local('react-dom/client'), root = createRoot(dom.window.document.getElementById('root'));
  const f = {
    router, writes, pauses,
    get document() { return dom.window.document; },
    get text() { return dom.window.document.body.textContent; },
    get audio() { return dom.window.document.querySelector('audio[data-quiz="true"]'); },
    get questionId() { return this.audio?.dataset.soundId; },
    visibleIds() { return [...dom.window.document.querySelectorAll('audio[data-sound-id]')].map(element => element.dataset.soundId); },
    element(id) { const element = dom.window.document.getElementById(id); assert.ok(element, id); return element; },
    handler(element) { const props = handlers.get(element); assert.ok(props, 'Captured native attributes'); return props; },
    button(label) {
      const element = [...dom.window.document.querySelectorAll('button')].find(button => button.textContent === label);
      assert.ok(element, 'Button: ' + label); return element;
    },
    playProps(element = this.audio) { assert.ok(element); return players.get(element.dataset.soundId); },
    async act(fn) { await React.act(async () => { fn(); }); },
    async render() { await React.act(async () => root.render(React.createElement(Library))); },
    async click(label) { const button = this.button(label); assert.equal(button.disabled, false, label); await this.act(() => this.handler(button).onClick()); },
    async change(id, value) { const element = this.element(id); await this.act(() => this.handler(element).onChange({ target: { value } })); },
    async play() { const audio = this.audio, props = this.playProps(audio); await this.act(() => props.onPlay({ currentTarget: audio })); },
    depart(kind) {
      if (kind === 'query') router.query = { stimme: 'fasan' };
      else if (kind === 'ready') router.isReady = false;
      else {
        router.asPath = base + (kind === 'hash' ? '#audit-new-context' : '?audit=changed');
        dom.window.history.replaceState(null, '', router.asPath);
      }
    },
    async unmount() { if (!mounted) return; mounted = false; await React.act(async () => root.unmount()); },
    async dispose() {
      await this.unmount(); dom.window.close();
      for (const [name, previous] of saved) {
        if (previous) Object.defineProperty(globalThis, name, previous); else delete globalThis[name];
      }
    },
  };
  await f.render(); return f;
}

function captureLibraryActions(f) {
  const start = f.handler(f.button('Hörquiz starten')).onClick;
  const open = f.handler(f.button('Stimmen entdecken')).onClick;
  const search = f.handler(f.element('sound-search')).onChange;
  const group = f.handler(f.element('sound-group')).onChange;
  const size = f.handler(f.element('sound-round-size')).onChange;
  const reset = f.handler(f.button('Filter zurücksetzen')).onClick;
  const page = f.handler(f.button('Nächste Seite')).onClick;
  const audio = f.document.querySelector('audio'), play = f.playProps(audio).onPlay;
  return { audio, run() {
    start(); open(); search({ target: { value: 'Fasan' } }); group({ target: { value: 'mammals' } });
    size({ target: { value: 'all' } }); reset(); page(); play({ currentTarget: audio });
  } };
}

test('Local library filters, pages and ten/all round sizes remain useful without rewriting the URL', async () => {
  const f = await fixture();
  try {
    assert.equal(f.visibleIds().length, 12);
    await f.click('Nächste Seite'); assert.match(f.text, /Seite 2 von/);
    await f.change('sound-search', 'Fasan');
    const matching = filterAnimalSounds({ query: 'Fasan' }).map(sound => sound.id);
    assert.deepEqual(f.visibleIds(), matching); assert.match(f.text, /Die Hörrunde verwendet deine Auswahl/);
    await f.change('sound-group', 'mammals');
    assert.equal(f.visibleIds().length, 0);
    await f.click('Filter zurücksetzen'); assert.equal(f.visibleIds().length, 12);
    assert.equal(f.router.asPath, base);
    await f.click('Hörquiz starten'); assert.match(f.text, /Aufnahme 1 von 10/);
    await f.click('Stimmen entdecken');
    await f.change('sound-round-size', 'all'); await f.click('Hörquiz starten');
    assert.ok(f.text.includes(`Aufnahme 1 von ${sounds.length}`));
    assert.equal(f.router.asPath, base);
  } finally { await f.dispose(); }
});

test('A queued current start uses the latest combined search/group/size edits before React redraws', async () => {
  const f = await fixture();
  try {
    const search = f.handler(f.element('sound-search')).onChange;
    const group = f.handler(f.element('sound-group')).onChange;
    const size = f.handler(f.element('sound-round-size')).onChange;
    const start = f.handler(f.button('Hörquiz starten')).onClick;
    const expected = filterAnimalSounds({ query: 'Fasan', group: 'gamebirds' }).map(sound => sound.id);
    await f.act(() => {
      search({ target: { value: 'Fasan' } }); group({ target: { value: 'gamebirds' } });
      size({ target: { value: 'all' } }); start();
    });
    assert.ok(f.text.includes(`Aufnahme 1 von ${expected.length}`)); assert.ok(expected.includes(f.questionId));
    assert.equal(f.router.asPath, base);
  } finally { await f.dispose(); }
});

test('Current library playback pauses the preceding element, and real unmount pauses the current captured element', async () => {
  const f = await fixture();
  try {
    const [first, second] = [...f.document.querySelectorAll('audio')];
    await f.act(() => f.playProps(first).onPlay({ currentTarget: first }));
    await f.act(() => f.playProps(second).onPlay({ currentTarget: second }));
    assert.ok(f.pauses.includes(first));
    await f.unmount(); assert.ok(f.pauses.includes(second));
  } finally { await f.dispose(); }
});

test('Retained library start/open/filter/reset/round-size/page/play actions are inert after actual unmount', async () => {
  const f = await fixture();
  try {
    const actions = captureLibraryActions(f); await f.unmount(); const writes = f.writes.length;
    await f.act(() => actions.run());
    assert.equal(f.writes.length, writes); assert.ok(f.pauses.includes(actions.audio));
  } finally { await f.dispose(); }
});

test('Before-render raw URL, query, hash and readiness departures block old library actions at their first boundary', async () => {
  for (const kind of ['address', 'query', 'hash', 'ready']) {
    const f = await fixture();
    try {
      const actions = captureLibraryActions(f), before = f.text, writes = f.writes.length;
      f.depart(kind);
      await f.act(() => actions.run());
      assert.equal(f.writes.length, writes, kind); assert.equal(f.text, before, kind);
      assert.ok(f.pauses.includes(actions.audio), kind + ': stale play pauses its own target');
      // Observed A→B→A cannot make these captured actions current again.
      f.router.isReady = true; f.router.query = {}; f.router.asPath = base;
      f.document.defaultView.history.replaceState(null, '', base);
      await f.act(() => actions.run()); assert.equal(f.writes.length, writes, kind + ': no revival');
    } finally { await f.dispose(); }
  }
});

test('A new round invalidates retained library actions while the current round remains playable', async () => {
  const f = await fixture();
  try {
    const actions = captureLibraryActions(f);
    await f.change('sound-search', byId.fasan.scientificName); await f.click('Hörquiz starten');
    assert.equal(f.questionId, 'fasan'); const writes = f.writes.length, before = f.text;
    await f.act(() => actions.run());
    assert.equal(f.writes.length, writes); assert.equal(f.text, before);
    await f.play();
    const correct = f.button(byId.fasan.name); assert.equal(correct.disabled, false);
    await f.click(byId.fasan.name); assert.match(f.text, /Richtig erkannt/);
  } finally { await f.dispose(); }
});

test('Heard/answered/index guards retain single answers and reject old question play, answer and double-next callbacks', async () => {
  const f = await fixture();
  try {
    await f.click('Hörquiz starten');
    const first = f.questionId, audio = f.audio, play = f.playProps().onPlay;
    const firstAnswer = f.handler(f.button(byId[first].name)).onClick;
    const beforeHeard = f.writes.length;
    await f.act(firstAnswer); assert.equal(f.writes.length, beforeHeard);
    await f.play(); await f.act(() => { firstAnswer(); firstAnswer(); });
    assert.match(f.text, /1 richtig erkannt/);
    const next = f.handler(f.button('Nächste Aufnahme')).onClick;
    await f.act(() => { next(); next(); }); assert.match(f.text, /Aufnahme 2 von 10/);
    const count = f.writes.length;
    await f.act(() => { firstAnswer(); play({ currentTarget: audio }); next(); });
    assert.equal(f.writes.length, count); assert.ok(f.pauses.includes(audio));
    assert.ok([...f.document.querySelectorAll('[aria-label="Antwortmöglichkeiten"] button')].every(button => button.disabled));
  } finally { await f.dispose(); }
});

test('Quiz play/skip/answer/next and open/start callbacks cannot mutate after unmount or an unrendered URL/hash departure', async () => {
  for (const departure of ['unmount', 'query', 'hash']) {
    const f = await fixture();
    try {
      const oldStart = f.handler(f.button('Hörquiz starten')).onClick;
      await f.change('sound-search', byId.fasan.scientificName); await f.click('Hörquiz starten');
      const audio = f.audio, play = f.playProps().onPlay;
      const skip = f.handler(f.button('Ich weiß es noch nicht / Aufnahme überspringen')).onClick;
      const answer = f.handler(f.button(byId.fasan.name)).onClick;
      await f.play(); await f.act(answer);
      const next = f.handler(f.button('Ergebnis ansehen')).onClick, open = f.handler(f.button('Stimmen entdecken')).onClick;
      if (departure === 'unmount') await f.unmount(); else f.depart(departure);
      const count = f.writes.length;
      await f.act(() => { play({ currentTarget: audio }); skip(); answer(); next(); open(); oldStart(); });
      assert.equal(f.writes.length, count, departure); assert.ok(f.pauses.includes(audio), departure);
    } finally { await f.dispose(); }
  }
});

test('A complete filtered round preserves explanations and repeats only its uncertain voices with a fresh generation', async () => {
  const f = await fixture();
  try {
    await f.change('sound-search', 'Fasan');
    const pool = filterAnimalSounds({ query: 'Fasan' }).map(sound => sound.id);
    await f.click('Hörquiz starten');
    const visited = [], skipped = f.questionId;
    for (let i = 0; i < pool.length; i++) {
      const id = f.questionId; visited.push(id);
      if (i === 0) await f.click('Ich weiß es noch nicht / Aufnahme überspringen');
      else { await f.play(); await f.click(byId[id].name); assert.ok(f.text.includes(byId[id].explanation)); }
      await f.click(i + 1 === pool.length ? 'Ergebnis ansehen' : 'Nächste Aufnahme');
    }
    assert.deepEqual([...visited].sort(), [...pool].sort());
    assert.ok(f.text.includes(`${pool.length - 1} von ${pool.length} Stimmen erkannt`));
    const oldRepeat = f.handler(f.button('Unsichere Stimmen wiederholen')).onClick;
    await f.act(oldRepeat); assert.equal(f.questionId, skipped); assert.match(f.text, /Aufnahme 1 von 1/);
    await f.play(); const count = f.writes.length;
    await f.act(oldRepeat); assert.equal(f.writes.length, count, 'Old result callbacks cannot reset this new round');
    await f.click(byId[skipped].name); await f.click('Ergebnis ansehen');
    assert.match(f.text, /1 von 1 Stimmen erkannt/);
  } finally { await f.dispose(); }
});
