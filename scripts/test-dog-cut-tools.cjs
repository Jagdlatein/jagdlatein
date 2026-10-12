const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const localRequire = createRequire(path.join(root, "package.json"));
const swc = localRequire("next/dist/build/swc");
function load(relative) {
  const filename = path.join(root, relative);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, "utf8"), { filename, jsc: { parser: { syntax: "ecmascript" }, target: "es2020" }, module: { type: "commonjs" } });
  new Function("require", "module", "exports", code)(localRequire, mod, mod.exports);
  return mod.exports;
}
const dog = load("lib/hunting-dog-video-lessons.js");
const meat = load("lib/venison-cut-guide.js");
const seconds = timestamp => timestamp.split(":").reduce((sum, value) => sum * 60 + Number(value), 0);

test("Real dog recordings have verified attribution, matching files and usable timed captions", () => {
  const provenance = JSON.parse(fs.readFileSync(path.join(root, "public/lernen/hundevideos-2026/media-provenance.json"), "utf8"));
  assert.equal(dog.huntingDogVideoLessons.length, 4);
  for (const lesson of dog.huntingDogVideoLessons) {
    const item = provenance.find(entry => entry.id === lesson.id);
    assert.ok(item, lesson.id);
    assert.equal(item.author, lesson.media.author);
    assert.equal(item.videoCodec, "h264");
    assert.equal(item.audio, false);
    assert.ok(Math.abs(item.duration - lesson.duration) < .1, lesson.id);
    const video = fs.readFileSync(path.join(root, "public", lesson.src));
    assert.equal(video.subarray(4, 8).toString(), "ftyp", lesson.id);
    assert.equal(crypto.createHash("sha256").update(video).digest("hex"), item.outputSha256);
    assert.equal(video.includes(Buffer.from("soun")), false, "Silent captioned edition must not contain an audio track");
    for (const asset of [lesson.poster, lesson.captions]) assert.ok(fs.statSync(path.join(root, "public", asset)).size > 70, asset);
    const vtt = fs.readFileSync(path.join(root, "public", lesson.captions), "utf8");
    assert.ok(vtt.startsWith("WEBVTT"));
    const timings = [...vtt.matchAll(/(\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}\.\d{3})/g)];
    assert.ok(timings.length);
    let previousEnd = 0;
    for (const [, start, end] of timings) {
      assert.ok(seconds(start) >= previousEnd);
      assert.ok(seconds(end) > seconds(start));
      assert.ok(seconds(end) <= lesson.duration + .03);
      previousEnd = seconds(end);
    }
  }
});

test("Each topic distinguishes observation from context and uses independent expert organizations", () => {
  for (const lesson of dog.huntingDogVideoLessons) {
    assert.ok(lesson.observations.length >= 2);
    assert.ok(lesson.context && lesson.lesson && lesson.practice && lesson.transcript);
    assert.ok(new Set(lesson.sources.map(id => dog.dogVideoSources[id].organization)).size >= 2, lesson.id);
    for (const question of lesson.questions) {
      assert.equal(new Set(question.choices).size, question.choices.length);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.choices.length);
      assert.ok(question.explanation.length > 40);
    }
  }
  assert.match(dog.huntingDogVideoLessons.find(item => item.id === "basset-faehrtenende").context, /vorangegangene Suche.*nicht zu sehen/);
  assert.match(dog.huntingDogVideoLessons.find(item => item.id === "labrador-signal").lesson, /keinen Lautnachweis/);
  assert.match(dog.huntingDogVideoLessons.find(item => item.id === "golden-wasser").lesson, /keine automatische Eignung/);
  const bodyLesson = dog.huntingDogVideoLessons.find(item => item.id === "rute-kontext");
  assert.match(bodyLesson.lesson, /allein.*nicht sicher/);
  assert.deepEqual(bodyLesson.sources, ["rspcaBody", "dogsTrustBody"]);
});

test("Each meat label points inside the source-verified crop and all derived photos retain provenance", () => {
  const source = JSON.parse(fs.readFileSync(path.join(root, "public/lernen/wildbret-stuecke-2026/media-provenance.json"), "utf8"));
  assert.equal(source.author, meat.venisonCutPhoto.author);
  assert.equal(source.license, "CC BY 3.0");
  assert.deepEqual(meat.venisonCuts.map(item => item.id), ["schulter", "rippen", "keule", "ruecken", "hals"]);
  for (const cut of meat.venisonCuts) {
    const [left, top, right, bottom] = source.cropBoxes[cut.id];
    const x = cut.marker.x / 100 * source.dimensions[0];
    const y = cut.marker.y / 100 * source.dimensions[1];
    assert.ok(x > left && x < right && y > top && y < bottom, cut.id);
    assert.ok(new Set(cut.sources.map(id => meat.venisonCutSources[id].organization)).size >= 2, cut.id);
    const photo = fs.readFileSync(path.join(root, "public", cut.photo));
    assert.equal(photo.subarray(0, 4).toString(), "RIFF");
    assert.equal(photo.subarray(8, 12).toString(), "WEBP");
    assert.equal(crypto.createHash("sha256").update(photo).digest("hex"), source.outputs[path.basename(cut.photo)]);
  }
  assert.match(meat.venisonCuts.find(item => item.id === "ruecken").distinction, /kein separat ausgelegtes Filet/);
  assert.match(meat.venisonKitchenSafety.text, /70 °C über zwei Minuten/);
  assert.match(meat.venisonKitchenSafety.text, /Kühlschrank auftauen/);
});

test("Cut search supports anatomical aliases, cooking terms, umlauts and combined words", () => {
  const ids = query => meat.findVenisonCuts(query).map(item => item.id);
  assert.deepEqual(ids("Schlegel"), ["keule"]);
  assert.deepEqual(ids("Nuss"), ["keule"]);
  assert.deepEqual(ids("Träger"), ["hals"]);
  assert.deepEqual(ids("Trager"), ["hals"]);
  assert.deepEqual(ids("Rücken Grillen"), ["ruecken"]);
  assert.deepEqual(ids("Rucken Grillen"), ["ruecken"]);
  assert.deepEqual(ids("Gulasch"), ["schulter", "hals"]);
  assert.deepEqual(ids("Filet"), ["ruecken"]);
  assert.deepEqual(ids("Banane"), []);
  assert.equal(ids(" ").length, 5);
});

test("Search entries deep-link to an actual scene or cut, with no fabricated asset paths", () => {
  for (const [entries, pathname, allowedIds] of [[dog.huntingDogVideoSearchEntries, "/lernen/jagdhund-videos", dog.huntingDogVideoLessons.map(item => item.id)], [meat.venisonCutSearchEntries, "/lernen/wildbret-stuecke", meat.venisonCuts.map(item => item.id)]]) {
    assert.ok(fs.existsSync(path.join(root, "pages", `${pathname}.js`)));
    for (const entry of entries) {
      const url = new URL(entry.href, "https://jagdlatein.de");
      assert.equal(url.pathname, pathname);
      assert.ok(allowedIds.includes(url.searchParams.get("eintrag")));
      assert.ok(entry.keywords.length >= 5);
    }
  }
});
