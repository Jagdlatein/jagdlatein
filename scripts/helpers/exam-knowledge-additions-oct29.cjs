// Historical snapshots isolate exactly the four appendices from this package.
// The new package tests exercise the live loader and compare all old objects.
const { sensesBaselineFixture } = require('./senses-learning-additions-oct29.cjs');
const { dogLearningProcessesBaselineFixture } = require('./dog-learning-processes-additions-oct29.cjs');
function examKnowledgeBaselineFixture(overrides = {}) {
  return dogLearningProcessesBaselineFixture(sensesBaselineFixture(overrides));
}
module.exports = { examKnowledgeBaselineFixture };
