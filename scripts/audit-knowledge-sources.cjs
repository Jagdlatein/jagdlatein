// Structural inventory only. This does not certify factual correctness or independence.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id + '.js'))) : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
function summarize(id, sources, extra = {}) {
  const links = [...new Set((sources || []).map(source => source.url || source.sourceUrl || source).filter(item => typeof item === 'string'))];
  const hosts = [...new Set(links.map(url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'INVALID'; } }))];
  return { id, ...extra, links, distinctHosts: hosts, needsIndependentSourceReview: hosts.length < 2 };
}
const courses = load('lib/learning-curriculum.js').learningModules.map(course => summarize(course.id, course.sources, { title: course.title, lessons: course.lessons.length, questions: course.questions.length, recordedReviewDate: course.reviewedOn }));
const wildlife = Object.entries(load('lib/wildlife-depth.js').wildlifeDepthBySlug).map(([id, profile]) => summarize(id, profile.sources));
const report = {
  inventoryDate: '2026-10-12', kind: 'structural-source-inventory',
  limitation: 'Different hosts do not prove independent support for a concrete claim. All marked items need editorial review; unmarked items still need claim-level review. Existing review dates are copied, not updated by this inventory.',
  courses, wildlife,
  summary: { courses: courses.length, wildlifeProfiles: wildlife.length, coursesWithFewerThanTwoHosts: courses.filter(item => item.needsIndependentSourceReview).length, wildlifeWithFewerThanTwoHosts: wildlife.filter(item => item.needsIndependentSourceReview).length },
};
const output = path.join(root, 'docs', 'knowledge-source-inventory.json');
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report.summary, report: output, limitation: report.limitation }));
