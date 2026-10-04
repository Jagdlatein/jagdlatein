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
const css = new Proxy({}, { get: (_, key) => String(key) });
function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/image') return ({ priority, fill, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides);
    return req(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports); return mod.exports;
}
function engine() {
  const slots = []; let cursor = 0; let effects = [];
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; const previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) { effects.push(fn); slots[i] = { deps }; } },
  }, render(fn) { cursor = 0; return fn(); }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); } };
}
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(''); return typeof node === 'object' ? text(node.props?.children) : String(node); }
function setup(relative) {
  const e = engine(), Component = load(relative, { react: e.hooks }).default; let tree = e.render(() => Component());
  return { get tree() { return tree; }, redraw() { tree = e.render(() => Component()); return tree; }, flush() { e.flush(); this.redraw(); }, html() { return renderToStaticMarkup(tree); }, button(label) { const node = find(tree, n => n.type === 'button' && text(n).trim() === label); assert.ok(node, 'Missing button: ' + label); return node; }, click(label) { const node = this.button(label); assert.ok(!node.props.disabled); node.props.onClick(); this.redraw(); }, field(label, value) { const holder = find(tree, n => n.type === 'label' && text(n).startsWith(label)); assert.ok(holder, 'Missing field: ' + label); const input = find(holder, n => ['input', 'select', 'textarea'].includes(n.type)); input.props.onChange({ target: { value, checked: value } }); this.redraw(); } };
}
const meat = load('lib/game-meat-cases.js');
const dogs = load('lib/dog-training-journal.js');
const exams = load('lib/oral-exam-trainer.js');

test('Ten substantive hygiene cases explain every option and all answers remain tied to the existing course', () => {
  assert.equal(meat.gameMeatCases.length, 10); assert.equal(new Set(meat.gameMeatCases.map(item => item.id)).size, 10);
  for (const item of meat.gameMeatCases) { assert.equal(item.choices.length, 3); assert.ok(item.answer >= 0 && item.answer < item.choices.length); assert.equal(item.checklist.length, 3); assert.ok(item.situation.length > 90); assert.ok(item.choices.every(choice => choice.explanation.length > 45)); assert.ok(item.sources.length); }
});
test('Hygiene feedback supports wrong answers, guards double submissions and rejects stale round actions', () => {
  const s = setup('components/GameMeatCases.js'); const first = meat.gameMeatCases[0]; const wrong = s.button(first.choices[1].text); const correct = s.button(first.choices[0].text);
  wrong.props.onClick(); wrong.props.onClick(); correct.props.onClick(); s.redraw(); assert.ok(s.html().includes(first.choices[1].explanation)); assert.ok(s.html().includes(first.choices[0].explanation));
  const next = s.button('Nächster Fall'); next.props.onClick(); next.props.onClick(); s.redraw(); assert.ok(s.html().includes('Fall 2 von 10'));
  wrong.props.onClick(); next.props.onClick(); s.redraw(); assert.ok(!s.html().includes('Fall 3 von 10'));
  for (let i = 1; i < 10; i++) { const item = meat.gameMeatCases[i]; s.click(item.choices[item.answer].text); s.click(i === 9 ? 'Runde auswerten' : 'Nächster Fall'); }
  assert.match(s.html(), /9 von 10/); s.click('Offene Fälle wiederholen'); assert.match(s.html(), /Fall 1 von 1/); wrong.props.onClick(); next.props.onClick(); s.redraw(); assert.equal(find(s.tree, n => n.props?.role === 'status'), null);
});
test('Journal backup validates schema, bounds, IDs, real dates and creates a round-trip without unknown properties', () => {
  const draft = { ...dogs.createDogJournalDraft(new Date('2026-10-04T12:00:00Z')), dog: 'Lotte', observation: 'Freiwillig auf die Decke gegangen.', nextStep: 'Eine kurze Wiederholung.' };
  const record = dogs.makeDogJournalRecord(draft, 'training_00001', '2026-10-04T12:00:00Z');
  const data = { version: 1, draft, records: [{ ...record, unknown: 'drop me' }] }; const roundTrip = dogs.parseDogJournalBackup(JSON.stringify(data)); assert.equal(roundTrip.records[0].unknown, undefined); assert.equal(roundTrip.records[0].dog, 'Lotte');
  for (const bad of [{ ...data, version: 2 }, { ...data, records: [record, record] }, { ...data, records: [{ ...record, date: '2026-02-30' }] }, { ...data, records: [{ ...record, exerciseId: 'unknown' }] }, { ...data, records: [{ ...record, minutes: '181' }] }, { ...data, records: [{ ...record, minutes: 5 }] }, { ...data, records: [{ ...record, observation: 'x'.repeat(2001) }] }, { ...data, records: [{ ...record, id: '<script>' }] }]) assert.throws(() => dogs.parseDogJournalBackup(JSON.stringify(bad)));
  assert.throws(() => dogs.parseDogJournalBackup('x'.repeat(dogs.DOG_JOURNAL_MAX_BYTES + 1))); assert.throws(() => dogs.parseDogJournalBackup(JSON.stringify({ ...data, extra: '🐕'.repeat(600000) })));
  assert.ok(dogs.validateDogJournalDraft({ ...draft, date: '', minutes: '' })); assert.ok(!dogs.validateDogJournalDraft({ ...draft, date: '', minutes: '' }, true));
});
test('Journal saves, edits, escapes notes and keeps working after storage denial', () => {
  const oldWindow = global.window; let saved = null; global.window = { location: { search: '' }, localStorage: { getItem() { return null; }, setItem(key, value) { saved = { key, value }; } } };
  try {
    const s = setup('components/DogTrainingJournal.js'); s.flush(); s.flush(); s.field('Hund / Team', 'Lotte'); s.field('Was war sichtbar?', '<script>alert(1)</script> Ruhig.');
    const form = find(s.tree, node => node.type === 'form'); form.props.onSubmit({ preventDefault() {} }); form.props.onSubmit({ preventDefault() {} }); s.redraw(); s.flush();
    assert.match(s.html(), /1 von 1 Einträgen/); assert.ok(s.html().includes('&lt;script&gt;alert(1)&lt;/script&gt;')); assert.equal(dogs.parseDogJournalBackup(saved.value).records.length, 1);
    s.click('Bearbeiten'); s.field('Nächster kleiner Schritt', 'Weniger Ablenkung.'); find(s.tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }); s.redraw(); s.flush(); assert.match(s.html(), /Weniger Ablenkung/); assert.match(s.html(), /1 von 1 Einträgen/);
    global.window.localStorage.setItem = () => { throw new Error('Quota'); }; s.field('Hund / Team', 'Zweiter Entwurf'); s.flush(); assert.match(s.html(), /Speichern auf diesem Gerät ist nicht möglich/); s.field('Was war sichtbar?', 'Freiwilliger kurzer Blick.'); find(s.tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }); s.redraw(); assert.match(s.html(), /2 von 2 Einträgen/);
  } finally { global.window = oldWindow; }
});
test('Journal import validates before replacement and ignores an older file finishing late', async () => {
  const oldWindow = global.window; global.window = { location: { search: '' }, localStorage: { getItem() { return null; }, setItem() {} } };
  try {
    const s = setup('components/DogTrainingJournal.js'); s.flush(); const fileInput = () => find(s.tree, node => node.type === 'input' && node.props.type === 'file');
    await fileInput().props.onChange({ target: { files: [{ size: 10, async text() { return '{broken'; } }], value: 'file' } }); s.redraw(); assert.match(s.html(), /keine gültige JSON/); assert.match(s.html(), /0 von 0 Einträgen/);
    let firstResolve; const first = fileInput().props.onChange({ target: { files: [{ size: 100, text() { return new Promise(resolve => { firstResolve = resolve; }); } }], value: 'first' } });
    const draft = { ...dogs.createDogJournalDraft(), dog: 'Neuer Stand', observation: 'Entspannte freiwillige Orientierung.' }; const record = dogs.makeDogJournalRecord(draft, 'training_import1'); const backup = JSON.stringify({ version: 1, records: [record], draft });
    await fileInput().props.onChange({ target: { files: [{ size: backup.length, async text() { return backup; } }], value: 'second' } }); s.redraw(); assert.match(s.html(), /Geprüfte Sicherung/); assert.match(s.html(), /0 von 0 Einträgen/);
    firstResolve('{broken'); await first; s.redraw(); assert.match(s.html(), /Geprüfte Sicherung/); const apply = s.button('Diesen Stand übernehmen'); apply.props.onClick(); apply.props.onClick(); s.redraw(); assert.match(s.html(), /1 von 1 Einträgen/); assert.match(s.html(), /Neuer Stand/);
  } finally { global.window = oldWindow; }
});
test('Open exam questions cover all twelve categories with criteria and valid course links', () => {
  const modules = load('lib/learning-curriculum.js').learningModules; assert.equal(exams.oralExamQuestions.length, 20); assert.equal(new Set(exams.oralExamQuestions.map(item => item.categorySlug)).size, 12); assert.equal(new Set(exams.oralExamQuestions.map(item => item.id)).size, 20);
  for (const item of exams.oralExamQuestions) { assert.equal(item.criteria.length, 4); assert.ok(item.model.length > 250); assert.ok(item.prompt.length > 70); assert.ok(item.sources.length); assert.ok(modules.some(module => module.id === item.course), item.course); }
});
test('Open exam requires an own answer, separates self assessment and guards stale next actions', () => {
  const s = setup('components/OralExamTrainer.js'); assert.ok(s.button('Mit der Musterantwort vergleichen').props.disabled); s.field('Deine Antwort', 'Meine eigene Erklärung.'); s.click('Mit der Musterantwort vergleichen'); assert.ok(s.html().includes(exams.oralExamQuestions[0].model)); assert.ok(s.button('Nächste Frage').props.disabled); s.click('Noch offene Lücken'); const next = s.button('Nächste Frage'); next.props.onClick(); next.props.onClick(); s.redraw(); assert.match(s.html(), /Frage 2 von 20/); next.props.onClick(); s.redraw(); assert.match(s.html(), /Frage 2 von 20/); assert.ok(s.button('Mit der Musterantwort vergleichen').props.disabled);
});
test('Exam reading never selects a remote voice and stays usable as text', () => {
  const oldWindow = global.window; let spoken = 0; global.window = { location: { search: '' }, speechSynthesis: { cancel() {}, getVoices() { return [{ lang: 'de-DE', localService: false }]; }, speak() { spoken++; } }, SpeechSynthesisUtterance: function (prompt) { this.text = prompt; } };
  try { const s = setup('components/OralExamTrainer.js'); s.flush(); s.click('Frage vorlesen'); assert.equal(spoken, 0); assert.match(s.html(), /Keine lokale deutsche Gerätestimme verfügbar/); global.window.speechSynthesis.getVoices = () => [{ lang: 'de-CH', localService: true }]; s.click('Frage vorlesen'); assert.equal(spoken, 1); assert.match(s.html(), /lokalen Gerätestimme/); }
  finally { global.window = oldWindow; }
});
test('Search deep links open only known content IDs in all three tools', () => {
  const oldWindow = global.window; global.window = { location: { search: '?eintrag=trichinen' }, localStorage: { getItem() { return null; }, setItem() {} } };
  try { const meatPage = setup('components/GameMeatCases.js'); meatPage.flush(); assert.match(meatPage.html(), /Einfrieren statt Untersuchung/); assert.match(meatPage.html(), /Begründung/); global.window.location.search = '?eintrag=pflege'; const journalPage = setup('components/DogTrainingJournal.js'); journalPage.flush(); assert.match(journalPage.html(), /Pflege kooperativ vorbereiten/); global.window.location.search = '?eintrag=baumwinter'; const examPage = setup('components/OralExamTrainer.js'); examPage.flush(); assert.match(examPage.html(), /Ein Laubbaum ohne Blätter/); global.window.location.search = '?eintrag=unknown'; const fallback = setup('components/GameMeatCases.js'); fallback.flush(); assert.match(fallback.html(), /Fall 1 von 10/); }
  finally { global.window = oldWindow; }
});
test('All six learning tools share exactly one category-aware layout and retain specialized learning content', () => {
  for (const component of ['GameMeatCases', 'DogTrainingJournal', 'OralExamTrainer', 'PhotoDetective', 'AnimalSounds', 'DogCompass']) { const s = setup(`components/${component}.js`); const html = s.html(); assert.equal((html.match(/<main\b/g) || []).length, 1, component); assert.equal((html.match(/<h1\b/g) || []).length, 1, component); assert.ok(html.includes('Alle Angebote suchen')); }
  const entries = load('lib/practice-search-entries.js').practiceSearchEntries; assert.equal(entries.length, 40); assert.equal(new Set(entries.map(item => item.id)).size, 40); assert.ok(entries.every(item => item.href.includes('?eintrag=') && item.text.length > 100));
});
