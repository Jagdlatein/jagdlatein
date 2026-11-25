// Keep every prior chat binding/source/answer assertion while projecting only the exact reviewed Guttation appendix.
const { guttationBaselineFixture } = require('./helpers/guttation-addition-nov25.cjs');
const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader: createGuttationProjectLoader, local, root } = require('./helpers/project-module.cjs');
const createLoader = overrides => createGuttationProjectLoader(guttationBaselineFixture(overrides));
const baseline = '76e93fab039b7789fdd84e65849d9fa77cf79969';
const load = createLoader();
const { chatPracticeBindings: bindings, chatTopicBindings: topics } = load('lib/jagdlatein-chat-bindings.js');
const { answerJagdlateinQuestion: answer } = load('lib/jagdlatein-chat.js');
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { getFlashcards } = load('lib/learning-flashcards.js');
const clone = value => JSON.parse(JSON.stringify(value));
const pairs = [
  ['Kiemenlamellen', 'wissen-ausbau-gewaesser-sauerstoff-2026', 'kiemen-gegenstrom', 'wissen-ausbau-gewaesser-sauerstoff-2026-kiemen-lamellen-bau', '04cc33ddc2a29434944ea19d0a5d5205baf67e8dd9c0aa0f1482313ff4b3d3e0'],
  ['Gegenstrom Fischkiemen', 'wissen-ausbau-gewaesser-sauerstoff-2026', 'kiemen-gegenstrom', 'wissen-ausbau-gewaesser-sauerstoff-2026-kiemen-gegenstrom-richtung', '54c0a952431395b724b3aca60fb42f5eeb01b3727fff14b26d53c0f01677b2bd'],
  ['Flehmen Haltung', 'wissen-rotwild-sozialverhalten', 'rot-flehmen', 'wissen-rotwild-sozialverhalten-rot-flehmen-haltung', '36a19fd02a9fa4a6d84c50c464e459f87e4c044cb16b2aa5f1dd82f7a060331c'],
  ['Flehmen und Röhren', 'wissen-rotwild-sozialverhalten', 'rot-flehmen', 'wissen-rotwild-sozialverhalten-rot-flehmen-sinnesrolle', '6a620494fb14ebe1ce35d9a3df4ee1ccbd452a609884170949952edf9b2f60cc'],
];
const signature = q => createHash('sha256').update(JSON.stringify([q.id, q.lessonId, q.q, q.answers, q.correct, q.explain, q.context || '', q.countries, q.topic])).digest('hex');
function gitLoader() {
  const cache = new Map();
  function read(file) {
    const full = path.resolve(root, file), relative = path.relative(root, full).replaceAll('\\', '/');
    if (cache.has(full)) return cache.get(full).exports;
    const source = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (full.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(full, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename: full, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? read(path.resolve(path.dirname(full), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return read;
}
test('Only four named bindings are appended; all prior bindings/topics and complete curriculum/cards stay identical', () => {
  const before = gitLoader(), old = before('lib/jagdlatein-chat-bindings.js');
  assert.deepEqual(bindings.slice(0, old.chatPracticeBindings.length), old.chatPracticeBindings);
  assert.equal(bindings.length, old.chatPracticeBindings.length + 4);
  assert.deepEqual(topics, old.chatTopicBindings);
  assert.deepEqual(bindings.slice(-4).map(b => b.questionId), pairs.map(p => p[3]));
  assert.equal(learningModules.length, 198);
  assert.deepEqual(learningModules, before('lib/learning-curriculum.js').learningModules);
  assert.equal(getFlashcards().length, 1802);
  assert.deepEqual(getFlashcards(), before('lib/learning-flashcards.js').getFlashcards());
  assert.deepEqual(getFlashcards().slice(0, 116), before('lib/learning-flashcards.js').getFlashcards().slice(0, 116));
});
for (const [query, courseId, lessonId, questionId, expectedSha] of pairs) {
  test(`Pure-server answer has the exact four-option exercise and sources: ${query}`, () => {
    const snapshot = JSON.stringify({ learningModules, cards: getFlashcards(), bindings, topics });
    const reply = answer(query, { country: 'CH', region: 'ZH' });
    const course = getLearningModule(courseId), lesson = course.lessons.find(l => l.id === lessonId);
    const binding = bindings.find(b => b.questionId === questionId), question = course.questions.find(q => q.id === questionId);
    assert.equal(reply.kind, 'lesson'); assert.equal(reply.text, binding.claim);
    assert.equal(reply.links[0].href, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.equal(signature(question), expectedSha); assert.equal(binding.questionSha256, expectedSha);
    const evidence = lesson.evidence.find(e => e.claim === binding.claim);
    const sourceUrls = [...new Set(evidence.sources.map(s => new URL(s.url).href))];
    assert.deepEqual(binding.sourceUrls, sourceUrls);
    assert.deepEqual(reply.links.filter(l => !l.href.startsWith('/')).map(l => l.href), sourceUrls);
    assert.equal(reply.practice.id, questionId); assert.equal(reply.practice.prompt, question.q);
    assert.equal(reply.practice.options.length, 4); assert.deepEqual(reply.practice.options, question.answers);
    assert.equal(reply.practice.correctId, question.correct[0]); assert.equal(reply.practice.explanation, question.explain);
    assert.ok(reply.links.some(l => l.href === `/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
    assert.equal(JSON.stringify({ learningModules, cards: getFlashcards(), bindings, topics }), snapshot);
  });
  test(`Source order and complete-question drift fail closed: ${query}`, () => {
    const original = answer(query);
    for (const sourceChange of ['order', 'url']) {
      const course = clone(getLearningModule(courseId));
      const evidence = course.lessons.find(l => l.id === lessonId).evidence.find(e => e.claim === original.text);
      if (sourceChange === 'order') evidence.sources.reverse();
      else evidence.sources[0].url = 'https://changed-source.example.invalid/original';
      const sourceReply = { ...clone(original), practice: undefined, links: [original.links[0], ...evidence.sources.map(s => ({ label: s.label, href: new URL(s.url).href }))] };
      const sourceAttach = createLoader({ './learning-curriculum': { learningModules, getLearningModule: id => id === courseId ? course : null } })('lib/jagdlatein-chat-practice.js').withChatPractice;
      assert.equal(sourceAttach(sourceReply).practice, undefined, `A source-${sourceChange} change cannot retain the exercise`);
    }
    for (const change of [{ q: 'Changed prompt.' }, { explain: 'Changed explanation.' }, { correct: ['missing'] }]) {
      const changed = clone(getLearningModule(courseId)); Object.assign(changed.questions.find(q => q.id === questionId), change);
      const attach = createLoader({ './learning-curriculum': { learningModules, getLearningModule: id => id === courseId ? changed : null } })('lib/jagdlatein-chat-practice.js').withChatPractice;
      const input = clone(original); delete input.practice;
      assert.equal(attach(input).practice, undefined, 'A signed question-field change cannot retain the exercise');
    }
  });
}
test('No unreviewed chemistry claim or broad legal/health/lamella alias is attached', () => {
  const additions = bindings.slice(-4);
  assert.ok(additions.every(b => !b.aliases.some(a => /^(Recht|Gesundheit|Lamellen)$/i.test(a))));
  const course = getLearningModule('wissen-rotwild-sozialverhalten'), lesson = course.lessons.find(l => l.id === 'rot-flehmen');
  const evidence = lesson.evidence.find(e => e.claim.includes('Harn weiblicher Tiere'));
  assert.ok(evidence); assert.equal(additions.some(b => b.claim === evidence.claim), false);
  const reply = { kind: 'lesson', text: evidence.claim, links: [{ label: 'Lektion', href: '/kurse/wissen-rotwild-sozialverhalten#lesson-rot-flehmen' }, ...evidence.sources.map(s => ({ label: s.label, href: new URL(s.url).href }))] };
  assert.equal(load('lib/jagdlatein-chat-practice.js').withChatPractice(reply).practice, undefined);
});
