// Isolate only the explicitly reviewed appendix; future objects remain visible.
const { createLoader, root, local } = require('./project-module.cjs');
const path = require('node:path'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const courseId = 'wissen-spuren-systematisch', lessonId = 'auftrittsformen';
const questionIds = ['auftritt-sohle', 'auftritt-zehen', 'auftritt-zehenspitzen'];
const sourceURLs = [
  'https://www.duesseldorf.de/fileadmin/Amt68/gartenamt/pdf/wald/lb_wirbeltiere.pdf',
  'https://hausdermuseen.ch/images/nmo/angebot/downloads/nmo-dachs-schulunterlagen-24-01-18.pdf#page=31',
];
const waldwissenURL = 'https://www.waldwissen.net/de/lebensraum-wald/tiere-im-wald/die-kunst-des-faehrtenlesens';
function stripTrackPostureAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(item => item.id !== lessonId),
    questions: module.questions.filter(item => !questionIds.some(id => item.id === id || item.id === `${courseId}-${id}`)),
    sources: module.sources.filter(item => !(sourceURLs.includes(item.url) && item.checkedOn === '2026-11-15' && JSON.stringify(item.lessonIds) === '["auftrittsformen"]')),
  };
}
function trackPostureBaselineFixture(overrides = {}) {
  const key = './learning-wildlife';
  const source = Object.hasOwn(overrides, key) ? overrides[key] : createLoader()('lib/learning-wildlife.js');
  return { ...overrides, [key]: { ...source, wildlifeModules: source.wildlifeModules.map(stripTrackPostureAddition) } };
}
function createPublishedLoader(revision) {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function historic(relative) {
    const filename = path.resolve(root, relative), file = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(file && !file.startsWith('../') && !path.isAbsolute(file));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    const module = { exports: {} }; cache.set(filename, module);
    if (filename.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? historic(path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')) : local(id), module, module.exports);
    return module.exports;
  }
  return historic;
}
module.exports = { courseId, lessonId, questionIds, sourceURLs, waldwissenURL, stripTrackPostureAddition, trackPostureBaselineFixture, createPublishedLoader };
