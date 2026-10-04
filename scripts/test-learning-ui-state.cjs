const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const ts = pr('typescript');
const css = new Proxy({}, { get: (_, key) => String(key) });
function load(relative, overrides = {}, expose = '') {
  let filename = path.join(root, relative);
  if (!fs.existsSync(filename) && filename.endsWith('.js') && fs.existsSync(filename.slice(0, -3) + '.jsx')) filename = filename.slice(0, -3) + '.jsx';
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => children;
    if (id === 'next/image') return ({ priority, fill, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides);
    return req(id);
  }
  new Function('require', 'module', 'exports', code + expose)(resolve, mod, mod.exports);
  return mod.exports;
}
function engine() {
  const slots = []; let cursor = 0; let effects = []; let changed = false;
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value; if (!Object.is(next, slots[i].value)) changed = true; slots[i].value = next; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++; const previous = slots[i]; if (!previous || !deps || deps.some((value, index) => value !== previous.deps?.[index])) { slots[i] = { deps, cleanup: previous?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  }, render(fn) { cursor = 0; changed = false; return fn(); }, needsRender() { return changed; }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); }, unmount() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function words(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(words).join(''); return typeof node === 'object' ? words(node.props?.children) : String(node); }
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function setup(relative, props = {}, exportName = 'default', expose = '', overrides = {}) {
  const e = engine(), Component = load(relative, { react: e.hooks, ...overrides }, expose)[exportName];
  let currentProps = props, tree;
  function render() { tree = e.render(() => Component(currentProps)); }
  render();
  return { get tree() { return tree; }, redraw: render, commit() { if (e.needsRender()) render(); }, flush() { e.flush(); render(); }, flushCommitted() { e.flush(); if (e.needsRender()) render(); }, unmount() { e.unmount(); }, setProps(next) { currentProps = next; render(); },
    button(label) { const button = find(tree, node => node.type === 'button' && words(node).trim() === label); assert.ok(button, `Missing button: ${label}`); return button; },
    click(label) { const button = this.button(label); assert.ok(!button.props.disabled, `Disabled button: ${label}`); button.props.onClick(); render(); },
    field(label) { const holder = find(tree, node => node.type === 'label' && words(node).startsWith(label)); assert.ok(holder, label); return find(holder, node => ['input', 'select', 'textarea'].includes(node.type)); },
  };
}

test('Habitat templates remain accurate after manual editing, quiz mode and loading another template', () => {
  const data = load('lib/habitat-workshop.js');
  const s = setup('components/HabitatWorkshop.js');
  assert.equal(s.field('Lernlandschaft laden').props.value, data.habitatPresets[1].id);
  const checkbox = find(s.tree, node => node.type === 'input' && node.props.type === 'checkbox');
  checkbox.props.onChange(); s.redraw();
  assert.equal(s.field('Lernlandschaft laden').props.value, 'custom');
  assert.match(words(s.tree), /Eigene Zusammenstellung/);
  s.click('Zusammenhänge prüfen'); s.click('Landschaft gestalten');
  assert.equal(s.field('Lernlandschaft laden').props.value, 'custom');
  s.field('Lernlandschaft laden').props.onChange({ target: { value: data.habitatPresets[0].id } }); s.redraw();
  assert.equal(s.field('Lernlandschaft laden').props.value, data.habitatPresets[0].id);
  assert.deepEqual(find(s.tree, node => node.type?.name === 'HabitatMap').props.selected, data.habitatPresets[0].ids);
  s.field('Lernlandschaft laden').props.onChange({ target: { value: 'invalid' } }); s.redraw();
  assert.equal(s.field('Lernlandschaft laden').props.value, data.habitatPresets[0].id);
});

test('A photo inspected in explorer mode is an assisted answer; stale quiz clicks cannot answer there', () => {
  const rounds = load('lib/photo-detective.js').photoDetectiveRounds;
  const s = setup('components/PhotoDetective.js');
  const stale = s.button(rounds[0].name);
  s.click('Merkmale entdecken'); stale.props.onClick(); s.redraw();
  s.click('Wissen testen');
  assert.equal(s.button(rounds[0].name).props.disabled, false);
  stale.props.onClick(); s.redraw();
  assert.equal(s.button(rounds[0].name).props.disabled, false);
  s.click(rounds[0].name);
  assert.match(words(s.tree), /Mit Merkmals-Hilfe beantwortet.*bereits nachgeschlagen/);
  assert.match(words(s.tree), /0 richtig ohne Hilfe/);
  s.click('Nächstes Foto'); s.click(rounds[1].name);
  assert.match(words(s.tree), /1 richtig ohne Hilfe/);
  assert.doesNotMatch(words(s.tree), /Mit Merkmals-Hilfe beantwortet/);
});

test('Audio source failures have a retry and old error/play events cannot affect a new attempt or recording', () => {
  const sounds = load('lib/animal-sounds.js').animalSounds;
  let playCount = 0, paused = 0;
  const props = sound => ({ sound, label: 'Originalaufnahme', onPlay: () => playCount++ });
  const s = setup('components/AnimalSounds.js', props(sounds[0]), 'SoundPlayer');
  const oldAudio = find(s.tree, node => node.type === 'audio'), oldSource = find(s.tree, node => node.type === 'source');
  oldSource.props.onError(); s.redraw(); assert.ok(find(s.tree, node => node.props?.role === 'alert'));
  s.click('Noch einmal laden'); oldSource.props.onError(); s.redraw();
  assert.equal(find(s.tree, node => node.props?.role === 'alert'), null);
  oldAudio.props.onPlay({ currentTarget: { pause() { paused++; } } }); assert.equal(paused, 1); assert.equal(playCount, 0);
  const current = find(s.tree, node => node.type === 'audio'); current.props.onError(); s.redraw();
  s.setProps(props(sounds[1])); assert.equal(find(s.tree, node => node.props?.role === 'alert'), null);
  current.props.onError(); s.redraw(); assert.equal(find(s.tree, node => node.props?.role === 'alert'), null);
  s.setProps(props(sounds[0])); assert.equal(find(s.tree, node => node.props?.role === 'alert'), null);
  find(s.tree, node => node.type === 'audio').props.onPlay({ currentTarget: { pause() {} } }); s.redraw(); assert.equal(playCount, 1);
});

test('Video failures and observed events remain tied to their exact attempt across retry and A–B–A navigation', () => {
  const cases = load('lib/wildlife-video-cases.js').wildlifeVideoCases;
  const s = setup('components/WildlifeVideoCases.js');
  const firstVideo = find(s.tree, node => node.type === 'video'), firstSource = find(s.tree, node => node.type === 'source');
  firstSource.props.onError(); s.redraw(); assert.match(words(s.tree), /Browser konnte das Video nicht abspielen/);
  s.click('Video neu laden'); firstSource.props.onError(); s.redraw();
  assert.doesNotMatch(words(s.tree), /Browser konnte das Video nicht abspielen/);
  s.click(cases[1].title); s.click(cases[0].title);
  firstVideo.props.onTimeUpdate({ currentTarget: { currentTime: 4 } }); firstVideo.props.onError(); s.redraw();
  assert.equal(s.button(cases[0].questions[0].choices[0]).props.disabled, true);
  assert.doesNotMatch(words(s.tree), /Browser konnte das Video nicht abspielen/);
  find(s.tree, node => node.type === 'video').props.onTimeUpdate({ currentTarget: { currentTime: 4 } }); s.redraw();
  assert.equal(s.button(cases[0].questions[0].choices[0]).props.disabled, false);
});

test('Selecting the current first video or opening its initial deep link leaves the visible media and answers usable without a forced render', () => {
  const first = load('lib/wildlife-video-cases.js').wildlifeVideoCases[0];
  const oldWindow = global.window;
  try {
    for (const deepLink of [false, true]) {
      global.window = { location: { search: deepLink ? '?eintrag=' + first.id : '' } };
      const s = setup('components/WildlifeVideoCases.js');
      if (deepLink) s.flushCommitted();
      else { s.button(first.title).props.onClick(); s.commit(); }
      find(s.tree, node => node.type === 'video').props.onTimeUpdate({ currentTarget: { currentTime: 3 } }); s.commit();
      assert.equal(s.button(first.questions[0].choices[0]).props.disabled, false, deepLink ? 'initial deep link' : 'current fall button');
      s.button(first.questions[0].choices[0]).props.onClick(); s.commit();
      assert.ok(words(s.tree).includes(first.questions[0].explanation));
    }
  } finally { if (oldWindow === undefined) delete global.window; else global.window = oldWindow; }
});

test('Cancelling a journal import invalidates its old confirmation before React redraws', async () => {
  const oldWindow = global.window;
  global.window = { location: { search: '' }, localStorage: { getItem() { return null; }, setItem() {} } };
  try {
    const data = load('lib/dog-training-journal.js');
    const draft = { ...data.createDogJournalDraft(), dog: 'Import', observation: 'Ruhige freiwillige Mitarbeit.' };
    const backup = JSON.stringify({ version: 1, records: [data.makeDogJournalRecord(draft, 'training_import2')], draft });
    const s = setup('components/DogTrainingJournal.js'); s.flush();
    const input = find(s.tree, node => node.type === 'input' && node.props.type === 'file');
    await input.props.onChange({ target: { files: [{ size: backup.length, async text() { return backup; } }], value: 'file' } }); s.redraw();
    const apply = s.button('Diesen Stand übernehmen'), cancel = s.button('Abbrechen');
    cancel.props.onClick(); apply.props.onClick(); s.redraw();
    assert.match(words(s.tree), /0 von 0 Einträgen/); assert.doesNotMatch(words(s.tree), /Sicherung übernommen/);
  } finally { if (oldWindow === undefined) delete global.window; else global.window = oldWindow; }
});

test('Species navigation creates separate portrait quiz sessions and restart refuses a past answer handler', () => {
  const species = load('lib/dach-wildlife.js').dachWildlifeBySlug;
  const portrait = load('pages/wildkunde/[art].js').default;
  const first = portrait({ species: species.wolf }), second = portrait({ species: species.fischotter });
  assert.equal(first.type, second.type); assert.notEqual(first.key, second.key);
  const s = setup('pages/wildkunde/[art].js', { species: species.wolf }, 'WildlifePortraitContent', '\nexports.WildlifePortraitContent = WildlifePortraitContent;');
  const stale = find(s.tree, node => node.type === 'button' && words(node) !== 'Noch einmal üben');
  stale.props.onClick(); s.redraw(); assert.ok(find(s.tree, node => node.props?.role === 'status'));
  s.click('Noch einmal üben'); stale.props.onClick(); s.redraw();
  assert.equal(find(s.tree, node => node.props?.role === 'status'), null);
});

test('Ansitz feedback lasts ten seconds and double/stale answers cannot affect timer transitions or a repeated round', () => {
  const originalTimeout = global.setTimeout, originalClear = global.clearTimeout;
  const timers = []; let latest;
  global.setTimeout = (callback, delay) => { const timer = { callback, delay }; timers.push(timer); return timer; };
  global.clearTimeout = timer => { if (timer) timer.cancelled = true; };
  try {
    const s = setup('pages/jagdpraxis/ansitz.js', {}, 'default', '', { '../../hooks/useActivityResult': input => { latest = input; return {}; } });
    const choose = () => find(s.tree, node => node.type?.name === 'ActionButton');
    const stale = choose(); stale.props.onClick(); stale.props.onClick(); s.redraw();
    assert.equal(latest.points, 1); assert.equal(timers[0].delay, 10000);
    assert.ok(find(s.tree, node => node.type?.name === 'InstantFeedback'));
    timers[0].callback(); stale.props.onClick(); s.redraw();
    assert.match(words(s.tree), /Situation 2 von 25/); assert.equal(latest.points, 1);
    for (let index = 1; index < 25; index++) { choose().props.onClick(); s.redraw(); timers.at(-1).callback(); s.redraw(); }
    const restart = find(s.tree, node => node.type?.name === 'NavigationButton' && node.props.text === 'Noch einmal üben');
    assert.ok(restart); restart.props.onClick(); restart.props.onClick(); s.redraw();
    assert.match(words(s.tree), /Situation 1 von 25/); assert.equal(latest.points, 0); assert.equal(latest.runKey, 1);
    stale.props.onClick(); timers[0].callback(); s.redraw();
    assert.match(words(s.tree), /Situation 1 von 25/); assert.equal(latest.points, 0);
    assert.equal(find(s.tree, node => node.type?.name === 'InstantFeedback'), null);
    s.flush(); const afterRestart = choose(); s.unmount(); afterRestart.props.onClick(); s.redraw();
    assert.equal(latest.points, 0);
  } finally { global.setTimeout = originalTimeout; global.clearTimeout = originalClear; }
});

test('Detailed courses show the legal scope of regional questions while retaining the canonical progress count', () => {
  const module = load('lib/learning-curriculum.js').learningModules.find(entry => entry.questions.some(question => question.countries.length < 3));
  assert.ok(module);
  const s = setup('components/LearningCourse.js', { module }, 'LearningContent', '\nexports.LearningContent = LearningContent;', { '../hooks/useCourseProgress': () => ({}) });
  s.click('Wissen prüfen');
  const question = module.questions[0];
  assert.match(words(s.tree), /Geltungsbereich dieser Frage/);
  for (const country of question.countries) assert.ok(words(s.tree).includes({ DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' }[country]));
  const progress = find(s.tree, node => node.type === 'progress'); assert.equal(progress.props.max, module.questions.length);
});

test('Every practice page and result uses one shared heading, browser title and learning navigation', () => {
  const files = fs.readdirSync(path.join(root, 'pages/jagdpraxis')).filter(file => file.endsWith('.js'));
  assert.equal(files.length, 39);
  for (const filename of files) {
    const relative = 'pages/jagdpraxis/' + filename;
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.ok(source.includes('PracticeLayout'), filename);
    assert.doesNotMatch(source, /<main\b|<h1\b|<HomeButton/, filename + ': no duplicate legacy wrapper');
    const Page = load(relative, { '../../hooks/useActivityResult': () => ({}) }).default;
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.equal((html.match(/<main\b/g) || []).length, 1, filename);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, filename);
    assert.match(html, /<title>.+ – Jagdlatein<\/title>/, filename);
    assert.ok(html.includes('Lernbereich') && html.includes('Alle Angebote suchen'), filename);
    assert.ok(!html.includes('padding:40px'), filename + ': outer mobile padding comes from the shared layout');
    if (filename !== 'index.js') assert.ok(html.includes('Alle Praxisübungen'), filename);
    if (!source.includes('step >= scenarios.length')) continue;
    let state = 0;
    const ResultPage = load(relative, { react: { ...React, useState(initial) { const [value, update] = React.useState(initial); return [state++ === 0 ? Number.MAX_SAFE_INTEGER : value, update]; } }, '../../hooks/useActivityResult': () => ({}) }).default;
    const result = renderToStaticMarkup(React.createElement(ResultPage));
    assert.equal((result.match(/<main\b/g) || []).length, 1, filename + ': result');
    assert.equal((result.match(/<h1\b/g) || []).length, 1, filename + ': result');
    assert.match(result, /<title>.+Ergebnis – Jagdlatein<\/title>/, filename + ': result title');
    assert.match(result, /Deine Auswertung/);
  }
});

test('Next.js client/server directives precede imports and other statements on every practice page', () => {
  function misplacedDirectives(source, filename) {
    const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    let prologue = true;
    return ast.statements.filter(statement => {
      const stringStatement = ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
      const directive = stringStatement && ['use client', 'use server'].includes(statement.expression.text);
      if (!stringStatement) prologue = false;
      return directive && !prologue;
    });
  }
  assert.equal(misplacedDirectives('import Thing from "./Thing";\n"use client";', 'broken.jsx').length, 1);
  assert.equal(misplacedDirectives('// header\n"use client";\nimport Thing from "./Thing";', 'valid.jsx').length, 0);
  const files = fs.readdirSync(path.join(root, 'pages/jagdpraxis')).filter(file => file.endsWith('.js'));
  for (const filename of files) {
    const source = fs.readFileSync(path.join(root, 'pages/jagdpraxis', filename), 'utf8');
    assert.equal(misplacedDirectives(source, filename).length, 0, filename + ': a misplaced Next.js directive fails production compilation');
  }
});
