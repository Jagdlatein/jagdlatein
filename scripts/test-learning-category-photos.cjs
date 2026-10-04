const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/lernen/kategorien-2026/quellen.json"), "utf8"));
const readModule = async relative => import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(path.join(root, relative), "utf8")).toString("base64")}`);

test("All twelve categories have their own documented photograph and the published map matches the source manifest", async () => {
  const [{ categoryPhotographs }, { learningCategoryDetails }] = await Promise.all([readModule("lib/learning-category-photos.js"), readModule("lib/learning-categories.js")]);
  assert.equal(manifest.assets.length, 12);
  assert.deepEqual(Object.keys(categoryPhotographs).sort(), learningCategoryDetails.map(category => category.slug).sort());
  assert.equal(new Set(manifest.assets.map(photo => photo.src)).size, 12);
  for (const photo of manifest.assets) {
    assert.deepEqual(categoryPhotographs[photo.category], photo);
    assert.ok(photo.author && photo.alt && photo.caption);
    assert.equal(new URL(photo.sourceUrl).hostname, "commons.wikimedia.org");
    assert.ok(new URL(photo.sourceUrl).pathname.startsWith("/wiki/File:"));
    assert.ok(/^(CC0 1\.0|CC BY(?:-SA)? \d\.\d(?: DE)?|Gemeinfrei \(PD-self\))$/.test(photo.license));
    assert.ok(new URL(photo.licenseUrl).protocol === "https:");
    assert.equal(photo.aiGenerated, false);
    assert.equal(photo.provenance.type, "documentary-photograph");
    assert.equal(photo.fit, "cover");
    assert.equal(photo.categoryCover, true);
    assert.equal(photo.objectPosition, `${photo.cropFocus.x}% ${photo.cropFocus.y}%`);
    assert.ok([photo.cropFocus.x, photo.cropFocus.y].every(value => value >= 0 && value <= 100));
    assert.ok(photo.cropFocus.reason);
    if (photo.photoDate) {
      assert.match(photo.photoDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(photo.photoDate <= manifest.checkedAt);
    }
  }
});

test("Every selected JPEG decodes at its recorded dimensions and matches its manifest checksum", async () => {
  const { learningImagePaths } = await readModule("lib/learning-image-paths.js");
  for (const photo of manifest.assets) {
    assert.ok(learningImagePaths.includes(photo.src), `Public image whitelist missing ${photo.src}`);
    const file = path.join(root, "public", photo.src);
    const bytes = fs.readFileSync(file);
    const image = await sharp(bytes).metadata();
    assert.equal(image.format, "jpeg");
    assert.equal(image.width, photo.width);
    assert.equal(image.height, photo.height);
    assert.ok(image.width >= 1200, `Insufficient width: ${photo.src}`);
    assert.ok(image.height >= 600, `Insufficient height: ${photo.src}`);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), photo.sha256);
  }
});
