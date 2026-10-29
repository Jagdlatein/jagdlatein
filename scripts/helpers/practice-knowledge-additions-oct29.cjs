// Two exact appendices accompany the new reciprocal practice-reading links.
const assert = require('node:assert/strict');
const { speciesRelationsBaselineFixture } = require('./species-relations-addition-oct29.cjs');
const { roeAntlerCastingBaselineFixture } = require('./roe-antler-casting-addition-oct29.cjs');
function practiceKnowledgeBaselineFixture(overrides = {}) {
  return speciesRelationsBaselineFixture(roeAntlerCastingBaselineFixture(overrides));
}
// Historical full-guide snapshots remove only this named two-card increment.
// Assert the real current value first; unrelated fields and targets survive.
function beforeRoeAntlerCastingGuide(targets) {
  return targets.map(target => {
    if (target.moduleId !== 'wissen-rehwild-jahreslauf') return target;
    assert.equal(target.flashcardCount, 2);
    return { ...target, flashcardCount: 0 };
  });
}
module.exports = { practiceKnowledgeBaselineFixture, beforeRoeAntlerCastingGuide };
