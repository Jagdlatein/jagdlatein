// Existing Oct29 goldens remain unchanged. Compose only already reviewed,
// explicitly named appendices that were subsequently published.
const assert = require('node:assert/strict');
const { novemberLearningBaselineFixture } = require('./november-learning-baseline.cjs');
const { stockenteLamellaeBaselineFixture } = require('./stockente-lamellae-addition-nov01.cjs');
const { avianCecaBaselineFixture } = require('./avian-ceca-addition-oct29.cjs');
const { beforeCootSwimmingLobesGuide } = require('./coot-swimming-lobes-addition-nov01.cjs');
function afterExamKnowledgeSnapshotFixture(overrides = {}) {
  return stockenteLamellaeBaselineFixture(avianCecaBaselineFixture(novemberLearningBaselineFixture(overrides)));
}
function beforeNovemberBirdFoundationGuide(targets) {
  // The existing coot helper validates and removes only bird-leg and swimming-
  // lobe card counts. The remaining single increment is the exact Nickhaut card.
  return beforeCootSwimmingLobesGuide(targets).map(target => {
    if (target.moduleId !== 'wissen-ausbau-biologie-vogelkoerper-2026') return target;
    assert.equal(target.flashcardCount, 37);
    return { ...target, flashcardCount: target.flashcardCount - 1 };
  });
}
module.exports = { afterExamKnowledgeSnapshotFixture, beforeNovemberBirdFoundationGuide };
