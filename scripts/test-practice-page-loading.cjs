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

function load(relative, overrides = {}, options = {}, cache = new Map()) {
  let filename = path.join(root, relative);
  if (!fs.existsSync(filename) && filename.endsWith('.js')) filename = filename.slice(0, -3) + '.jsx';
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const source = options.source ?? fs.readFileSync(filename, 'utf8');
  const { code } = swc.transformSync(source, {
    filename, disableNextSsg: !options.client,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, name) => name }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, {}, cache);
    return pr(id);
  }, mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
}

const scenarios = load('lib/practice-scenarios.js');
const slugs = Object.keys(scenarios.practiceModuleIds);
const pagePath = slug => `pages/jagdpraxis/${slug}.js`;
const layout = ({ children, title, result }) => React.createElement('main', { 'data-result': Boolean(result) }, React.createElement('h1', null, title), children);
const overrides = { '../../components/PracticeLayout': layout, '../../lib/practice-scenarios': scenarios };

test('All 26 practice pages assemble only their unchanged 25-question array at build time', () => {
  assert.equal(slugs.length, 26);
  for (const slug of slugs) {
    const calls = [];
    const page = load(pagePath(slug), { ...overrides, '../../lib/practice-scenarios': {
      getPracticeScenarios(id) { calls.push(id); return scenarios.getPracticeScenarios(id); },
    } });
    assert.equal(calls.length, 0, `${slug}: importing the page must not assemble the curriculum`);
    const result = page.getStaticProps();
    assert.deepEqual(calls, [slug]);
    const expected = scenarios.getPracticeScenarios(slug);
    assert.equal(result.props.scenarios.length, 25);
    assert.deepEqual(result.props.scenarios, expected, `${slug}: all questions, answers, ordering, explanations and sources stay intact`);
    assert.deepEqual(JSON.parse(JSON.stringify(result.props.scenarios)), expected, `${slug}: Next page data is serializable without dropping fields`);
  }
});

test('Next client compilation excludes the complete curriculum and its scenario assembler on all 26 pages', () => {
  for (const slug of slugs) {
    const page = load(pagePath(slug), { ...overrides, '../../lib/practice-scenarios': new Proxy({}, { get() { throw new Error(`${slug}: client imported the full curriculum`); } }) }, { client: true });
    assert.equal(page.__N_SSG, true, slug);
    assert.equal(page.getStaticProps, undefined, slug);
    assert.equal(typeof page.default, 'function', slug);
  }
});

const propsOf = node => node[Object.keys(node).find(key => key.startsWith('__reactProps'))];
function clock() {
  const originals = { setTimeout: global.setTimeout, clearTimeout: global.clearTimeout };
  const timers = new Map(); let timerId = 0;
  // Own only the actual practice feedback timers. DOM/React scheduling keeps
  // real timers, so mounting child components cannot be simulated away.
  global.setTimeout = (callback, delay, ...args) => {
    if (delay !== 10000) return originals.setTimeout(callback, delay, ...args);
    const id = { practiceTimer: ++timerId }; timers.set(id, { callback, delay }); return id;
  };
  global.clearTimeout = id => { if (!timers.delete(id)) originals.clearTimeout(id); };
  return { timers, restore() { Object.assign(global, originals); } };
}
async function mountedPage(slug, paired = false) {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const dom = new JSDOM('<!doctype html><div id="current"></div><div id="legacy"></div>', { url: `https://jagdlatein.invalid/jagdpraxis/${slug}` });
  const globals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    globals.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  dom.window.Storage.prototype.getItem = dom.window.Storage.prototype.setItem = () => { throw Error('No personal storage permitted'); };
  const current = load(pagePath(slug), overrides), props = current.getStaticProps().props;
  const createRoot = pr('react-dom/client').createRoot, currentHost = document.getElementById('current'), currentRoot = createRoot(currentHost);
  let legacyRoot;
  if (paired) {
    const source = fs.readFileSync(path.join(root, pagePath(slug)), 'utf8');
    const previous = source.replace(/export function getStaticProps\(\) \{\s*return \{ props: \{ scenarios: getPracticeScenarios\("([^"]+)"\) \} \};\s*\}/,
      'const scenarios = getPracticeScenarios("$1");').replace(/export default function (\w+)\(\{ scenarios \}\)/, 'export default function $1()');
    assert.notEqual(previous, source, slug);
    const legacy = load(pagePath(slug), overrides, { source: previous });
    legacyRoot = createRoot(document.getElementById('legacy'));
    await React.act(async () => { currentRoot.render(React.createElement(current.default, props)); legacyRoot.render(React.createElement(legacy.default)); });
  } else await React.act(async () => currentRoot.render(React.createElement(current.default, props)));
  const nested = slug === 'trefferzonen', hosts = paired ? [currentHost, document.getElementById('legacy')] : [currentHost];
  if (nested) await React.act(async () => { for (const host of hosts) host.querySelector('details.learningCases > summary').click(); });
  const round = host => nested ? host.querySelector('section[aria-label="Wissen & Sicherheit"]') : host;
  function answer(host, index) {
    const label = nested ? props.scenarios[index].correct ? 'Stimmt' : 'Stimmt nicht' : props.scenarios[index].correct ? 'Aussage stimmt' : 'Aussage stimmt nicht';
    const found = [...round(host).querySelectorAll('button')].find(node => node.textContent.trim() === label);
    assert.ok(found, `${slug}: actual answer ${index + 1}`); return found;
  }
  async function advance(timers) {
    await React.act(async () => {
      if (nested) for (const host of hosts) {
        const next = [...round(host).querySelectorAll('button')].find(node => ['Weiter', 'Runde auswerten'].includes(node.textContent.trim()));
        assert.ok(next); next.click();
      } else for (const [id, timer] of [...timers]) { timers.delete(id); assert.equal(timer.delay, 10000); timer.callback(); }
    });
  }
  return { dom, hosts, props, nested, round, answer, advance, async close() {
    await React.act(async () => { currentRoot.unmount(); legacyRoot?.unmount(); }); dom.window.close();
    for (const [key, descriptor] of globals) descriptor ? Object.defineProperty(global, key, descriptor) : delete global[key];
  } };
}

test('Moving question data to static props preserves every genuinely mounted round, explanation and final result exactly', async () => {
  const c = clock();
  try {
    for (const slug of slugs) {
      const f = await mountedPage(slug, true);
      try {
        for (let index = 0; index < 25; index++) {
          const [after, before] = f.hosts.map(host => f.round(host));
          assert.equal(after.innerHTML, before.innerHTML, `${slug}: blind question ${index + 1}`);
          await React.act(async () => f.hosts.forEach(host => f.answer(host, index).click()));
          assert.equal(after.innerHTML, before.innerHTML, `${slug}: answered question ${index + 1}`);
          assert.ok(after.textContent.includes(f.props.scenarios[index].explanation), `${slug}: the complete explanation remains visible`);
          if (f.props.scenarios[index].source?.startsWith('https://')) assert.ok([...after.querySelectorAll('a')].some(link => link.getAttribute('href') === f.props.scenarios[index].source), `${slug}: original source stays attached to the explanation`);
          await f.advance(c.timers);
        }
        assert.equal(f.round(f.hosts[0]).innerHTML, f.round(f.hosts[1]).innerHTML, `${slug}: final result`);
      } finally { await f.close(); }
      assert.equal(c.timers.size, 0);
    }
  } finally { c.restore(); }
});

test('Static-data pages retain real answer locking, 25 score transitions and their timed or explicitly manual feedback contract', async () => {
  const c = clock();
  try {
    for (const slug of slugs) {
      const f = await mountedPage(slug);
      let stale;
      try {
        const host = f.hosts[0];
        let targetState;
        if (f.nested) {
          assert.ok(host.querySelector('#scheiben-minispiel')); assert.ok(host.querySelector('details.learningCases'));
          assert.equal(host.querySelector('details.learningCases').open, true, 'The explicit existing summary opened the learning round');
          const start = [...host.querySelectorAll('#scheiben-minispiel button')].find(node => node.textContent.includes('Runde starten'));
          assert.ok(start); await React.act(async () => start.click());
          const board = host.querySelector('#scheiben-minispiel [role="button"]');
          assert.equal(board.getAttribute('aria-disabled'), 'false');
          await React.act(async () => board.click()); assert.match(board.getAttribute('aria-label'), /Schuss 2 von 10/);
          targetState = host.querySelector('#scheiben-minispiel').innerHTML;
        }
        for (let index = 0; index < 25; index++) {
          const answer = f.answer(host, index), handler = propsOf(answer).onClick;
          assert.equal(f.round(host).querySelector('[role="status"]'), null, `${slug}: the new question starts blind`);
          assert.equal(answer.disabled, false);
          await React.act(async () => { stale?.(); answer.click(); handler(); });
          assert.equal(c.timers.size, f.nested ? 0 : 1, `${slug}: duplicate answers cannot add timers`);
          assert.ok(f.round(host).textContent.includes(f.props.scenarios[index].explanation), `${slug}: feedback follows its supplied question`);
          assert.equal(answer.disabled, true, `${slug}: chosen answer is locked`);
          await f.advance(c.timers); stale = handler;
        }
        assert.match(f.round(host).textContent, f.nested ? /25 von 25 Aussagen richtig eingeordnet/ : /Punktestand: 25 \/ 25/);
        const final = f.round(host).innerHTML;
        await React.act(async () => stale()); assert.equal(f.round(host).innerHTML, final, 'A previous question cannot alter the result');
        if (f.nested) assert.equal(host.querySelector('#scheiben-minispiel').innerHTML, targetState, 'Twenty-five learning answers do not reset or answer the separately mounted game');
      } finally { await f.close(); }
      if (stale) await React.act(async () => stale());
      assert.equal(c.timers.size, 0, `${slug}: unmount clears its owned feedback timers`);
    }
  } finally { c.restore(); }
});
