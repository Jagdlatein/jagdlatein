const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./helpers/project-module.cjs');
const guide = createLoader()('lib/revier-photo-guide.js');
const review = require('../data/reviews/revier-photo-guide-2026-10-22.json');
const root = path.resolve(__dirname, '..');

test('Empty and unknown input never determines an animal', () => {
  for (const input of [undefined, {}, { group: 'not-a-group', traits: ['pale-rump'] }]) {
    const result = guide.getPhotoGuideMatches(input);
    assert.equal(result.status, 'needs-group');
    assert.deepEqual(result.matches, []);
  }
  assert.equal(guide.getPhotoGuideMatches({ group: 'cervids' }).status, 'needs-traits');
  assert.equal(guide.getPhotoGuideMatches({ group: 'cervids', traits: [] }).status, 'needs-traits');
});

test('A shared trait deliberately retains all relevant comparison cards', () => {
  const result = guide.getPhotoGuideMatches({ group: 'cervids', traits: ['pale-rump'] });
  assert.equal(result.status, 'comparison');
  assert.deepEqual(result.matches.map(c => c.id), ['rehwild', 'rotwild', 'damwild']);
  assert.match(result.message, /offen/);
  for (const item of result.matches) {
    assert.equal(item.matchedTraits.length, 1);
    assert.ok(!('confidence' in item));
    assert.ok(!('score' in item));
    assert.ok(!('probability' in item));
  }
});

test('Positive intersection does not loosen a contradiction into a single confident result', () => {
  const impossible = guide.getPhotoGuideMatches({ group: 'cervids', traits: ['no-visible-tail', 'palmate-antlers'] });
  assert.equal(impossible.status, 'no-match');
  assert.deepEqual(impossible.matches, []);
  assert.match(impossible.message, /schließt keine Art aus/);
  const comparative = guide.getPhotoGuideMatches({ group: 'cervids', traits: ['pale-rump', 'palmate-antlers'] });
  assert.deepEqual(comparative.matches.map(c => c.id), ['damwild']);
  assert.match(comparative.message, /Bestimmung bleibt offen/);
});

test('Wrong-group traits, malformed arrays and unknown traits cannot be silently discarded', () => {
  for (const traits of ['pale-rump', 1, {}, [null], ['pale-rump', 'made-up'], ['hooked-horns']]) {
    const result = guide.getPhotoGuideMatches({ group: 'cervids', traits });
    assert.equal(result.status, 'no-match');
    assert.deepEqual(result.matches, []);
  }
  const repeated = guide.getPhotoGuideMatches({ group: 'cervids', traits: ['pale-rump', 'pale-rump'] });
  assert.deepEqual(repeated.selectedTraits, ['pale-rump']);
  assert.equal(repeated.matches.length, 3);
});

test('Every authored comparison is reachable, scoped and linked to an existing local route', () => {
  const ids = new Set();
  assert.equal(guide.PHOTO_GUIDE_CANDIDATES.filter(c => c.group !== 'tracks').length, 8);
  assert.equal(guide.PHOTO_GUIDE_CANDIDATES.filter(c => c.group === 'tracks').length, 3);
  for (const card of guide.PHOTO_GUIDE_CANDIDATES) {
    assert.ok(!ids.has(card.id)); ids.add(card.id);
    const group = guide.PHOTO_GUIDE_GROUPS.find(g => g.id === card.group);
    assert.ok(group);
    for (const trait of card.traits) {
      assert.ok(group.traits.some(t => t.id === trait), card.id + ':' + trait);
      assert.ok(guide.getPhotoGuideMatches({ group: card.group, traits: [trait] }).matches.some(c => c.id === card.id));
    }
    assert.ok(card.limitations.length > 30);
    assert.ok(card.href.startsWith('/'));
    assert.ok(fs.existsSync(path.join(root, 'pages', card.href + '.js')), card.href);
    if (card.group === 'tracks') {
      assert.equal(card.scientificName, '');
      assert.equal(card.href, '/lernen/spurenwerkstatt');
      assert.match(card.limitations, /kein|keine/);
    }
  }
});

test('Every retained morphological claim has a recorded independent-source comparison', () => {
  assert.equal(review.reviewedOn, guide.PHOTO_GUIDE_REVIEWED_ON);
  assert.equal(review.claims.length, guide.PHOTO_GUIDE_CANDIDATES.flatMap(c => c.facts).length);
  const sources = new Map(guide.PHOTO_GUIDE_SOURCES.map(s => [s.id, s]));
  for (const card of guide.PHOTO_GUIDE_CANDIDATES) {
    for (const fact of card.facts) {
      const row = review.claims.find(c => c.id === fact.id);
      assert.ok(row, fact.id);
      assert.equal(row.claim, fact.text, fact.id);
      assert.deepEqual(row.sourceIds, fact.sourceIds, fact.id);
      const organizations = new Set();
      for (const id of fact.sourceIds) {
        const source = sources.get(id);
        assert.ok(source, id);
        assert.ok(source.url.startsWith('https://'));
        assert.ok(row.evidence.some(e => e.sourceId === id && e.section.length > 15), fact.id + ':' + id);
        organizations.add(source.organization);
      }
      assert.ok(organizations.size >= 2, fact.id);
    }
    for (const sourceId of card.question.sourceIds) {
      assert.ok(sources.has(sourceId));
      assert.ok(card.sources.some(s => s.id === sourceId), card.id + ': question citation');
    }
    const questionRow = review.questions.find(q => q.candidateId === card.id);
    assert.equal(questionRow.prompt, card.question.prompt);
    assert.equal(questionRow.answer, card.question.answer);
    assert.equal(questionRow.explanation, card.question.explanation);
    assert.deepEqual(questionRow.sourceIds, card.question.sourceIds);
  }
});

test('The matching helper does not mutate caller input or shared authored data', () => {
  const input = { group: 'mountain', traits: ['hooked-horns'] };
  const before = JSON.stringify(guide.PHOTO_GUIDE_CANDIDATES);
  const result = guide.getPhotoGuideMatches(input);
  assert.deepEqual(input, { group: 'mountain', traits: ['hooked-horns'] });
  assert.equal(JSON.stringify(guide.PHOTO_GUIDE_CANDIDATES), before);
  assert.deepEqual(result.matches.map(c => c.id), ['gamswild']);
  assert.match(guide.PHOTO_GUIDE_LIMITATIONS, /analysiert das Foto nicht/);
});
