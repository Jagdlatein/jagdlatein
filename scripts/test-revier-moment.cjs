const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const req = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return pr(id);
  };
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const { getRevierMoment, getRevierMomentPreview } = load('lib/revier-moment-server.js');
const data = load('lib/practice-research-server.js').getPracticeResearchData();
const at = text => getRevierMoment(new Date(text));
const start = Date.UTC(2026, 11, 15, 12);
const day = 86400000;

test('The daily case is deterministic throughout the Swiss civil day, with local midnight boundaries', () => {
  assert.deepEqual(at('2026-01-15T23:00:00Z'), at('2026-01-16T22:59:59.999Z'));
  assert.equal(at('2026-01-15T22:59:59Z').dateKey, '2026-01-15');
  assert.equal(at('2026-01-15T23:00:00Z').dateKey, '2026-01-16');
  assert.deepEqual(at('2026-06-01T22:00:00Z'), at('2026-06-02T21:59:59.999Z'));
  assert.equal(at('2026-06-01T21:59:59Z').dateKey, '2026-06-01');
  assert.equal(at('2026-06-01T22:00:00Z').dateKey, '2026-06-02');
  assert.equal(at('2026-10-16T12:00:00Z').displayDate, '16. Oktober 2026');
});

test('All 60 reviewed cases rotate once before repeating, interleaving every topic through New Year', () => {
  const moments = Array.from({ length: 120 }, (_, index) => getRevierMoment(new Date(start + index * day)));
  assert.equal(new Set(moments.slice(0, 60).map(moment => moment.question.id)).size, 60);
  assert.equal(new Set(moments.slice(1, 61).map(moment => moment.question.id)).size, 60);
  const counts = new Map();
  moments.slice(0, 60).forEach(moment => counts.set(moment.topic.id, (counts.get(moment.topic.id) || 0) + 1));
  assert.deepEqual([...counts.values()], [20, 20, 20]);
  for (let i = 0; i < 60; i++) {
    assert.equal(moments[i].question.id, moments[i + 60].question.id);
    assert.notEqual(moments[i].topic.id, moments[i + 1].topic.id);
    assert.equal(moments[i].topic.id, moments[i + 3].topic.id);
    assert.notEqual(moments[i].question.id, moments[i + 3].question.id);
  }
  assert.ok(moments.some(moment => moment.dateKey === '2026-12-31'));
  assert.ok(moments.some(moment => moment.dateKey === '2027-01-01'));
});

test('DST changes use 23/25 hour Swiss days and leap day is one full cycle step', () => {
  assert.deepEqual(at('2026-03-28T23:00:00Z'), at('2026-03-29T21:59:59Z'));
  assert.deepEqual(at('2026-03-29T00:59:59Z'), at('2026-03-29T01:00:00Z'));
  assert.equal(at('2026-03-29T22:00:00Z').dateKey, '2026-03-30');
  assert.deepEqual(at('2026-10-24T22:00:00Z'), at('2026-10-25T22:59:59Z'));
  assert.deepEqual(at('2026-10-25T00:59:59Z'), at('2026-10-25T01:00:00Z'));
  assert.equal(at('2026-10-25T23:00:00Z').dateKey, '2026-10-26');
  const leap = ['2028-02-28T12:00:00Z', '2028-02-29T12:00:00Z', '2028-03-01T12:00:00Z', '2028-03-02T12:00:00Z'].map(at);
  assert.equal(leap[1].dateKey, '2028-02-29');
  assert.equal(new Set(leap.slice(0, 3).map(moment => moment.topic.id)).size, 3);
  assert.equal(leap[0].topic.id, leap[3].topic.id);
  assert.notEqual(leap[0].question.id, leap[3].question.id);
  assert.equal(getRevierMoment(new Date(-day)).dateKey, '1969-12-31');
});

test('A case copies exactly one reviewed question, referenced sources and its licensed photograph', () => {
  const moments = Array.from({ length: 60 }, (_, index) => getRevierMoment(new Date(start + index * day)));
  for (const moment of moments) {
    const topic = data.topics.find(item => item.id === moment.topic.id);
    const question = data.questions.find(item => item.id === moment.question.id);
    assert.deepEqual(moment.question, question);
    assert.deepEqual(Object.keys(moment).sort(), ['dateKey', 'displayDate', 'photo', 'question', 'topic']);
    assert.deepEqual(Object.keys(moment.topic).sort(), ['id', 'photoContext', 'reviewedOn', 'sources', 'title']);
    assert.equal(moment.topic.reviewedOn, topic.reviewedOn);
    assert.equal(moment.question.reviewedOn, question.reviewedOn);
    assert.deepEqual(moment.topic.sources, topic.sources.filter(source => question.sourceIds.includes(source.id)));
    assert.equal(moment.topic.sources.length, question.sourceIds.length);
    assert.deepEqual(moment.photo, data.photos[topic.photoKey]);
    assert.ok(moment.photo.credit && moment.photo.creditUrl && moment.photo.licenseUrl);
    assert.ok(moment.topic.photoContext.includes('keine Aufnahme'));
  }
  const first = moments[0];
  first.question.options[0].text = 'modified'; first.topic.sources[0].title = 'modified'; first.photo.src = 'modified';
  const repeated = getRevierMoment(new Date(start));
  assert.notEqual(repeated.question.options[0].text, 'modified');
  assert.notEqual(repeated.topic.sources[0].title, 'modified');
  assert.notEqual(repeated.photo.src, 'modified');
});

test('The home teaser has an explicit four-field allowlist and cannot leak answers or extra payload fields', () => {
  const moment = getRevierMoment(new Date(start));
  moment.privateAccount = 'secret'; moment.question.privateAccount = 'secret'; moment.topic.privateAccount = 'secret';
  const preview = getRevierMomentPreview(moment);
  assert.deepEqual(preview, { dateKey: moment.dateKey, displayDate: moment.displayDate, prompt: moment.question.prompt, topicTitle: moment.topic.title });
  const serialized = JSON.stringify(preview);
  assert.doesNotMatch(serialized, /correctIds|expectedOrder|options|explanation|sourceIds|reviewedOn|photo|privateAccount|secret/);
  const altered = structuredClone(data);
  altered.questions.forEach(question => { question.privateField = 'secret'; question.options.forEach(option => { option.privateField = 'secret'; }); });
  altered.topics.forEach(topic => { topic.privateField = 'secret'; topic.sources.forEach(source => { source.privateField = 'secret'; }); });
  Object.values(altered.photos).forEach(photo => { photo.privateField = 'secret'; });
  const selector = load('lib/revier-moment-server.js', { './practice-research-server': { getPracticeResearchData: () => altered } });
  assert.doesNotMatch(JSON.stringify(selector.getRevierMoment(new Date(start))), /privateField|secret/);
});

test('Invalid dates, incomplete pools, broken answer/source mappings and missing licensed photos fail closed', () => {
  for (const now of [null, undefined, '2026-10-16', 0, {}, new Date(NaN)]) {
    if (now === undefined) continue; // Omitted now intentionally uses the current time.
    assert.throws(() => getRevierMoment(now), /gültiges Date-Objekt/);
  }
  assert.throws(() => getRevierMoment(new Date('0000-12-01T12:00:00Z')), /Kalenderbereich/);
  const invalid = [
    value => { value.topics = []; },
    value => { value.questions = []; },
    value => { value.questions.pop(); },
    value => { value.questions[1].id = value.questions[0].id; },
    value => { value.questions[0] = null; },
    value => { value.questions[0].topicId = 'unknown'; },
    value => { value.questions[0].correctIds = ['unknown']; },
    value => { value.questions[0].sourceIds = ['unknown']; },
    value => { value.questions[0].reviewedOn = '2026-02-30'; },
    value => { value.topics[0].sources[0].url = 'javascript:alert(1)'; },
    value => { value.photos = {}; },
    value => { delete value.photos.rehwild.licenseUrl; },
  ];
  for (const mutate of invalid) {
    const broken = structuredClone(data); mutate(broken);
    const selector = load('lib/revier-moment-server.js', { './practice-research-server': { getPracticeResearchData: () => broken } });
    assert.throws(() => selector.getRevierMoment(new Date(start)), /Fragenvorrat/);
  }
  assert.throws(() => getRevierMomentPreview({}), /Fragenvorrat/);
});
