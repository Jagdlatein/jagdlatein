// The water-protection snapshot includes that Oct26 lesson and all original
// objects, excluding only later named additions rather than cutting by date.
const { novemberLearningBaselineFixture } = require('./november-learning-baseline.cjs');
const { flightFeatherBaselineFixture } = require('./flight-feather-additions-oct27.cjs');
const { stripOctober27Additions, isOctober27Evidence } = require('./learning-additions-oct27.cjs');
function growthWaterSnapshotFixture(overrides = {}) {
  const result = flightFeatherBaselineFixture(novemberLearningBaselineFixture(overrides));
  const key = '../data/learning-expansion-wildlife-dogs-2026-10-16.json', dataset = result[key];
  return { ...result, [key]: { ...dataset, modules: dataset.modules.map(stripOctober27Additions), evidence: dataset.evidence.filter(item => !isOctober27Evidence(item)) } };
}
module.exports = { growthWaterSnapshotFixture };
