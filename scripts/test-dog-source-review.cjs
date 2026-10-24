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
const sourcesAddedOctober13 = new Set(["handlerBelief", "handlerKnowledge", "markerDogsTrust", "markerBlueCross", "recallDogsTrust", "recallRspca", "heatVetmed", "heatPdsa", "pantingPdsa", "firstAidZurich"]);
const sourcesAddedOctober24 = new Set(["sniffAirflowCraven", "sniffAirflowJendrny"]);
const expectedReviewedLessons = {
  "wissen-vertiefung-hunde-vorstehrassen": ["deutsche-vielfalt", "varietaeten", "spanielnamen", "italienische-arbeitsweise", "setter"],
  "wissen-vertiefung-hunde-bracken-nordische": ["oesterreich", "dachsbracken", "schweiz", "nordische", "herkunft-kontext"],
  "wissen-vertiefung-hunde-retriever-spaniels": ["sechs-retriever", "flat-curly", "wasser-tolling", "spanielprofile", "auftrag-uebergabe"],
  "wissen-vertiefung-hunde-nase-spur-laut": ["fundkontrolle", "ausatemrichtung"],
  "wissen-vertiefung-hunde-klare-lernsignale": ["markerzeitpunkt", "rueckruf-gesichert", "belastung-pausen"],
};

test("Supplemental claims have a responsible organization and a bounded source scope", () => {
  for (const [id, source] of Object.entries(dogDepthIndependentSources)) {
    assert.ok(source.organization && source.label);
    assert.ok(source.scope.length > 45, source.label);
    assert.equal(source.checkedOn, sourcesAddedOctober24.has(id) ? "2026-10-24" : sourcesAddedOctober13.has(id) ? "2026-10-13" : "2026-10-12", id);
    assert.equal(new URL(source.url).protocol, "https:");
    assert.notEqual(new URL(source.url).hostname, "www.fci.be");
  }
  assert.match(dogDepthIndependentSources.training.scope, /Kein Beleg für Rasseeinordnung/);
  assert.match(dogDepthIndependentSources.schweizerLauf.scope, /nicht den Niederlaufhund/);
  for (const id of sourcesAddedOctober13) assert.ok(dogDepthIndependentSources[id], id);
});

test("Every source-review entry refers to its actual course and lesson and preserves evidence gaps", () => {
  for (const [courseId, review] of Object.entries(dogDepthSourceReview)) {
    const course = dogDepthModules.find(item => item.id === courseId);
    assert.ok(course, courseId);
    assert.deepEqual(review.lessons.map(item => item.lesson), expectedReviewedLessons[courseId], courseId);
    assert.ok(review.scope.length > 80, "Partial review needs an explicit source scope");
    if (["wissen-vertiefung-hunde-vorstehrassen", "wissen-vertiefung-hunde-bracken-nordische", "wissen-vertiefung-hunde-retriever-spaniels"].includes(courseId)) {
      assert.ok(course.sources.some(source => new URL(source.url).hostname === "www.fci.be"));
    }
    for (const item of review.lessons) {
      const lesson = course.lessons.find(lesson => lesson.id === `${courseId}-${item.lesson}`);
      assert.ok(lesson, item.lesson);
      assert.deepEqual(lesson.sourceReview, item);
      assert.ok(item.confirmedClaims.length);
      if (["wissen-vertiefung-hunde-nase-spur-laut", "wissen-vertiefung-hunde-klare-lernsignale"].includes(courseId)) assert.equal(item.checkedOn, item.lesson === "ausatemrichtung" ? "2026-10-24" : "2026-10-13");
      for (const id of item.sourceIds) {
        const source = dogDepthIndependentSources[id];
        assert.ok(source, id);
        assert.ok(course.sources.some(candidate => candidate.url === source.url));
      }
    }
    for (const lesson of course.lessons) {
      const reviewed = review.lessons.some(item => lesson.id === `${courseId}-${item.lesson}`);
      if (!reviewed) assert.equal(lesson.sourceReview, null, `${lesson.id} must retain an unreviewed status`);
    }
  }
  const swiss = dogDepthSourceReview["wissen-vertiefung-hunde-bracken-nordische"].lessons.find(item => item.lesson === "schweiz");
  assert.ok(swiss.standardOnly.some(text => /Niederlaufhund/.test(text)));
  const pointer = dogDepthSourceReview["wissen-vertiefung-hunde-vorstehrassen"].lessons.find(item => item.lesson === "spanielnamen");
  assert.ok(pointer.standardOnly.some(text => /Breton/.test(text)));
  const unreviewed = dogDepthModules.flatMap(course => course.lessons).filter(lesson => lesson.sourceReview === null);
  assert.equal(unreviewed.length, 10, "The ten older non-breed lessons have not acquired a new per-lesson review");
  assert.equal(dogDepthSourceReview["wissen-vertiefung-hunde-bracken-nordische"].lessons.filter(item => item.standardOnly.length > 0).length, 5);
});
