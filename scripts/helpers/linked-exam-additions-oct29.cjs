// Isolate only the two appendices accompanying reciprocal oral-practice links.
// Current-package tests compare them with the real 25807fe repository objects.
const { avianUrinaryBaselineFixture } = require('./avian-urinary-addition-oct29.cjs');
const { seedMastBaselineFixture } = require('./seed-mast-addition-oct29.cjs');
function linkedExamBaselineFixture(overrides = {}) {
  return seedMastBaselineFixture(avianUrinaryBaselineFixture(overrides));
}
module.exports = { linkedExamBaselineFixture };
