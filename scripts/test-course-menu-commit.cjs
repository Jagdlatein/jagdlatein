const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const course = createLoader()('lib/learning-curriculum.js').learningModules.find(item => item.lessons.length >= 3);

function setup(t, initial = 0) {
  const previousWindow = global.window, previousDocument = global.document;
  const slots = [], effects = [], cleanups = new Map(), listeners = new Map(), frames = new Map();
  const requests = [], focus = [], scroll = [], anchors = [];
  let cursor = 0, dirty = false, tree, disposed = false, afterUnmount = 0, frameId = 0;
  const base = `/kurse/${course.id}`;
  const hashFor = index => `#lesson-${encodeURIComponent(course.lessons[index].id)}`;
  const router = { isReady: true, asPath: base + hashFor(initial), replace(href, as, options) {
    const request = { href, as, options }; requests.push(request);
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  } };
  const win = { location: { pathname: base, search: '', hash: hashFor(initial), href: `https://jagdlatein.invalid${router.asPath}` },
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
    scrollTo(options) { scroll.push(options); }, requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; }, cancelAnimationFrame(id) { frames.delete(id); },
  };
  const header = { isConnected: true, focus() { focus.push('page'); } };
  function target(id) { return { isConnected: true, focus() { focus.push(id); }, scrollIntoView() { anchors.push(id); }, closest() { return { querySelector() { return header; } }; } }; }
  global.window = win;
  global.document = { getElementById(id) { return target(id); }, addEventListener() {}, removeEventListener() {} };
  const hooks = { ...React,
    useState(initialValue) { const i = cursor++; slots[i] ||= { value: typeof initialValue === 'function' ? initialValue() : initialValue }; return [slots[i].value, input => {
      if (disposed) { afterUnmount++; return; }
      const next = typeof input === 'function' ? input(slots[i].value) : input;
      if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
    }]; },
    useRef(initialValue) { const i = cursor++; slots[i] ||= { current: initialValue }; return slots[i]; },
    useEffect(callback, deps) { const i = cursor++, before = slots[i]; if (!before || deps.some((value, j) => !Object.is(value, before[j]))) { slots[i] = deps; effects.push({ i, callback }); } },
  };
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => router },
    '../hooks/useCourseProgress': () => ({}),
    './LearningToolLayout': ({ children }) => React.createElement('main', null, children),
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    'next/image': props => React.createElement('img', props),
  });
  const Component = load('components/LearningCourse.js').default({ module: course }).type;
  function render() {
    for (let pass = 0; pass < 12; pass++) {
      dirty = false; cursor = 0; tree = Component({ module: course });
      for (const node of nodes(tree, node => !!node.props?.ref)) node.props.ref.current = target(node.props.id || text(node));
      while (effects.length) { const { i, callback } = effects.shift(); cleanups.get(i)?.(); const cleanup = callback(); if (typeof cleanup === 'function') cleanups.set(i, cleanup); }
      if (!dirty) return;
    }
    throw new Error('Course did not settle');
  }
  function dispose() { if (disposed) return; for (const cleanup of cleanups.values()) cleanup(); disposed = true; }
  t.after(() => { dispose(); global.window = previousWindow; global.document = previousDocument; });
  render();
  return { router, requests, focus, scroll, anchors, frames, dispose, render,
    get tree() { return tree; }, get afterUnmount() { return afterUnmount; },
    title() { return text(nodes(tree, node => node.props?.id === 'current-lesson-heading')[0]); },
    select(index) { return nodes(tree, node => node.type?.name === 'MenuChoice' && node.props.id === 'lesson-selection')[0].props.onChange({ target: { value: String(index) } }); },
    navigate(hash) { win.location.hash = hash; router.asPath = base + hash; win.location.href = `https://jagdlatein.invalid${router.asPath}`; render(); },
    commit(index) { this.navigate(hashFor(index)); },
    get handler() { return nodes(tree, node => node.type?.name === 'MenuChoice' && node.props.id === 'lesson-selection')[0].props.onChange; },
  };
}

test('Course lesson text waits for a real URL commit; false and rejected choices keep the current full lesson', async t => {
  const f = setup(t), snapshot = JSON.stringify(course);
  const first = f.select(1); f.render(); assert.equal(f.title(), course.lessons[0].title);
  assert.deepEqual(f.requests[0].options, { shallow: true, scroll: false });
  f.requests[0].resolve(false); await first; f.render(); assert.equal(f.title(), course.lessons[0].title);
  assert.ok(nodes(f.tree, node => node.props?.role === 'alert').length);
  const second = f.select(2); f.requests[1].reject(new Error('network')); await second; f.render();
  assert.equal(f.title(), course.lessons[0].title); assert.equal(JSON.stringify(course), snapshot);
});

test('An actual menu lesson commit starts at page top; reselecting the committed lesson writes no route; direct sources and quiz retain their anchors', async t => {
  const f = setup(t), action = f.select(1);
  f.commit(1); assert.equal(f.title(), course.lessons[1].title); assert.equal(f.focus.at(-1), 'page');
  f.requests[0].resolve(true); await action;
  await f.select(1); assert.equal(f.requests.length, 1); assert.equal(f.focus.at(-1), 'page');
  f.navigate('#quellen'); assert.equal(f.anchors.at(-1), 'learning-sources');
  f.navigate('#wissenscheck'); assert.equal(f.anchors.at(-1), 'quiz-heading'); assert.equal(f.frames.size, 0);
});

test('Unmount blocks a captured lesson menu handler and ignores a late failed lesson request', async t => {
  const f = setup(t), old = f.handler, action = f.select(1);
  f.dispose(); assert.equal(f.frames.size, 0); old({ target: { value: '2' } });
  assert.equal(f.requests.length, 1); f.requests[0].reject(new Error('late')); await action;
  assert.equal(f.afterUnmount, 0);
});

test('An external source jump supersedes a pending menu intent; a later direct lesson link retains its anchor', async t => {
  const f = setup(t), action = f.select(1);
  f.navigate('#quellen'); const before = f.scroll.length;
  f.requests[0].resolve(false); await action; f.render();
  f.commit(1); assert.equal(f.title(), course.lessons[1].title);
  assert.equal(f.focus.at(-1), 'current-lesson-heading');
  assert.equal(f.scroll.length, before, 'An old menu intent must not turn a later direct lesson link into a category/top action');
});
