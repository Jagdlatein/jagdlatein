// Actual React hydration/effects and isolated storage/players. No real account,
// browser storage, profile write, network request or media playback is used.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToString, renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const data = createLoader(), { examCountries, EXAM_PROFILE_STORAGE_KEY: KEY } = data('lib/exam-profile.js');
const generic = '/lernen/jagdrecht', genericText = 'Rechtswissen nach Prüfungsregion';

async function fixture({ tool = 'link', profile = null, denyRead = false, hydrate = false, ready = true, entry } = {}) {
  const route = tool === 'wild' ? '/lernen/wildtier-videofaelle' : tool === 'dog' ? '/lernen/jagdhund-videos' : '/isolated-media-law-link';
  entry ||= tool === 'wild' ? 'fuchs' : 'labrador-signal';
  const address = route + (tool === 'link' ? '' : `?eintrag=${entry}`);
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: `https://jagdlatein.test${address}` });
  const saved = new Map(), values = new Map(profile ? [[KEY, JSON.stringify(profile)]] : []), writes = [], reads = [], pauses = [], navigation = [], warnings = [];
  let denied = denyRead, mounted = true, reactRoot;
  const store = { getItem(key) { reads.push(key); if (denied) throw new Error('Isolated denied read'); return values.get(key) ?? null; },
    setItem(key, value) { writes.push(['set', key, value]); values.set(key, value); }, removeItem(key) { writes.push(['remove', key]); values.delete(key); } };
  Object.defineProperty(dom.window, 'localStorage', { configurable: true, get: () => store });
  dom.window.HTMLMediaElement.prototype.pause = function () { pauses.push(this); };
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.scrollTo = () => {};
  dom.window.requestAnimationFrame = fn => dom.window.setTimeout(fn, 0);
  dom.window.cancelAnimationFrame = id => dom.window.clearTimeout(id);
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const router = { isReady: ready, query: tool === 'link' ? {} : { eintrag: entry }, asPath: address,
    push(...args) { navigation.push(args); return Promise.resolve(true); } };
  const Link = ({ children, href, prefetch, ...props }) => React.createElement('a', { ...props, href }, children);
  const load = createLoader({ 'next/link': Link, 'next/router': { useRouter: () => router },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
  });
  const Component = load(tool === 'wild' ? 'components/WildlifeVideoCases.js' : tool === 'dog' ? 'components/HuntingDogVideos.js' : 'components/MediaExamLawLink.js').default;
  const node = React.createElement(Component), container = dom.window.document.getElementById('root');
  let serverHtml = null;
  const previousError = console.error;
  console.error = (...args) => { warnings.push(args.map(String).join(' ')); };
  try {
    const { createRoot, hydrateRoot } = local('react-dom/client');
    if (hydrate) {
      serverHtml = renderToString(node); assert.equal(reads.length, 0, 'Actual SSR never reads local storage');
      container.innerHTML = serverHtml;
      await React.act(async () => { reactRoot = hydrateRoot(container, node); });
    } else {
      reactRoot = createRoot(container);
      await React.act(async () => { reactRoot.render(node); });
    }
  } finally { console.error = previousError; }
  return {
    document: dom.window.document, window: dom.window, router, reads, writes, values, pauses, navigation, warnings, serverHtml,
    law() { return [...dom.window.document.querySelectorAll('a')].find(link => link.textContent.startsWith('Rechtswissen')); },
    get video() { return dom.window.document.querySelector('video'); },
    async act(callback) { await React.act(async () => { callback(); }); },
    async externalProfile(value, { raw = false } = {}) {
      if (value === null) values.delete(KEY); else values.set(KEY, raw ? value : JSON.stringify(value));
      const event = new dom.window.Event('storage'); Object.defineProperties(event, { key: { value: KEY }, storageArea: { value: store } });
      await React.act(async () => { dom.window.dispatchEvent(event); });
    },
    deny(value) { denied = value; },
    async unmount() { if (!mounted) return; mounted = false; await React.act(async () => reactRoot.unmount()); },
    async dispose() {
      await this.unmount(); dom.window.close();
      for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    },
  };
}

test('Actual SSR and hydration share the neutral link before restoring an explicit profile without writes or warnings', async () => {
  const f = await fixture({ profile: { country: 'DE', region: 'BY' }, hydrate: true });
  try {
    assert.match(f.serverHtml, /href="\/lernen\/jagdrecht"/); assert.ok(f.serverHtml.includes(genericText));
    assert.equal(f.law().getAttribute('href'), '/jagdrecht/de?region=BY');
    assert.equal(f.law().textContent, 'Rechtswissen: Bayern · Deutschland');
    assert.equal(f.law().hasAttribute('target'), false); assert.equal(f.writes.length, 0); assert.equal(f.navigation.length, 0);
    assert.equal(f.warnings.length, 0);
  } finally { await f.dispose(); }
});

test('All 51 authored valid country/region pairs resolve exactly, without leaking unrelated stored fields', async () => {
  const f = await fixture(); let checked = 0;
  try {
    assert.deepEqual(examCountries.map(country => country.regions.length), [26, 9, 16]);
    for (const country of examCountries) for (const region of country.regions) {
      await f.externalProfile({ country: country.code, region: region.code, email: 'private@example.test', notes: 'private-note-sentinel' });
      assert.equal(f.law().getAttribute('href'), `/jagdrecht/${country.slug}?region=${region.code}`);
      assert.equal(f.law().textContent, `Rechtswissen: ${region.name} · ${country.name}`);
      assert.equal(f.document.querySelectorAll('a').length, 1); assert.equal(f.document.querySelector('video,audio,iframe,form'), null);
      assert.doesNotMatch(f.document.body.innerHTML, /private@example|private-note-sentinel|email=|notes=/);
      checked++;
    }
    assert.equal(checked, 51); assert.equal(f.writes.length, 0); assert.equal(f.navigation.length, 0);
  } finally { await f.dispose(); }
});

test('Missing, malformed, impossible, repeated and prototype-shaped stored profiles use the neutral country-free entry', async () => {
  const f = await fixture();
  try {
    for (const profile of [null, {}, [], { country: 'DE', region: 'GR' }, { country: 'CH', region: 'BY' }, { country: ['DE'], region: 'BY' },
      { country: 'DE', region: ['BY'] }, { country: '__proto__', region: 'BY' }, { country: 'DE', region: 'constructor' }]) {
      await f.externalProfile(profile); assert.equal(f.law().getAttribute('href'), generic); assert.equal(f.law().textContent, genericText);
    }
    await f.externalProfile('{broken json', { raw: true }); assert.equal(f.law().getAttribute('href'), generic);
    assert.equal(f.writes.length, 0); assert.equal(f.navigation.length, 0);
  } finally { await f.dispose(); }
});

test('An unready snapshot cannot publish its profile and denied storage never guesses a country', async () => {
  const Link = ({ children, href }) => React.createElement('a', { href }, children);
  const pending = createLoader({ 'next/link': Link, '../lib/use-exam-profile': { __esModule: true, default: () => ({ ready: false, profile: { country: 'AT', region: 'T' } }) } });
  const html = renderToStaticMarkup(React.createElement(pending('components/MediaExamLawLink.js').default));
  assert.match(html, /href="\/lernen\/jagdrecht"/); assert.ok(html.includes(genericText)); assert.doesNotMatch(html, /Tirol|region=/);
  const f = await fixture({ denyRead: true, profile: { country: 'AT', region: 'T' } });
  try { assert.equal(f.law().getAttribute('href'), generic); assert.equal(f.writes.length, 0); }
  finally { await f.dispose(); }
});

test('Profile clearing and storage failure preserve explicit current choices without triggering media/navigation or writes', async () => {
  const f = await fixture({ profile: { country: 'CH', region: 'GR' } });
  try {
    assert.equal(f.law().getAttribute('href'), '/jagdrecht/ch?region=GR');
    f.deny(true); await f.externalProfile({ country: 'DE', region: 'BY' });
    assert.equal(f.law().getAttribute('href'), '/jagdrecht/ch?region=GR', 'A denied read preserves the explicit in-memory target');
    f.deny(false); await f.externalProfile(null); assert.equal(f.law().getAttribute('href'), generic);
    await f.unmount(); const reads = f.reads.length; await f.externalProfile({ country: 'AT', region: 'T' });
    assert.equal(f.reads.length, reads, 'No profile listener remains after unmount');
    assert.equal(f.writes.length, 0); assert.equal(f.navigation.length, 0);
  } finally { await f.dispose(); }
});

for (const tool of ['wild', 'dog']) {
  test(`${tool} video keeps its real player, playback position and answer through profile changes in the existing lower menu`, async () => {
    const f = await fixture({ tool });
    try {
      const video = f.video; assert.ok(video); video.currentTime = 7;
      if (tool === 'wild') {
        await f.act(() => video.dispatchEvent(new f.window.Event('timeupdate', { bubbles: true })));
        const choice = f.document.querySelector('.choices button'); assert.equal(choice.disabled, false);
        await f.act(() => choice.click()); assert.match(f.document.body.textContent, /Richtig beobachtet/);
      } else {
        const choice = f.document.querySelector('input[type="radio"]');
        await f.act(() => choice.click()); assert.equal(choice.checked, true);
      }
      const answer = tool === 'wild' ? f.document.querySelector('.feedback[role="status"]').textContent : f.document.querySelector('input[type="radio"]:checked').value;
      const pauses = f.pauses.length, address = f.router.asPath, src = video.querySelector('source').getAttribute('src');
      for (const profile of [{ country: 'DE', region: 'BY' }, { country: 'AT', region: 'T' }, { country: 'CH', region: 'BE' }]) {
        await f.externalProfile(profile);
        assert.ok(f.law().closest('aside')); assert.equal(f.document.querySelectorAll('video').length, 1);
        assert.equal(f.video, video); assert.equal(video.currentTime, 7); assert.equal(video.querySelector('source').getAttribute('src'), src);
        assert.equal(f.pauses.length, pauses); assert.equal(f.router.asPath, address); assert.equal(f.window.location.pathname + f.window.location.search, address);
        assert.equal(tool === 'wild' ? f.document.querySelector('.feedback[role="status"]').textContent : f.document.querySelector('input[type="radio"]:checked').value, answer);
      }
      assert.equal(f.writes.length, 0); assert.equal(f.navigation.length, 0); assert.equal(f.document.querySelector('iframe,audio'), null);
    } finally { await f.dispose(); }
  });
  test(`${tool} unready and invalid selections do not show a media-specific law destination`, async () => {
    for (const state of [{ ready: false }, { entry: 'unknown' }]) {
      const f = await fixture({ tool, ...state, profile: { country: 'DE', region: 'BY' } });
      try { assert.equal(f.law(), undefined); assert.equal(f.video, null); assert.equal(f.navigation.length, 0); }
      finally { await f.dispose(); }
    }
  });
}
