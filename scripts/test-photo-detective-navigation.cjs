// Isolated route/commit owners and the real existing photo catalogue only.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const load = createLoader(), api = load('lib/photo-detective-navigation.js');
const rounds = load('lib/photo-detective.js').photoDetectiveRounds;
const tick = () => new Promise(resolve => setImmediate(resolve));
const address = query => '/lernen/fotodetektiv' + (new URLSearchParams(query).size ? '?' + new URLSearchParams(query) : '');
function parameters(href) { const url = new URL(href, 'https://jagdlatein.test'), query = {}; for (const key of new Set(url.searchParams.keys())) { const values = url.searchParams.getAll(key); query[key] = values.length > 1 ? values : values[0]; } return query; }
function fixture(t, query = {}, options = {}) {
  const h = setup('components/PhotoDetective.js', query, { ...options, router: { asPath: address(query), ...options.router } });
  h.requests = [];
  h.router.push = (href, as, options) => { const request = { href, as, options }; h.calls.push(request); h.requests.push(request); return new Promise((resolve, reject) => Object.assign(request, { resolve, reject })); };
  h.route = href => { h.router.query = parameters(href); h.router.asPath = href; h.render(); };
  h.pick = (id, value) => { const field = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === id)[0]; assert.ok(field, id); const button = nodes(field.type(field.props), node => node.type === 'button' && node.props['data-menu-choice'] === value)[0]; assert.ok(button, value); button.props.onClick(); h.render(); };
  h.photo = () => h.nodes(node => node.type?.name === 'PhotoEvidence')[0];
  t.after(() => h.dispose()); return h;
}

test('Every complete old photo object is identical except one appended option; all fourth names already exist in the atlas', () => {
  const source = execFileSync('git', ['show', '7b69962b0fee40db63096d512b852a4241c90fcb:lib/photo-detective.js'], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'photo-detective.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} }; new Function('require', 'module', 'exports', code)(id => { assert.equal(id, './learning-wildlife-photos'); return load('lib/learning-wildlife-photos.js'); }, module, module.exports);
  assert.equal(rounds.length, 8); assert.equal(rounds.reduce((count, round) => count + round.traits.length, 0), 24);
  assert.deepEqual(rounds.map(round => ({ ...round, options: round.options.slice(0, 3) })), module.exports.photoDetectiveRounds);
  const names = new Set(load('lib/dach-wildlife.js').dachWildlife.flatMap(record => [record.name, ...record.aliases]));
  for (const round of rounds) { assert.equal(round.options.length, 4); assert.equal(new Set(round.options).size, 4); assert.equal(round.options.filter(value => value === round.name).length, 1); assert.ok(names.has(round.options[3]), round.options[3]); }
});

test('Bare is intentionally blind quiz, art-only is a direct explorer; invalid/empty/repeated/contradictory fields never choose a substitute', () => {
  assert.deepEqual(api.readPhotoDetectiveSelection({}), { valid: true, view: 'quiz', art: null });
  assert.deepEqual(api.readPhotoDetectiveSelection({ ansicht: 'merkmale' }), { valid: true, view: 'merkmale', art: null });
  for (const round of rounds) for (const query of [{ art: round.id }, { ansicht: 'merkmale', art: round.id }]) assert.deepEqual(api.readPhotoDetectiveSelection(query), { valid: true, view: 'merkmale', art: round.id });
  for (const query of [{ art: '' }, { art: 'unknown' }, { art: ['gams'] }, { ansicht: '' }, { ansicht: ['quiz'] }, { ansicht: 'explore' }, { ansicht: 'quiz', art: 'gams' }, new URLSearchParams('art=gams&art=gams'), new URLSearchParams('ansicht=quiz&ansicht=quiz')]) assert.deepEqual(api.readPhotoDetectiveSelection(query), { valid: false, view: null, art: null });
});

test('Readiness and targets require complete raw query/hash/browser origin, preserve context and clean only incompatible fields', () => {
  const router = { isReady: true, asPath: '/lernen/fotodetektiv?ref=a&ref=b&art=gams#old', query: { ref: ['a', 'b'], art: 'gams' } };
  assert.equal(api.photoDetectiveRoute(router).ready, true);
  const target = new URL(api.photoDetectiveTarget(router, 'quiz'), 'https://jagdlatein.test');
  assert.deepEqual(target.searchParams.getAll('ref'), ['a', 'b']); assert.equal(target.searchParams.get('ansicht'), 'quiz'); assert.equal(target.searchParams.has('art'), false); assert.equal(target.hash, '#fotodetektiv-title');
  assert.equal(api.photoDetectiveTarget(router, 'quiz', 'gams'), null); assert.equal(api.photoDetectiveTarget(router, 'merkmale', 'bad'), null);
  for (const change of [{ isReady: false }, { asPath: '/lernen/wildjahr' }, { asPath: '//host/lernen/fotodetektiv' }, { query: { ref: ['b', 'a'], art: 'gams' } }, { query: { ref: ['a', 'b'], art: ['gams'] } }]) assert.equal(api.photoDetectiveRoute({ ...router, ...change }).ready, false);
  const previous = global.window;
  try { global.window = { location: { pathname: '/lernen/fotodetektiv', search: '?ref=a&ref=b&art=gams', hash: '#old' } }; const first = api.photoDetectiveRoute(router); assert.equal(first.ready, true); global.window.location.hash = '#other'; assert.equal(api.photoDetectiveRoute(router).ready, false); assert.notEqual(api.photoDetectiveRoute(router).origin, first.origin); }
  finally { if (previous === undefined) delete global.window; else global.window = previous; }
});

test('One lower choice menu replaces native fields; every valid direct entry shows exactly its unchanged photograph, invalid/unready show none', t => {
  for (const round of rounds) { const h = fixture(t, { art: round.id }); assert.deepEqual(h.photo().props.round, rounds.find(item => item.id === round.id)); assert.ok(h.tree.props.headingOnly); assert.equal(h.nodes(node => node.type?.name === 'PageMenu').length, 1); assert.equal(h.nodes(node => ['select', 'input', 'dialog'].includes(node.type)).length, 0); assert.deepEqual(h.nodes(node => node.type?.name === 'MenuChoice').map(node => node.props.id), ['photo-detective-view', 'photo-detective-species']); }
  for (const query of [{ art: '' }, { art: 'missing' }, { ansicht: 'quiz', art: 'gams' }, { ansicht: 'merkmale' }]) assert.equal(fixture(t, query).photo(), undefined);
  const h = fixture(t, { art: 'gams' }, { ready: false }); assert.equal(h.photo(), undefined); h.pick('photo-detective-view', 'quiz'); assert.equal(h.calls.length, 0);
});

test('Pending and promise-only acceptance retain the committed view; true URL commits and history restore exact explorers', async t => {
  const h = fixture(t, { art: 'gams' }); h.pick('photo-detective-species', 'steinbock');
  assert.equal(h.photo().props.round.id, 'gams'); assert.deepEqual(h.requests[0].options, { shallow: true, scroll: false });
  h.requests[0].resolve(true); await tick(); h.render(); assert.equal(h.photo().props.round.id, 'gams');
  h.route(h.requests[0].href); assert.equal(h.photo().props.round.id, 'steinbock'); h.route('/lernen/fotodetektiv?art=gams'); assert.equal(h.photo().props.round.id, 'gams'); assert.equal(h.requests.length, 1);
});

test('False/reject/cancelled preserve content; superseded failures and stale/unmounted choices cannot affect the current owner', async t => {
  for (const outcome of ['false', 'reject', 'cancelled']) {
    const h = fixture(t, { art: 'gams' }); h.pick('photo-detective-species', 'steinbock');
    if (outcome === 'false') h.requests[0].resolve(false); else h.requests[0].reject(Object.assign(new Error('Isolated fixture route failure'), outcome === 'cancelled' ? { cancelled: true } : {}));
    await tick(); h.render(); assert.equal(h.photo().props.round.id, 'gams'); assert.equal(h.nodes(node => node.props.role === 'alert').length, outcome === 'cancelled' ? 0 : 1);
  }
  const h = fixture(t, { art: 'gams' }), stale = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === 'photo-detective-species')[0].props.onChange;
  h.pick('photo-detective-species', 'steinbock'); h.pick('photo-detective-species', 'feldhase'); h.requests[0].reject(new Error('Old request')); await tick(); h.render(); assert.equal(h.nodes(node => node.props.role === 'alert').length, 0);
  h.route(h.requests[1].href); await stale({ target: { value: 'gams' } }); assert.equal(h.requests.length, 2);
  const retained = h.nodes(node => node.type?.name === 'MenuChoice')[0].props.onChange; h.dispose(); await retained({ target: { value: 'quiz' } }); assert.equal(h.requests.length, 2);
});

test('Eight four-answer rounds retain blind content, feedback, native double-click bounds and intentional-only reset', t => {
  const h = fixture(t), oldFirst = h.nodes(node => node.type === 'button' && text(node) === rounds[0].name)[0];
  for (const [index, round] of rounds.entries()) {
    assert.equal(h.photo().props.round.id, round.id); assert.equal(h.photo().props.revealed, false);
    const options = h.nodes(node => node.type === 'div' && node.props['aria-label'] === 'Art auswählen')[0]; assert.equal(nodes(options, node => node.type === 'button').length, 4);
    const choice = h.nodes(node => node.type === 'button' && text(node) === (index === 0 ? round.options[3] : round.name))[0]; choice.props.onClick(); choice.props.onClick(); h.render();
    assert.match(text(h.tree), new RegExp(round.explanation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))); if (!index) assert.match(text(h.tree), /Vergleiche die sichtbaren Merkmale mit der Erklärung/);
    const advance = h.nodes(node => node.type === 'button' && text(node).startsWith(index === 7 ? 'Auswertung ansehen' : 'Nächstes Foto'))[0]; advance.props.onClick(); advance.props.onClick(); h.render();
  }
  assert.match(text(h.tree), /7 von 8 Arten richtig erkannt/); h.click('Fehler und Hilfefragen wiederholen (1)'); assert.match(text(h.tree), /Foto 1 von 1/); oldFirst.props.onClick(); h.render(); assert.equal(h.photo().props.revealed, false);
});

test('Reading/history preserve existing quiz answers/index/hint; an obsolete explorer callback never marks an unviewed species as assisted', t => {
  const h = fixture(t); h.click('Merkmale als Hilfe anzeigen'); h.click(rounds[0].name); h.click('Nächstes Foto');
  h.route('/lernen/fotodetektiv?art=feldhase'); const stale = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === 'photo-detective-species')[0].props.onChange;
  h.route('/lernen/fotodetektiv?ansicht=quiz'); stale({ target: { value: 'steinbock' } }); h.render(); assert.equal(h.requests.length, 0); assert.match(text(h.tree), /Foto 2 von 8/);
  h.click(rounds[1].name); assert.match(text(h.tree), /1 richtig ohne Hilfe/); assert.doesNotMatch(text(h.tree), /Mit Merkmals-Hilfe beantwortet/);
  h.click('Nächstes Foto'); h.click(rounds[2].name); assert.match(text(h.tree), /Mit Merkmals-Hilfe beantwortet.*bereits nachgeschlagen/);
  h.route('/lernen/fotodetektiv?art=gams'); h.route('/lernen/fotodetektiv'); assert.match(text(h.tree), /Foto 3 von 8/); assert.match(text(h.tree), /Mit Merkmals-Hilfe beantwortet/);
});

test('Exactly one closed final source rubric follows observation and maps to the current revealed photo or the complete actual result pool', t => {
  function source(h) {
    const components = h.nodes(node => node.type?.name === 'PhotoSources');
    if (!components.length) return null;
    assert.equal(components.length, 1); const component = components[0], rendered = component.type(component.props);
    assert.equal(h.tree.props.children.at(-1), component); assert.equal(rendered.type, 'details'); assert.equal(rendered.props.open, undefined);
    assert.equal(nodes(rendered, node => node.type === 'summary').map(text).join(''), 'Fachquellen zur Erklärung');
    assert.deepEqual(nodes(rendered, node => node.type === 'a').map(node => ({ title: text(node), url: node.props.href })), component.props.rounds.flatMap(round => round.sources));
    return component.props.rounds;
  }
  for (const round of rounds) { const h = fixture(t, { art: round.id }); assert.deepEqual(source(h), [round]); const further = h.nodes(node => node.type?.name === 'FurtherLearning')[0]; assert.equal(nodes(further.type(further.props), node => node.type === 'details').length, 0); }
  for (const query of [{ art: 'missing' }, { ansicht: 'merkmale' }, { art: '' }, { ansicht: 'quiz', art: 'gams' }]) assert.equal(source(fixture(t, query)), null);
  assert.equal(source(fixture(t, { art: 'gams' }, { ready: false })), null);
  const h = fixture(t); assert.equal(source(h), null); h.click('Merkmale als Hilfe anzeigen'); assert.equal(source(h), null);
  for (const [index, round] of rounds.entries()) { h.click(round.name); assert.deepEqual(source(h), [round]); h.click(index === 7 ? 'Auswertung ansehen' : 'Nächstes Foto'); if (index < 7) assert.equal(source(h), null); }
  assert.deepEqual(source(h), rounds); h.click('Fehler und Hilfefragen wiederholen (1)'); assert.equal(source(h), null); h.click(rounds[0].name); h.click('Auswertung ansehen'); assert.deepEqual(source(h), [rounds[0]]);
});
