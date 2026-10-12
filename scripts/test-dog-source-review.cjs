const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const localRequire = createRequire(path.join(root, "package.json"));
const swc = localRequire("next/dist/build/swc");
function load(relative) {
  const filename = path.join(root, relative);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, "utf8"), { filename, jsc: { parser: { syntax: "ecmascript" }, target: "es2020" }, module: { type: "commonjs" } });
  const requireFromFile = id => id.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`))) : localRequire(id);
  new Function("require", "module", "exports", code)(requireFromFile, mod, mod.exports);
  return mod.exports;
}
const { dogDepthModules } = load("lib/learning-dog-depth.js");
const { dogDepthIndependentSources, dogDepthSourceReview } = load("lib/dog-depth-independent-sources.js");

test("Supplemental claims have a responsible organization and a bounded source scope", () => {
  for (const source of Object.values(dogDepthIndependentSources)) {
    assert.ok(source.organization && source.label);
    assert.ok(source.scope.length > 45, source.label);
    assert.equal(source.checkedOn, "2026-10-12");
    assert.equal(new URL(source.url).protocol, "https:");
    assert.notEqual(new URL(source.url).hostname, "www.fci.be");
  }
  assert.match(dogDepthIndependentSources.training.scope, /Kein Beleg für Rasseeinordnung/);
  assert.match(dogDepthIndependentSources.schweizerLauf.scope, /nicht den Niederlaufhund/);
});

test("Every source-review entry refers to its actual course and lesson and preserves evidence gaps", () => {
  for (const [courseId, review] of Object.entries(dogDepthSourceReview)) {
    const course = dogDepthModules.find(item => item.id === courseId);
    assert.ok(course, courseId);
    assert.equal(review.lessons.length, course.lessons.length);
    assert.ok(course.sources.some(source => new URL(source.url).hostname === "www.fci.be"));
    for (const item of review.lessons) {
      const lesson = course.lessons.find(lesson => lesson.id === `${courseId}-${item.lesson}`);
      assert.ok(lesson, item.lesson);
      assert.deepEqual(lesson.sourceReview, item);
      assert.ok(item.confirmedClaims.length);
      for (const id of item.sourceIds) {
        const source = dogDepthIndependentSources[id];
        assert.ok(source, id);
        assert.ok(course.sources.some(candidate => candidate.url === source.url));
      }
    }
  }
  const swiss = dogDepthSourceReview["wissen-vertiefung-hunde-bracken-nordische"].lessons.find(item => item.lesson === "schweiz");
  assert.ok(swiss.standardOnly.some(text => /Niederlaufhund/.test(text)));
  const pointer = dogDepthSourceReview["wissen-vertiefung-hunde-vorstehrassen"].lessons.find(item => item.lesson === "spanielnamen");
  assert.ok(pointer.standardOnly.some(text => /Breton/.test(text)));
});
