const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const localRequire = createRequire(path.join(root, "package.json"));
const swc = localRequire("next/dist/build/swc");
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  const mod = { exports: {} };
  cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, "utf8"), { filename, jsc: { parser: { syntax: "ecmascript" }, target: "es2020" }, module: { type: "commonjs" } });
  const requireRelative = id => id.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`))) : localRequire(id);
  new Function("require", "module", "exports", code)(requireRelative, mod, mod.exports);
  return mod.exports;
}
const modules = load("lib/learning-curriculum.js").learningModules;
const reviewPool = load("lib/daily-review-pool.js").getDailyReviewPool();
const references = load("lib/dog-depth-independent-sources.js").dogDepthIndependentSources;
const lessonSuffixes = ["fundkontrolle", "markerzeitpunkt", "rueckruf-gesichert", "belastung-pausen"];
const expanded = modules.filter(item => ["wissen-vertiefung-hunde-nase-spur-laut", "wissen-vertiefung-hunde-klare-lernsignale"].includes(item.id));
const newLessons = expanded.flatMap(item => item.lessons.filter(lesson => lessonSuffixes.some(suffix => lesson.id === `${item.id}-${suffix}`)));

test("New practice blocks reach maintained courses and short review without splitting shared DACH knowledge", () => {
  assert.equal(newLessons.length, 4);
  const questions = expanded.flatMap(item => item.questions.filter(question => newLessons.some(lesson => lesson.id === question.lessonId)));
  assert.equal(questions.length, 8);
  assert.equal(new Set(questions.map(question => question.id)).size, 8);
  for (const question of questions) {
    assert.deepEqual(question.countries, ["DE", "AT", "CH"]);
    assert.equal(question.topic, "Hundewesen");
    const shortQuestion = reviewPool.find(item => item.id === question.id);
    assert.ok(shortQuestion, question.id);
    assert.ok(shortQuestion.href.endsWith(`#lesson-${question.lessonId}`), shortQuestion.href);
    assert.deepEqual(shortQuestion.correct, question.correct);
    assert.ok(question.id.length <= 159, "Question IDs must remain valid for the existing repetition API");
  }
});

test("Both answer rotations retain the new factual distinctions and emergency action", () => {
  const questions = expanded.flatMap(item => item.questions);
  const answer = fragment => {
    const question = questions.find(item => item.q.includes(fragment));
    assert.ok(question, fragment);
    return question.answers.find(item => question.correct.includes(item.id)).text;
  };
  assert.equal(answer("Der Zielgeruch fehlt"), "Als richtige Nichtanzeige.");
  assert.match(answer("DeChants Studie"), /keine? |nicht nachgewiesen/);
  assert.match(answer("DeChants Studie"), /Suchverhalten änderte sich/);
  assert.match(answer("passend aufgebauter Marker"), /konkreten Verhaltensmoment/);
  assert.match(answer("lautlose Labradorclip"), /Weder den hörbaren Marker/);
  assert.match(answer("neue Rückrufanforderung"), /unter gesicherten Bedingungen/);
  assert.match(answer("lange Trainingsleine nicht"), /Aufmerksamkeit.*sicheren Lernaufbau/);
  assert.match(answer("starke Arbeitsbereitschaft"), /Keine sichere Belastungsgrenze/);
  assert.match(answer("Hund taumelt"), /sofort beenden.*kühlen.*unverzüglich tierärztlich/);
});

test("Per-block source provenance limits the new review date to the actually added lessons", () => {
  for (const course of expanded) assert.equal(course.reviewedOn, "2026-10-12", "Older course review must not become a blanket current certification");
  for (const lesson of newLessons) {
    assert.equal(lesson.reviewedOn, "2026-10-13");
    assert.equal(lesson.sourceReview.checkedOn, "2026-10-13");
    const sourceIds = lesson.sourceReview.sourceIds;
    assert.ok(new Set(sourceIds.map(id => references[id].organization)).size >= 2);
    for (const id of sourceIds) {
      const source = references[id];
      assert.equal(source.checkedOn, "2026-10-13");
      assert.ok(source.scope && new URL(source.url).protocol === "https:");
    }
  }
  const scent = newLessons.find(item => item.id.endsWith("fundkontrolle"));
  assert.match(scent.paragraphs.join(" "), /keine veränderte Fehlanzeigenrate/);
  assert.match(scent.paragraphs.join(" "), /keine feste Fehlerquote/);
  const heat = newLessons.find(item => item.id.endsWith("belastung-pausen"));
  assert.match(heat.paragraphs.join(" "), /Hecheln allein erlaubt keine Diagnose/);
});
