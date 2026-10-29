const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { stripDogLearningProcessesAddition } = require('./helpers/dog-learning-processes-additions-oct29.cjs');
function load(relative, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020' }, module: { type: 'commonjs' } });
  const localRequire = id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), cache) : pr(id);
  cache.set(filename, mod.exports);
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  return mod.exports;
}
const expanded = load('lib/dog-breed-expansion.js').dogBreedExpansion;
// Keep the original five-course structural assertions exact. The two named
// October-29 appendices have their own live positive preservation checks.
const modules = load('lib/learning-dog-depth.js').dogDepthModules.map(stripDogLearningProcessesAddition);

test('Expanded dog directory covers additional working groups without duplicating existing standards', () => {
  assert.equal(expanded.length, 45);
  assert.equal(new Set(expanded.map(item => item.id)).size, 45);
  assert.equal(new Set(expanded.map(item => item.standard.number)).size, 45);
  const existingNumbers = new Set([98, 119, 102, 118, 1, 104, 125, 299, 213, 217, 148, 103, 122, 111]);
  const tasks = new Set(['vorstehen', 'stoebern', 'apport', 'wasser', 'schweiss', 'brackieren', 'bau', 'laut-anzeigen']);
  for (const item of expanded) {
    assert.ok(!existingNumbers.has(item.standard.number), item.name);
    assert.ok(item.tasks.length && item.tasks.every(task => tasks.has(task)), item.name);
    for (const field of ['summary', 'work', 'training', 'everyday', 'care', 'boundary']) assert.ok(item[field]?.length > 35, `${item.name}: ${field}`);
    assert.equal(item.reviewedOn, '2026-10-12');
    assert.equal(new URL(item.source.url).hostname, 'www.fci.be');
    assert.ok(item.source.url.endsWith(`${String(item.standard.number).padStart(3, '0')}g${String(item.standard.group).padStart(2, '0')}-en.pdf`));
  }
  assert.deepEqual([...new Set(expanded.map(item => item.standard.group))].sort(), [3, 5, 6, 7, 8]);
});

test('Easily confused breeds preserve the source classification and separate working purposes', () => {
  const byId = Object.fromEntries(expanded.map(item => [item.id, item]));
  assert.deepEqual(byId['slowakischer-rauhbart'].standard, { number: 320, group: 7 });
  assert.deepEqual(byId['alpenlaendische-dachsbracke'].standard, { number: 254, group: 6 });
  assert.equal(byId['alpenlaendische-dachsbracke'].group, 'Schweißhund');
  assert.equal(byId['westfaelische-dachsbracke'].group, 'Laufhund');
  assert.equal(byId['schweizer-laufhund'].standard.number, 59);
  assert.equal(byId['schweizer-niederlaufhund'].standard.number, 60);
  assert.equal(byId['epagneul-breton'].standard.group, 7);
  assert.equal(byId['english-cocker'].standard.group, 8);
  assert.deepEqual(byId['finnischer-spitz'].tasks, ['laut-anzeigen']);
  assert.deepEqual(byId['finnischer-laufhund'].tasks, ['brackieren']);
  assert.equal(expanded.filter(item => item.group === 'Nordischer Jagdhund').length, 4);
});

test('Five dog courses supply linked lessons, unambiguous questions and usable primary references', () => {
  assert.equal(modules.length, 5);
  assert.equal(new Set(modules.map(item => item.id)).size, modules.length);
  assert.equal(modules.reduce((sum, item) => sum + item.lessons.length, 0), 30);
  assert.equal(modules.reduce((sum, item) => sum + item.questions.length, 0), 59);
  const expectedLessonCounts = {
    'wissen-vertiefung-hunde-vorstehrassen': 5,
    'wissen-vertiefung-hunde-bracken-nordische': 5,
    'wissen-vertiefung-hunde-retriever-spaniels': 5,
    'wissen-vertiefung-hunde-nase-spur-laut': 7,
    'wissen-vertiefung-hunde-klare-lernsignale': 8,
  };
  const allQuestionIds = new Set();
  const paragraphTexts = new Set();
  for (const item of modules) {
    assert.equal(item.lessons.length, expectedLessonCounts[item.id], item.id);
    assert.equal(item.questions.length, item.id === 'wissen-vertiefung-hunde-nase-spur-laut' ? 13 : expectedLessonCounts[item.id] * 2, item.id);
    assert.equal(item.category, 'Hundewesen');
    assert.equal(item.reviewedOn, '2026-10-12');
    assert.ok(item.id.startsWith('wissen-vertiefung-hunde-'));
    assert.deepEqual(item.countries, ['DE', 'AT', 'CH']);
    for (const country of item.countries) assert.ok(item.countryNotes[country]);
    const lessonIds = new Set(item.lessons.map(lesson => lesson.id));
    assert.equal(lessonIds.size, item.lessons.length);
    for (const lesson of item.lessons) {
      assert.equal(lesson.paragraphs.length, 3);
      for (const paragraph of lesson.paragraphs) {
        assert.ok(paragraph.length > 210, lesson.title);
        assert.ok(!paragraphTexts.has(paragraph), lesson.title);
        paragraphTexts.add(paragraph);
      }
      assert.ok(lesson.takeaway && lesson.exercise);
    }
    for (const question of item.questions) {
      assert.ok(lessonIds.has(question.lessonId));
      assert.ok(!allQuestionIds.has(question.id));
      allQuestionIds.add(question.id);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
      assert.ok(question.explain?.length > 45);
    }
    assert.ok(item.sources.length >= 5);
    for (const source of item.sources) {
      assert.ok(source.label);
      assert.equal(new URL(source.url).protocol, 'https:');
    }
  }
  assert.equal(paragraphTexts.size, 90);
});

test('Rotated choices keep the factual comparison answers correct', () => {
  const questions = modules.flatMap(item => item.questions);
  const answerFor = fragment => {
    const question = questions.find(item => item.q.includes(fragment));
    assert.ok(question, fragment);
    return question.options[question.answer];
  };
  assert.equal(answerFor('Varietäten innerhalb'), 'Kurzhaariger und langhaariger Weimaraner.');
  assert.equal(answerFor('Sektion der Schweißhunde'), 'Alpenländische Dachsbracke.');
  assert.equal(answerFor('Brittany Spaniel'), 'Epagneul Breton.');
  assert.equal(answerFor('Finnischen Spitz und Finnischen Laufhund'), 'Sie sind getrennte Rassen mit verschiedenen FCI-Gruppen und Arbeitsprofilen.');
  assert.equal(answerFor('positive Verstärkung'), 'Wenn das vorausgehende Verhalten dadurch wahrscheinlicher wird.');
});
