// Personal self-assessment only. All storage, accounts and browser lifetimes
// below are isolated doubles; no real notes, tokens or cloud data are read.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToString } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const CH = { country: 'CH', region: 'ZH' }, AT = { country: 'AT', region: 'NOE' }, DE = { country: 'DE', region: 'BY' };
const goal = { id: 'wild-merkmale', title: 'Merkmale erklären', task: 'Erkläre die sichtbaren Merkmale.', selfCheck: ['Merkmale benannt', 'Unsicherheit benannt'], href: '/kurse/synthetic#lesson-a', lessonTitle: 'Merkmale', courseTitle: 'Wildkunde', sourceIds: [], sourceScope: 'lesson' };
const other = { ...goal, id: 'regional-aufgabe', title: 'Regionaler Lernauftrag' };
const smallBlueprint = { categories: [{ slug: 'wildkunde', goals: [goal] }] };
const smallAlignment = { regions: [{ ...CH, subjectAreas: [{ goals: [other] }] }] };
const stateBody = profiles => JSON.stringify({ version: 1, profiles });

function storageFixture(options = {}) {
  const api = createLoader()('lib/exam-goal-progress.js'), values = new Map(), writes = [], listeners = new Map();
  let failRead = options.failRead || false, failWrite = options.failWrite || false, failRemove = options.failRemove || false;
  const storage = {
    getItem(key) { if (failRead) throw new Error('Synthetic read denial'); return values.get(key) ?? null; },
    setItem(key, value) { writes.push(['set', key, value]); if (failWrite) throw new Error('Synthetic quota'); values.set(key, value); },
    removeItem(key) { writes.push(['remove', key]); if (failRemove) throw new Error('Synthetic removal denial'); values.delete(key); },
  };
  const win = { localStorage: storage, addEventListener(name, listener) { listeners.set(name, listener); }, removeEventListener(name, listener) { if (listeners.get(name) === listener) listeners.delete(name); } };
  const catalog = api.buildExamGoalCatalog(smallBlueprint, smallAlignment), store = api.createExamGoalProgressStore({ windowFor: () => win });
  store.configure(catalog);
  if (options.raw) values.set(api.EXAM_GOAL_PROGRESS_KEY, options.raw);
  const stop = store.subscribe(() => {});
  return { ...api, store, values, writes, catalog, listeners, storage, stop,
    get snapshot() { return store.getSnapshot(); },
    set failRead(value) { failRead = value; }, set failWrite(value) { failWrite = value; }, set failRemove(value) { failRemove = value; },
    storageEvent(event = {}) { listeners.get('storage')?.({ key: api.EXAM_GOAL_PROGRESS_KEY, storageArea: storage, ...event }); },
  };
}

test('The goal catalog preserves every projected object and exact target; storage schema accepts known goals and explicit marks only', () => {
  const s = storageFixture(); assert.equal(s.catalog.profiles.size, 51);
  assert.equal(s.catalog.profiles.get('CH:ZH').get(goal.id), goal); assert.equal(s.catalog.profiles.get('AT:NOE').has(other.id), false);
  assert.equal(s.examGoalProfileKey({ country: 'DE', region: ['BY'] }), '');
  const entries = s.readExamGoalProgress(stateBody({ 'CH:ZH': { [goal.id]: 'erklaert', [other.id]: 'ueben', missing: 'erklaert', '__proto__': 'erklaert' }, 'AT:NOE': { [goal.id]: 'offen', [other.id]: 'erklaert' }, 'CH:ZZ': { [goal.id]: 'erklaert' } }), s.catalog);
  assert.deepEqual(entries, { 'CH:ZH': { [goal.id]: 'erklaert', [other.id]: 'ueben' } });
  for (const raw of ['{', 'null', '[]', JSON.stringify({ version: 2, profiles: {} }), JSON.stringify({ version: 1, profiles: {}, email: 'synthetic@example.invalid' }), ' '.repeat(524289)]) assert.deepEqual(s.readExamGoalProgress(raw, s.catalog), {});
  assert.throws(() => s.buildExamGoalCatalog({ categories: [{ goals: [goal, goal] }] }, {}), /Lernziel/); s.stop();
});

test('Explicit marks and resetting one target retain the same goal ID independently across countries and regions', () => {
  const s = storageFixture(); assert.equal(s.writes.length, 0, 'Restoration does not write');
  assert.equal(s.store.set('CH:ZH', goal.id, 'erklaert'), true); assert.equal(s.store.set('AT:NOE', goal.id, 'ueben'), true);
  assert.equal(s.store.set('CH:BE', goal.id, 'ueben'), true); assert.equal(s.store.set('AT:NOE', other.id, 'erklaert'), false);
  assert.equal(s.store.set('CH:ZH', goal.id, 'passed'), false); assert.equal(s.store.set('CH:ZH', 'unknown-goal', 'erklaert'), false);
  assert.equal(s.store.reset('AT:NOE'), true); assert.deepEqual(s.snapshot.entries, { 'CH:ZH': { [goal.id]: 'erklaert' }, 'CH:BE': { [goal.id]: 'ueben' } });
  const persisted = JSON.parse(s.values.get(s.EXAM_GOAL_PROGRESS_KEY)); assert.deepEqual(Object.keys(persisted).sort(), ['profiles', 'version']);
  assert.doesNotMatch(JSON.stringify(persisted), /email|account|score|quiz|date|token|passed|profileId/i);
  assert.equal(s.store.set('CH:ZH', goal.id, 'offen'), true); assert.equal(s.snapshot.entries['CH:ZH'], undefined); s.stop();
});

test('Storage denial and quota preserve honest session marks; a failed clear never revives old device marks on remount', () => {
  const s = storageFixture({ raw: stateBody({ 'CH:ZH': { [goal.id]: 'erklaert' } }), failWrite: true });
  assert.equal(s.store.set('CH:ZH', goal.id, 'ueben'), true); assert.equal(s.snapshot.persistence, 'session'); assert.match(s.snapshot.error, /nur in dieser Sitzung/);
  s.failRemove = true; assert.equal(s.store.clear(), false); assert.deepEqual(s.snapshot.entries, {}); assert.match(s.snapshot.error, /Gerätespeicher/);
  s.stop(); const cleanup = s.store.subscribe(() => {}); assert.deepEqual(s.snapshot.entries, {}); cleanup();
  const denied = storageFixture({ failRead: true, failWrite: true }); assert.equal(denied.snapshot.phase, 'ready'); assert.equal(denied.snapshot.persistence, 'session'); assert.match(denied.snapshot.error, /nicht verfügbar/);
  denied.store.set('CH:ZH', goal.id, 'ueben'); assert.equal(denied.snapshot.entries['CH:ZH'][goal.id], 'ueben'); denied.stop();
});

test('Native storage events read current bytes, ignore unrelated stores and remove marks on a confirmed clear even after quota failure', () => {
  const s = storageFixture(); s.values.set(s.EXAM_GOAL_PROGRESS_KEY, stateBody({ 'AT:NOE': { [goal.id]: 'ueben' } }));
  s.storageEvent({ newValue: stateBody({ 'CH:ZH': { [goal.id]: 'erklaert' } }) }); assert.deepEqual(s.snapshot.entries, { 'AT:NOE': { [goal.id]: 'ueben' } });
  s.values.clear(); const previous = s.snapshot; s.storageEvent({ storageArea: {} }); assert.equal(s.snapshot, previous);
  s.storageEvent({ key: 'unrelated' }); assert.equal(s.snapshot, previous);
  s.failWrite = true; s.store.set('CH:ZH', goal.id, 'ueben'); assert.equal(s.snapshot.persistence, 'session');
  s.storageEvent({ key: null }); assert.deepEqual(s.snapshot.entries, {}); assert.equal(s.listeners.size, 1);
  s.stop(); assert.equal(s.listeners.size, 0);
});

test('A delayed StorageEvent cannot make a later explicit delta overwrite another tab’s completed mark or another target on reset', () => {
  const s = storageFixture(), tabB = s.createExamGoalProgressStore({ windowFor: () => ({ localStorage: s.storage }) });
  tabB.configure(s.catalog); const stopB = tabB.subscribe(() => {});
  s.store.set('CH:ZH', goal.id, 'erklaert'); assert.deepEqual(tabB.getSnapshot().entries, {}, 'Native event deliberately not delivered');
  tabB.set('AT:NOE', goal.id, 'ueben');
  assert.deepEqual(JSON.parse(s.values.get(s.EXAM_GOAL_PROGRESS_KEY)).profiles, { 'CH:ZH': { [goal.id]: 'erklaert' }, 'AT:NOE': { [goal.id]: 'ueben' } });
  s.store.set('CH:BE', goal.id, 'ueben'); tabB.reset('AT:NOE');
  assert.deepEqual(JSON.parse(s.values.get(s.EXAM_GOAL_PROGRESS_KEY)).profiles, { 'CH:ZH': { [goal.id]: 'erklaert' }, 'CH:BE': { [goal.id]: 'ueben' } });
  s.failRead = true; const writes = s.writes.length; s.store.set('CH:ZH', goal.id, 'ueben');
  assert.equal(s.snapshot.persistence, 'session'); assert.equal(s.snapshot.entries['CH:ZH'][goal.id], 'ueben'); assert.equal(s.writes.length, writes, 'No write may follow an unreadable current device value');
  stopB(); s.stop();
});

const nativeProps = node => node?.[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
async function hookFixture(t, options = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://exam.invalid/lernen/pruefungsplan' });
  const router = { isReady: true, asPath: '/lernen/pruefungsplan', query: {}, push() { throw new Error('Marking cannot navigate'); } };
  const writes = [], reads = [], original = new Map(), values = new Map(); let quota = options.quota || false, denied = options.denied || false, account = options.account || { ready: true, saving: false, accountKey: 'synthetic-A', profile: CH };
  const storage = { getItem(key) { reads.push(key); if (denied) throw new Error('Synthetic denial'); return values.get(key) ?? null; }, setItem(key, value) { writes.push(['set', key, value]); if (quota || denied) throw new Error('Synthetic quota'); values.set(key, value); }, removeItem(key) { writes.push(['remove', key]); if (quota || denied) throw new Error('Synthetic denial'); values.delete(key); } };
  const win = new Proxy(dom.window, { get(target, key) { if (key === 'localStorage') return storage; const value = Reflect.get(target, key, target); return ['addEventListener', 'removeEventListener'].includes(key) ? value.bind(target) : value; } });
  dom.window.scrollTo = () => { throw new Error('Goal marks must not scroll'); };
  for (const [key, value] of Object.entries({ window: win, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) { original.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, writable: true, configurable: true }); }
  const wrap = value => ({ __esModule: true, default: value });
  const Link = ({ href, children, prefetch, ...rest }) => React.createElement('a', { href, ...rest }, children);
  const product = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': wrap(Link), './account-exam-profile-client': { getAccountExamSnapshot: () => account } });
  const api = product('lib/exam-goal-progress.js'), hook = product('lib/use-exam-goal-progress.js').default, Goals = product('components/ExamLearningGoals.js').default;
  let catalog = api.buildExamGoalCatalog(smallBlueprint, smallAlignment), props = { catalog, profile: CH, ready: true, persistence: 'device', accountKey: null, ...options.props }, controller, disposed = false;
  if (options.raw) values.set(api.EXAM_GOAL_PROGRESS_KEY, options.raw);
  function Harness() { controller = hook(props); return React.createElement('div', {}, React.createElement('p', { id: 'progress' }, `${controller.ready}:${controller.counts.offen}:${controller.counts.ueben}:${controller.counts.erklaert}`), React.createElement('p', { role: 'status' }, controller.error), React.createElement(Goals, { category: options.category || smallBlueprint.categories[0], profile: props.profile, goalProgress: controller })); }
  const container = dom.window.document.getElementById('root'), tree = () => React.createElement(Harness);
  let root; const errors = [], serverHtml = options.hydrate ? renderToString(tree()) : '';
  const serverReads = reads.slice(), serverWrites = writes.slice();
  if (options.hydrate) { container.innerHTML = serverHtml; await React.act(async () => { root = local('react-dom/client').hydrateRoot(container, tree(), { onRecoverableError: error => errors.push(error) }); }); }
  else { root = local('react-dom/client').createRoot(container); await React.act(async () => root.render(tree())); }
  async function unmount() { if (!disposed) { await React.act(async () => root.unmount()); disposed = true; } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  return { product, api, router, values, writes, reads, dom, storage, container, serverHtml, serverReads, serverWrites, errors, unmount,
    get controller() { return controller; }, get account() { return account; }, accountSnapshot(value) { account = value; },
    set quota(value) { quota = value; }, set denied(value) { denied = value; },
    async render(next = {}) { props = { ...props, ...next }; await React.act(async () => root.render(tree())); },
    async mark(state) { const node = container.querySelector('select'); assert.ok(node); await React.act(async () => nativeProps(node).onChange({ target: { value: state } })); },
    async event(name, properties = {}) { const event = new dom.window.Event(name); for (const [key, value] of Object.entries(properties)) Object.defineProperty(event, key, { value }); await React.act(async () => dom.window.dispatchEvent(event)); },
  };
}

test('Actual SSR and hydration are neutral, then restore local exact-target marks without a silent write or mismatch', async t => {
  const s = await hookFixture(t, { hydrate: true, raw: stateBody({ 'CH:ZH': { [goal.id]: 'erklaert' } }) });
  assert.deepEqual(s.serverReads, []); assert.deepEqual(s.serverWrites, []); assert.match(s.serverHtml, /disabled=""/); assert.match(s.serverHtml, /Wird geladen/); assert.deepEqual(s.errors, []);
  assert.equal(s.container.querySelector('select').value, 'erklaert'); assert.equal(s.controller.counts.total, 2); assert.equal(s.controller.counts.erklaert, 1); assert.equal(s.writes.length, 0);
  await s.mark('ueben'); assert.equal(s.controller.state(goal), 'ueben'); assert.equal(s.writes.length, 1); assert.match(s.container.textContent, /Merkmale benannt · Unsicherheit benannt/);
});

test('Unready profiles, unready routers and disabled legacy projections never read storage or invent open counts', async t => {
  const s = await hookFixture(t, { props: { ready: false } }); assert.equal(s.controller.ready, false); assert.deepEqual(s.reads, []); assert.equal(s.controller.state(goal), '');
  await s.render({ ready: true, enabled: false }); assert.deepEqual(s.reads, []); assert.equal(s.container.querySelector('select').disabled, true);
  s.router.isReady = false; await s.render({ enabled: true }); assert.deepEqual(s.reads, []);
  s.router.isReady = true; await s.render(); assert.equal(s.controller.ready, true); assert.equal(s.reads.length, 1);
});

test('Profile changes preserve independent lists, restore on return and block both old select and reset closures', async t => {
  const s = await hookFixture(t); await s.mark('erklaert'); const old = s.controller;
  await s.render({ profile: AT }); assert.equal(s.controller.state(goal), 'offen'); assert.equal(old.set(goal, 'ueben'), false); assert.equal(old.reset(), false);
  await s.mark('ueben'); assert.equal(s.controller.counts.total, 1); await s.render({ profile: CH }); assert.equal(s.controller.state(goal), 'erklaert');
  await React.act(async () => s.controller.reset()); assert.equal(s.controller.state(goal), 'offen'); await s.render({ profile: AT }); assert.equal(s.controller.state(goal), 'ueben');
  assert.doesNotMatch(JSON.stringify([...s.values.values()]), /synthetic-A|account|email|score/i);
});

test('Raw URL/query/hash changes invalidate old handlers before rerender; A-B-A render lifetimes cannot reuse old closures', async t => {
  const s = await hookFixture(t), old = s.controller; s.router.asPath += '#new-context';
  assert.equal(old.set(goal, 'erklaert'), false); assert.equal(old.reset(), false); assert.equal(s.writes.length, 0);
  await s.render(); await s.mark('ueben'); const current = s.controller;
  s.router.query = { kategorie: ['wildkunde', 'jagdrecht'] }; assert.equal(current.set(goal, 'erklaert'), false);
  s.router.query = {}; s.router.asPath = '/lernen/pruefungsplan'; await s.render(); assert.equal(old.set(goal, 'erklaert'), false); assert.equal(s.controller.state(goal), 'ueben');
});

test('Account snapshot lifetimes block stale A-to-A actions and real A-to-B replacement clears marks without persisting identity', async t => {
  const s = await hookFixture(t, { props: { persistence: 'account', accountKey: 'synthetic-A' } }); await s.mark('erklaert'); const old = s.controller;
  s.accountSnapshot({ ...s.account, ready: false, accountKey: null }); assert.equal(old.set(goal, 'ueben'), false); assert.equal(old.reset(), false);
  s.accountSnapshot({ ready: true, saving: false, profile: CH, accountKey: 'synthetic-A' }); assert.equal(old.set(goal, 'ueben'), false, 'Same key after reload is still a new account snapshot');
  await s.render(); assert.equal(s.controller.state(goal), 'erklaert');
  s.accountSnapshot({ ready: true, saving: false, profile: CH, accountKey: 'synthetic-B' }); await s.render({ accountKey: 'synthetic-B' }); assert.equal(s.controller.state(goal), 'offen');
  assert.deepEqual(s.api.examGoalProgressStore.getSnapshot().entries, {}); assert.doesNotMatch(JSON.stringify(s.writes), /synthetic-A|synthetic-B/);
});

test('A replaced goal object invalidates captured writes even at the same ID; superseded revision and true unmount block reset and marking', async t => {
  const s = await hookFixture(t), old = s.controller;
  await s.mark('ueben'); assert.equal(old.set(goal, 'erklaert'), false); assert.equal(old.reset(), false);
  const prior = s.controller, replacement = { ...goal }, catalog = s.api.buildExamGoalCatalog({ categories: [{ goals: [replacement] }] }, smallAlignment);
  await s.render({ catalog }); assert.equal(prior.set(goal, 'erklaert'), false); assert.equal(s.controller.set(goal, 'erklaert'), false); assert.equal(s.controller.state(goal), '');
  const live = s.controller; await s.unmount(); const before = s.writes.length;
  assert.equal(live.set(replacement, 'erklaert'), false); assert.equal(live.reset(), false); assert.equal(s.writes.length, before);
});

test('Confirmed logout cleanup, account deletion and native clear invalidate callbacks; an early failed-logout event preserves marks', async t => {
  const s = await hookFixture(t); await s.mark('erklaert'); const beforeLogout = s.controller;
  const writes = s.writes.length; await s.event('jagdlatein-logout'); assert.equal(s.controller.state(goal), 'erklaert'); assert.equal(s.writes.length, writes, 'Early event is not successful transport');
  await React.act(async () => s.api.clearExamGoalProgress()); assert.equal(s.controller.state(goal), 'offen'); assert.equal(beforeLogout.set(goal, 'erklaert'), false);
  await s.mark('ueben'); await s.event('jagdlatein-account-deleted'); assert.equal(s.controller.state(goal), 'offen');
  s.values.set(s.api.EXAM_GOAL_PROGRESS_KEY, stateBody({ 'CH:ZH': { [goal.id]: 'erklaert' } }));
  await s.event('storage', { key: s.api.EXAM_GOAL_PROGRESS_KEY, storageArea: s.storage, newValue: null }); assert.equal(s.controller.state(goal), 'erklaert');
  const beforeClear = s.controller; s.values.clear(); await s.event('storage', { key: null, storageArea: s.storage }); assert.equal(s.controller.state(goal), 'offen'); assert.equal(beforeClear.reset(), false);
  await s.unmount(); const revision = s.api.examGoalProgressStore.getSnapshot().revision; await s.event('jagdlatein-account-deleted'); assert.equal(s.api.examGoalProgressStore.getSnapshot().revision, revision, 'Actual listener cleanup');
});

test('Quota and denied storage are visible session limitations while self-check texts and internal learning links remain usable', async t => {
  const s = await hookFixture(t, { quota: true }); await s.mark('ueben'); assert.equal(s.controller.persistence, 'session'); assert.match(s.container.textContent, /nur in dieser Sitzung/);
  assert.equal(s.controller.state(goal), 'ueben'); assert.equal(s.container.querySelector('a').getAttribute('href'), goal.href);
  s.denied = true; await React.act(async () => s.api.clearExamGoalProgress()); assert.deepEqual(s.api.examGoalProgressStore.getSnapshot().entries, {}); assert.match(s.container.textContent, /blockierte Gerätespeicher/);
});

test('All authored common and regional goals, exact sources and check text are unchanged from HEAD; only local controls are added', () => {
  const load = createLoader(), files = ['data/exam-alignment/learning-goals-2026-11-01.json', 'data/exam-alignment/ch-2026-11-01.json', 'data/exam-alignment/at-2026-11-01.json', 'data/exam-alignment/de-2026-11-01.json'];
  for (const file of files) assert.equal(fs.readFileSync(path.join(repo, file), 'utf8').replace(/\r\n/g, '\n'), execFileSync('git', ['show', `HEAD:${file}`], { cwd: repo, encoding: 'utf8', maxBuffer: 8000000 }).replace(/\r\n/g, '\n'));
  const blueprint = load('lib/exam-blueprint-server.js').getExamBlueprintData(), alignment = load('lib/exam-alignment-server.js').getExamAlignmentData();
  const api = load('lib/exam-goal-progress.js'), catalog = api.buildExamGoalCatalog(blueprint, alignment);
  assert.equal(blueprint.categories.flatMap(category => category.goals).length, 36);
  assert.equal(alignment.regions.flatMap(region => (region.subjectAreas || []).flatMap(area => area.goals)).length, 54);
  for (const region of alignment.regions) {
    const all = [...blueprint.categories.flatMap(category => category.goals), ...(region.subjectAreas || []).flatMap(area => area.goals)];
    for (const item of all) assert.equal(catalog.profiles.get(`${region.country}:${region.region}`).get(item.id), item);
  }
  const ui = fs.readFileSync(path.join(repo, 'components/ExamLearningGoals.js'), 'utf8');
  assert.doesNotMatch(ui, /localStorage|sessionStorage|fetch\(|router\.(?:push|replace)|window\.open/);
});

test('The complete real plan shares one mark per common/regional goal, counts the entire target and restores separate lists after an account-confirmed region change', async t => {
  const { fixture } = require('./helpers/account-exam-dom.cjs'), load = createLoader();
  const blueprint = load('lib/exam-blueprint-server.js').getExamBlueprintData(), alignment = load('lib/exam-alignment-server.js').getExamAlignmentData();
  const router = { isReady: true, query: {}, asPath: '/lernen/pruefungsplan', push() { throw new Error('Only explicit topic actions may navigate'); } };
  const progress = { phase: 'ready', summary: { total: { answered: 0, due: 0, mistakes: 0 }, byCategory: {} } };
  const menu = ({ children }) => React.createElement('aside', {}, children), wrap = value => ({ __esModule: true, default: value });
  const s = await fixture(t, { component: 'components/ExamStudyPlan.js', loadAccount: true, profile: CH,
    props: { data: load('lib/exam-study-plan-server.js').getExamStudyPlanData(), examBlueprint: blueprint, examAlignment: alignment },
    overrides: { 'next/router': { useRouter: () => router }, './PageMenu': { ...wrap(menu), closePageMenu() {}, openPageMenu() {} }, '../lib/use-exam-review-progress': wrap(() => progress) },
  });
  const summary = () => s.container.querySelector('#exam-goal-progress').parentElement;
  const counts = () => [...summary().querySelectorAll('dd')].map(node => Number(node.textContent));
  const allControls = () => [...s.container.querySelectorAll('select[aria-label$=": Mein Stand"]')];
  assert.equal(allControls().length, 43); assert.deepEqual(counts(), [43, 0, 0]); assert.equal(s.writes.length, 0);
  const commonControl = allControls()[0], regionalControl = s.container.querySelector('[aria-labelledby="exam-plan-regional-exam"] select');
  await React.act(async () => nativeProps(commonControl).onChange({ target: { value: 'erklaert' } }));
  await React.act(async () => nativeProps(regionalControl).onChange({ target: { value: 'ueben' } }));
  assert.deepEqual(counts(), [41, 1, 1]);
  const raw = JSON.parse(s.dom.window.localStorage.getItem('jagdlatein-exam-goals-v1'));
  assert.equal(Object.keys(raw.profiles['CH:ZH']).length, 2); assert.equal(raw.profiles['CH:ZH'][blueprint.categories[0].goals[0].id], 'erklaert');
  assert.match(summary().textContent, /Selbstbewertungen, keine Prüfungsergebnisse/); assert.match(summary().textContent, /nur auf diesem Gerät/);
  assert.ok(s.container.querySelector('.categoryList').compareDocumentPosition(summary()) & s.dom.window.Node.DOCUMENT_POSITION_FOLLOWING, 'Concrete learning goals precede the personal totals');
  assert.ok(summary().compareDocumentPosition(s.container.querySelector('#exam-plan-progress')) & s.dom.window.Node.DOCUMENT_POSITION_FOLLOWING, 'Personal totals precede separate quiz review');
  assert.doesNotMatch(s.container.textContent, /Kategorien entsprechen dem Menü/);
  assert.equal(s.container.querySelector('#exam-plan-sources').open, false);
  assert.ok(s.container.textContent.indexOf('Meine Selbstkontrolle') < s.container.textContent.indexOf('Originalquellen und Prüfungsunterlagen'));
  const storedBeforeReading = s.writes.length;
  router.query = { kategorie: 'wildkunde' }; router.asPath = '/lernen/pruefungsplan?kategorie=wildkunde'; await s.render();
  assert.equal(allControls().length, 10, 'Three selected common goals plus seven regional goals'); assert.deepEqual(counts(), [41, 1, 1]); assert.equal(s.writes.length, storedBeforeReading);
  await s.select('exam-plan-country', 'AT'); await s.select('exam-plan-region', 'NOE'); const { task } = await s.submit(); await s.respond(1, AT); await task;
  assert.deepEqual(counts(), [40, 0, 0]); assert.equal(allControls()[0].value, 'offen');
  await s.select('exam-plan-country', 'CH'); await s.select('exam-plan-region', 'ZH'); const second = await s.submit(); await s.respond(2, CH); await second.task;
  assert.deepEqual(counts(), [41, 1, 1]); assert.equal(allControls()[0].value, 'erklaert');
  const clear = s.product('lib/exam-goal-progress.js').clearExamGoalProgress; await React.act(async () => clear());
  assert.deepEqual(counts(), [43, 0, 0]); assert.equal(s.dom.window.localStorage.getItem('jagdlatein-exam-goals-v1'), null);
});
