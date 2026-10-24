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
const { setup: setupReader } = require('../helpers/field-reader-fixture.cjs');

function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  const resolve = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ isReady: false, query: {}, pathname: '', replace: async () => true }) };
    if (id === 'next/image') return ({ priority, fill, ...props }) => React.createElement('img', props);
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head' || id === 'next/script') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides);
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
  if (['components/ObservationWorkshop.js', 'components/WildlifeVideoCases.js'].includes(relative)) {
    const params = new URLSearchParams(global.window?.location?.search || '');
    const app = setupReader(relative, Object.fromEntries(params), { props: {} });
    const button = label => { const found = app.nodes(node => node.type === 'button' && text(node) === label)[0]; assert.ok(found, `Missing button ${label}`); return found; };
    return { redraw: app.render, button, get tree() { return app.tree; },
      click(label) { const found = button(label); assert.equal(!!found.props.disabled, false, `Disabled button ${label}`); found.props.onClick(); app.render(); },
      choose(id) { app.nodes(node => node.type === 'select' && node.props.id === 'beobachtung-case')[0].props.onChange({ target: { value: id } }); app.render(); },
      content() { return text(app.tree); }, dispose: app.dispose };
  }
  const hooks = engine(); const component = load(relative, { react: hooks.hooks }).default;
  let tree; const redraw = () => tree = hooks.render(component); redraw();
  const button = label => { const found = find(tree, node => node.type === 'button' && text(node) === label); assert.ok(found, `Missing button ${label}`); return found; };
  return { hooks, redraw, button, get tree() { return tree; }, click(label) { const found = button(label); assert.equal(!!found.props.disabled, false, `Disabled button ${label}`); found.props.onClick(); redraw(); }, content() { return text(tree); } };
}
const videos = load('lib/wildlife-video-cases.js');
const anatomy = load('lib/anatomy-explorer.js');
const observation = load('lib/observation-workshop.js');
function selectAnatomyModel(app, id) {
  find(app.tree, node => node.type === 'select').props.onChange({ target: { value: id } }); app.redraw();
}
function openAnatomyQuiz(app) {
  const details = find(app.tree, node => node.type === 'details' && text(node.props.children[0]).startsWith('Wissen zum Modell'));
  assert.ok(details && !details.props.open); details.props.onToggle({ currentTarget: { open: true } }); app.redraw();
}

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
    app.choose(item.id);
    for (let index = 0; index < item.stages.length; index++) {
      const stage = item.stages[index]; const wrong = (stage.answer + 1) % stage.choices.length;
      const stale = app.button(stage.choices[wrong]).props.onClick; stale(); stale(); app.redraw(); assert.ok(app.content().includes(stage.explanation));
      if (index < item.stages.length - 1) { const next = app.button('Nächste Information aufdecken').props.onClick; next(); next(); app.redraw(); assert.ok(app.content().includes(item.stages[index + 1].question)); stale(); app.redraw(); }
    }
  }
  assert.match(app.content(), /24 von 24 Entscheidungen beantwortet · 0 richtig/);
  app.click('Alle acht Fälle neu beginnen'); assert.match(app.content(), /0 von 24 Entscheidungen beantwortet/);
  app.dispose();
});

test('Each optional model-specific anatomy round explains mistakes and rapid advance does not skip its questions', () => {
  const app = setup('components/AnatomyExplorer.js');
  for (const model of anatomy.anatomyModels) {
    selectAnatomyModel(app, model.id); openAnatomyQuiz(app);
    const questions = anatomy.anatomyQuestions.filter(question => question.modelId === model.id);
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index]; const wrong = (question.answer + 1) % question.choices.length;
      const stale = app.button(question.choices[wrong]).props.onClick; stale(); stale(); app.redraw(); assert.ok(app.content().includes(question.explanation));
      if (index < questions.length - 1) { const next = app.button('Nächste Frage').props.onClick; next(); next(); app.redraw(); assert.ok(app.content().includes(questions[index + 1].question)); stale(); app.redraw(); }
    }
    assert.ok(app.content().includes(`Runde abgeschlossen: 0 von ${questions.length} richtig`));
    app.click('Diese Fragen wiederholen'); assert.match(app.content(), /0 beantwortet · 0 richtig/);
  }
});

test('The anatomy selector opens real-photo digestion content directly and retains museum questions', () => {
  const app = setup('components/AnatomyExplorer.js');
  const select = () => find(app.tree, node => node.type === 'select' && node.props.children?.some?.(child => child?.type === 'optgroup'));
  assert.ok(select());
  select().props.onChange({target: {value: 'schwarzwild-verdauung'}}); app.redraw();
  const panel = find(app.tree, node => node.type?.name === 'DigestiveLearning');
  assert.ok(panel); assert.equal(panel.props.selectedId, 'schwarzwild-verdauung'); assert.equal(panel.props.hideSelector, true);
  select().props.onChange({target: {value: anatomy.anatomyModels[0].id}}); app.redraw();
  assert.equal(find(app.tree, node => node.type?.name === 'DigestiveLearning'), null);
  assert.ok(!app.content().includes(anatomy.anatomyQuestions[0].question));
  openAnatomyQuiz(app);
  assert.ok(app.content().includes(anatomy.anatomyQuestions[0].question));
});

test('Direct search links select valid content and unknown observation IDs never substitute another case', () => {
  const previousWindow = global.window;
  try {
    for (const [component, id, expected] of [['ObservationWorkshop', 'hund', 'Der Hund hechelt stark'], ['WildlifeVideoCases', 'stockente', 'Stockente bei der Nahrungssuche'], ['AnatomyExplorer', 'unterkiefer', 'Der Unterkiefer ist als eigener Scan verfügbar.']]) {
      global.window = { location: { search: `?eintrag=${id}` } }; const app = setup(`components/${component}.js`); if (component === 'AnatomyExplorer') app.hooks.effects[0](); app.redraw(); assert.ok(app.content().includes(expected)); app.dispose?.();
    }
    global.window = { location: { search: '?eintrag=not-valid' } }; const app = setup('components/ObservationWorkshop.js'); assert.match(app.content(), /Dieser Lernfall ist nicht verfügbar/); assert.ok(!app.content().includes(observation.observationCases[0].stages[0].evidence)); app.dispose();
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
    observationApp.choose(item.id);
    for (const [index, stage] of item.stages.entries()) {
      observationApp.click(stage.choices[stage.answer]); assert.ok(observationApp.content().includes(stage.explanation));
      if (index < item.stages.length - 1) observationApp.click('Nächste Information aufdecken');
    }
  }
  assert.match(observationApp.content(), /24 von 24 Entscheidungen beantwortet · 24 richtig/);
  observationApp.dispose();
  const anatomyApp = setup('components/AnatomyExplorer.js');
  for (const model of anatomy.anatomyModels) {
    selectAnatomyModel(anatomyApp, model.id); openAnatomyQuiz(anatomyApp);
    const questions = anatomy.anatomyQuestions.filter(question => question.modelId === model.id);
    for (const [index, question] of questions.entries()) {
      anatomyApp.click(question.choices[question.answer]); assert.ok(anatomyApp.content().includes(question.explanation));
      if (index < questions.length - 1) anatomyApp.click('Nächste Frage');
    }
    assert.ok(anatomyApp.content().includes(`Runde abgeschlossen: ${questions.length} von ${questions.length} richtig`));
  }
});
