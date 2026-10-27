// Synthetic journal data, in-memory storage, deferred files and inert DOM doubles.
// No real localStorage, user backup files, downloads, accounts or network are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const data = createLoader()('lib/dog-training-journal.js');

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function backup(name = 'Synthetic team', id = 'training_fixture_01') {
  const draft = { ...data.createDogJournalDraft(new Date('2026-10-24T12:00:00Z')), dog: name, observation: 'Synthetic voluntary observation.', nextStep: 'Synthetic easier step.' };
  return { version: 1, draft, records: [data.makeDogJournalRecord(draft, id, '2026-10-24T12:00:00Z')] };
}
function deferredFile() {
  let resolve, reject, reads = 0;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { file: { size: 512, text() { reads++; return promise; } }, resolve, reject, get reads() { return reads; } };
}

function fixture(t, { saved = null, readDenied = false } = {}) {
  const globals = Object.fromEntries(['window', 'document', 'URL', 'setTimeout', 'clearTimeout'].map(key => [key, global[key]]));
  const slots = [], effects = [], cleanups = new Map(), writes = [], urls = [], clicks = [], timers = new Map();
  const listeners = new Map();
  let cursor = 0, tree, dirty = false, disposed = false, stateWrites = 0, writesAfterDispose = 0, setDenied = false, reads = 0, timerId = 0;
  const pathname = '/lernen/hundetraining-tagebuch';
  const router = {
    isReady: true, pathname, query: {}, asPath: pathname,
    async push(href) {
      const url = typeof href === 'string' ? new globals.URL(href, 'https://jagdlatein.test') : null;
      this.query = url ? Object.fromEntries(url.searchParams) : { ...href.query };
      this.asPath = url ? url.pathname + url.search + url.hash : pathname + '?' + new URLSearchParams(this.query) + (href.hash ? '#' + href.hash : '');
      return true;
    },
  };
  const storage = new Map(saved == null ? [] : [[data.DOG_JOURNAL_KEY, typeof saved === 'string' ? saved : JSON.stringify(saved)]]);
  global.setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  global.clearTimeout = id => timers.delete(id);
  global.window = {
    location: { pathname, search: '', hash: '', href: 'https://jagdlatein.test' + pathname },
    localStorage: {
      getItem(key) { reads++; if (readDenied) throw new Error('Synthetic storage denial'); return storage.get(key) ?? null; },
      setItem(key, value) { if (setDenied) throw new Error('Synthetic quota'); storage.set(key, value); writes.push({ key, value }); },
    },
    setTimeout: global.setTimeout, clearTimeout: global.clearTimeout,
    requestAnimationFrame(callback) { callback(); return 1; }, cancelAnimationFrame() {},
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  };
  global.URL = class extends globals.URL {
    static createObjectURL(blob) { const url = `blob:synthetic-${urls.length}`; urls.push({ url, blob, revoked: false }); return url; }
    static revokeObjectURL(url) { const item = urls.find(item => item.url === url); if (item) item.revoked = true; }
  };
  global.document = {
    createElement(tag) {
      assert.equal(tag, 'a');
      return { click() { clicks.push({ href: this.href, download: this.download }); }, remove() {} };
    },
    body: { appendChild() {} },
  };
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, input => {
        stateWrites++;
        if (disposed) { writesAfterDispose++; return; }
        const value = typeof input === 'function' ? input(slots[index].value) : input;
        dirty ||= !Object.is(slots[index].value, value);
        slots[index].value = value;
      }];
    },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
    useEffect(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || !previous.dependencies || dependencies.length !== previous.dependencies.length || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        slots[index] = { dependencies }; effects.push({ index, callback });
      }
    },
    useMemo(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) slots[index] = { dependencies, value: callback() };
      return slots[index].value;
    },
    useCallback(callback, dependencies) { return hooks.useMemo(() => callback, dependencies); },
  };
  hooks.useLayoutEffect = hooks.useEffect;
  const Component = createLoader({
    react: hooks,
    'next/router': { useRouter: () => router },
    'next/link': props => React.createElement('a', props, props.children),
    './LearningToolLayout': props => React.createElement('main', {}, props.children),
    './PageMenu': { __esModule: true, default: props => React.createElement('aside', {}, props.children), closePageMenu() {}, openPageMenu() {} },
  })('components/DogTrainingJournal.js').default;
  function render() {
    assert.equal(disposed, false, 'Never render an unmounted journal');
    let passes = 0;
    do {
      assert.ok(passes++ < 12, 'Journal state/effects must settle');
      cursor = 0; dirty = false; tree = Component();
      for (const node of nodes(tree, node => node.props?.ref && typeof node.props.ref === 'object')) node.props.ref.current = { focus() {}, scrollIntoView() {} };
      while (effects.length) {
        const { index, callback } = effects.shift(); cleanups.get(index)?.();
        const cleanup = callback();
        if (typeof cleanup === 'function') cleanups.set(index, cleanup); else cleanups.delete(index);
      }
    } while (dirty);
    return tree;
  }
  function dispose() {
    if (disposed) return;
    for (const cleanup of cleanups.values()) cleanup();
    disposed = true;
  }
  const find = predicate => nodes(tree, predicate)[0];
  function button(label) {
    const node = find(node => node.type === 'button' && text(node).trim() === label);
    assert.ok(node, `Missing button: ${label}`); return node;
  }
  function input(label) {
    const choice = find(node => node.type?.name === 'MenuChoice' && node.props.label === label);
    if (choice) return choice;
    const holder = find(node => node.type === 'label' && text(node).startsWith(label));
    const node = holder && nodes(holder, node => ['input', 'textarea', 'select'].includes(node.type))[0];
    assert.ok(node, `Missing input: ${label}`); return node;
  }
  const fileInput = () => find(node => node.type === 'input' && node.props.type === 'file');
  const form = () => find(node => node.type === 'form');
  const fileEvent = file => ({ target: { value: 'synthetic.json', files: file ? [file] : [] } });
  t.after(() => { dispose(); for (const [key, previous] of Object.entries(globals)) if (previous === undefined) delete global[key]; else global[key] = previous; });
  render();
  return {
    render, dispose, find, button, input, fileInput, form, fileEvent, writes, urls, clicks, timers,
    body: () => text(tree),
    field(label, value) { input(label).props.onChange({ target: { value } }); render(); },
    click(label) { const node = button(label); assert.ok(!node.props.disabled); node.props.onClick(); render(); },
    save() { form().props.onSubmit({ preventDefault() {} }); render(); },
    async read(file) { await fileInput().props.onChange(fileEvent(file)); render(); },
    stored() { return JSON.parse(storage.get(data.DOG_JOURNAL_KEY)); },
    setQuotaDenied(value) { setDenied = value; },
    get stateWrites() { return stateWrites; }, get writesAfterDispose() { return writesAfterDispose; }, get storageReads() { return reads; },
  };
}

function completeDraft(f, name = 'Synthetic dog') {
  f.field('Hund / Team', name); f.field('Was war sichtbar?', 'Synthetic voluntary response.');
}

test('Current saves and edits retain the record identity; old and double submit cannot save a newer revision', t => {
  const f = fixture(t); completeDraft(f);
  const oldSave = f.form().props.onSubmit;
  f.field('Nächster kleiner Schritt', 'Latest synthetic step.');
  oldSave({ preventDefault() {} }); f.render();
  assert.equal(f.stored().records.length, 0);
  const currentSave = f.form().props.onSubmit;
  currentSave({ preventDefault() {} }); currentSave({ preventDefault() {} }); f.render();
  assert.equal(f.stored().records.length, 1);
  const original = f.stored().records[0];
  assert.equal(original.nextStep, 'Latest synthetic step.');
  assert.equal(f.input('Hund / Team').props.value, '');
  f.click('Bearbeiten'); f.field('Nächster kleiner Schritt', 'Updated synthetic step.'); f.save();
  const edited = f.stored().records[0];
  assert.equal(f.stored().records.length, 1); assert.equal(edited.id, original.id); assert.equal(edited.createdAt, original.createdAt);
  assert.equal(edited.nextStep, 'Updated synthetic step.');
});

test('Retained change handlers in the same form session merge rapid changes without dropping another field', t => {
  const f = fixture(t);
  const dog = f.input('Hund / Team').props.onChange, observation = f.input('Was war sichtbar?').props.onChange;
  dog({ target: { value: 'Rapid synthetic team' } });
  observation({ target: { value: 'Rapid independent observation.' } });
  f.render(); f.save();
  assert.equal(f.stored().records[0].dog, 'Rapid synthetic team');
  assert.equal(f.stored().records[0].observation, 'Rapid independent observation.');
});

for (const action of ['Reset', 'Edit', 'Import']) {
  test(`A ${action} rotates the form session so retained Change, Reset, Save and Edit cannot overwrite its newer draft`, async t => {
    const f = fixture(t, { saved: backup() });
    const change = f.input('Hund / Team').props.onChange, reset = f.button('Entwurf verwerfen').props.onClick;
    const save = f.form().props.onSubmit, edit = f.button('Bearbeiten').props.onClick;
    if (action === 'Reset') f.click('Entwurf verwerfen');
    if (action === 'Edit') f.click('Bearbeiten');
    if (action === 'Import') {
      await f.read({ size: 512, async text() { return JSON.stringify(backup('Imported form session')); } });
      f.click('Diesen Stand übernehmen');
    }
    f.field('Hund / Team', 'Keep this newer form session');
    const before = f.stateWrites, stored = f.stored();
    change({ target: { value: 'Stale overwrite' } }); reset(); save({ preventDefault() {} }); edit(); f.render();
    assert.equal(f.stateWrites, before); assert.deepEqual(f.stored(), stored);
    assert.equal(f.input('Hund / Team').props.value, 'Keep this newer form session');
  });
}

test('Unavailable storage keeps the current draft and records usable in memory without claiming durable saving', t => {
  const f = fixture(t, { readDenied: true });
  assert.match(f.body(), /Speicher.*nicht verfügbar|unlesbare Sicherung/);
  completeDraft(f); f.save();
  assert.match(f.body(), /1 von 1 Einträgen/); assert.match(f.body(), /Dauerhafte Speicherung.*nicht aktiv/);
  assert.equal(f.writes.length, 0);
});

test('A storage quota error preserves the draft and later records in the open page with an explicit persistence warning', t => {
  const f = fixture(t); f.setQuotaDenied(true); completeDraft(f);
  assert.match(f.body(), /Speichern auf diesem Gerät ist nicht möglich/);
  assert.equal(f.input('Hund / Team').props.value, 'Synthetic dog');
  f.save();
  assert.match(f.body(), /1 von 1 Einträgen/);
  assert.match(f.body(), /Dauerhafte Speicherung.*nicht aktiv/);
});

test('A newer import wins and a cancelled preview invalidates old Apply before the next render', async t => {
  const f = fixture(t), first = deferredFile();
  const waiting = f.fileInput().props.onChange(f.fileEvent(first.file)); f.render();
  const newer = backup('Newer synthetic import');
  await f.read({ size: 512, async text() { return JSON.stringify(newer); } });
  const apply = f.button('Diesen Stand übernehmen').props.onClick;
  first.resolve('{broken'); await waiting; f.render();
  assert.match(f.body(), /Geprüfte Sicherung/); assert.doesNotMatch(f.body(), /keine gültige JSON/);
  f.button('Abbrechen').props.onClick(); apply(); f.render();
  assert.equal(f.stored().records.length, 0); assert.doesNotMatch(f.body(), /Sicherung übernommen/);
  await f.read({ size: 512, async text() { return JSON.stringify(newer); } });
  const currentApply = f.button('Diesen Stand übernehmen').props.onClick;
  currentApply(); currentApply(); f.render();
  assert.equal(f.stored().records.length, 1); assert.equal(f.stored().records[0].dog, newer.draft.dog);
});

test('Starting a replacement file invalidates a retained old Apply immediately, before the next render', async t => {
  const f = fixture(t);
  await f.read({ size: 512, async text() { return JSON.stringify(backup('First preview')); } });
  const oldApply = f.button('Diesen Stand übernehmen').props.onClick, replacement = deferredFile();
  const waiting = f.fileInput().props.onChange(f.fileEvent(replacement.file));
  oldApply(); f.render();
  assert.equal(f.stored().records.length, 0); assert.doesNotMatch(f.body(), /Sicherung übernommen/);
  replacement.resolve(JSON.stringify(backup('Replacement preview'))); await waiting; f.render();
  f.click('Diesen Stand übernehmen');
  assert.equal(f.stored().records[0].dog, 'Replacement preview');
});

test('An old preview Cancel cannot dismiss a later preview, while a revised draft invalidates old Apply, Reset and Export', async t => {
  const f = fixture(t);
  await f.read({ size: 512, async text() { return JSON.stringify(backup('First preview')); } });
  const oldCancel = f.button('Abbrechen').props.onClick;
  await f.read({ size: 512, async text() { return JSON.stringify(backup('Later preview')); } });
  const oldApply = f.button('Diesen Stand übernehmen').props.onClick;
  const oldReset = f.button('Entwurf verwerfen').props.onClick, oldExport = f.button('Sicherung herunterladen').props.onClick;
  f.field('Hund / Team', 'Preserve the revised draft');
  const before = f.stateWrites;
  oldCancel(); oldApply(); oldReset(); oldExport(); f.render();
  assert.equal(f.stateWrites, before); assert.equal(f.urls.length, 0); assert.equal(f.clicks.length, 0);
  assert.equal(f.input('Hund / Team').props.value, 'Preserve the revised draft');
  assert.match(f.body(), /Geprüfte Sicherung/);
  f.click('Diesen Stand übernehmen');
  assert.equal(f.stored().records[0].dog, 'Later preview');
});

test('Cancelling the native file choice invalidates the older in-flight read without replacing the current draft', async t => {
  const f = fixture(t), first = deferredFile(); completeDraft(f, 'Keep the current draft');
  const waiting = f.fileInput().props.onChange(f.fileEvent(first.file)); f.render();
  await f.read(null);
  first.resolve(JSON.stringify(backup('Old discarded file'))); await waiting; f.render();
  assert.equal(f.stored().records.length, 0);
  assert.equal(f.input('Hund / Team').props.value, 'Keep the current draft');
  assert.doesNotMatch(f.body(), /Geprüfte Sicherung/);
});

test('A deferred file success after a real unmount performs no React writes', async t => {
  const f = fixture(t), file = deferredFile();
  const waiting = f.fileInput().props.onChange(f.fileEvent(file.file)); f.render();
  f.dispose(); const before = f.stateWrites;
  file.resolve(JSON.stringify(backup())); await waiting;
  assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
});

test('A deferred file failure after a real unmount performs no React writes', async t => {
  const f = fixture(t), rejected = deferredFile();
  const pending = f.fileInput().props.onChange(f.fileEvent(rejected.file)); f.render();
  f.dispose(); const beforeError = f.stateWrites;
  rejected.reject(new Error('Synthetic late read failure')); await pending;
  assert.equal(f.stateWrites, beforeError); assert.equal(f.writesAfterDispose, 0);
});

for (const action of ['Change', 'Reset', 'Save', 'Prepare', 'Search', 'Filter']) {
  test(`Unmounted ${action} is blocked before any state writes`, t => {
    const f = fixture(t); completeDraft(f);
    const handler = {
      Change: () => f.input('Hund / Team').props.onChange,
      Reset: () => f.button('Entwurf verwerfen').props.onClick,
      Save: () => f.form().props.onSubmit,
      Prepare: () => f.button('Für diese Übung einen Eintrag vorbereiten').props.onClick,
      Search: () => f.input('Eigene Notizen durchsuchen').props.onChange,
      Filter: () => f.input('Aufgabe filtern').props.onChange,
    }[action]();
    f.dispose(); const before = f.stateWrites;
    handler({ target: { value: action === 'Filter' ? 'all' : 'Must not write' }, preventDefault() {} });
    assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  });
}

test('An unmounted file picker handler neither reads the file nor clears the event target', async t => {
  const f = fixture(t), file = deferredFile(), read = f.fileInput().props.onChange;
  f.dispose(); const before = f.stateWrites, event = f.fileEvent(file.file);
  const pending = read(event); file.resolve(JSON.stringify(backup())); await pending;
  assert.equal(file.reads, 0); assert.equal(event.target.value, 'synthetic.json');
  assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  await assert.doesNotReject(() => read({ get target() { throw new Error('The unmounted picker must not inspect its event'); } }));
});

for (const action of ['Diesen Stand übernehmen', 'Abbrechen']) {
  test(`Unmounted import ${action} does not alter state`, async t => {
    const f = fixture(t);
    await f.read({ size: 512, async text() { return JSON.stringify(backup()); } });
    const handler = f.button(action).props.onClick;
    f.dispose(); const before = f.stateWrites;
    handler();
    assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  });
}

test('Unmounted download is blocked before Blob URL creation, DOM click and notice updates', t => {
  const f = fixture(t, { saved: backup() }), download = f.button('Sicherung herunterladen').props.onClick;
  f.dispose(); const before = f.stateWrites;
  download();
  assert.equal(f.urls.length, 0); assert.equal(f.clicks.length, 0); assert.equal(f.timers.size, 0);
  assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
});

for (const action of ['Bearbeiten', 'Entfernen', 'Eintrag endgültig entfernen', 'Behalten']) {
  test(`Unmounted ${action} cannot touch records or draft`, t => {
    const f = fixture(t, { saved: backup() });
    if (['Eintrag endgültig entfernen', 'Behalten'].includes(action)) f.click('Entfernen');
    const handler = f.button(action).props.onClick;
    f.dispose(); const before = f.stateWrites;
    handler();
    assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  });
}

test('Import rejection leaves existing records and the unsaved draft intact, including oversize files rejected before reading', async t => {
  const f = fixture(t, { saved: backup('Existing synthetic record') });
  f.field('Hund / Team', 'Keep this unsaved draft');
  const before = f.stored(); let reads = 0;
  await f.read({ size: data.DOG_JOURNAL_MAX_BYTES + 1, async text() { reads++; return '{}'; } });
  assert.equal(reads, 0); assert.match(f.body(), /höchstens 2 MB/);
  await f.read({ size: 7, async text() { return '{broken'; } });
  assert.match(f.body(), /keine gültige JSON/);
  assert.deepEqual(f.stored(), before);
  assert.equal(f.input('Hund / Team').props.value, 'Keep this unsaved draft');
});

test('Delete needs confirmation, a retained confirmation cannot delete after a draft revision, and current double confirmation removes exactly once', t => {
  const f = fixture(t, { saved: backup() });
  f.click('Bearbeiten'); f.click('Entfernen');
  assert.equal(f.stored().records.length, 1);
  const oldConfirm = f.button('Eintrag endgültig entfernen').props.onClick;
  f.field('Nächster kleiner Schritt', 'Latest edited draft');
  const before = f.stateWrites;
  oldConfirm(); f.render();
  assert.equal(f.stateWrites, before); assert.equal(f.stored().records.length, 1);
  assert.equal(f.input('Nächster kleiner Schritt').props.value, 'Latest edited draft');
  const confirm = f.button('Eintrag endgültig entfernen').props.onClick;
  confirm(); confirm(); f.render();
  assert.equal(f.stored().records.length, 0); assert.equal(f.input('Hund / Team').props.value, '');
  assert.match(f.body(), /Eintrag entfernt/);
});

test('The record limit blocks an extra save without discarding the completed draft', t => {
  const source = backup(), records = Array.from({ length: data.DOG_JOURNAL_LIMIT }, (_, index) => ({ ...source.records[0], id: `training_limit_${index}` }));
  const f = fixture(t, { saved: { ...source, records } });
  completeDraft(f, 'Must remain a draft'); f.save();
  assert.equal(f.stored().records.length, data.DOG_JOURNAL_LIMIT);
  assert.equal(f.input('Hund / Team').props.value, 'Must remain a draft');
  assert.match(f.body(), /500 Einträge sind erreicht/);
});

test('A current export contains records and the latest unsaved draft, and the synthetic Blob URL is revoked', async t => {
  const f = fixture(t, { saved: backup('Existing synthetic record') });
  f.field('Hund / Team', 'Unsaved exported draft');
  f.click('Sicherung herunterladen');
  assert.equal(f.urls.length, 1); assert.equal(f.clicks.length, 1);
  const parsed = data.parseDogJournalBackup(await f.urls[0].blob.text());
  assert.equal(parsed.records.length, 1); assert.equal(parsed.records[0].dog, 'Existing synthetic record');
  assert.equal(parsed.draft.dog, 'Unsaved exported draft');
  assert.match(f.clicks[0].download, /^jagdlatein-hundetraining-\d{4}-\d{2}-\d{2}\.json$/);
  f.dispose(); const before = f.stateWrites;
  for (const timer of f.timers.values()) timer.callback();
  assert.equal(f.urls[0].revoked, true); assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
});
