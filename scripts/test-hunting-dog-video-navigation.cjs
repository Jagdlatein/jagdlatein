const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { huntingDogVideoLessons: lessons } = createLoader()('lib/hunting-dog-video-lessons.js');

function nodes(node, ancestors = []) {
  if (!React.isValidElement(node)) return [];
  const children = []; React.Children.forEach(node.props.children, child => children.push(child));
  return [{ node, ancestors }, ...children.flatMap(child => nodes(child, [...ancestors, node]))];
}
function fixture(t, { query = {}, hash = '', isReady = true } = {}) {
  const oldWindow = global.window;
  global.window = { location: { hash: hash ? `#${hash.replace(/^#/, '')}` : '' } };
  const slots = [], cleanups = new Map(), effects = [], pushes = [], focused = [];
  let cursor = 0, tree, dirty, disposed = false, writesAfterDispose = 0, closed = 0, pushFailure = null, deferred = null;
  function stateWrite(slot, value) {
    if (disposed) { writesAfterDispose++; return; }
    const next = typeof value === 'function' ? value(slot.value) : value;
    if (!Object.is(slot.value, next)) { slot.value = next; dirty = true; }
  }
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => stateWrite(slots[i], value)];
    },
    useRef(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { current: initial };
      return slots[i];
    },
    useEffect(fn, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.length !== previous.length || deps.some((value, j) => !Object.is(value, previous[j]))) {
        slots[i] = deps; effects.push({ i, fn });
      }
    },
  };
  function pathFor(nextQuery, nextHash) {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(nextQuery)) for (const item of Array.isArray(value) ? value : [value]) params.append(name, item);
    return '/lernen/jagdhund-videos' + (params.size ? `?${params}` : '') + (nextHash ? `#${nextHash.replace(/^#/, '')}` : '');
  }
  const history = [{ query: { ...query }, hash }]; let historyIndex = 0;
  const router = {
    isReady, pathname: '/lernen/jagdhund-videos', query: { ...query }, asPath: pathFor(query, hash),
    async push(url, as, options) {
      pushes.push({ url, as, options });
      if (pushFailure) { const error = pushFailure; pushFailure = null; throw error; }
      if (deferred) { const request = deferred; deferred = null; return request; }
      history.splice(historyIndex + 1); history.push({ query: { ...url.query }, hash: url.hash }); historyIndex++;
      commit(history[historyIndex]); return true;
    },
  };
  function commit(entry) {
    router.query = { ...entry.query }; router.asPath = pathFor(entry.query, entry.hash);
    global.window.location.hash = entry.hash ? `#${entry.hash.replace(/^#/, '')}` : '';
  }
  const PageMenu = props => React.createElement('section', { 'data-page-menu': true }, props.children);
  const Component = createLoader({ react: hooks, 'next/router': { useRouter: () => router },
    'next/link': props => React.createElement('a', props, props.children),
    './LearningToolLayout': props => React.createElement('main', {}, props.children),
    './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() { closed++; } },
  })('components/HuntingDogVideos.js').default;
  function render() {
    let iterations = 0;
    do {
      assert.ok(iterations++ < 10, 'State/effect updates must settle');
      dirty = false; cursor = 0; tree = Component();
      for (const { node } of nodes(tree)) if (node.props.ref) {
        const text = React.Children.toArray(node.props.children).filter(value => typeof value === 'string').join('');
        node.props.ref.current = { focus(options) { focused.push({ text, action: 'focus', options }); }, scrollIntoView(options) { focused.push({ text, action: 'scroll', options }); } };
      }
      while (effects.length) { const { i, fn } = effects.shift(); cleanups.get(i)?.(); const cleanup = fn(); if (typeof cleanup === 'function') cleanups.set(i, cleanup); }
    } while (dirty);
    return tree;
  }
  function find(predicate) { return nodes(tree).find(({ node, ancestors }) => predicate(node, ancestors))?.node; }
  function article() { return find(node => node.type === 'article' && node.props.id === 'hundevideo-film'); }
  async function choose(id) { await find(node => node.type === 'select').props.onChange({ target: { value: id } }); render(); }
  function dispose() { if (disposed) return; for (const cleanup of cleanups.values()) cleanup(); disposed = true; }
  let cleaned = false;
  function cleanup() { if (cleaned) return; cleaned = true; dispose(); global.window = oldWindow; }
  t.after(cleanup);
  render();
  return { router, pushes, focused, find, article, choose, render, dispose, cleanup, PageMenu,
    get closed() { return closed; }, get writesAfterDispose() { return writesAfterDispose; },
    rejectNext(error) { pushFailure = error; }, deferNext(promise) { deferred = promise; },
    back() { assert.ok(historyIndex > 0); commit(history[--historyIndex]); render(); },
    forward() { assert.ok(historyIndex + 1 < history.length); commit(history[++historyIndex]); render(); },
    restore(nextQuery, nextHash = '') { commit({ query: nextQuery, hash: nextHash }); render(); },
  };
}

test('Choosing a scene creates a valid deep link; reload, Back and Forward retain exactly the selected lesson', async t => {
  const f = fixture(t, { query: { eintrag: lessons[0].id, herkunft: 'videos' }, hash: 'hundevideo-film' });
  assert.equal(f.article().key, lessons[0].id);
  await f.choose(lessons[1].id);
  assert.equal(f.article().key, lessons[1].id);
  assert.deepEqual(f.pushes[0], { url: { pathname: '/lernen/jagdhund-videos', query: { eintrag: lessons[1].id, herkunft: 'videos' }, hash: 'hundevideo-film' }, as: undefined, options: { shallow: true, scroll: false } });
  assert.equal(f.find(node => node.type === 'source').props.src, lessons[1].src);
  assert.equal(nodes(f.article()).filter(({ node }) => node.type === 'video').length, 1);
  assert.ok(!nodes(f.article()).some(({ node }) => node.props.children === lessons[0].title));
  f.back(); assert.equal(f.article().key, lessons[0].id);
  f.forward(); assert.equal(f.article().key, lessons[1].id);
  const fresh = fixture(t, { query: f.router.query, hash: 'hundevideo-film' });
  assert.equal(fresh.article().key, lessons[1].id);
  fresh.cleanup();
});

test('All authored direct links are recognized; missing, unknown or repeated selection parameters safely use the first scene', t => {
  const f = fixture(t);
  for (const lesson of lessons) { f.restore({ eintrag: lesson.id }, 'hundevideo-film'); assert.equal(f.article().key, lesson.id); }
  for (const query of [{}, { eintrag: '../other' }, { eintrag: [lessons[1].id, lessons[2].id] }]) {
    f.restore(query); assert.equal(f.article().key, lessons[0].id);
  }
  assert.equal(f.pushes.length, 0, 'Restoring a URL must never write another history entry');
});

test('Selection waits for router readiness and rejects an arbitrary scene without changing content or history', async t => {
  const f = fixture(t, { query: { eintrag: lessons[1].id }, isReady: false });
  assert.equal(f.article().key, lessons[0].id);
  await f.choose(lessons[2].id); assert.equal(f.pushes.length, 0);
  f.router.isReady = true; f.render(); assert.equal(f.article().key, lessons[1].id);
  await f.choose('https://other.example/video'); assert.equal(f.pushes.length, 0); assert.equal(f.article().key, lessons[1].id);
});

test('Controls and directory links live only in the lower page menu; transcript is visible and old hash targets remain', t => {
  const f = fixture(t, { query: { eintrag: lessons[1].id }, hash: 'hundevideo-handlung' });
  const menu = f.find(node => node.type === f.PageMenu);
  assert.ok(menu);
  assert.ok(nodes(menu).some(({ node }) => node.type === 'select' && node.props.id === 'hundevideo-auswahl'));
  assert.ok(!nodes(f.article()).some(({ node }) => node.type === 'select'));
  assert.deepEqual(nodes(menu).filter(({ node }) => node.props.href).map(({ node }) => node.props.href), ['/lernen/videos', '/lernen/jagdhunde']);
  const transcript = f.find(node => node.props.id === 'hundevideo-handlung');
  assert.equal(transcript.type, 'section');
  assert.ok(nodes(transcript).some(({ node }) => node.type === 'p' && node.props.children === lessons[1].transcript));
  assert.ok(f.focused.some(item => item.action === 'focus' && item.text === 'Handlung als Text'));
  const children = []; React.Children.forEach(f.article().props.children, child => children.push(child));
  const lastChild = children.at(-1);
  assert.equal(lastChild.type, 'details'); assert.equal(lastChild.props.open, undefined);
  assert.ok(nodes(lastChild).some(({ node }) => node.props.href === lessons[1].media.source));
  assert.ok(!nodes(f.article()).some(({ node, ancestors }) => node.props.href?.startsWith('https:') && !ancestors.some(parent => parent === lastChild)));
});

test('A committed scene focuses its heading; failed and cancelled navigation keep the current lesson', async t => {
  const f = fixture(t, { query: { eintrag: lessons[0].id } });
  await f.choose(lessons[1].id);
  assert.ok(f.focused.some(item => item.action === 'focus' && item.text === lessons[1].title));
  assert.ok(f.closed > 0);
  f.rejectNext(new Error('offline')); await f.choose(lessons[2].id);
  assert.equal(f.article().key, lessons[1].id);
  assert.match(f.find(node => node.props.role === 'alert').props.children, /Szene konnte nicht geöffnet/);
  f.rejectNext(Object.assign(new Error('superseded'), { cancelled: true })); await f.choose(lessons[2].id);
  assert.equal(f.article().key, lessons[1].id);
  assert.equal(f.find(node => node.props.role === 'alert'), undefined);
});

test('A detached old video cannot mark another scene, or a later instance of the same scene, as failed', async t => {
  const f = fixture(t, { query: { eintrag: lessons[0].id } });
  const oldVideo = f.find(node => node.type === 'video');
  await f.choose(lessons[1].id); oldVideo.props.onError(); f.render();
  assert.equal(f.find(node => node.props.role === 'alert'), undefined);
  await f.choose(lessons[0].id); oldVideo.props.onError(); f.render();
  assert.equal(f.find(node => node.props.role === 'alert'), undefined);
  f.find(node => node.type === 'video').props.onError(); f.render();
  assert.match(f.find(node => node.props.role === 'alert').props.children, /Video lässt sich gerade nicht abspielen/);
});

test('A navigation failure completing after unmount cannot update the departed view', async t => {
  const f = fixture(t, { query: { eintrag: lessons[0].id } });
  let reject;
  f.deferNext(new Promise((resolve, fail) => { reject = fail; }));
  const pending = f.choose(lessons[1].id);
  f.dispose(); reject(new Error('late failure')); await pending;
  assert.equal(f.writesAfterDispose, 0);
});

test('Re-selecting the current scene supersedes an in-flight different scene; an older completion cannot clear the newer request', async t => {
  const f = fixture(t, { query: { eintrag: lessons[1].id }, hash: 'hundevideo-film' });
  let rejectFirst, rejectSecond;
  f.deferNext(new Promise((resolve, reject) => { rejectFirst = reject; }));
  const first = f.choose(lessons[0].id);
  f.deferNext(new Promise((resolve, reject) => { rejectSecond = reject; }));
  const second = f.choose(lessons[2].id);
  // Next cancels the older push when the second begins. Its late catch/finally
  // must not erase the fact that a different, newer navigation is still pending.
  rejectFirst(Object.assign(new Error('superseded'), { cancelled: true })); await first;
  try {
    await f.choose(lessons[1].id);
    assert.equal(f.pushes.length, 3, 'Choosing the current scene must still call Next to cancel the pending different scene');
    assert.equal(f.pushes[2].url.query.eintrag, lessons[1].id);
    assert.equal(f.article().key, lessons[1].id);
  } finally {
    rejectSecond(Object.assign(new Error('superseded again'), { cancelled: true })); await second;
  }
  assert.equal(f.find(node => node.props.role === 'alert'), undefined);
  await f.choose(lessons[1].id);
  assert.equal(f.pushes.length, 3, 'A settled current scene needs no redundant history step');
});
