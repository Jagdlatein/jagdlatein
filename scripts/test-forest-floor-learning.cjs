const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const media = JSON.parse(fs.readFileSync(path.join(root, "public/lernen/forest-floor-2026/bildnachweise.json"), "utf8"));
const report = JSON.parse(fs.readFileSync(path.join(root, "docs/forest-floor-oct13.json"), "utf8"));
const code = fs.readFileSync(path.join(root, "lib/forest-floor-learning.js"), "utf8")
  .replace(/^import photoRecords[^\n]+\n/, "")
  .replace(/export const /g, "const ");
const context = { photoRecords: media };
vm.createContext(context);
vm.runInContext(`${code}\nthis.data = { forestFloorReviewedOn, forestFloorSources, forestFloorTopics };`, context);
const { forestFloorReviewedOn, forestFloorSources, forestFloorTopics } = context.data;
const inventory = Object.fromEntries(report.sourceInventory.map(source => [source.id, source]));

test("each new soil fact has distinct supporting organizations and a matching review record", () => {
  assert.equal(forestFloorReviewedOn, report.reviewedOn);
  assert.equal(new Set(forestFloorTopics.map(topic => topic.id)).size, 2);
  assert.equal(report.claimChecks.length, 6);
  for (const topic of forestFloorTopics) {
    assert.equal(topic.group, "boden");
    assert.equal(topic.facts.length, 3);
    for (const fact of topic.facts) {
      const checked = report.claimChecks.find(claim => claim.id === `${topic.id}.${fact.id}`);
      assert.ok(checked, `${topic.id}.${fact.id} missing factual review`);
      assert.equal(checked.status, "checked");
      assert.deepEqual(Array.from(fact.sourceIds), checked.sourceIds);
      const organizations = new Set(fact.sourceIds.map(id => {
        assert.ok(forestFloorSources[id] && inventory[id], `${id} missing source inventory`);
        assert.equal(inventory[id].url, forestFloorSources[id].url);
        assert.equal(inventory[id].accessedOn, report.reviewedOn);
        return inventory[id].independenceKey;
      }));
      assert.ok(organizations.size >= 2, `${topic.id}.${fact.id} lacks independent sources`);
      assert.deepEqual(Array.from(organizations), checked.independentOrganizations);
    }
  }
});

test("quizzes refer to the reviewed facts and have an in-range unique answer", () => {
  for (const topic of forestFloorTopics) {
    assert.ok(Number.isInteger(topic.quiz.answer));
    assert.ok(topic.quiz.answer >= 0 && topic.quiz.answer < topic.quiz.choices.length);
    assert.equal(new Set(topic.quiz.choices).size, topic.quiz.choices.length);
    assert.ok(topic.quiz.explanation.length);
    const claimIds = report.derivedContent[topic.id].quiz;
    assert.ok(claimIds.length);
    for (const id of claimIds) assert.ok(report.claimChecks.some(claim => claim.id === id));
    assert.equal(topic.reviewedOn, forestFloorReviewedOn);
  }
});

test("every learning photo matches a real licensed local file and the byte-level manifest", async () => {
  assert.equal(media.length, forestFloorTopics.length);
  for (const topic of forestFloorTopics) {
    const photo = media.find(item => item.id === topic.id);
    assert.ok(photo && topic.photo);
    assert.equal(topic.photo.src, photo.src);
    assert.equal(photo.aiGenerated, false);
    assert.equal(photo.license, "CC BY 4.0");
    assert.match(photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.ok(photo.author && photo.visualReview && photo.modifications && photo.alt);
    const bytes = fs.readFileSync(path.join(root, "public", photo.src));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), photo.sha256);
    const measured = await sharp(bytes).metadata();
    assert.equal(measured.format, "jpeg");
    assert.equal(measured.width, photo.width);
    assert.equal(measured.height, photo.height);
    assert.equal(photo.reviewedOn, report.reviewedOn);
  }
});
