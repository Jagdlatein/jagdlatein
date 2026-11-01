// Real React DOM/effects with local media and parent-guard doubles only.
// No audio network, browser profile, persistent storage or source data changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const runtime = local('react/jsx-runtime');
const sounds = createLoader()('lib/animal-sounds.js').animalSounds;

async function fixture(initial = {}, { strict = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.test/isolated-sound-player' });
  const saved = new Map(), pauses = [], writes = [], plays = [], captures = [];
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  dom.window.HTMLMediaElement.prototype.pause = function () { pauses.push(this); };
  let audioProps, sourceProps, retryProps, props = { sound: sounds[0], label: 'Originalaufnahme', onPlay: event => plays.push(event.currentTarget), ...initial }, mounted = true;
  const intercept = name => (type, attributes, key) => {
    if (type === 'audio') { audioProps = attributes; captures.push({ type, attributes }); }
    if (type === 'source') sourceProps = attributes;
    if (type === 'button' && attributes.children === 'Noch einmal laden') retryProps = attributes;
    return runtime[name](type, attributes, key);
  };
  const load = createLoader({
    react: { ...React, useState(initialValue) {
      const [value, setValue] = React.useState(initialValue);
      return [value, next => { writes.push({ afterUnmount: !mounted }); setValue(next); }];
    } },
    'react/jsx-runtime': { ...runtime, jsx: intercept('jsx'), jsxs: intercept('jsxs') },
    './SoundSpectrogram': { __esModule: true, default: ({ sound }) => React.createElement('details', { 'data-spectrogram': sound.id }, React.createElement('summary', null, 'Klangbild')) },
  });
  const Player = load('components/AnimalSoundPlayer.js').SoundPlayer;
  const { createRoot } = local('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root'));
  const f = {
    pauses, writes, plays, captures,
    get document() { return dom.window.document; },
    get audio() { return dom.window.document.querySelector('audio'); },
    get audioProps() { return audioProps; },
    get sourceProps() { return sourceProps; },
    get retryProps() { return retryProps; },
    get alert() { return dom.window.document.querySelector('[role="alert"]'); },
    async render(next = {}) {
      props = { ...props, ...next };
      await React.act(async () => { const child = React.createElement(Player, props); root.render(strict ? React.createElement(React.StrictMode, null, child) : child); });
    },
    async act(fn) { await React.act(async () => { fn(); }); },
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

test('The shared player preserves original controls, MIME, credits and deliberate playback; a reader can move credits to its final panel', async () => {
  const f = await fixture();
  try {
    assert.equal(f.audio.querySelector('source').getAttribute('src'), sounds[0].src);
    assert.equal(f.audio.querySelector('source').getAttribute('type'), 'audio/mpeg');
    assert.equal(f.audio.preload, 'none'); assert.equal(f.audio.controls, true); assert.equal(f.audio.autoplay, false);
    assert.ok(f.document.body.textContent.includes(sounds[0].author));
    assert.ok(f.document.body.textContent.includes(sounds[0].recording));
    assert.ok(f.document.querySelector(`[href="${sounds[0].sourceUrl}"]`));
    assert.ok(f.document.querySelector('[data-spectrogram]'));
    const audio = f.audio;
    await f.render({ showCredit: false });
    assert.equal(f.audio, audio); assert.equal(f.document.body.textContent.includes(sounds[0].author), false);
    await f.render({ reveal: false });
    assert.equal(f.audio, audio); assert.equal(f.document.querySelector('[data-spectrogram]'), null);
  } finally { await f.dispose(); }
});

test('Retry synchronously revokes the exact failed attempt; old error/play/retry events cannot reach the new player', async () => {
  const f = await fixture();
  try {
    const oldAudio = f.audio, oldPlay = f.audioProps.onPlay, oldError = f.sourceProps.onError;
    await f.act(oldError); assert.ok(f.alert);
    const oldRetry = f.retryProps.onClick;
    await f.act(() => {
      oldRetry(); const count = f.writes.length;
      oldError(); oldRetry(); oldPlay({ currentTarget: oldAudio });
      assert.equal(f.writes.length, count, 'Before-render callbacks are already revoked');
    });
    assert.notEqual(f.audio, oldAudio); assert.equal(f.alert, null); assert.equal(f.plays.length, 0);
    assert.ok(f.pauses.includes(oldAudio));
    await f.act(() => f.audioProps.onPlay({ currentTarget: f.audio }));
    assert.equal(f.plays.length, 1);
  } finally { await f.dispose(); }
});

test('A retained retry from A cannot clear B failure or remount it, including A–B–A reuse', async () => {
  const f = await fixture();
  try {
    await f.act(f.audioProps.onError); const oldRetry = f.retryProps.onClick, oldError = f.sourceProps.onError, oldPlay = f.audioProps.onPlay, oldAudio = f.audio;
    await f.render({ sound: sounds[1] }); await f.act(f.audioProps.onError);
    const currentAudio = f.audio, count = f.writes.length;
    await f.act(() => { oldRetry(); oldError(); oldPlay({ currentTarget: oldAudio }); });
    assert.equal(f.writes.length, count); assert.equal(f.audio, currentAudio); assert.ok(f.alert); assert.equal(f.plays.length, 0);
    await f.render({ sound: sounds[0] });
    const returnedAudio = f.audio, returnedWrites = f.writes.length;
    await f.act(() => { oldRetry(); oldError(); oldPlay({ currentTarget: oldAudio }); });
    assert.equal(f.writes.length, returnedWrites); assert.equal(f.audio, returnedAudio); assert.equal(f.alert, null);
    assert.ok(f.pauses.includes(oldAudio) && f.pauses.includes(currentAudio));
  } finally { await f.dispose(); }
});

test('The parent URL guard blocks callbacks before React renders a departure and never revives the observed old ticket', async () => {
  let live = true;
  const scope = {}, f = await fixture({ scope, isCurrent: () => live });
  try {
    await f.act(f.audioProps.onError); const oldRetry = f.retryProps.onClick, oldError = f.sourceProps.onError, oldPlay = f.audioProps.onPlay, audio = f.audio;
    const count = f.writes.length; live = false;
    await f.act(() => { oldRetry(); oldError(); oldPlay({ currentTarget: audio }); });
    assert.equal(f.writes.length, count); assert.ok(f.pauses.includes(audio)); assert.equal(f.plays.length, 0);
    live = true;
    await f.act(() => { oldRetry(); oldError(); oldPlay({ currentTarget: audio }); });
    assert.equal(f.writes.length, count, 'Returning before render cannot revive observed old work');
    await f.render({ scope: {} });
    await f.act(() => f.audioProps.onPlay({ currentTarget: f.audio })); assert.equal(f.plays.length, 1);
  } finally { await f.dispose(); }
});

test('Changing URL scope for the same recording pauses its captured element and revokes old actions without remounting audio', async () => {
  const f = await fixture({ scope: {} });
  try {
    await f.act(f.sourceProps.onError);
    const oldRetry = f.retryProps.onClick, oldError = f.audioProps.onError, oldPlay = f.audioProps.onPlay, audio = f.audio;
    await f.render({ scope: {} });
    assert.equal(f.audio, audio); assert.ok(f.pauses.includes(audio)); assert.equal(f.alert, null);
    const count = f.writes.length;
    await f.act(() => { oldRetry(); oldError(); oldPlay({ currentTarget: audio }); });
    assert.equal(f.writes.length, count); assert.equal(f.plays.length, 0);
    await f.act(() => f.audioProps.onPlay({ currentTarget: audio })); assert.equal(f.plays.length, 1);
  } finally { await f.dispose(); }
});

test('Actual unmount pauses its captured player and blocks retained current retry/error/play handlers before any state write', async () => {
  const f = await fixture();
  try {
    await f.act(f.audioProps.onError);
    const retry = f.retryProps.onClick, error = f.sourceProps.onError, play = f.audioProps.onPlay, audio = f.audio;
    await f.unmount(); assert.ok(f.pauses.includes(audio));
    const count = f.writes.length;
    await f.act(() => { retry(); error(); play({ currentTarget: audio }); });
    assert.equal(f.writes.length, count); assert.equal(f.plays.length, 0);
  } finally { await f.dispose(); }
});

test('An unchanged recording stays mounted through a local answer/reveal update; StrictMode effect replay stays usable', async () => {
  const scope = {}, f = await fixture({ scope, reveal: false }, { strict: true });
  try {
    const audio = f.audio, pauses = f.pauses.length;
    await f.act(() => f.audioProps.onPlay({ currentTarget: audio })); assert.equal(f.plays.length, 1);
    await f.render({ reveal: true, label: 'Antwort erklärt', showCredit: false });
    assert.equal(f.audio, audio); assert.equal(f.pauses.length, pauses);
    await f.act(() => f.audioProps.onPlay({ currentTarget: audio })); assert.equal(f.plays.length, 2);
  } finally { await f.dispose(); }
});
