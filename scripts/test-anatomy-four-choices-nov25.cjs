// Existing museum quiz, actual React commits and native buttons, with isolated
// DOM/router/layout doubles. No account, storage, WebGL or external media call.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), { execFileSync } = require('node:child_process');
const { createLoader, root: repo, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the existing isolated jsdom module.', { cause: error }); }
const React = local('react'), revision = '5d231d94a652d0685708326f1faa6b5c22008d96';
const load = createLoader(), current = load('lib/anatomy-explorer.js'), review = load('data/reviews/anatomy-four-choices-2026-11-25.json');
const expected = [
  ['art', 'schaedel', 1, 'Damhirsch'], ['auge', 'schaedel', 0, 'Die Lichtempfindlichkeit der Netzhaut'],
  ['luecke', 'unterkiefer', 1, 'Ein Zahnfach (Alveole)'], ['weichteil', 'unterkiefer', 2, 'Fehlende Muskeln werden beim Drehen automatisch ergänzt'],
  ['groessen', 'vorderlauf', 1, 'Ja, wenn beide Modelle ihr Ansichtsfenster ganz ausfüllen'], ['scan', 'vorderlauf', 2, 'Eine Filmaufnahme eines lebenden Vorderlaufs'],
];
function priorData() {
  const source = execFileSync('git', ['show', `${revision}:lib/anatomy-explorer.js`], { cwd: repo, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'anatomy-explorer.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} }; new Function('module', 'exports', code)(module, module.exports); return module.exports;
}
const before = priorData(), sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('All original museum exports, six model bindings and nine full feature objects remain exact after removing only six named fourth alternatives', () => {
  assert.deepEqual(Object.keys(current).sort(), Object.keys(before).sort());
  assert.deepEqual(current.anatomyQuestions.map(question => [question.id, question.modelId, question.answer, question.choices[3]]), expected);
  assert.deepEqual(current.anatomyQuestions.map(question => ({ ...question, choices: question.choices.slice(0, 3) })), before.anatomyQuestions);
  for (const key of Object.keys(before).filter(key => key !== 'anatomyQuestions')) assert.deepEqual(current[key], before[key], key);
  assert.equal(current.anatomyModels.length, 3); assert.equal(current.anatomyModels.flatMap(model => model.features).length, 9);
  for (const model of current.anatomyModels) {
    assert.equal(model.scientificName, 'Odocoileus virginianus');
    const questions = current.anatomyQuestions.filter(question => question.modelId === model.id); assert.equal(questions.length, 2);
    for (const question of questions) { assert.equal(question.choices.length, 4); assert.equal(new Set(question.choices).size, 4); assert.ok(question.answer < 3); }
  }
});

test('Every original GLB byte and original4October provenance record stays identical to the released baseline, with no new animation or skin', () => {
  const name = 'public/lernen/anatomie/mediennachweise.json', manifest = JSON.parse(fs.readFileSync(path.join(repo, name), 'utf8').replace(/^\uFEFF/, ''));
  assert.deepEqual(manifest, JSON.parse(execFileSync('git', ['show', `${revision}:${name}`], { cwd: repo, encoding: 'utf8' }).replace(/^\uFEFF/, '')));
  for (const model of current.anatomyModels) {
    const relative = 'public' + model.src, bytes = fs.readFileSync(path.join(repo, relative)), record = manifest.find(item => item.file === model.src);
    assert.ok(record); assert.equal(record.checked, '2026-10-04'); assert.equal(record.license, 'CC0 1.0'); assert.equal(record.aiGenerated, false);
    assert.equal(sha(bytes), record.sha256); assert.equal(sha(bytes), sha(execFileSync('git', ['show', `${revision}:${relative}`], { cwd: repo, maxBuffer: 15000000 })));
    assert.equal(bytes.subarray(0, 4).toString(), 'glTF'); assert.equal(bytes.readUInt32LE(4), 2);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8').trim());
    assert.equal((json.animations || []).length, 0); assert.equal((json.skins || []).length, 0);
  }
});

test('Only the six new positive-prompt alternatives receive a25November comparison review, preserving the unique-provenance and current-access boundaries', () => {
  assert.equal(review.checkedOn, '2026-11-25'); assert.equal(review.baselineCommit, revision);
  assert.equal(review.implementationScope.newQuestions, 0); assert.equal(review.implementationScope.newModels, 0); assert.equal(review.implementationScope.sourceObjectsChanged, false); assert.equal(review.implementationScope.mediaChanged, false);
  assert.deepEqual(review.questions.map(item => [item.questionId, item.modelId, item.unchangedAnswerIndex, item.fourthChoice]), expected);
  const sources = new Map(review.sourcesActuallyRead.map(source => [source.id, source]));
  for (const item of review.questions) {
    assert.equal(item.newAlternativeTruth, false); assert.match(item.questionDirection, /^positive:/); assert.ok(item.comparison && item.existingTeaching && item.limit);
    assert.equal(new Set(item.sourceIds.map(id => { assert.ok(sources.has(id)); return sources.get(id).independenceGroup; })).size, item.independentFamilyCount);
    assert.ok(item.independentFamilyCount >= 2);
  }
  assert.match(sources.get('modelViewer410').url, /\/v4\.1\.0\//);
  assert.match(review.primaryProvenanceBoundary, /NOT.*second physical identification/);
  assert.match(review.rootSourceAccessBoundary, /403.*verbatim.*No fresh Root HTTP200/);
});

const tick = () => new Promise(resolve => setImmediate(resolve));
async function fixture(modelId = 'schaedel') {
  const url = id => `/lernen/anatomie?eintrag=${id}#anatomie-modell`;
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'https://jagdlatein.test' + url(modelId) });
  const { window } = dom, saved = new Map(), frames = new Map(); let frame = 0;
  window.requestAnimationFrame = callback => { frames.set(++frame, callback); return frame; };
  window.cancelAnimationFrame = id => frames.delete(id); window.scrollTo = () => {}; window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  const router = { isReady: true, asPath: url(modelId), query: { eintrag: modelId } }, requests = [];
  router.push = async (...args) => { requests.push(args); return true; };
  const innerLoad = createLoader({
    'next/router': { useRouter: () => router }, 'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
    'next/script': () => { throw new Error('The quiz probe must not load the optional model viewer'); },
    './LearningToolLayout': { __esModule: true, default: ({ title, children }) => React.createElement('main', null, React.createElement('h1', { 'data-learning-page-start': true, tabIndex: -1 }, title), children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-isolated-menu': true }, children), openPageMenu() {}, closePageMenu() {} },
  });
  const Page = innerLoad('components/AnatomyExplorer.js').default, { createRoot } = local('react-dom/client');
  const host = window.document.getElementById('test-root'), root = createRoot(host); let disposed = false, unmounted = false;
  async function render() { await React.act(async () => root.render(React.createElement(Page))); const jobs = [...frames.values()]; frames.clear(); for (const callback of jobs) callback(); }
  const f = { host, window, router, requests,
    get quiz() { return [...host.querySelectorAll('details')].find(details => details.querySelector('summary')?.textContent.startsWith('Wissen zum Modell')); },
    get area() { return host.querySelector('#anatomie-fragen')?.closest('section'); },
    get choices() { return this.area ? [...this.area.querySelectorAll('.choices > button')] : []; },
    handler(element, name = 'onClick') { return element[Object.keys(element).find(key => key.startsWith('__reactProps'))][name]; },
    async click(label) { const button = [...host.querySelectorAll('button')].find(item => item.textContent === label); assert.ok(button, label); assert.equal(button.disabled, false); await React.act(async () => button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); },
    async toggle(open) { const details = this.quiz; assert.ok(details); await React.act(async () => { details.open = open; details.dispatchEvent(new window.Event('toggle')); await tick(); }); },
    async answer(index) { const button = this.choices[index]; assert.ok(button); assert.equal(button.disabled, false); await React.act(async () => button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); },
    async route(id, ready = true) { router.asPath = url(id); router.query = { eintrag: id }; router.isReady = ready; window.history.replaceState(null, '', router.asPath); await render(); },
    async unmount() { if (unmounted) return; unmounted = true; await React.act(async () => root.unmount()); assert.equal(frames.size, 0); },
    async dispose() { if (disposed) return; disposed = true; await this.unmount(); window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(global, key, value); else delete global[key]; } },
  };
  await render(); return f;
}

for (const model of current.anatomyModels) test(`The actual ${model.id} quiz stays optional and blind, then grades all eight native answer paths using only its two original model-bound questions`, async () => {
  const f = await fixture(model.id), questions = current.anatomyQuestions.filter(question => question.modelId === model.id);
  try {
    assert.equal(f.quiz.open, false); assert.equal(f.area, undefined); assert.equal(f.host.querySelector('model-viewer'), null);
    assert.ok(f.host.textContent.includes('nordamerikanischen Weißwedelhirsches')); assert.ok(f.host.textContent.includes('nicht maßstabsgleich'));
    await f.toggle(true);
    for (const selectedIndex of [3, 0, 1, 2]) {
      if (selectedIndex !== 3) await f.click('Diese Fragen wiederholen');
      for (const [index, question] of questions.entries()) {
        assert.equal(f.area.querySelector('h3').textContent, question.question); assert.deepEqual(f.choices.map(button => button.textContent), question.choices);
        assert.equal(f.choices.length, 4); assert.equal(f.area.querySelector('[role="status"]'), null);
        await f.answer(selectedIndex);
        assert.equal(f.area.querySelector('[role="status"] strong').textContent, selectedIndex === question.answer ? 'Richtig.' : `Die richtige Antwort ist: ${question.choices[question.answer]}.`);
        assert.equal(f.area.querySelector('[role="status"] p').textContent, question.explanation); assert.ok(f.choices.every(button => button.disabled));
        if (index === 0) await f.click('Nächste Frage');
      }
      const correct = questions.filter(question => question.answer === selectedIndex).length;
      assert.ok(f.area.textContent.includes(`Runde abgeschlossen: ${correct} von 2 richtig`));
    }
    const evidence = [...f.host.querySelectorAll('details')].find(details => details.querySelector('summary')?.textContent === 'Fachliche Quellen und Modellnachweise');
    assert.ok(evidence); assert.equal(evidence.open, false); assert.equal(evidence.parentElement.lastElementChild, evidence);
    assert.match(evidence.textContent, /4\. Oktober 2026/); assert.equal(f.requests.length, 0);
  } finally { await f.dispose(); }
});

test('Fourth-choice double clicks and stale correct handlers cannot grade twice; closing/repeating and modelA-B-A keep their existing round boundaries', async () => {
  const f = await fixture(), q = current.anatomyQuestions[0];
  try {
    await f.toggle(true); const stale = f.handler(f.choices[q.answer]);
    await React.act(async () => { const fourth = f.choices[3]; fourth.dispatchEvent(new f.window.MouseEvent('click', { bubbles: true })); stale(); });
    assert.ok(f.area.textContent.includes('1 beantwortet · 0 richtig'));
    await f.toggle(false); await React.act(async () => stale()); await f.toggle(true); assert.ok(f.area.textContent.includes('1 beantwortet · 0 richtig'));
    await f.route('unterkiefer'); assert.equal(f.quiz.open, false); await f.toggle(true); await React.act(async () => stale()); assert.ok(f.area.textContent.includes('0 beantwortet · 0 richtig'));
    await f.route('schaedel'); await f.toggle(true); await React.act(async () => stale()); assert.ok(f.area.textContent.includes('0 beantwortet · 0 richtig'));
    await f.answer(q.answer); await f.click('Nächste Frage'); await f.answer(current.anatomyQuestions[1].answer);
    const oldRound = f.handler(f.choices[3]); await f.click('Diese Fragen wiederholen'); await React.act(async () => oldRound()); assert.ok(f.area.textContent.includes('0 beantwortet · 0 richtig'));
    const last = f.handler(f.choices[3]); await f.unmount(); await React.act(async () => last()); assert.equal(f.host.textContent, ''); assert.equal(f.requests.length, 0);
  } finally { await f.dispose(); }
});

test('Unready or invalid model selections cannot display a substitute museum question or request optional3D resources', async () => {
  const f = await fixture();
  try {
    const confirmed = f.quiz;
    for (const [id, ready] of [['unterkiefer', false], ['unknown', true]]) {
      await f.route(id, ready);
      assert.equal(f.quiz === confirmed, true, 'The previously confirmed quiz is retained, never replaced by the unconfirmed target');
      assert.equal(Boolean(f.quiz.closest('[hidden][inert][aria-hidden="true"]')), true, 'Retained practice is unavailable visually, to assistive technology and to native interaction');
      assert.equal(f.quiz.closest('[hidden]').style.display, 'none');
      assert.equal(f.area === undefined, true, 'A closed optional quiz does not invent an answered question panel');
      assert.equal(f.host.querySelector('model-viewer') === null, true); assert.equal(f.requests.length, 0);
    }
  }
  finally { await f.dispose(); }
});
