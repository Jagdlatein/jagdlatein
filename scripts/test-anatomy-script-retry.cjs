// Real installed Next Script cache, inert document nodes and isolated component
// hooks. No browser, module execution, downloads or user data is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const { local } = require('./helpers/project-module.cjs');
const { setup, text } = require('./helpers/field-reader-fixture.cjs');
const { handleClientScriptLoad } = local('next/dist/client/script.js');
const settle = () => new Promise(resolve => setImmediate(resolve));

function documentFixture(t) {
  const previous = global.document, previousWindow = global.window, previousRegistry = global.customElements;
  const appended = [], definitions = new Map();
  const registry = {
    get(name) { return definitions.get(name); },
    define(name, value) { assert.ok(!definitions.has(name), 'A custom element may be registered only once'); definitions.set(name, value); },
  };
  global.customElements = registry;
  global.window = { customElements: registry };
  global.document = {
    createElement(name) {
      assert.equal(name, 'script');
      return {
        listeners: new Map(),
        addEventListener(event, callback) { this.listeners.set(event, callback); },
        setAttribute() {},
      };
    },
    body: { appendChild(element) { appended.push(element); } },
  };
  t.after(() => {
    if (previous === undefined) delete global.document;
    else global.document = previous;
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
    if (previousRegistry === undefined) delete global.customElements;
    else global.customElements = previousRegistry;
  });
  return appended;
}

test('The installed Next loader retains a failed src, so remounting that src alone cannot perform a network retry', async t => {
  const appended = documentFixture(t), callbacks = [];
  const props = { src: '/isolated-anatomy-cache-baseline.js', strategy: 'afterInteractive',
    onError() { callbacks.push('error'); }, onLoad() { callbacks.push('load'); } };
  handleClientScriptLoad(props);
  assert.equal(appended.length, 1);
  appended[0].listeners.get('error')(new Error('Synthetic module request failure'));
  await settle();
  handleClientScriptLoad(props);
  await settle();
  assert.equal(appended.length, 1, 'This real Next version caches the failed src');
  assert.deepEqual(callbacks, ['error', 'load'], 'A reused rejected src would falsely look loaded to its new component');
});

test('A failed anatomy module receives a fresh retry request and only its real load enables the viewer', async t => {
  const appended = documentFixture(t);
  const app = setup('components/AnatomyExplorer.js', {}, {
    router: { pathname: '/lernen/anatomie', asPath: '/lernen/anatomie' },
  });
  t.after(() => app.dispose());
  const script = () => app.nodes(node => node.type?.__nextScript)[0];
  const viewer = () => app.nodes(node => node.type === 'model-viewer')[0];
  const status = () => text(app.nodes(node => node.type === 'p' && node.props.role === 'status')[0]);
  app.click('3D-Ansicht öffnen');
  const initial = script().props;
  assert.equal(new URL(initial.src, 'https://jagdlatein.test').pathname, '/lernen/anatomie/model-viewer-4.1.0.min.js');
  handleClientScriptLoad(initial);
  assert.equal(appended.length, 1);
  appended[0].listeners.get('error')(new Error('Synthetic module request failure'));
  await settle(); app.render();
  assert.match(status(), /konnte nicht geladen/); assert.equal(viewer(), undefined);

  app.click('Laden erneut vorbereiten');
  assert.equal(script(), undefined);
  app.click('3D-Ansicht öffnen');
  const retry = script().props;
  assert.notEqual(retry.src, initial.src, 'The retry must bypass Next\'s failed-src cache');
  handleClientScriptLoad(retry);
  await settle(); app.render();
  assert.equal(appended.length, 2, 'The user retry performs a fresh module request');
  assert.equal(viewer(), undefined, 'A pending request does not fabricate script readiness');
  assert.match(status(), /Modell lädt/);

  initial.onError(new Error('Synthetic retained old error'));
  initial.onLoad(); initial.onReady(); app.render();
  assert.equal(viewer(), undefined, 'Old attempt success callbacks cannot enable the replacement');
  assert.match(status(), /Modell lädt/, 'The old error cannot replace the retry status');

  global.customElements.define('model-viewer', function ModelViewerDouble() {});
  appended[1].listeners.get('load')({ type: 'load' });
  await settle(); app.render();
  assert.ok(viewer(), 'Only the replacement script\'s actual load enables the custom element');
  initial.onError(new Error('Synthetic retained old error after success')); app.render();
  assert.ok(viewer()); assert.match(status(), /Modell lädt/);
});

test('Returning after an unmounted failed script cannot mistake Next\'s cached failure for a loaded custom element', async t => {
  const appended = documentFixture(t);
  const modulePath = local.resolve('next/dist/client/script.js');
  delete local.cache[modulePath];
  const loadScript = local(modulePath).handleClientScriptLoad;
  const create = () => setup('components/AnatomyExplorer.js', {}, {
    router: { pathname: '/lernen/anatomie', asPath: '/lernen/anatomie' },
  });
  const first = create();
  first.click('3D-Ansicht öffnen');
  const initial = first.nodes(node => node.type?.__nextScript)[0].props;
  loadScript(initial);
  appended[0].listeners.get('error')(new Error('Synthetic initial request failure'));
  await settle(); first.render(); first.dispose();

  const returned = create(); t.after(() => returned.dispose());
  returned.click('3D-Ansicht öffnen');
  const fresh = returned.nodes(node => node.type?.__nextScript)[0].props;
  loadScript(fresh);
  await settle(); returned.render();
  assert.equal(returned.nodes(node => node.type === 'model-viewer').length, 0,
    'Neither a native module load nor custom element registration has occurred after returning');
});

test('An old pending origin module failure cannot report script readiness to the current origin', async t => {
  const appended = documentFixture(t);
  const modulePath = local.resolve('next/dist/client/script.js');
  delete local.cache[modulePath];
  const loadScript = local(modulePath).handleClientScriptLoad;
  const app = setup('components/AnatomyExplorer.js', {}, {
    router: { pathname: '/lernen/anatomie', asPath: '/lernen/anatomie' },
  });
  t.after(() => app.dispose());
  const script = () => app.nodes(node => node.type?.__nextScript)[0];
  app.click('3D-Ansicht öffnen');
  loadScript(script().props);
  assert.equal(appended.length, 1);
  app.router.asPath = '/lernen/anatomie?eintrag=schaedel&ref=changed-during-module-load';
  app.navigate({ eintrag: 'schaedel', ref: 'changed-during-module-load' });
  loadScript(script().props);
  appended[0].listeners.get('error')(new Error('Synthetic old pending module request failure'));
  await settle(); app.render();
  assert.equal(app.nodes(node => node.type === 'model-viewer').length, 0,
    'The caught Next cache promise may not fabricate a model-viewer definition');
});

test('Returning after successful registration reuses the global custom element without evaluating a second module URL', async t => {
  const appended = documentFixture(t);
  const modulePath = local.resolve('next/dist/client/script.js');
  delete local.cache[modulePath];
  const loadScript = local(modulePath).handleClientScriptLoad;
  const create = () => setup('components/AnatomyExplorer.js', {}, {
    router: { pathname: '/lernen/anatomie', asPath: '/lernen/anatomie' },
  });
  const first = create();
  first.click('3D-Ansicht öffnen');
  loadScript(first.nodes(node => node.type?.__nextScript)[0].props);
  global.customElements.define('model-viewer', function ModelViewerDouble() {});
  appended[0].listeners.get('load')({ type: 'load' });
  await settle(); first.render(); first.dispose();

  const returned = create(); t.after(() => returned.dispose());
  returned.click('3D-Ansicht öffnen');
  const script = returned.nodes(node => node.type?.__nextScript)[0];
  if (script) loadScript(script.props);
  await settle(); returned.render();
  assert.equal(appended.length, 1, 'The local module unconditionally defines model-viewer and may execute only once');
  assert.equal(returned.nodes(node => node.type === 'model-viewer').length, 1);
});
