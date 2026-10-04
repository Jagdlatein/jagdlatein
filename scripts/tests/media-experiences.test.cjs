const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const css = new Proxy({}, { get: (_, key) => String(key) });

function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  const resolve = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head' || id === 'next/script') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  return mod.exports;
}
function engine() {
  const slots = []; let cursor = 0; const effects = [];
  return { effects, hooks: {
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }]; },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: { current: initial } }; return slots[index].value; },
    useEffect(callback) { if (!effects.includes(callback)) effects.push(callback); },
  }, render(fn) { cursor = 0; return fn(); } };
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function setup(relative) {
  const hooks = engine(); const component = load(relative, { react: hooks.hooks }).default;
  let tree; const redraw = () => tree = hooks.render(component); redraw();
  const button = label => { const found = find(tree, node => node.type === 'button' && text(node) === label); assert.ok(found, `Missing button ${label}`); return found; };
  return { hooks, redraw, button, get tree() { return tree; }, click(label) { const found = button(label); assert.equal(!!found.props.disabled, false, `Disabled button ${label}`); found.props.onClick(); redraw(); }, content() { return text(tree); } };
}
const videos = load('lib/wildlife-video-cases.js');
const anatomy = load('lib/anatomy-explorer.js');
const observation = load('lib/observation-workshop.js');

test('All 45 questions have valid answers, substantial feedback and stable IDs', () => {
  assert.equal(videos.wildlifeVideoQuestionCount, 15);
  assert.equal(anatomy.anatomyQuestions.length, 6);
  assert.equal(observation.observationQuestionCount, 24);
  const collections = [videos.wildlifeVideoCases.flatMap(item => item.questions), anatomy.anatomyQuestions, observation.observationCases.flatMap(item => item.stages)];
  for (const collection of collections) for (const item of collection) {
    assert.ok(Number.isInteger(item.answer)); assert.ok(item.answer >= 0 && item.answer < item.choices.length);
    assert.ok(item.explanation.length >= 90); assert.equal(new Set(item.choices).size, item.choices.length);
  }
  for (const items of [videos.wildlifeVideoCases, anatomy.anatomyModels, observation.observationCases]) assert.equal(new Set(items.map(item => item.id)).size, items.length);
});

test('Real local WebM/JPEG/GLB assets have correct file signatures and documented licenses', () => {
  const { mediaExperienceAssetPaths } = load('lib/media-experience-asset-paths.js');
  assert.equal(mediaExperienceAssetPaths.length, 16); assert.equal(new Set(mediaExperienceAssetPaths).size, 16);
  for (const asset of mediaExperienceAssetPaths) {
    const full = path.join(root, 'public', asset); assert.ok(fs.existsSync(full), asset); const data = fs.readFileSync(full);
    if (asset.endsWith('.webm')) assert.equal(data.subarray(0, 4).toString('hex'), '1a45dfa3');
    if (asset.endsWith('.jpg')) assert.equal(data.subarray(0, 2).toString('hex'), 'ffd8');
    if (asset.endsWith('.glb')) { assert.equal(data.subarray(0, 4).toString(), 'glTF'); assert.equal(data.readUInt32LE(4), 2); assert.equal(data.readUInt32LE(8), data.length); const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString()); assert.ok(gltf.meshes.length); assert.equal(gltf.extensionsUsed?.includes('KHR_draco_mesh_compression') || false, false); }
  }
  for (const folder of ['videos', 'anatomie']) {
    const entries = JSON.parse(fs.readFileSync(path.join(root, 'public/lernen', folder, 'mediennachweise.json'), 'utf8').replace(/^\uFEFF/, ''));
    for (const item of entries) { assert.equal(item.aiGenerated, false); assert.match(item.source, /^https:\/\//); assert.match(item.license, /^CC/); assert.match(item.sha256, /^[a-f0-9]{64}$/); }
  }
});

test('All sixteen catalog entries deep-link to a valid content ID without answer keys', () => {
  const { mediaSearchEntries } = load('lib/media-search-entries.js'); assert.equal(mediaSearchEntries.length, 16);
  for (const entry of mediaSearchEntries) {
    assert.equal(Object.hasOwn(entry, 'answer'), false); assert.ok(entry.categories.length); assert.ok(entry.text.length > 50);
    const url = new URL(entry.href, 'https://example.test'); const id = url.searchParams.get('eintrag');
    const data = url.pathname.endsWith('anatomie') ? anatomy.anatomyModels : url.pathname.endsWith('beobachtungswerkstatt') ? observation.observationCases : videos.wildlifeVideoCases;
    assert.ok(data.some(item => item.id === id));
  }
});

test('Every video question explains a wrong answer; text alternative and duplicate/stale guards work', () => {
  const app = setup('components/WildlifeVideoCases.js');
  assert.equal(app.button(videos.wildlifeVideoCases[0].questions[0].choices[0]).props.disabled, true);
  for (const item of videos.wildlifeVideoCases) {
    app.click(item.title); app.click('Textfassung gelesen – Fragen öffnen');
    for (let index = 0; index < item.questions.length; index++) {
      const question = item.questions[index]; const wrong = (question.answer + 1) % question.choices.length;
      const staleAnswer = app.button(question.choices[wrong]).props.onClick; staleAnswer(); staleAnswer(); app.redraw();
      assert.ok(app.content().includes(question.explanation)); assert.ok(app.content().includes('Richtig ist:'));
      if (index < item.questions.length - 1) { const next = app.button('Nächste Frage').props.onClick; next(); next(); app.redraw(); assert.ok(app.content().includes(item.questions[index + 1].question)); staleAnswer(); app.redraw(); }
    }
  }
  assert.match(app.content(), /15 von 15 Fragen beantwortet · 0 richtig/);
  app.click('Alle Videofälle neu beginnen'); assert.match(app.content(), /0 von 15 Fragen beantwortet/);
});

test('Observation reveals exactly one stage, rejects stale events and explains all wrong choices', () => {
  const app = setup('components/ObservationWorkshop.js');
  for (const item of observation.observationCases) {
    app.click(item.title);
    for (let index = 0; index < item.stages.length; index++) {
      const stage = item.stages[index]; const wrong = (stage.answer + 1) % stage.choices.length;
      const stale = app.button(stage.choices[wrong]).props.onClick; stale(); stale(); app.redraw(); assert.ok(app.content().includes(stage.explanation));
      if (index < item.stages.length - 1) { const next = app.button('Nächste Information aufdecken').props.onClick; next(); next(); app.redraw(); assert.ok(app.content().includes(item.stages[index + 1].question)); stale(); app.redraw(); }
    }
  }
  assert.match(app.content(), /24 von 24 Entscheidungen beantwortet · 0 richtig/);
  app.click('Alle acht Fälle neu beginnen'); assert.match(app.content(), /0 von 24 Entscheidungen beantwortet/);
});

test('All anatomy answers explain mistakes and rapid advance does not skip questions', () => {
  const app = setup('components/AnatomyExplorer.js');
  for (let index = 0; index < anatomy.anatomyQuestions.length; index++) {
    const question = anatomy.anatomyQuestions[index]; const wrong = (question.answer + 1) % question.choices.length;
    const stale = app.button(question.choices[wrong]).props.onClick; stale(); stale(); app.redraw(); assert.ok(app.content().includes(question.explanation));
    if (index < anatomy.anatomyQuestions.length - 1) { const next = app.button('Nächste Frage').props.onClick; next(); next(); app.redraw(); assert.ok(app.content().includes(anatomy.anatomyQuestions[index + 1].question)); stale(); app.redraw(); }
  }
  assert.match(app.content(), /Runde abgeschlossen: 0 von 6 richtig/);
  app.click('Alle Fragen wiederholen'); assert.match(app.content(), /0 beantwortet · 0 richtig/);
});

test('Direct search links select valid content and unknown IDs are ignored', () => {
  const previousWindow = global.window;
  try {
    for (const [component, id, expected] of [['ObservationWorkshop', 'hund', 'Der Hund hechelt stark'], ['WildlifeVideoCases', 'stockente', 'Stockente bei der Nahrungssuche'], ['AnatomyExplorer', 'unterkiefer', 'Der Unterkiefer ist als eigener Scan verfügbar.']]) {
      global.window = { location: { search: `?eintrag=${id}` } }; const app = setup(`components/${component}.js`); app.hooks.effects[0](); app.redraw(); assert.ok(app.content().includes(expected));
    }
    global.window = { location: { search: '?eintrag=not-valid' } }; const app = setup('components/ObservationWorkshop.js'); app.hooks.effects[0](); app.redraw(); assert.ok(app.content().includes(observation.observationCases[0].stages[0].evidence));
  } finally { global.window = previousWindow; }
});

test('All forty-five correct choices receive explanations and correct completion scores', () => {
  const videoApp = setup('components/WildlifeVideoCases.js');
  for (const item of videos.wildlifeVideoCases) {
    videoApp.click(item.title); videoApp.click('Textfassung gelesen – Fragen öffnen');
    for (const [index, question] of item.questions.entries()) {
      videoApp.click(question.choices[question.answer]); assert.ok(videoApp.content().includes(question.explanation));
      if (index < item.questions.length - 1) videoApp.click('Nächste Frage');
    }
  }
  assert.match(videoApp.content(), /15 von 15 Fragen beantwortet · 15 richtig/);
  const observationApp = setup('components/ObservationWorkshop.js');
  for (const item of observation.observationCases) {
    observationApp.click(item.title);
    for (const [index, stage] of item.stages.entries()) {
      observationApp.click(stage.choices[stage.answer]); assert.ok(observationApp.content().includes(stage.explanation));
      if (index < item.stages.length - 1) observationApp.click('Nächste Information aufdecken');
    }
  }
  assert.match(observationApp.content(), /24 von 24 Entscheidungen beantwortet · 24 richtig/);
  const anatomyApp = setup('components/AnatomyExplorer.js');
  for (const [index, question] of anatomy.anatomyQuestions.entries()) {
    anatomyApp.click(question.choices[question.answer]); assert.ok(anatomyApp.content().includes(question.explanation));
    if (index < anatomy.anatomyQuestions.length - 1) anatomyApp.click('Nächste Frage');
  }
  assert.match(anatomyApp.content(), /Runde abgeschlossen: 6 von 6 richtig/);
});