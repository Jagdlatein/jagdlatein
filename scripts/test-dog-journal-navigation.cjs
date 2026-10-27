// Isolated URL-reading regression tests. Storage contains synthetic fixture data
// only; no user records, account, browser or remote service is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader, local } = require('./helpers/project-module.cjs');
// Initialize Next's style registry in SSR mode before exposing our minimal
// synthetic window; the fixture intentionally provides no browser DOM.
local('styled-jsx/style');
const journal = createLoader()('lib/dog-training-journal.js');
const exercises = journal.dogTrainingExercises;
const file = 'components/DogTrainingJournal.js', base = '/lernen/hundetraining-tagebuch';
const heading = h => h.nodes(node => node.props?.id === 'exercise-title')[0];
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const alerts = h => h.nodes(node => node.props?.role === 'alert');
function field(h, label) {
  const choice = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.label === label)[0];
  if (choice) return choice;
  const holder = h.nodes(node => node.type === 'label' && text(node).startsWith(label))[0];
  assert.ok(holder, `Missing field ${label}`);
  const result = nodes(holder, node => ['input', 'select', 'textarea'].includes(node.type))[0];
  assert.ok(result, `Missing control ${label}`); return result;
}
function button(h, label) {
  const result = h.nodes(node => node.type === 'button' && text(node) === label)[0];
  assert.ok(result, `Missing button ${label}`); return result;
}
function enter(h, label, value) { field(h, label).props.onChange({ target: { value } }); h.render(); }
function fire(h, label) {
  const control = button(h, label); assert.ok(!control.props.disabled, `Disabled button ${label}`);
  const result = control.props.onClick(); h.render(); return result;
}
const choose = (h, id) => field(h, 'Übung entdecken').props.onChange({ target: { value: id } });
function address(query, hash = 'exercise-title') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function savedJournal() {
  const draft = { ...journal.createDogJournalDraft(new Date('2026-10-04T12:00:00Z')), dog: 'Synthetisches Team', exerciseId: 'ruheplatz', observation: 'Unveränderter Entwurf für den Navigationstest.', nextStep: 'Kurze Pause.' };
  const record = journal.makeDogJournalRecord({ ...draft, dog: 'Synthetischer früherer Eintrag', exerciseId: 'handtarget' }, 'training_navigation1', '2026-10-04T12:00:00Z');
  return { version: 1, records: [record], draft };
}
function environment(t, saved = savedJournal()) {
  const previousWindow = global.window, harnesses = [], writes = [], reads = [];
  const values = new Map(saved ? [[journal.DOG_JOURNAL_KEY, JSON.stringify(saved)]] : []);
  global.window = { location: { search: '?eintrag=tausch', hash: '#unrelated-browser-state' }, localStorage: {
    getItem(key) { assert.equal(key, journal.DOG_JOURNAL_KEY); reads.push(key); return values.get(key) ?? null; },
    setItem(key, value) { assert.equal(key, journal.DOG_JOURNAL_KEY); values.set(key, value); writes.push({ key, value }); },
  } };
  t.after(() => { for (const h of harnesses.reverse()) h.dispose(); global.window = previousWindow; });
  return { harnesses, writes, reads, snapshot: () => JSON.parse(values.get(journal.DOG_JOURNAL_KEY)) };
}
function fixture(env, query = { eintrag: exercises[0].id }, options = {}) {
  const h = setup(file, query, { ...options, router: { asPath: address(query), ...options.router } });
  env.harnesses.push(h); return h;
}
function history(h, query, hash = 'exercise-title') { h.router.asPath = address(query, hash); h.navigate(query); }
function pendingRouter(h) {
  const requests = [];
  h.router.push = (href, as, options) => {
    const request = { href, as, options }; requests.push(request); h.calls.push({ href, options });
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  };
  return requests;
}
async function commit(h, request, action) {
  history(h, request.href.query, request.href.hash); request.resolve(true); await action; h.render();
}
function focusProbe(h) {
  const calls = { focus: 0, scroll: 0 };
  heading(h).props.ref.current = {
    focus(options) { assert.deepEqual(options, { preventScroll: true }); calls.focus++; },
    scrollIntoView(options) { assert.deepEqual(options, { block: 'start', behavior: 'auto' }); calls.scroll++; },
  };
  return calls;
}

test('Every original exercise URL preserves its complete teaching text and course under the single lower exercise picker', t => {
  const env = environment(t), h = fixture(env);
  assert.equal(exercises.length, 10);
  for (const exercise of exercises) {
    history(h, { eintrag: exercise.id });
    assert.equal(text(heading(h)), exercise.title);
    assert.equal(field(h, 'Übung entdecken').props.value, exercise.id);
    const panel = h.nodes(node => node.props?.['aria-labelledby'] === 'exercise-title')[0];
    for (const exact of [exercise.goal, exercise.preparation, ...exercise.steps, exercise.easier, exercise.observe]) assert.ok(text(panel).includes(exact), exercise.id);
    assert.equal(nodes(panel, node => node.type === 'select').length, 0);
    assert.ok(nodes(menu(h), node => node.props?.id === 'journal-exercise-select').length);
    assert.deepEqual(nodes(panel, node => node.props?.href).map(node => node.props.href), [`/kurse/${exercise.course}`]);
    assert.match(text(panel), /Pausen, Wohlbefinden und freiwilliges Mitmachen gehen vor/);
    assert.match(text(panel), /Bei Schmerz, anhaltender Angst oder Aggression passende fachliche Hilfe/);
  }
  const sources = h.nodes(node => node.type === 'details' && text(node).includes('Fachgrundlagen'))[0];
  assert.ok(sources && !sources.props.open); assert.match(text(sources), /04\.10\.2026/);
  assert.deepEqual(nodes(sources, node => node.type === 'a').map(node => ({ href: node.props.href, label: text(node) })), journal.dogTrainingSources.map(source => ({ href: source.url, label: source.title })));
  assert.match(text(h.tree), /ohne Übertragung an Jagdlatein und ohne Abgleich mit anderen Geräten/);
  assert.match(text(h.tree), /empfiehlt keine Trainingsdauer/);
  assert.equal(h.calls.length, 0);
});

test('Bare entry has its documented first exercise while delayed route readiness remains independent of the restored local journal', async t => {
  const saved = savedJournal(), env = environment(t, saved);
  const bare = fixture(env, {}, { router: { asPath: base } });
  assert.equal(text(heading(bare)), exercises[0].title); assert.equal(bare.menu.closed, 0);
  const h = fixture(env, { eintrag: 'pflege' }, { ready: false });
  assert.equal(heading(h), undefined); assert.match(text(h.tree), /gewählte Übung wird geladen/);
  assert.equal(field(h, 'Übung entdecken').props.disabled, true); assert.equal(menu(h).props.openInitially, false);
  assert.equal(button(h, 'Eintrag speichern').props.disabled, false);
  assert.equal(field(h, 'Hund / Team').props.value, saved.draft.dog);
  assert.match(text(h.tree), /Synthetischer früherer Eintrag/);
  await choose(h, 'rueckruf'); h.render(); assert.equal(h.calls.length, 0);
  const snapshot = env.snapshot(), writes = env.writes.length;
  h.router.isReady = true; h.render();
  assert.equal(text(heading(h)), exercises.find(exercise => exercise.id === 'pflege').title);
  assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
});

test('Explicit invalid, empty, null and repeated exercise fields reveal no substitute lesson and remain repairable', async t => {
  const env = environment(t);
  for (const eintrag of ['', 'unknown', null, ['pflege'], ['pflege', 'tausch']]) {
    const h = fixture(env, { eintrag });
    assert.equal(heading(h), undefined, JSON.stringify(eintrag)); assert.match(text(h.tree), /Diese Übung ist nicht verfügbar/);
    assert.equal(menu(h).props.openInitially, true); assert.equal(field(h, 'Übung entdecken').props.value, '');
    assert.match(text(h.tree), /Synthetischer früherer Eintrag/);
    history(h, { eintrag: 'pflege' }); await new Promise(resolve => setTimeout(resolve, 1));
    assert.equal(text(heading(h)), exercises.find(exercise => exercise.id === 'pflege').title); assert.equal(h.menu.opened, 0);
  }
  const h = fixture(env, { eintrag: 'missing' }), requests = pendingRouter(h);
  const repair = choose(h, 'handtarget');
  assert.deepEqual(requests[0].href.query, { eintrag: 'handtarget' }); await commit(h, requests[0], repair);
  assert.equal(field(h, 'Übung entdecken').props.value, 'handtarget');
  const departed = fixture(env, { eintrag: 'missing' }); departed.dispose();
  await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(departed.menu.opened, 0);
});

test('A deferred push preserves the displayed exercise and all local data until the actual canonical URL commits', async t => {
  const env = environment(t), initial = { eintrag: 'orientierung', ref: 'suche', q: 'Pflege' };
  const h = fixture(env, initial, { router: { pathname: '/unrelated' } }), requests = pendingRouter(h), focus = focusProbe(h);
  const snapshot = env.snapshot(), writes = env.writes.length;
  const action = choose(h, 'pflege'); h.render();
  assert.deepEqual(requests[0].href, { pathname: base, query: { ...initial, eintrag: 'pflege' }, hash: 'exercise-title' });
  assert.equal(requests[0].as, undefined); assert.deepEqual(requests[0].options, { shallow: true, scroll: false });
  assert.equal(text(heading(h)), exercises[0].title); assert.equal(focus.focus, 0);
  assert.equal(field(h, 'Geübte Aufgabe').props.value, snapshot.draft.exerciseId);
  await commit(h, requests[0], action);
  assert.equal(field(h, 'Übung entdecken').props.value, 'pflege'); assert.deepEqual(focus, { focus: 1, scroll: 0 });
  assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
  history(h, initial); assert.equal(field(h, 'Übung entdecken').props.value, 'orientierung');
  history(h, requests[0].href.query); assert.equal(field(h, 'Übung entdecken').props.value, 'pflege');
  const reload = fixture(env, requests[0].href.query); assert.equal(field(reload, 'Übung entdecken').props.value, 'pflege');
});

test('Reading another exercise preserves an edited record, its draft, local filters and a verified import awaiting approval', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h);
  fire(h, 'Bearbeiten'); enter(h, 'Nächster kleiner Schritt', 'Unabhängiger noch nicht gespeicherter Bearbeitungsentwurf.');
  enter(h, 'Eigene Notizen durchsuchen', 'Synthetischer'); enter(h, 'Aufgabe filtern', 'handtarget');
  const imported = savedJournal(); imported.draft.dog = 'Nur vorbereitete fremde Sicherung';
  const backup = JSON.stringify(imported), fileInput = field(h, 'Sicherung auswählen');
  await fileInput.props.onChange({ target: { files: [{ size: backup.length, async text() { return backup; } }], value: 'synthetic.json' } }); h.render();
  assert.match(text(h.tree), /Geprüfte Sicherung/);
  const snapshot = env.snapshot(), writes = env.writes.length;
  const action = choose(h, 'umwelt'); await commit(h, requests[0], action);
  assert.match(text(h.tree), /Eintrag bearbeiten/); assert.match(text(h.tree), /Geprüfte Sicherung/);
  assert.equal(field(h, 'Nächster kleiner Schritt').props.value, 'Unabhängiger noch nicht gespeicherter Bearbeitungsentwurf.');
  assert.equal(field(h, 'Eigene Notizen durchsuchen').props.value, 'Synthetischer'); assert.equal(field(h, 'Aufgabe filtern').props.value, 'handtarget');
  assert.equal(field(h, 'Geübte Aufgabe').props.value, 'handtarget'); assert.equal(field(h, 'Hund / Team').props.value, 'Synthetischer früherer Eintrag');
  assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
  history(h, { eintrag: 'pflege' }); assert.match(text(h.tree), /Eintrag bearbeiten/); assert.match(text(h.tree), /Geprüfte Sicherung/);
  assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
});

test('Failed, cancelled and refused navigation retain the existing exercise and local journal without synthetic writes', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h), focus = focusProbe(h);
  const snapshot = env.snapshot(), writes = env.writes.length;
  const failed = choose(h, 'pflege'); requests[0].reject(new Error('offline')); await failed; h.render();
  assert.match(text(alerts(h)[0]), /Übung konnte nicht geöffnet/); assert.equal(h.menu.opened, 1);
  assert.equal(field(h, 'Übung entdecken').props.value, 'orientierung'); assert.equal(focus.focus, 0);
  const cancelled = choose(h, 'tausch'); requests[1].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  const refused = choose(h, 'umwelt'); requests[2].resolve(false); await refused; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 1); assert.equal(focus.focus, 0);
  assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
});

test('A committed-exercise reselection cancels the latest pending target even when an older request finishes first', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h), focus = focusProbe(h);
  const first = choose(h, 'pflege'), second = choose(h, 'umwelt');
  requests[0].reject(Object.assign(new Error('old cancelled'), { cancelled: true })); await first;
  const current = choose(h, 'orientierung'); assert.equal(requests.length, 3); assert.equal(requests[2].href.query.eintrag, 'orientierung');
  requests[1].reject(new Error('superseded')); await second; requests[2].resolve(true); await current; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(focus.focus, 1);
  await choose(h, 'orientierung'); h.render(); assert.equal(requests.length, 3); assert.equal(focus.focus, 2);
});

test('Raw query/asPath origins and History away-and-back retire old selection, preparation and late-failure callbacks', async t => {
  const env = environment(t), initial = { eintrag: 'orientierung' };
  const visits = [
    h => history(h, { ...initial, ref: 'independent' }),
    h => { h.router.query = { ...initial, ref: 'query-only' }; h.render(); },
    h => { h.router.asPath = address(initial, 'another-anchor'); h.render(); },
    h => { history(h, { eintrag: 'pflege' }); history(h, initial); },
    h => { h.router.isReady = false; h.render(); h.router.isReady = true; h.render(); },
  ];
  for (const visit of visits) {
    const h = fixture(env, initial), requests = pendingRouter(h), focus = focusProbe(h);
    const oldSelect = field(h, 'Übung entdecken').props.onChange;
    const oldPrepare = button(h, 'Für diese Übung einen Eintrag vorbereiten').props.onClick;
    const action = choose(h, 'pflege'); visit(h);
    const snapshot = env.snapshot(), writes = env.writes.length, focused = { ...focus };
    requests[0].reject(new Error('late origin failure')); await action;
    await oldSelect({ target: { value: 'orientierung' } }); await oldSelect({ target: { value: 'umwelt' } }); oldPrepare(); h.render();
    assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.deepEqual(focus, focused);
    assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
  }
});

test('Only explicit current-origin preparation changes the independent draft exercise and cannot reuse a stale revision', async t => {
  const env = environment(t), h = fixture(env, { eintrag: 'pflege' });
  const stale = button(h, 'Für diese Übung einen Eintrag vorbereiten').props.onClick;
  enter(h, 'Hund / Team', 'Neuer unabhängiger Entwurf.');
  const before = env.snapshot(); stale(); h.render(); assert.deepEqual(env.snapshot(), before);
  fire(h, 'Für diese Übung einen Eintrag vorbereiten');
  assert.deepEqual(env.snapshot(), { ...before, draft: { ...before.draft, exerciseId: 'pflege' } });
  assert.equal(h.calls.length, 0); assert.equal(field(h, 'Übung entdecken').props.value, 'pflege');
});

test('Unmount retires deferred requests and current/foreign exercise callbacks without navigation, storage or focus work', async t => {
  const env = environment(t), h = fixture(env), requests = pendingRouter(h), focus = focusProbe(h);
  const oldSelect = field(h, 'Übung entdecken').props.onChange;
  const oldPrepare = button(h, 'Für diese Übung einen Eintrag vorbereiten').props.onClick;
  const action = choose(h, 'pflege'), snapshot = env.snapshot(), writes = env.writes.length;
  h.dispose(); requests[0].reject(new Error('late unmount')); await action;
  await oldSelect({ target: { value: 'orientierung' } }); await oldSelect({ target: { value: 'umwelt' } }); oldPrepare(); h.render();
  assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.deepEqual(focus, { focus: 0, scroll: 0 });
  assert.deepEqual(env.snapshot(), snapshot); assert.equal(env.writes.length, writes);
});
