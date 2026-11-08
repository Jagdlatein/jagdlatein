// Historical assertions keep their original full-object baselines. The two
// independent narrow helpers validate and remove only the later appendices.
const { marmotHibernationBaselineFixture } = require('./marmot-hibernation-addition-nov08.cjs');
const { forestRegenerationBaselineFixture } = require('./forest-regeneration-additions-nov08.cjs');
function winterForestBaselineFixture(overrides = {}) {
  return forestRegenerationBaselineFixture(marmotHibernationBaselineFixture(overrides));
}
module.exports = { winterForestBaselineFixture };
