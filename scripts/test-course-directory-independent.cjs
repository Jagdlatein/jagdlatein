// Separate owner audit: real MenuChoice buttons and host/effect phases. All
// locations, frames and requests are isolated doubles; no user storage exists.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), load = createLoader();
const props = load('pages/kurse/index.js').getStaticProps().props;
const categories = load('lib/learning-categories.js').learningCategoryDetails;
const selection = load('lib/course-directory-selection.js');

function setup(t, initial = '/kurse?kategorie=wildkunde') {
  const before = { window: global.window, document: global.document };
  const slots = [], effects = new Map(), cleanups = new Map(), frames = new Map(), requests = [], scrolls = [], focused = [];
  let cursor = 0, dirty = false, tree, disposed = false, postUnmount = 0, frame = 0, phase = 'idle';
  const browser = { location: {}, scrollTo: point => scrolls.push({ point, phase, url: router.asPath }), requestAnimationFrame: callback => { frames.set(++frame, callback); return frame; }, cancelAnimationFrame: key => frames.delete(key) };
  const router = { isReady: true, asPath: initial, query: {}, push(href, as, options) { const request = { href, as, options }; requests.push(request); return new Promise((resolve, reject) => Object.assign(request, { resolve, reject })); } };
  function route(url) { const parsed = new URL(url, 'https://jagdlatein.test'); router.asPath = url; router.query = {}; for (const key of new Set(parsed.searchParams.keys())) { const values = parsed.searchParams.getAll(key); router.query[key] = values.length === 1 ? values[0] : values; } Object.assign(browser.location, { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash, href: parsed.href }); }
  route(initial); global.window = browser; global.document = { addEventListener() {}, removeEventListener() {} };
  const hooks = { ...React,
    useState(value) { const key = cursor++; slots[key] ||= { value: typeof value === 'function' ? value() : value }; return [slots[key].value, next => { if (disposed) { postUnmount++; return; } const value = typeof next === 'function' ? next(slots[key].value) : next; dirty ||= !Object.is(value, slots[key].value); slots[key].value = value; }]; },
    useRef(value) { const key = cursor++; return slots[key] ||= { current: value }; },
    useEffect(callback, deps) { const key = cursor++, old = slots[key]; if (!old || deps.some((value, index) => !Object.is(value, old[index]))) { slots[key] = deps; effects.set(key, callback); } },
  };
  const menu = { opened: 0, closed: 0 };
  const audited = createLoader({ react: hooks, 'next/router': { useRouter: () => router }, './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) }, './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), openPageMenu() { menu.opened++; }, closePageMenu() { menu.closed++; } } });
  const Component = audited('components/CourseDirectory.js').default;
  function renderOnly() { phase = 'render'; cursor = 0; dirty = false; tree = Component(props); phase = 'idle'; }
  function commit() { phase = 'host-commit'; for (const node of nodes(tree, item => !!item.props?.ref)) node.props.ref.current = { isConnected: true, focus() { focused.push({ id: node.props.id, phase }); }, closest() { return null; }, scrollIntoView() { throw Error('Directory must scroll to page top'); } }; phase = 'effect'; const changed = [...effects]; effects.clear(); for (const [key] of changed) cleanups.get(key)?.(); for (const [key, callback] of changed) cleanups.set(key, callback()); phase = 'idle'; }
  function render() { for (let pass = 0; pass < 12; pass++) { renderOnly(); commit(); if (!dirty) return; } throw Error('Unsettled directory'); }
  function dispose() { if (disposed) return; for (const fn of cleanups.values()) fn?.(); disposed = true; }
  t.after(() => { dispose(); global.window = before.window; global.document = before.document; });
  render();
  return { router, route, renderOnly, commit, render, dispose, requests, frames, focused, scrolls, menu,
    get tree() { return tree; }, get postUnmount() { return postUnmount; },
    ids() { return nodes(tree, item => item.type === 'article').map(item => item.key); },
    handler(id) { return nodes(tree, item => item.props?.id === id)[0].props.onChange; },
    choose(id, value) { const choice = nodes(tree, item => item.props?.id === id)[0], rendered = choice.type(choice.props); const button = nodes(rendered, item => item.props?.['data-menu-choice'] === value)[0]; assert.ok(button, value); return button.props.onClick(); },
    tickFrames() { phase = 'frame'; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); phase = 'idle'; },
  };
}

test('Every category and all three formats expose the exact ordered metadata subset of the 232 actual courses', t => {
  const f = setup(t);
  assert.equal(props.courses.length, 232);
  for (const category of ['all', ...categories.map(item => item.slug)]) for (const format of ['all', 'mini', 'detailed']) {
    f.route(`/kurse?kategorie=${category}&format=${format}`); f.render();
    const expected = props.courses.filter(course => (category === 'all' || course.category === category) && (format === 'all' || course.format === format));
    assert.deepEqual(f.ids(), expected.map(course => course.id));
    const articles = nodes(f.tree, item => item.type === 'article');
    expected.forEach((course, index) => { assert.ok(text(articles[index]).includes(course.title)); assert.ok(text(articles[index]).includes(course.description)); assert.ok(nodes(articles[index], item => item.props?.href === course.href).length === 1); });
  }
  assert.equal(nodes(f.tree, item => item.type === 'input' && item.props.type === 'search').length, 0);
  assert.equal(nodes(f.tree, item => item.props?.headingOnly === true).length, 1);
});

test('Missing, repeated, malformed and contradictory selection fields never borrow a course pool', t => {
  const f = setup(t);
  for (const suffix of ['', '?format=mini', '?kategorie=', '?kategorie=unknown', '?kategorie=wildkunde&kategorie=wildkunde', '?kategorie=wildkunde&format=', '?kategorie=wildkunde&format=mini&format=all']) {
    f.route('/kurse' + suffix); f.render(); assert.deepEqual(f.ids(), [], suffix);
  }
  f.route('/kurse?kategorie=wildkunde'); f.router.query.kategorie = 'hundewesen'; f.render(); assert.deepEqual(f.ids(), []);
  f.route('/kurse?kategorie=wildkunde'); f.router.query.kategorie = ['wildkunde']; f.render(); assert.deepEqual(f.ids(), []);
  for (const query of [{ kategorie: null }, { kategorie: {} }, { format: [] }, { kategorie: 1 }]) assert.equal(selection.readCourseDirectorySelection(query).valid, false);
});

test('Ready, browser and raw router views must agree before a native menu button may navigate', t => {
  const f = setup(t), old = f.handler('course-directory-category');
  f.router.isReady = false; f.render(); old({ target: { value: 'hundewesen' } }); assert.equal(f.requests.length, 0); assert.deepEqual(f.ids(), []);
  f.router.isReady = true; f.route('/kurse?kategorie=wildkunde'); global.window.location.search = '?kategorie=hundewesen'; f.render(); f.choose('course-directory-category', 'hundewesen'); assert.equal(f.requests.length, 0);
  assert.deepEqual(f.ids(), []);
});

test('Pending and failed pushes preserve old contents; only an actual commit moves focus and page top', async t => {
  const f = setup(t), before = f.ids(), scrollCount = f.scrolls.length;
  const first = f.handler('course-directory-category')({ target: { value: 'hundewesen' } }); f.render();
  assert.deepEqual(f.ids(), before); assert.equal(f.scrolls.length, scrollCount); assert.deepEqual(f.requests[0].options, { shallow: true, scroll: false });
  f.requests[0].resolve(false); await first; f.render(); assert.deepEqual(f.ids(), before); assert.equal(nodes(f.tree, item => item.props?.role === 'alert').length, 1);
  const second = f.handler('course-directory-category')({ target: { value: 'hundewesen' } }); f.route(f.requests[1].href); f.renderOnly(); assert.equal(f.scrolls.length, scrollCount); f.commit(); f.render();
  assert.notDeepEqual(f.ids(), before); assert.equal(f.focused.at(-1).id, 'course-directory-top'); assert.ok(f.scrolls.slice(scrollCount).every(call => call.point.top === 0 && call.phase !== 'render'));
  f.requests[1].resolve(true); await second; f.tickFrames();
  f.route('/kurse?kategorie=wildkunde'); f.render(); assert.deepEqual(f.ids(), before);
});

test('Fresh intents supersede pending work; stale promise failure cannot steal the new menu or focus', async t => {
  const f = setup(t), first = f.handler('course-directory-category')({ target: { value: 'hundewesen' } });
  const second = f.handler('course-directory-category')({ target: { value: categories.find(item => !['wildkunde', 'hundewesen'].includes(item.slug)).slug } });
  f.route(f.requests[1].href); f.render(); f.requests[1].resolve(true); await second;
  const focus = f.focused.length, closed = f.menu.closed; f.requests[0].reject(Error('old')); await first; f.render();
  assert.equal(f.focused.length, focus); assert.equal(f.menu.closed, closed); assert.equal(nodes(f.tree, item => item.props?.role === 'alert').length, 0);
});

test('URL replacement before effect cleanup blocks captured handlers, frames and late failures, as does a true unmount', async t => {
  const f = setup(t), captured = f.handler('course-directory-category'), pending = captured({ target: { value: 'hundewesen' } });
  f.route('/kurse?kategorie=wildkunde&context=changed'); captured({ target: { value: 'all' } }); assert.equal(f.requests.length, 1);
  f.renderOnly(); captured({ target: { value: 'all' } }); assert.equal(f.requests.length, 1); f.commit(); f.render();
  const scrollCount = f.scrolls.length; f.tickFrames(); assert.equal(f.scrolls.length, scrollCount);
  f.dispose(); captured({ target: { value: 'all' } }); f.requests[0].reject(Error('unmounted')); await pending;
  assert.equal(f.requests.length, 1); assert.equal(f.postUnmount, 0); assert.equal(f.frames.size, 0);
});

test('Only the two owned selector fields change; unrelated repeated query values survive exact target construction', t => {
  const f = setup(t, '/kurse?kategorie=wildkunde&x=1&x=2&q=Reh&%C3%A4=Natur&Z=oben#previous');
  const target = selection.courseDirectoryTarget(f.router, 'hundewesen', 'mini'), url = new URL(target, 'https://jagdlatein.test');
  assert.deepEqual(url.searchParams.getAll('x'), ['1', '2']); assert.equal(url.searchParams.get('q'), 'Reh'); assert.equal(url.hash, '#course-directory-top');
  assert.equal(url.searchParams.get('ä'), 'Natur'); assert.equal(url.searchParams.get('Z'), 'oben');
  assert.equal(selection.courseDirectoryTarget(f.router, 'unknown', 'mini'), null);
  assert.equal(selection.courseDirectoryTarget(f.router, 'all', 'unknown'), null);
});

test('Rapid real category and format buttons combine intent while the old committed list stays visible', async t => {
  const f = setup(t), before = f.ids();
  f.choose('course-directory-category', 'hundewesen'); f.choose('course-directory-format', 'mini');
  assert.equal(f.requests.length, 2);
  const target = new URL(f.requests[1].href, 'https://jagdlatein.test');
  assert.equal(target.searchParams.get('kategorie'), 'hundewesen'); assert.equal(target.searchParams.get('format'), 'mini');
  f.requests[1].resolve(true); await Promise.resolve(); f.render(); assert.deepEqual(f.ids(), before, 'Promise success cannot commit a view');
  f.route(f.requests[1].href); f.render(); assert.deepEqual(f.ids(), props.courses.filter(course => course.category === 'hundewesen' && course.format === 'mini').map(course => course.id));
  f.requests[0].resolve(false); await Promise.resolve(); f.render(); assert.equal(nodes(f.tree, item => item.props?.role === 'alert').length, 0);
});

test('Returning to the committed category supersedes a pending switch and starts at top only after that exact new push commits', async t => {
  const f = setup(t), before = f.ids();
  f.tickFrames(); const scrollCount = f.scrolls.length, focusCount = f.focused.length;
  const old = f.handler('course-directory-category')({ target: { value: 'hundewesen' } });
  const latest = f.handler('course-directory-category')({ target: { value: 'wildkunde' } });
  f.requests[1].resolve(true); await latest; f.render();
  assert.deepEqual(f.ids(), before); assert.equal(f.scrolls.length, scrollCount); assert.equal(f.focused.length, focusCount);
  f.route(f.requests[1].href); f.renderOnly(); assert.equal(f.scrolls.length, scrollCount); f.commit(); f.render();
  assert.deepEqual(f.ids(), before); assert.equal(f.focused.length, focusCount + 1); assert.ok(f.scrolls.length > scrollCount);
  assert.ok(f.scrolls.slice(scrollCount).every(call => call.point.top === 0 && call.url === f.requests[1].href));
  const after = f.focused.length; f.requests[0].reject(Error('superseded')); await old; f.render(); assert.equal(f.focused.length, after);
  assert.equal(nodes(f.tree, item => item.props?.role === 'alert').length, 0);
});

test('A browser-first readiness gap preserves only the latest own top intent until both URL views commit the same target', async t => {
  const f = setup(t); f.tickFrames();
  const old = f.handler('course-directory-category')({ target: { value: 'hundewesen' } });
  const latest = f.handler('course-directory-category')({ target: { value: 'wildkunde' } });
  const target = new URL(f.requests[1].href, 'https://jagdlatein.test'), count = f.scrolls.length;
  Object.assign(global.window.location, { pathname: target.pathname, search: target.search, hash: target.hash, href: target.href });
  f.render(); assert.deepEqual(f.ids(), []); assert.equal(f.scrolls.length, count);
  f.requests[0].resolve(false); await old; f.render(); assert.equal(f.scrolls.length, count);
  f.route(f.requests[1].href); f.render(); assert.ok(f.scrolls.length > count); assert.equal(f.focused.at(-1).id, 'course-directory-top');
  f.requests[1].resolve(true); await latest;
});

test('A raw address change between render and host effects cannot focus or close the menu for the abandoned render', t => {
  const f = setup(t); f.tickFrames();
  const count = f.scrolls.length, closed = f.menu.closed;
  f.route('/kurse?kategorie=hundewesen'); f.renderOnly();
  f.route('/kurse?kategorie=all'); f.commit();
  assert.equal(f.scrolls.length, count); assert.equal(f.menu.closed, closed);
  f.render(); assert.equal(f.ids().length, 232); assert.ok(f.scrolls.length > count);
});

test('Foreign query changes during a readiness gap cancel the old own-focus intent permanently', async t => {
  const f = setup(t); f.tickFrames(); const count = f.scrolls.length;
  const old = f.handler('course-directory-category')({ target: { value: 'hundewesen' } });
  const latest = f.handler('course-directory-category')({ target: { value: 'wildkunde' } });
  const target = new URL(f.requests[1].href, 'https://jagdlatein.test');
  Object.assign(global.window.location, { pathname: target.pathname, search: target.search, hash: target.hash, href: target.href });
  f.router.query = { ...f.router.query, ref: 'foreign-context' }; f.render(); assert.deepEqual(f.ids(), []);
  f.route(f.requests[1].href); f.render(); assert.equal(f.scrolls.length, count, 'A later matching address cannot revive an abandoned focus job');
  f.requests[0].resolve(false); f.requests[1].resolve(true); await Promise.all([old, latest]);
});
