const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const React = projectRequire('react');
const { renderToStaticMarkup } = projectRequire('react-dom/server');
const swc = projectRequire('next/dist/build/swc');

function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.resolve(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  const resolve = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ asPath: '/wildkunde', isReady: false }) };
    if (id === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === '../../components/LearningToolLayout') return { __esModule: true, default: ({ children }) => React.createElement('main', null, children) };
    if (id === '../../components/AppIcon') return { __esModule: true, default: () => null };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return projectRequire(id);
  };
  const globals = overrides.__globals || {};
  new Function('require', 'module', 'exports', 'window', 'setTimeout', 'clearTimeout', code)(resolve, mod, mod.exports, globals.window, globals.setTimeout || setTimeout, globals.clearTimeout || clearTimeout);
  cache.set(filename, mod.exports); return mod.exports;
}
function findAll(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => findAll(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)];
}
function words(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(words).join('');
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function setup(asPath = '/wildkunde', ready = true) {
  const slots = [], effects = [], replacements = [], pushes = [], assigned = [], timers = new Map(), listeners = new Map(); let cursor = 0, tree, changed = false, nextTimer = 0;
  const hooks = { ...React,
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, value => { if (!Object.is(value, slots[index].value)) changed = true; slots[index].value = value; }]; },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: { current: initial } }; return slots[index].value; },
    useMemo(callback) { return callback(); },
    useEffect(callback, deps) { const index = cursor++, prior = slots[index]; if (!prior || deps.some((value, i) => value !== prior.deps[i])) { slots[index] = { deps, cleanup: prior?.cleanup }; effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = callback(); }); } },
  };
  const router = { asPath, isReady: ready,
    replace(href, unused, options) { let resolve, reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail; }); replacements.push({ href, options, resolve, reject }); return promise; },
    push(href) { pushes.push(href); return Promise.resolve(true); },
  };
  const window = { location: { assign(href) { assigned.push(href); } }, addEventListener(name, callback) { listeners.set(name, callback); }, removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); } };
  function location(href) { const url = new URL(href, 'https://test.invalid'); Object.assign(window.location, { pathname: url.pathname, search: url.search, hash: url.hash }); }
  location(asPath);
  const globals = { window, setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  const Component = load('pages/wildkunde/index.js', { react: hooks, 'next/router': { useRouter: () => router }, __globals: globals }).default;
  function render() { cursor = 0; changed = false; tree = Component(); }
  function flush() { for (let i = 0; i < 15; i++) { effects.splice(0).forEach(callback => callback()); if (changed) render(); else if (!effects.length) return; } throw new Error('URL effect loop'); }
  function route(href, pop = false) { router.asPath = href; location(href); if (pop) listeners.get('popstate')?.(); render(); flush(); }
  async function tick() { for (let i = 0; i < 8; i++) await Promise.resolve(); render(); flush(); }
  render(); flush();
  return { get tree() { return tree; }, render, flush, router, replacements, pushes, assigned, timers, listeners, route, tick,
    runTimers(delay = 180) { const pending = [...timers].filter(([, item]) => item.delay === delay); for (const [id, item] of pending) { timers.delete(id); item.callback(); } },
    async settle(index, result = true, reject = false) { if (reject) replacements[index].reject(new Error('cancelled')); else replacements[index].resolve(result); await tick(); },
    ack(index) { route(replacements[index].href); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    rows() { return findAll(tree, node => node.props?.['data-wildlife-slug']); },
    field(type) { return findAll(tree, node => node.type === type)[0]; },
    change(type, value) { const field = this.field(type); assert.ok(field); field.props.onChange({ target: { value } }); render(); flush(); },
    click(label) { const button = findAll(tree, node => node.type === 'button' && words(node) === label)[0]; assert.ok(button, label); button.props.onClick(); render(); flush(); },
    portrait(slug, extra = {}, auxiliary = false) { const row = this.rows().find(item => item.props['data-wildlife-slug'] === slug); assert.ok(row, slug); const link = findAll(row, node => typeof node.props?.href === 'string')[0]; const event = { button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra }; const promise = link.props[auxiliary ? 'onAuxClick' : 'onClick'](event); return { event, promise, href: link.props.href }; },
  };
}

const inventory = load('lib/european-wildlife-discovery.js').europeanWildlife;

test('One alphabetic list exposes every existing entry, its real knowledge and one portrait link without paging', () => {
  const ui = setup();
  const expected = [...inventory].sort((left, right) => left.name.localeCompare(right.name, 'de'));
  assert.deepEqual(ui.rows().map(row => row.props['data-wildlife-slug']), expected.map(species => species.slug));
  assert.equal(ui.rows().length, 114);
  for (const [index, species] of expected.entries()) {
    const row = ui.rows()[index];
    const links = findAll(row, node => typeof node.props?.href === 'string');
    assert.equal(links.length, 1, species.slug);
    assert.equal(links[0].props.href, `/wildkunde/${species.slug}`);
    assert.ok(words(row).includes(species.identification), `${species.slug}: identification stays visible`);
    assert.ok(words(row).includes(species.habitat), `${species.slug}: habitat stays visible`);
    assert.equal(findAll(row, node => node.type === 'button' || node.type === 'details').length, 0);
  }
  assert.equal(findAll(ui.tree, node => node.type === 'input' && node.props.type === 'search').length, 1);
  assert.equal(findAll(ui.tree, node => node.type === 'select').length, 1);
  assert.equal(findAll(ui.tree, node => node.type === 'button').length, 0);
  assert.doesNotMatch(words(ui.tree), /Weitere Arten|Seite \d+ von/);
  const html = renderToStaticMarkup(React.createElement(load('pages/wildkunde/index.js').default));
  assert.equal((html.match(/data-wildlife-slug=/g) || []).length, inventory.length, 'All entries also exist before client hydration');
  assert.match(html, /Hybrid, keine eigene Art/);
  assert.match(html, /bedeutet keine Jagdfreigabe/);
});

test('Live name/alias and group filters combine, an empty result explains recovery, reset restores the full list', () => {
  const ui = setup();
  ui.change('input', 'Steinbock');
  assert.ok(ui.rows().some(row => row.props['data-wildlife-slug'] === 'steinwild'));
  assert.ok(ui.rows().length < inventory.length);
  ui.change('select', 'Enten');
  assert.equal(ui.rows().length, 0);
  assert.match(words(ui.tree), /Keine Wildart passt/);
  ui.click('Suche leeren');
  assert.equal(ui.rows().length, inventory.length);
  ui.change('select', 'Enten');
  const bySlug = Object.fromEntries(inventory.map(species => [species.slug, species]));
  assert.ok(ui.rows().length > 0);
  for (const row of ui.rows()) assert.equal(bySlug[row.props['data-wildlife-slug']].group, 'Enten');
});

test('A targeted biology search links to the existing section while submit alone moves focus to results', () => {
  const ui = setup(); const calls = [];
  findAll(ui.tree, node => node.props?.id === 'wildlife-results')[0].props.ref.current = {
    focus: options => calls.push(['focus', options]), scrollIntoView: options => calls.push(['scroll', options]),
  };
  ui.change('input', 'Zahnformel');
  assert.deepEqual(calls, [], 'Typing must not steal focus');
  const rehwild = ui.rows().find(row => row.props['data-wildlife-slug'] === 'rehwild');
  assert.ok(rehwild);
  assert.equal(findAll(rehwild, node => typeof node.props?.href === 'string')[0].props.href, '/wildkunde/rehwild#gebiss');
  let prevented = false;
  findAll(ui.tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { block: 'start', behavior: 'auto' }]]);
});

const listState = load('lib/wildlife-list-state.js');
test('List URLs validate filters and preserve foreign duplicate parameters and hash when updating or clearing', () => {
  assert.deepEqual(listState.readWildlifeListURL('/wildkunde?q=Gams%00wild&group=unbekannt'), { query: 'Gams wild', group: 'all' });
  assert.equal(listState.readWildlifeListURL('/wildkunde?q=' + 'x'.repeat(300)).query.length, 160);
  const original = '/wildkunde?ref=a&ref=b&next=%2Fkonto&q=alt&group=Enten#merken';
  const written = new URL(listState.wildlifeListURL(original, { query: 'Gams & Steinbock', group: 'Schalenwild' }), 'https://test.invalid');
  assert.equal(written.pathname, '/wildkunde'); assert.equal(written.hash, '#merken');
  assert.deepEqual(written.searchParams.getAll('ref'), ['a', 'b']); assert.equal(written.searchParams.get('next'), '/konto');
  assert.equal(written.searchParams.get('q'), 'Gams & Steinbock'); assert.equal(written.searchParams.get('group'), 'Schalenwild');
  const cleared = new URL(listState.wildlifeListURL(written.pathname + written.search + written.hash, listState.defaultWildlifeListState()), 'https://test.invalid');
  assert.equal(cleared.searchParams.has('q'), false); assert.equal(cleared.searchParams.has('group'), false);
  assert.deepEqual(cleared.searchParams.getAll('ref'), ['a', 'b']); assert.equal(cleared.hash, '#merken');
  assert.equal(listState.wildlifeListURL('//other.invalid?secret=x', { query: 'Gams', group: 'all' }), '/wildkunde?q=Gams');
});

test('Hydration restores a direct link without overwriting it, and reload restores the same selection', () => {
  const href = '/wildkunde?q=Gams&group=Schalenwild&ref=test#wildlife-results';
  const ui = setup(href, false);
  assert.equal(ui.field('input').props.disabled, true); assert.equal(ui.timers.size, 0);
  ui.router.isReady = true; ui.render(); ui.flush();
  assert.equal(ui.field('input').props.value, 'Gams'); assert.equal(ui.field('select').props.value, 'Schalenwild');
  assert.equal(ui.field('input').props.disabled, false); assert.equal(ui.replacements.length, 0);
  assert.ok(ui.rows().some(row => row.props['data-wildlife-slug'] === 'gamswild'));
  const reload = setup(href);
  assert.deepEqual(reload.rows().map(row => row.props['data-wildlife-slug']), ui.rows().map(row => row.props['data-wildlife-slug']));
});

test('Rapid edits compose in one shallow replacement, and older router acknowledgements cannot replace newer typing', async () => {
  const ui = setup('/wildkunde?ref=a&ref=b#merken');
  ui.change('input', 'G'); ui.change('input', 'Ga'); ui.change('select', 'Schalenwild'); ui.change('input', 'Gams');
  ui.runTimers(); assert.equal(ui.replacements.length, 1);
  const first = new URL(ui.replacements[0].href, 'https://test.invalid');
  assert.equal(first.searchParams.get('q'), 'Gams'); assert.equal(first.searchParams.get('group'), 'Schalenwild');
  assert.deepEqual(first.searchParams.getAll('ref'), ['a', 'b']); assert.equal(first.hash, '#merken');
  assert.deepEqual(ui.replacements[0].options, { shallow: true, scroll: false });
  ui.change('input', 'Steinbock'); ui.ack(0); await ui.settle(0);
  assert.equal(ui.field('input').props.value, 'Steinbock'); assert.equal(ui.field('select').props.value, 'Schalenwild');
  ui.runTimers(); assert.equal(ui.replacements.length, 2); ui.ack(1); await ui.settle(1); ui.runTimers();
  assert.equal(ui.replacements.length, 2, 'No route/state replacement loop');
});

test('Back cancels a pending debounce and restores URL selection without forcing focus or scroll', () => {
  const ui = setup('/wildkunde?q=Gams'); const calls = [];
  findAll(ui.tree, node => node.props?.id === 'wildlife-results')[0].props.ref.current = { focus: () => calls.push('focus'), scrollIntoView: () => calls.push('scroll') };
  ui.change('input', 'Steinbock');
  ui.route('/wildkunde?q=Reh&group=Schalenwild#alt', true); ui.runTimers();
  assert.equal(ui.field('input').props.value, 'Reh'); assert.equal(ui.field('select').props.value, 'Schalenwild');
  assert.equal(ui.replacements.length, 0); assert.deepEqual(calls, []);
});

test('A late in-flight acknowledgement after Back cannot restore old input and corrects only the stale address once', async () => {
  const ui = setup('/wildkunde?q=Gams&ref=initial#start');
  ui.change('input', 'Steinbock'); ui.runTimers();
  ui.route('/wildkunde?q=Reh&ref=back&ref=two#zurueck', true);
  ui.ack(0); await ui.settle(0);
  assert.equal(ui.field('input').props.value, 'Reh'); assert.equal(ui.replacements.length, 2);
  assert.equal(ui.replacements[1].href, '/wildkunde?ref=back&ref=two&q=Reh#zurueck');
  ui.ack(1); await ui.settle(1); ui.runTimers(); assert.equal(ui.replacements.length, 2);
});

test('An older failure for a repeated URL cannot remove the newer acknowledgement marker', async () => {
  const ui = setup('/wildkunde');
  ui.change('input', 'Gams'); ui.runTimers();
  ui.change('input', 'Reh'); ui.change('input', 'Gams'); ui.runTimers();
  assert.equal(ui.replacements.length, 2); assert.equal(ui.replacements[0].href, ui.replacements[1].href);
  await ui.settle(0, false, true); ui.change('input', 'Steinbock'); ui.ack(1); await ui.settle(1);
  assert.equal(ui.field('input').props.value, 'Steinbock');
  ui.runTimers(); assert.equal(ui.replacements.length, 3);
});

test('Returning to the original empty draft before an in-flight URL arrives does not leave its stale query in the address', async () => {
  const ui = setup('/wildkunde?ref=keep#merken');
  ui.change('input', 'Gams'); ui.runTimers();
  ui.change('input', ''); ui.runTimers(); assert.equal(ui.replacements.length, 1);
  ui.ack(0); await ui.settle(0);
  assert.equal(ui.field('input').props.value, ''); assert.equal(ui.replacements.length, 2);
  assert.equal(ui.replacements[1].href, '/wildkunde?ref=keep#merken');
  ui.ack(1); await ui.settle(1); ui.runTimers(); assert.equal(ui.replacements.length, 2);
});

test('A quick portrait click flushes the list selection before navigation, so Back and reload can recover it', async () => {
  const ui = setup('/wildkunde?ref=portrait#merken');
  ui.change('input', 'Gams'); ui.change('select', 'Schalenwild');
  const click = ui.portrait('gamswild');
  assert.equal(click.event.defaultPrevented, true); assert.equal(ui.replacements.length, 1); assert.deepEqual(ui.pushes, []);
  ui.ack(0); await ui.settle(0); await click.promise;
  assert.deepEqual(ui.pushes, ['/wildkunde/gamswild']);
  const back = setup(ui.replacements[0].href);
  assert.equal(back.field('input').props.value, 'Gams'); assert.equal(back.field('select').props.value, 'Schalenwild');
  assert.equal(back.router.asPath.includes('ref=portrait'), true); assert.equal(back.router.asPath.endsWith('#merken'), true);
});

test('Failed or slow flushing still follows the original portrait, while a newer navigation wins', async () => {
  const failed = setup(); failed.change('input', 'Gams'); const click = failed.portrait('gamswild');
  await failed.settle(0, false, true); await click.promise; assert.deepEqual(failed.pushes, ['/wildkunde/gamswild']);
  const slow = setup(); slow.change('input', 'Gams'); const delayed = slow.portrait('gamswild');
  slow.runTimers(500); await delayed.promise; assert.deepEqual(slow.pushes, ['/wildkunde/gamswild']);
  slow.ack(0); await slow.settle(0);
  assert.equal(slow.replacements.length, 1, 'A late source acknowledgement must not start a replacement that cancels the portrait navigation');
  const newer = setup(); newer.change('input', 'Gams'); const obsolete = newer.portrait('gamswild');
  newer.route('/konto'); await newer.settle(0); await obsolete.promise; assert.deepEqual(newer.pushes, []);
});

test('A real portrait navigation failure falls back to its ordinary URL, while cancellation or newer intent does not', async () => {
  for (const synchronous of [false, true]) {
    const ui = setup(); ui.change('input', 'Gams');
    ui.router.push = () => { if (synchronous) throw new Error('navigation failed'); return Promise.reject(new Error('navigation failed')); };
    const click = ui.portrait('gamswild'); await ui.settle(0, false); await click.promise;
    assert.deepEqual(ui.assigned, ['/wildkunde/gamswild']);
  }
  const cancelled = setup(); cancelled.change('input', 'Gams');
  cancelled.router.push = () => Promise.reject(Object.assign(new Error('cancelled'), { cancelled: true }));
  const click = cancelled.portrait('gamswild'); await cancelled.settle(0, false); await click.promise;
  assert.deepEqual(cancelled.assigned, []);
});

test('Modified and middle clicks retain native link behavior, remember the original tab and never push a portrait themselves', async () => {
  for (const [extra, auxiliary] of [[{ ctrlKey: true }, false], [{ metaKey: true }, false], [{ shiftKey: true }, false], [{ button: 1 }, true]]) {
    const ui = setup(); ui.change('input', 'Gams');
    const click = ui.portrait('gamswild', extra, auxiliary); await click.promise;
    assert.equal(click.event.defaultPrevented, false); assert.deepEqual(ui.pushes, []); assert.equal(ui.replacements.length, 1);
    assert.equal(new URL(ui.replacements[0].href, 'https://test.invalid').searchParams.get('q'), 'Gams');
    assert.equal(click.href, '/wildkunde/gamswild', 'The new tab uses the ordinary portrait URL');
  }
});

test('Foreign parameter/hash changes survive pending edits, clearing only removes owned state, and unmount cancels work', async () => {
  const ui = setup('/wildkunde?ref=old#old'); ui.change('input', 'Gams');
  ui.route('/wildkunde?ref=new&ref=two#new');
  assert.equal(ui.field('input').props.value, 'Gams'); ui.runTimers();
  assert.equal(ui.replacements[0].href, '/wildkunde?ref=new&ref=two&q=Gams#new'); ui.ack(0); await ui.settle(0);
  ui.click('Suche leeren'); ui.runTimers();
  assert.equal(ui.replacements[1].href, '/wildkunde?ref=new&ref=two#new');
  ui.change('input', 'Reh'); ui.unmount(); ui.runTimers();
  assert.equal(ui.replacements.length, 2); assert.equal(ui.listeners.has('popstate'), false);
});

test('A foreign hash change after an acknowledged selection keeps a newer draft and the new hash', async () => {
  const ui = setup(); ui.change('input', 'Gams'); ui.runTimers(); ui.ack(0); await ui.settle(0);
  ui.change('input', 'Steinbock'); ui.route('/wildkunde?q=Gams&ref=neu#neu');
  assert.equal(ui.field('input').props.value, 'Steinbock'); ui.runTimers();
  assert.equal(ui.replacements[1].href, '/wildkunde?ref=neu&q=Steinbock#neu');
});
