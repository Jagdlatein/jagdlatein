// Explicit historical metadata fixtures only. The current guide is positively
// compared with the actual 22 target decks and 114 species in its own suite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./project-module.cjs');
const today = Object.freeze([
  { moduleId: 'wissen-vertiefung-wild-alpine-winterstrategien', key: 'alpine', current: 6, previous: 4 },
  { moduleId: 'wissen-ausbau-biologie-vogelkoerper-2026', key: 'birdBody', current: 41, previous: 39 },
  { moduleId: 'wissen-vertiefung-wild-huehner-nachwuchs', key: 'chickens', current: 2, previous: 0 },
  { moduleId: 'wissen-rotwild-sozialverhalten', key: 'red', current: 2, previous: 0 },
].map(Object.freeze));
const baseline610CountSHA = '6c2373ad4a3ec919a83a21778512422fa3743b277dfbc246b9d10e471c19e5d6';
const countBlock = /const flashcardCounts = \{[\s\S]*?\n\};/g;
const hash = value => createHash('sha256').update(value).digest('hex');
function blockFrom(source) {
  const matches = [...source.replaceAll('\r\n', '\n').matchAll(countBlock)];
  assert.equal(matches.length, 1, 'Exactly one authored guide count block is required');
  return matches[0][0];
}
function replaceCount(block, key, current, previous) {
  const pattern = new RegExp(`\\b${key}: ${current}\\b`, 'g');
  assert.equal([...block.matchAll(pattern)].length, 1, `Unexpected guide count: ${key}`);
  return block.replace(pattern, `${key}: ${previous}`);
}
function beforeWildlifeGuideCountsNov25(targets) {
  assert.ok(Array.isArray(targets));
  return targets.map(target => {
    const correction = today.find(item => target?.moduleId === item.moduleId && !target.lessonId);
    if (!correction) return target;
    assert.equal(target.flashcardCount, correction.current, correction.key);
    return { ...target, flashcardCount: correction.previous };
  });
}
function projectGuideCountSource610(source) {
  const normalized = source.replaceAll('\r\n', '\n');
  let block = blockFrom(normalized);
  block = replaceCount(block, 'alpine', 6, 4);
  block = replaceCount(block, 'birdBody', 41, 39);
  assert.equal((block.match(/, chickens: 2, red: 2,/g) || []).length, 1);
  block = block.replace(', chickens: 2, red: 2,', ',');
  // This is the exact complete count block published in6101989, not a
  // permissive removal of arbitrary counts or future target metadata.
  assert.equal(hash(block), baseline610CountSHA);
  return normalized.replace(countBlock, block);
}
function projectPublishedGuideCounts686(source610) {
  const normalized = source610.replaceAll('\r\n', '\n');
  let block = blockFrom(normalized);
  assert.equal(hash(block), baseline610CountSHA);
  // Separately named earlier publications: bird32->34(25807fe),34->36
  // (49b462f),36->37(6cb07b1),37->38(7d6c08a),38->39(6b27f67).
  for (const [current, previous] of [[39, 38], [38, 37], [37, 36], [36, 34], [34, 32]]) block = replaceCount(block, 'birdBody', current, previous);
  // The roe0->2 availability correction was already published in74dfb34.
  assert.equal((block.match(/, roe: 2,/g) || []).length, 1);
  block = block.replace(', roe: 2,', ',');
  // PigeonMilk remains unchanged: the original suite separately preserves
  // its added fourth Ringeltaube target and compares the other three.
  return normalized.replace(countBlock, block);
}
function wildlifeGuideCounts686Module() {
  const relative = 'lib/wildlife-learning-guide.js';
  const source = projectPublishedGuideCounts686(projectGuideCountSource610(fs.readFileSync(path.join(root, relative), 'utf8')));
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: relative, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} }, load = createLoader();
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
    ? load(path.posix.join('lib', path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
  return module.exports;
}
module.exports = { today, beforeWildlifeGuideCountsNov25, projectGuideCountSource610, projectPublishedGuideCounts686, wildlifeGuideCounts686Module };
