// Structural, integration and complete historical preservation checks.
// The source reading and visual sample review are separate editorial work;
// these tests do not certify biological statements or device playback.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const load = createLoader();
const added = load('lib/wildlife-video-expansion-2026-11-01.js').wildlifeVideoExpansionNov01Cases;
const { wildlifeVideoCases, wildlifeVideoQuestionCount, wildlifeVideoAssetPaths } = load('lib/wildlife-video-cases.js');
const { huntingDogVideoLessons } = load('lib/hunting-dog-video-lessons.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const { dachWildlifeBySlug } = load('lib/dach-wildlife.js');
const proof = load('public/lernen/videos-2026-11-01/mediennachweise.json');
const baselineRevision = '2f5d806';

// Use the same project SWC dependency as createLoader, but read each historical
// module from Git. No current content is substituted into the baseline graph.
function createHistoricalLoader(revision) {
  const cache = new Map();
  const swc = local('next/dist/build/swc');
  function historic(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const repositoryPath = path.relative(root, filename).split(path.sep).join('/');
    assert.ok(!repositoryPath.startsWith('../'), 'Historical module stays in repository');
    const source = execFileSync('git', ['show', `${revision}:${repositoryPath}`], { cwd: root, encoding: 'utf8' });
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = swc.transformSync(source, {
      filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
      module: { type: 'commonjs' },
    });
    new Function('require', 'module', 'exports', code)(id => {
      if (id.startsWith('.')) return historic(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`));
      return local(id);
    }, module, module.exports);
    return module.exports;
  }
  return historic;
}
const historical = createHistoricalLoader(baselineRevision);
const baselineWild = historical('lib/wildlife-video-cases.js').wildlifeVideoCases;
const baselineDogs = historical('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
const expected = [
  { id: 'maeusebussard-flug', title: 'Mäusebussard im Flug', speciesSlug: undefined, species: 'Mäusebussard – Buteo buteo', module: 'wissen-federwild-beobachtung', author: 'Natuur Digitaal (Marc Plomp); Stichting Natuurbeelden', license: 'CC BY-SA 3.0 NL', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/nl/', times: [3, 8, 21] },
  { id: 'fasan-sandbad', title: 'Fasane am Wegrand', speciesSlug: 'fasan', species: 'Fasan – Phasianus colchicus', module: 'wissen-federwild-beobachtung', author: 'Vera de Kok', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', times: [3, 12, 21] },
  { id: 'ringeltaube-ast', title: 'Ringeltaube auf einem Ast', speciesSlug: 'ringeltaube', species: 'Ringeltaube – Columba palumbus', module: 'wissen-federwild-beobachtung', author: 'NaIzletuSi ™', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', times: [3, 9, 16] },
  { id: 'wildkaninchen-park', title: 'Wildkaninchen im Park', speciesSlug: 'wildkaninchen', species: 'Wildkaninchen – Oryctolagus cuniculus', module: 'wissen-ausbau-hasenartige', author: 'Frank Vincentz', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', times: [2, 7, 13] },
];
const ids = new Set(expected.map(item => item.id));
const examIds = new Set(['damwild-dyrehaven', 'blaesshuhn-bled']);

test('Four exact new scenes resolve to their existing course and only established portraits', () => {
  assert.equal(added.length, 4);
  assert.deepEqual(added.map(item => item.id), expected.map(item => item.id));
  assert.deepEqual(proof.map(item => item.id), expected.map(item => item.id));
  for (const [index, item] of added.entries()) {
    const target = expected[index], record = proof[index];
    for (const field of ['title', 'speciesSlug', 'species', 'author', 'license', 'licenseUrl']) assert.equal(item[field], target[field], `${item.id}: ${field}`);
    assert.equal(item.course, `/kurse/${target.module}`);
    assert.ok(getLearningModule(target.module));
    if (item.speciesSlug) assert.ok(dachWildlifeBySlug[item.speciesSlug]);
    else assert.equal(Object.hasOwn(item, 'speciesSlug'), false, 'No invented Mäusebussard portrait');
    assert.equal(item.src, `/lernen/videos-2026-11-01/${item.id}.mp4`);
    assert.equal(item.poster, `/lernen/videos-2026-11-01/${item.id}-vorschau.jpg`);
    assert.equal(item.mimeType, 'video/mp4');
    assert.equal(item.reviewedOn, '2026-11-01');
    assert.equal(item.duration, Math.ceil(record.duration));
    for (const field of ['source', 'author', 'license', 'licenseUrl', 'modifications']) assert.equal(item[field], record[field], `${item.id}: manifest ${field}`);
    assert.equal(item.src, record.file); assert.equal(item.poster, record.poster);
    assert.equal(record.aiGenerated, false);
    assert.equal(record.checked, item.reviewedOn);
    assert.ok(record.original.startsWith('https://upload.wikimedia.org/wikipedia/commons/'));
    assert.ok(item.source.startsWith('https://commons.wikimedia.org/wiki/File:'));
    assert.ok(item.location.startsWith(record.location));
    assert.ok(Math.abs(record.duration - record.sourceDuration) < 0.1, 'Whole original duration retained within container rounding');
    for (const asset of [item.src, item.poster]) assert.ok(fs.statSync(path.join(root, 'public', asset)).size > 1000);
    const words = item.transcript.split(/\s+/).length;
    assert.ok(words >= 100 && words <= 135, `${item.id}: ${words} transcript words`);
    assert.equal(item.observations.length, 3);
    assert.ok(item.observations.every(text => text.trim().length >= 40));
  }
});

test('Every old wildlife and dog object, all 41 old questions and their order match Git 2f5d806 exactly', () => {
  assert.equal(baselineWild.length, 11); assert.equal(baselineDogs.length, 4);
  assert.equal([...baselineWild, ...baselineDogs].flatMap(item => item.questions).length, 41);
  assert.deepEqual(wildlifeVideoCases.filter(item => !ids.has(item.id) && !examIds.has(item.id)), baselineWild);
  assert.deepEqual(wildlifeVideoCases.slice(0, baselineWild.length), baselineWild);
  assert.deepEqual(huntingDogVideoLessons, baselineDogs);
  assert.deepEqual(wildlifeVideoCases.filter(item => ids.has(item.id)), added);
  const examCases = load('lib/wildlife-video-expansion-exam-2026-11-01.js').wildlifeVideoExamExpansionNov01Cases;
  assert.deepEqual(examCases.map(item => item.id), [...examIds]);
  assert.deepEqual(wildlifeVideoCases.filter(item => examIds.has(item.id)), examCases);
  assert.equal(wildlifeVideoCases.length, 17);
  assert.equal(huntingDogVideoLessons.length, 4);
  assert.equal(wildlifeVideoQuestionCount, 51);
  assert.equal([...wildlifeVideoCases, ...huntingDogVideoLessons].flatMap(item => item.questions).length, 59);
  assert.equal(new Set(wildlifeVideoCases.map(item => item.id)).size, 17);
  assert.deepEqual(wildlifeVideoAssetPaths, wildlifeVideoCases.flatMap(item => [item.src, item.poster]));
});

test('Twelve distinct scene questions use reviewed in-range times and balanced answer positions', () => {
  const allQuestions = [...wildlifeVideoCases, ...huntingDogVideoLessons].flatMap(item => item.questions);
  const stems = allQuestions.map(question => question.question.trim().toLocaleLowerCase('de'));
  assert.equal(new Set(stems).size, stems.length);
  const positions = [0, 0, 0];
  for (const [index, item] of added.entries()) {
    assert.equal(item.questions.length, 3);
    assert.deepEqual(item.questions.map(question => question.at), expected[index].times);
    assert.equal(new Set(item.questions.map(question => question.id)).size, 3);
    assert.deepEqual(item.questions.map(question => question.answer).sort(), [0, 1, 2]);
    let previous = -1;
    for (const question of item.questions) {
      assert.ok(Number.isFinite(question.at) && question.at >= 0 && question.at < proof[index].duration);
      assert.ok(question.at > previous); previous = question.at;
      assert.equal(question.choices.length, 3);
      assert.equal(new Set(question.choices).size, 3);
      assert.ok(question.choices[question.answer]);
      assert.ok(question.question.length >= 40);
      assert.ok(question.explanation.length >= 80);
      positions[question.answer]++;
    }
  }
  assert.deepEqual(positions, [4, 4, 4]);
});

test('Transcripts preserve concrete scene limits and source context without new general biology', () => {
  const item = id => added.find(value => value.id === id);
  assert.match(item('maeusebussard-flug').transcript, /Originalaufnahme enthält einen Einstellungswechsel vom blauen zum grauen Hintergrund/);
  assert.match(item('maeusebussard-flug').transcript, /Beute.*nicht erkennbar/);
  assert.match(item('fasan-sandbad').transcript, /Originaltitel beschreibt die Szene als Sandbad; die Dateibeschreibung nennt Texel/);
  assert.match(item('fasan-sandbad').transcript, /Altersklasse oder Verwandtschaft.*nicht bestimmt/);
  assert.match(item('ringeltaube-ast').transcript, /zeitweise unscharf/);
  assert.match(item('ringeltaube-ast').transcript, /Zweig.*Kopf und Hals/);
  assert.match(item('ringeltaube-ast').transcript, /Warum die Federn aufgestellt werden.*nicht geklärt/);
  assert.match(item('wildkaninchen-park').transcript, /Kamera schwenkt nach rechts/);
  assert.match(item('wildkaninchen-park').transcript, /vollständige Gruppengröße.*Verwandtschaft.*offen/);
});

test('Each added scene is an exact lightweight directory entry and links to the chosen existing course', () => {
  const { getLearningVideoLibrary } = load('lib/learning-video-library.js');
  const { learningVideoLinks, getCourseVideoLinks, getWildlifeVideoLinks } = load('lib/learning-video-links.js');
  const library = getLearningVideoLibrary();
  assert.equal(library.length, 21);
  for (const [index, item] of added.entries()) {
    const target = expected[index];
    const summary = library.find(value => value.id === `wild-${item.id}`);
    assert.ok(summary);
    assert.equal(summary.title, item.title);
    assert.equal(summary.subject, item.species);
    assert.equal(summary.duration, item.duration);
    assert.equal(summary.href, `/lernen/wildtier-videofaelle?eintrag=${item.id}#video-fall`);
    assert.equal(summary.src, undefined);
    assert.equal(summary.questions, undefined);
    assert.equal(summary.transcript, undefined);
    assert.ok(summary.courses.some(course => course.href === item.course));
    const link = learningVideoLinks.find(value => value.id === item.id && value.kind === 'wild');
    assert.ok(link);
    assert.equal(link.title, item.title);
    assert.deepEqual(link.speciesSlugs, item.speciesSlug ? [item.speciesSlug] : []);
    assert.deepEqual(link.moduleIds, [target.module]);
    assert.ok(getCourseVideoLinks(target.module).some(value => value.id === item.id));
    if (item.speciesSlug) assert.ok(getWildlifeVideoLinks(item.speciesSlug).some(value => value.id === item.id));
  }
});
