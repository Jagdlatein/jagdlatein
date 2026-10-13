const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const swc = projectRequire('next/dist/build/swc');
function load(relative) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id))) : projectRequire(id), mod, mod.exports);
  return mod.exports;
}
const data = load('lib/pond-life-learning.js');
const report = load('docs/pond-life-oct13.json');

test('Pond profiles fit the existing learning schema without a new country split', () => {
  assert.deepEqual(data.pondLifeTopics.map(topic => topic.id), ['libellenlarven', 'wasserlaeufer']);
  assert.deepEqual(data.pondLifeGroups, [{ id: 'pond', title: 'Teich und Gewässerrand' }]);
  for (const topic of data.pondLifeTopics) {
    assert.equal(topic.group, 'pond');
    assert.equal(topic.reviewedOn, data.pondLifeReviewedOn);
    assert.equal(topic.facts.length, 3);
    assert.ok(topic.aliases.length > 3);
    assert.ok(topic.connections.length >= 2 && topic.connections.length <= 3);
    assert.ok(topic.observe.length > 80 && topic.limit.length > 80 && topic.photoContext.length > 80);
    assert.equal(topic.quiz.choices.length, 3);
    assert.ok(Number.isInteger(topic.quiz.answer) && topic.quiz.answer >= 0 && topic.quiz.answer < topic.quiz.choices.length);
    assert.ok(topic.quiz.explanation.length > 80);
    assert.ok(!('country' in topic) && !('countries' in topic));
  }
});

test('Every factual block and specific subclaim has a recorded independent evidence pair', () => {
  assert.equal(report.reviewedOn, data.pondLifeReviewedOn);
  const inventory = new Map(report.sourceInventory.map(source => [source.sourceId, source]));
  for (const topic of data.pondLifeTopics) {
    const evidence = report.topics.find(entry => entry.id === topic.id);
    assert.deepEqual(evidence.claims.map(claim => claim.factId), topic.facts.map(fact => fact.id));
    for (const fact of topic.facts) {
      const claim = evidence.claims.find(entry => entry.factId === fact.id);
      assert.deepEqual(claim.sourceIds, fact.sourceIds);
      assert.deepEqual(claim.support.map(source => source.sourceId), fact.sourceIds);
      assert.ok(claim.boundary && claim.support.every(source => source.section && source.supports));
      const independent = ids => new Set(ids.map(id => data.pondLifeSources[id].organization)).size >= 2;
      assert.ok(independent(fact.sourceIds));
      for (const pair of claim.subclaimPairs || []) assert.ok(independent(pair.sourceIds));
      for (const id of fact.sourceIds) {
        const source = inventory.get(id);
        assert.ok(source && source.readOn === data.pondLifeReviewedOn && source.sectionsRead.length);
        assert.equal(source.url, data.pondLifeSources[id].url);
        assert.equal(source.organization, data.pondLifeSources[id].organization);
      }
    }
  }
  assert.ok(report.rejectedSourceClaims.some(claim => claim.sourceId === 'pondNpsLegs'));
});

test('Real photographs keep verified dimensions, exact licensing and content hashes', async () => {
  const sharp = projectRequire('sharp');
  const records = load('public/lernen/pond-life-2026/bildnachweise.json');
  assert.equal(records.length, 2);
  for (const photo of records) {
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.width, photo.width); assert.equal(meta.height, photo.height);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), photo.sha256);
    assert.equal(photo.aiGenerated, false); assert.equal(photo.visuallyVerified, true);
    assert.ok(photo.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
    assert.ok(photo.originalUrl && photo.downloadUrl && photo.author && photo.visualReview && photo.modifications);
    assert.equal(photo.reviewedOn, data.pondLifeReviewedOn);
    assert.deepEqual(data.pondLifeTopics.find(topic => topic.id === photo.id).photo, photo);
  }
  assert.equal(records[0].license, 'CC BY-SA 2.5');
  assert.equal(records[1].license, 'CC BY-SA 4.0');
});

test('Teaching limits distinguish a photographed animal from a measurement or general species key', () => {
  const larva = data.pondLifeTopics[0], strider = data.pondLifeTopics[1];
  assert.match(larva.facts[0].text, /kein Puppenstadium/);
  assert.match(larva.facts[1].text, /Unterlippe/);
  assert.match(larva.photoContext, /Alter.*nicht dokumentiert.*keinen Beutefang/s);
  assert.match(larva.limit, /weder Larvenalter noch Wasserqualität/);
  assert.match(strider.facts[0].text, /Oberflächenspannung.*wasserabweisende Haare.*keine Tragkraft/s);
  assert.match(strider.photoContext, /keinen vollständigen Fangablauf.*keine Fangrate/s);
  assert.match(strider.observe, /nichts ins Gewässer geben/);
});
