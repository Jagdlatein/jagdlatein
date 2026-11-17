// Preserve historical positive contracts while the named Nov17 additions are
// tested separately against the live48-goal renderer and complete curriculum.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./project-module.cjs');
const revision = '69e4417ffc881e88432dfc04e3e444f1b1357659';
function assertPreservedBaseBlueprint() {
  const load = createLoader(), filename = path.join(root, 'lib/exam-blueprint-server.js'), module = { exports: {} };
  const source = execFileSync('git', ['show', `${revision}:lib/exam-blueprint-server.js`], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
  const before = module.exports.getExamBlueprintData(), current = load('lib/exam-blueprint-server.js').getExamBlueprintData();
  const additions = load('lib/exam-transfer-goals-server.js').getExamTransferGoals();
  assert.equal(additions.length, 12); assert.equal(current.categories.length, 12);
  const categories = current.categories.map(category => {
    assert.equal(category.goals.length, 4);
    assert.equal(category.goals[3].id, additions.find(item => item.slug === category.slug).goal.id);
    return { ...category, goals: category.goals.slice(0, 3) };
  });
  const sourceIds = new Set(categories.flatMap(category => category.goals.flatMap(goal => goal.sourceIds)));
  assert.deepEqual({ ...current, categories, sources: current.sources.filter(source => sourceIds.has(source.id)) }, before);
  assert.deepEqual(current.sources.slice(0, before.sources.length), before.sources);
}
function restoreGoalSelfCheckSource(source) {
  const normalized = source.replaceAll('\r\n', '\n');
  const addition = '    <details className={styles.goalSelfCheck}><summary>Selbstkontrolle</summary>\n      {Array.isArray(goal.selfCheck) ? <ul>{goal.selfCheck.map((criterion, index) => <li key={index}>{criterion}</li>)}</ul> : <p>{goal.selfCheck}</p>}\n    </details>';
  const original = '    <p className={styles.goalSelfCheck}><strong>Selbstkontrolle:</strong> {Array.isArray(goal.selfCheck) ? goal.selfCheck.join(" · ") : goal.selfCheck}</p>';
  assert.equal(normalized.split(addition).length, 2, 'Only the exact native-disclosure addition may be projected');
  return normalized.replace(addition, original);
}
function restoreTransferSearchSource(source) {
  let normalized = source.replaceAll('\r\n', '\n');
  const extraImport = 'import { getExamTransferGoals } from "./exam-transfer-goals-server";\n';
  const extraEntries = '  ...getExamTransferGoals().map(({ slug, goal }) => ({ id: `exam-transfer:${goal.id}`, title: goal.title, description: goal.task,\n    href: `/lernen/pruefungsplan?kategorie=${encodeURIComponent(slug)}#exam-plan-learning`, type: "practice", categories: [slug], countries: ["DE", "AT", "CH"],\n    aliases: ["Prüfungsfall", "Prüfungslernziel"], text: [goal.task, goal.caseText, goal.followUp].join(" ") })),\n';
  for (const addition of [extraImport, extraEntries]) { assert.equal(normalized.split(addition).length, 2); normalized = normalized.replace(addition, ''); }
  return normalized;
}
module.exports = { assertPreservedBaseBlueprint, restoreGoalSelfCheckSource, restoreTransferSearchSource };
