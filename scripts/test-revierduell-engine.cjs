// Pure mechanics and synthetic teaching records only: no account, network,
// personal storage, provider, actual timer or browser execution.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const engine = createLoader()('lib/revierduell.js');
const bank = Array.from({ length: 11 }, (_, category) => Array.from({ length: 6 }, (_, number) => ({
  id: `synthetic-${category}-${number}`, categorySlug: `group-${category}`, prompt: `Synthetische Frage ${category}/${number}?`,
  options: ['a','b','c','d'].map(id => ({ id, text: `Synthetische Antwort ${id}` })), correctIds: ['a'], explanation: 'Synthetische Erklärung.',
}))).flat();
const frozen = value => { if (value && typeof value === 'object') { Object.values(value).forEach(frozen); Object.freeze(value); } return value; };
const round = () => engine.createDuellRound(bank, 'mechanics-fixture');
const send = (state, type, details = {}) => engine.duellReducer(state, { type, generation: state.generation, index: state.index, ...details });
function started(now = 100) { return send(engine.createDuellState(round()), 'start', { now }); }
function answer(state, { correct = true, elapsed = 0 } = {}) { const question = state.questions[state.index], optionId = correct ? question.correctIds[0] : question.options.find(option => !question.correctIds.includes(option.id)).id; return send(state, 'answer', { now: state.startedAt + elapsed, optionId }); }
function finished() { let state = started(); for (let index = 0; index < 7; index++) { state = answer(state); state = send(state, 'next', { now: state.startedAt }); } return state; }

test('Seed/target/revision validators accept only bounded scalar canonical values', () => {
  for (const value of ['a', 'AbC_123-xyz', 'z'.repeat(64)]) assert.equal(engine.normaliseDuellSeed(value), value);
  for (const value of [undefined, null, '', [], ['a'], {}, 12, ' a', 'a ', 'a.b', 'a/b', 'ä', 'a\n', 'x'.repeat(65)]) assert.equal(engine.normaliseDuellSeed(value), null);
  for (const [raw, expected] of [['0',0],['1',1],['8329',8329],['8330',8330]]) assert.equal(engine.parseDuellTarget(raw), expected);
  for (const value of [undefined, null, 0, [], ['12'], {}, '', '-1', '+1', '01', '1.0', '1e3', ' 1', '1 ', '8331', '99999', '1\n']) assert.equal(engine.parseDuellTarget(value), null);
  assert.equal(engine.normaliseDuellRevision('aB0123456789CdEf'), 'ab0123456789cdef');
  for (const value of ['', 'abcdef', 'z'.repeat(16), 'a'.repeat(17), ['a'.repeat(16)], {}, null]) assert.equal(engine.normaliseDuellRevision(value), null);
});

test('Secure seeds require16 crypto bytes, never a Math.random fallback or private crypto error', () => {
  let calls = 0;
  const secure = { getRandomValues(bytes) { calls++; assert.ok(bytes instanceof Uint8Array); assert.equal(bytes.length, 16); bytes.forEach((_, index) => { bytes[index] = index; }); return bytes; } };
  const original = Math.random; Math.random = () => { throw Error('An insecure fallback must not run'); };
  try { assert.equal(engine.createDuellSeed(secure), 'd1_000102030405060708090a0b0c0d0e0f'); assert.equal(calls, 1); } finally { Math.random = original; }
  for (const value of [null, {}, { getRandomValues: true }, { getRandomValues() { throw Error('private-marker'); } }]) assert.throws(() => engine.createDuellSeed(value), error => error.message === 'DUELL_SECURE_RANDOM_UNAVAILABLE');
});

test('A fixed seed reproduces seven question IDs and all four answer orders without mutating the bank', () => {
  const original = JSON.stringify(bank); frozen(bank);
  const first = engine.createDuellRound(bank, 'winter_2026'), second = engine.createDuellRound(bank, 'winter_2026');
  assert.deepEqual(first, second); assert.equal(first.length, 7); assert.equal(new Set(first.map(item => item.id)).size, 7); assert.equal(new Set(first.map(item => item.categorySlug)).size, 7);
  for (const question of first) { assert.equal(question.options.length, 4); assert.equal(new Set(question.options.map(option => option.id)).size, 4); assert.equal(question.correctIds.length, 1); assert.ok(question.options.some(option => option.id === question.correctIds[0])); }
  first[0].options[0].text = 'local mutation'; first[0].correctIds[0] = 'changed';
  assert.equal(JSON.stringify(bank), original); assert.notEqual(second[0].options[0].text, 'local mutation'); assert.equal(second[0].correctIds[0], 'a');
});

test('Canonical order makes a bank reorder and option reorder irrelevant to the same seeded challenge', () => {
  const reversed = [...bank].reverse().map(question => ({ ...question, options: [...question.options].reverse(), correctIds: [...question.correctIds] }));
  assert.deepEqual(engine.createDuellRound(reversed, 'order-proof'), engine.createDuellRound(bank, 'order-proof'));
});

test('Algorithm version1 retains the exact published synthetic seed fixture, including answer order', () => {
  assert.equal(engine.DUELL_ALGORITHM_VERSION, 1);
  assert.deepEqual(engine.createDuellRound(bank, 'winter_2026').map(question => ({ id: question.id, order: question.options.map(option => option.id).join('') })), [
    { id: 'synthetic-3-2', order: 'badc' }, { id: 'synthetic-9-0', order: 'dacb' }, { id: 'synthetic-2-4', order: 'dacb' },
    { id: 'synthetic-6-1', order: 'dbca' }, { id: 'synthetic-5-5', order: 'acdb' }, { id: 'synthetic-8-4', order: 'abcd' }, { id: 'synthetic-7-2', order: 'acdb' },
  ]);
});

test('Different seeds produce predominantly different rounds and varied answer positions', () => {
  const signatures = Array.from({ length: 200 }, (_, index) => engine.createDuellRound(bank, 'fixture_' + index).map(question => question.id + ':' + question.options.map(option => option.id).join('')).join('|'));
  assert.ok(new Set(signatures).size >= 195);
  const small = bank.filter(question => question.id.endsWith('-0')).slice(0,7), orders = new Set();
  for (let index = 0; index < 100; index++) orders.add(engine.createDuellRound(small, 'answer_' + index).find(question => question.id === small[0].id).options.map(option => option.id).join(''));
  assert.ok(orders.size >= 16);
});

test('Malformed banks, legal category, duplicates and unusable answer mappings fail closed', () => {
  const copy = () => structuredClone(bank), mutations = [
    data => data.splice(1), data => { data[1].id = data[0].id; }, data => { data[0].categorySlug = 'jagdrecht'; },
    data => { data[0].prompt = ''; }, data => { data[0].explanation = ''; }, data => { data[0].options.pop(); },
    data => { data[0].options[1].id = data[0].options[0].id; }, data => { data[0].correctIds = ['unknown']; },
    data => { data[0].correctIds = ['a','b']; }, data => { data.forEach(question => { question.categorySlug = 'one-category'; }); },
  ];
  for (const mutate of mutations) { const value = copy(); mutate(value); assert.throws(() => engine.createDuellRound(value, 'valid')); }
  for (const seed of [null, '', ['one'], 'x'.repeat(65)]) assert.throws(() => engine.createDuellRound(bank, seed));
});

test('Correct answers score base plus remaining full seconds plus previous-streak bonus', () => {
  for (const [remaining, expected] of [[12000,920],[11999.999,885],[11000,885],[10999.999,850],[1000,535],[999.999,500],[0,0],[-1,0]]) assert.equal(engine.duellAnswerPoints(true, remaining, 0), expected);
  assert.equal(engine.duellAnswerPoints(true, 12000, 6), 1460); assert.equal(engine.duellAnswerPoints(true, 120000, 0), 920);
  for (const remaining of [NaN, Infinity, -Infinity]) assert.equal(engine.duellAnswerPoints(true, remaining, 0), 0);
  for (const streak of [-1, 0.1, 7, NaN, Infinity]) assert.equal(engine.duellAnswerPoints(true, 12000, streak), 0);
  for (const correct of [false, null, 1, 'true']) assert.equal(engine.duellAnswerPoints(correct, 12000, 0), 0);
});

test('A full perfect immediate round reaches exactly8330 and waits for manual next after every answer', () => {
  let state = engine.createDuellState(round()); assert.equal(state.phase, 'ready'); assert.equal(engine.duellRemainingMs(state, 0), 0);
  state = send(state, 'start', { now: 0 }); assert.equal(state.phase, 'asking'); assert.equal(engine.duellRemainingMs(state, 0), 12000);
  for (let index = 0; index < 7; index++) {
    const before = state; state = answer(state); assert.equal(state.phase, 'feedback'); assert.equal(state.index, index); assert.equal(state.answers.length, index + 1);
    assert.equal(state.answers[index].points, 920 + 90 * index); assert.equal(state.correctCount, index + 1); assert.equal(state.streak, index + 1);
    assert.equal(before.score, index * 920 + 90 * index * (index - 1) / 2);
    assert.equal(send(state, 'timeout', { now: 100000 }), state, 'Feedback does not automatically advance or regrade');
    state = send(state, 'next', { now: before.startedAt });
  }
  assert.equal(state.phase, 'finished'); assert.equal(state.score, 7*500 + 7*12*35 + 21*90); assert.equal(state.score, engine.DUELL_MAX_SCORE); assert.equal(state.answers.length, 7);
});

test('Wrong answer resets a prior series and the following correct answer starts at zero bonus', () => {
  let state = started(); state = answer(state); state = send(state, 'next', { now: 101 }); state = answer(state); state = send(state, 'next', { now: 102 });
  assert.equal(state.streak, 2); const previous = state.score; state = answer(state, { correct: false }); assert.equal(state.streak, 0); assert.equal(state.score, previous); assert.equal(state.correctCount, 2); assert.equal(state.answers[2].points, 0);
  state = send(state, 'next', { now: 103 }); state = answer(state); assert.equal(state.answers[3].points, 920); assert.equal(state.streak, 1);
});

test('The deadline wins even if the interval has not yet processed timeout; no auto-next follows', () => {
  let state = started(50); const correct = state.questions[0].correctIds[0];
  assert.equal(send(state, 'timeout', { now: state.deadline - 0.001 }), state);
  const justInTime = send(state, 'answer', { now: state.deadline - 0.001, optionId: correct }); assert.equal(justInTime.correctCount, 1); assert.equal(justInTime.score, 500);
  state = send(state, 'answer', { now: state.deadline, optionId: correct }); assert.equal(state.phase, 'feedback'); assert.equal(state.index, 0); assert.equal(state.score, 0); assert.equal(state.streak, 0); assert.equal(state.answers[0].timedOut, true); assert.equal(state.answers[0].selectedId, null); assert.equal(state.answers[0].elapsedMs, 12000);
  const late = send(started(50), 'timeout', { now: 999999 }); assert.equal(late.score, 0); assert.equal(late.answers[0].timedOut, true); assert.equal(late.answers[0].elapsedMs, 12000);
});

test('Double answers/nexts and callbacks from older questions or generations cannot apply twice', () => {
  let state = started(); const event = { type: 'answer', generation: state.generation, index: 0, now: 100, optionId: state.questions[0].correctIds[0] };
  state = engine.duellReducer(state, event); assert.equal(engine.duellReducer(state, event), state);
  const next = { type: 'next', generation: state.generation, index: 0, now: 101 }; state = engine.duellReducer(state, next); assert.equal(engine.duellReducer(state, next), state); assert.equal(engine.duellReducer(state, event), state);
  const done = finished(), restarted = send(done, 'restart'); assert.equal(restarted.phase, 'ready'); assert.equal(restarted.generation, done.generation + 1); assert.equal(restarted.score, 0);
  assert.equal(engine.duellReducer(restarted, { type: 'start', generation: done.generation, index: 0, now: 100 }), restarted);
  assert.equal(send(restarted, 'restart'), restarted, 'An unfinished new round cannot be reset by an old result button');
});

test('Clock rollback, invalid timestamps, wrong phases and invalid answers leave state untouched', () => {
  const ready = engine.createDuellState(round()); assert.equal(send(ready, 'next', { now: 0 }), ready); assert.equal(send(ready, 'answer', { now: 0, optionId: 'a' }), ready);
  for (const now of [NaN, Infinity, -1, Number.MAX_SAFE_INTEGER]) assert.equal(send(ready, 'start', { now }), ready);
  let state = started(100); assert.equal(send(state, 'start', { now: 200 }), state); assert.equal(send(state, 'answer', { now: 99, optionId: 'a' }), state); assert.equal(send(state, 'answer', { now: 101, optionId: 'unknown' }), state);
  state = answer(state, { elapsed: 500 }); assert.equal(send(state, 'next', { now: 599 }), state); assert.equal(send(state, 'next', { now: NaN }), state);
  assert.equal(engine.duellReducer(state, null), state); assert.equal(engine.duellReducer(state, { type: 'next', generation: state.generation + 1, index: state.index, now: 601 }), state);
});

test('A queued action rechecks its captured live owner inside the reducer and fails closed on stale or throwing predicates', () => {
  const state = started(); let current = true;
  const event = { type: 'answer', generation: state.generation, index: state.index, now: state.startedAt, optionId: state.questions[0].correctIds[0], isCurrent: () => current };
  current = false; assert.equal(engine.duellReducer(state, event), state);
  for (const isCurrent of [null, true, () => false, () => undefined, () => { throw Error('Disposed owner'); }]) assert.equal(engine.duellReducer(state, { ...event, isCurrent }), state);
  current = true; assert.equal(engine.duellReducer(state, event).phase, 'feedback');
});

test('Invalid round sizes/IDs/generation are rejected and copied options do not alias the selected round', () => {
  const selected = round(); assert.throws(() => engine.createDuellState(selected.slice(0,6))); assert.throws(() => engine.createDuellState([...selected.slice(0,6), selected[0]]));
  for (const generation of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => engine.createDuellState(selected, generation));
  const state = engine.createDuellState(selected); state.questions[0].options[0].text = 'state only'; assert.notEqual(selected[0].options[0].text, 'state only');
});

test('Ranks use hit rate; challenge comparison explicitly distinguishes zero, won, tied and missed', () => {
  const ids = Array.from({ length: 8 }, (_, correct) => engine.duellRank(correct).id); assert.deepEqual(ids, ['neugierig','neugierig','neugierig','spur','spur','sicher','sicher','fuchs']);
  for (const [correct,total] of [[-1,7],[8,7],[1,0],[1,8],[NaN,7]]) assert.equal(engine.duellRank(correct,total), null);
  assert.equal(engine.compareDuellTarget(1,0), 'won'); assert.equal(engine.compareDuellTarget(0,0), 'tied'); assert.equal(engine.compareDuellTarget(1,1), 'tied'); assert.equal(engine.compareDuellTarget(0,1), 'missed');
  for (const target of [null, undefined, '0', -1, 8331, NaN]) assert.equal(engine.compareDuellTarget(0,target), null);
});

test('Challenge URLs are exact first-party URLs with validated seed/target/version and fixed UTM fields', () => {
  const result = engine.duellChallengeUrl({ seed: 'Duell_2026-X', score: 0, revision: 'ABCDEF0123456789' }), url = new URL(result);
  assert.equal(url.origin, 'https://jagdlatein.de'); assert.equal(url.pathname, '/revierduell'); assert.equal(url.searchParams.get('duell'), 'Duell_2026-X'); assert.equal(url.searchParams.get('ziel'), '0'); assert.equal(url.searchParams.get('v'), 'abcdef0123456789');
  assert.deepEqual([...url.searchParams.keys()], ['duell','ziel','v','utm_source','utm_medium','utm_campaign']); assert.equal(url.searchParams.get('utm_source'), 'revierduell'); assert.equal(url.searchParams.get('utm_medium'), 'share'); assert.equal(url.searchParams.get('utm_campaign'), 'revierduell');
  for (const patch of [{ seed: '//evil.invalid' },{ seed: ['valid'] },{ score: 8331 },{ score: '4' },{ revision: '<script>' }]) assert.throws(() => engine.duellChallengeUrl({ seed: 'valid', score: 10, revision: '0123456789abcdef', ...patch }));
});

test('Only a bounded canonical integer is accepted from local highscore storage', () => {
  for (const value of ['0','42','8330']) assert.equal(engine.parseDuellHighscore(value), Number(value));
  for (const value of [null, {}, 42, '', 'null', 'NaN', '8331', '-5', '1e3', '0042', '"42"', '{"score":42}', '<script>', '4\n']) assert.equal(engine.parseDuellHighscore(value), null);
  assert.equal(engine.DUELL_HIGHSCORE_KEY, 'jagdlatein-revierduell-highscore-v1');
});
