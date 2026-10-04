const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require','module','exports',code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id + '.js'))) : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const { QUESTIONS } = load('data/questions-full.js');
const { legacyQuizEvidence } = load('lib/legacy-quiz-evidence.js');
const byId = new Map(QUESTIONS.map(question=>[question.id,question]));
const correctText = id => { const q=byId.get(id); return q.answers.filter(a=>q.correct.includes(a.id)).map(a=>a.text).join(' '); };

test('All formerly unlinked legacy questions retain stable IDs, direct references and a fixed editorial date', () => {
  assert.equal(Object.keys(legacyQuizEvidence).length, 190);
  assert.equal(QUESTIONS.length,963);
  for(const [id, evidence] of Object.entries(legacyQuizEvidence)) {
    const q = byId.get(id); assert.ok(q,id); assert.equal(q.source,evidence.source,id);
    assert.equal(new URL(q.source).protocol,'https:');
    assert.ok(q.sourceTitle && q.sourceScope,id); assert.equal(q.sourceCheckedAt,'2026-10-04');
  }
  assert.ok(QUESTIONS.every(q=>q.source || /^\/kurse\/[a-z0-9-]+$/.test(q.learningHref || '')), 'Every active question provides a direct reference or its referenced detailed course');
});

test('Horn age, teeth and field observations no longer infer certainty from an unsuitable single feature', () => {
  for(const id of ['JL-1002','JL-1098','JL-1220']) {
    assert.match(correctText(id),/Rückseite/); assert.match(byId.get(id).explain,/kein einfacher Jahreszähler/);
  }
  assert.match(correctText('JL-103'),/Kälber beider Geschlechter/);
  assert.match(byId.get('DE-hege-verbiss').explain,/beweist kein/);
  assert.match(byId.get('JL-1046').explain,/beweist keinen Fuchs/);
  assert.match(correctText('JL-1211'),/Kein verlässliches genaues Alter/);
});

test('Technical explanations exclude weapon-specific universal promises and unsupported distance or load recommendations', () => {
  for(const id of ['DE-ws-flintenlaufgeschoss','AT-ws-flg','CH-ws-flg','JL-1024']) {
    assert.match(correctText(id),/einzelnes Geschoss/); assert.match(byId.get(id).explain,/freigegebene Munition/);
  }
  for(const id of ['JL-1114','JL-1213']) assert.match(correctText(id),/Mündung/);
  assert.match(byId.get('JL-1245').explain,/Gehörschutz/);
  assert.match(correctText('JL-1091'),/Masseneinheit/);
  assert.match(byId.get('JL-new-0001').explain,/Lauflänge allein garantiert keine/);
});

test('Newly delimited law questions cannot appear as general biology across countries', () => {
  for(const [id,country] of [['JL-111','DE'],['JL-112','AT'],['JL-113','CH'],['JL-new-0003','AT'],['JL-new-0004','CH']]) {
    assert.deepEqual(byId.get(id).countries,[country]); assert.equal(byId.get(id).topic,'Recht');
  }
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  assert.ok(quizLearningPool(QUESTIONS, { topic: 'Wildkunde' }).some(q => q.id === 'AT-wk-aalweibchen-69'));
  assert.equal(byId.get('JL-1039').topic, 'Gamswild');
  assert.match(byId.get('AT-recht-schonzeiten').q, /Oberösterreich/);
  assert.match(byId.get('JL-new-0003').source, /land-oberoesterreich/);
  assert.match(correctText('JL-1046'), /Losung/);
  assert.deepEqual(byId.get('JL-1112').answers.map(answer => answer.text), ['Tafelente', 'Stockente', 'Krickente', 'Pfeifente']);
});

test('Quiz feedback uses metadata saved with its exact question version and never leaks future answers', () => {
  const {publicRound} = load('lib/ranked-quiz-server.js');
  const q = byId.get('JL-103');
  const state = { phase:'feedback',index:0,questions:[q,{...byId.get('JL-105')}],feedback:{questionId:q.id,source:q.source,explain:q.explain},serverNow:'2026-10-04T12:00:00Z' };
  const result = publicRound(state);
  assert.equal(result.feedback.sourceCheckedAt,'2026-10-04'); assert.equal(result.feedback.sourceTitle,q.sourceTitle);
  assert.equal(result.question.correct,undefined); assert.equal(result.questions,undefined);
  const oldQuestion = {...q}; delete oldQuestion.sourceTitle; delete oldQuestion.sourceCheckedAt; delete oldQuestion.sourceScope;
  assert.equal(publicRound({...state,questions:[oldQuestion]}).feedback.sourceCheckedAt,null);
  assert.equal(publicRound({...state,feedback:{...state.feedback,source:'https://old.example.invalid/'}}).feedback.sourceCheckedAt,null);
});
