// Retain October's positive object/hash assertions while excluding the exact
// later reviewed appendices. Each existing helper owns its IDs/source scope;
// no date cutoff, lesson-count truncation or replacement expected hash is used.
const { alulaBaselineFixture } = require('./alula-addition-nov15.cjs');
const { featherFieldsBaselineFixture } = require('./feather-fields-additions-nov08.cjs');
const { broodPatchBaselineFixture } = require('./brood-patch-addition-nov08.cjs');
const { lenticelBaselineFixture } = require('./lenticel-addition-nov08.cjs');
const { digestionAbsorptionBaselineFixture } = require('./digestion-absorption-addition-nov08.cjs');
const { rootAbsorptionBaselineFixture } = require('./root-absorption-additions-nov08.cjs');
const { foodSporesToxinsBaselineFixture } = require('./food-spores-toxins-additions-nov08.cjs');
const { ecologyConceptBaselineFixture } = require('./ecology-concepts-addition-nov08.cjs');
const { winterForestBaselineFixture } = require('./winter-forest-baseline-nov08.cjs');
const { avianNictitatingBaselineFixture } = require('./avian-nictitating-addition-nov01.cjs');
const { cootSwimmingLobesBaselineFixture } = require('./coot-swimming-lobes-addition-nov01.cjs');

function novemberLearningBaselineFixture(overrides = {}) {
  return [alulaBaselineFixture, featherFieldsBaselineFixture, broodPatchBaselineFixture,
    lenticelBaselineFixture, digestionAbsorptionBaselineFixture, rootAbsorptionBaselineFixture,
    foodSporesToxinsBaselineFixture, ecologyConceptBaselineFixture, winterForestBaselineFixture,
    avianNictitatingBaselineFixture, cootSwimmingLobesBaselineFixture]
    .reduce((result, project) => project(result), overrides);
}
module.exports = { novemberLearningBaselineFixture };
