// Exact metadata, integration and historical preservation checks. Physical
// container/decode work and visual scene review are documented separately.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const { wildlifeVideoExamExpansionNov01Cases: added } = load('lib/wildlife-video-expansion-exam-2026-11-01.js');
const { wildlifeVideoCases, wildlifeVideoQuestionCount } = load('lib/wildlife-video-cases.js');
const { huntingDogVideoLessons } = load('lib/hunting-dog-video-lessons.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const { europeanWildlifeBySlug } = load('lib/european-wildlife-discovery.js');
const { animalSoundById } = load('lib/animal-sounds.js');
const manifest = load('public/lernen/videos-pruefungswissen-2026-11-01/mediennachweise.json');
const baselineRevision = '6cb07b1600990c94793b78e65e06db0365ac1115';
const expected = [
  { id: 'damwild-dyrehaven', title: 'Damwild zwischen Bäumen', speciesSlug: 'damwild', species: 'Damwild – Dama dama', course: '/kurse/wissen-vertiefung-wild-hirsche-vergleichen', author: 'Thue', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', frames: 543, duration: 21.72, posterTime: 9 },
  { id: 'blaesshuhn-bled', title: 'Blässhühner auf dem Wasser', speciesSlug: 'blaesshuhn', species: 'Blässhuhn – Fulica atra', course: '/kurse/wissen-ausbau-biologie-vogelkoerper-2026#lesson-schwimmlappen', author: 'NaIzletuSi ™', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/', frames: 624, duration: 25.015, posterTime: 5 },
];
const ids = new Set(expected.map(item => item.id));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function historicalLoader() {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function old(relative) {
    const filename = path.resolve(root, relative), file = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(file && !file.startsWith('../') && !path.isAbsolute(file));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${baselineRevision}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? old(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return old;
}
const old = historicalLoader();
const oldWild = old('lib/wildlife-video-cases.js').wildlifeVideoCases;
const oldDogs = old('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;

test('Two exact new scenes retain their documented source, existing species/course and full normalized media frames', () => {
  assert.equal(added.length, 2); assert.equal(manifest.length, 2);
  assert.deepEqual(added.map(item => item.id), expected.map(item => item.id));
  for (const [index, item] of added.entries()) {
    const spec = expected[index], proof = manifest.find(row => row.id === item.id);
    for (const field of ['id', 'title', 'speciesSlug', 'species', 'course', 'author', 'license', 'licenseUrl']) assert.equal(item[field], spec[field], `${item.id}:${field}`);
    assert.ok(europeanWildlifeBySlug[item.speciesSlug]);
    const courseURL = new URL(item.course, 'https://jagdlatein.invalid');
    assert.equal(courseURL.origin, 'https://jagdlatein.invalid');
    const course = getLearningModule(courseURL.pathname.slice('/kurse/'.length)); assert.ok(course);
    if (courseURL.hash) assert.ok(course.lessons.some(lesson => '#lesson-' + lesson.id === courseURL.hash), 'Exact existing foot lesson target');
    assert.equal(item.src, `/lernen/videos-pruefungswissen-2026-11-01/${item.id}.mp4`);
    assert.equal(item.poster, `/lernen/videos-pruefungswissen-2026-11-01/${item.id}-vorschau.jpg`);
    assert.equal(item.mimeType, 'video/mp4'); assert.equal(item.reviewedOn, '2026-11-01');
    assert.equal(item.duration, Math.ceil(spec.duration)); assert.equal(proof.duration, spec.duration);
    for (const field of ['source', 'author', 'license', 'licenseUrl', 'modifications']) assert.equal(item[field], proof[field], `${item.id}: source manifest ${field}`);
    assert.equal(proof.sourceVideoFrames, spec.frames); assert.equal(proof.encodedVideoFrames, spec.frames);
    assert.equal(proof.duration, proof.sourceDuration); assert.equal(proof.posterTime, spec.posterTime);
    assert.equal(proof.checked, item.reviewedOn); assert.equal(proof.aiGenerated, false);
    assert.ok(proof.downloadedBytes > 0 && proof.downloadedBytes < 100000000);
    assert.equal(proof.file, item.src); assert.equal(proof.poster, item.poster);
    for (const [asset, bytes, digest] of [[item.src, proof.bytes, proof.sha256], [item.poster, proof.posterBytes, proof.posterSha256]]) {
      const data = fs.readFileSync(path.join(root, 'public', asset));
      assert.equal(data.length, bytes); assert.equal(hash(data), digest);
    }
    assert.match(item.modifications, /kein Zuschnitt und keine zusätzlichen Schnitte/);
    assert.match(item.modifications, /Startzeitstempel.*auf 0 normalisiert; alle dekodierten Videobilder bleiben erhalten/);
    assert.equal(item.observations.length, 3); assert.ok(item.observations.every(value => value.trim().length > 40));
    const words = item.transcript.trim().split(/\s+/).length;
    assert.ok(words >= 100 && words <= 140, `${item.id}: ${words} transcript words`);
  }
  const damProof = manifest.find(item => item.id === 'damwild-dyrehaven');
  assert.equal(damProof.sourceContainerDuration, 22); assert.equal(damProof.sourceStartTimestamp, 0.28);
});

test('All nineteen prior video objects, their 53 questions and ordering remain exact against Git 6cb07b1', () => {
  assert.equal(oldWild.length, 15); assert.equal(oldDogs.length, 4);
  assert.equal([...oldWild, ...oldDogs].flatMap(item => item.questions).length, 53);
  assert.deepEqual(wildlifeVideoCases.filter(item => !ids.has(item.id) && !['muffelwild-granat', 'graugans-dresden'].includes(item.id)), oldWild);
  assert.deepEqual(wildlifeVideoCases.slice(0, oldWild.length), oldWild);
  assert.deepEqual(huntingDogVideoLessons, oldDogs);
});

test('Six unique scene questions use inspected MP4 times and meaningful explanations with balanced answer positions', () => {
  const allQuestions = [...oldWild, ...oldDogs, ...added].flatMap(item => item.questions);
  const stems = allQuestions.map(question => question.question.trim().toLocaleLowerCase('de'));
  assert.equal(new Set(stems).size, stems.length);
  const positions = [0, 0, 0];
  for (const item of added) {
    assert.equal(item.questions.length, 3);
    assert.deepEqual(item.questions.map(question => question.at), [2, 9, 17]);
    assert.equal(new Set(item.questions.map(question => question.id)).size, 3);
    assert.deepEqual(item.questions.map(question => question.answer).sort(), [0, 1, 2]);
    const actualDuration = manifest.find(row => row.id === item.id).duration;
    for (const question of item.questions) {
      assert.ok(Number.isFinite(question.at) && question.at >= 0 && question.at < actualDuration);
      assert.equal(question.choices.length, 3); assert.equal(new Set(question.choices).size, 3);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 3);
      assert.ok(question.question.length >= 40 && question.explanation.length >= 80);
      positions[question.answer]++;
    }
  }
  assert.deepEqual(positions, [2, 2, 2]);
});

test('Scene text keeps the concrete visibility limits and never presents the swimming film as a foot photograph', () => {
  const dam = added.find(item => item.id === 'damwild-dyrehaven'), coot = added.find(item => item.id === 'blaesshuhn-bled');
  assert.match(dam.transcript, /Stämme.*Äste verdecken/);
  assert.match(dam.transcript, /vollständige Gruppengröße.*genaues Alter/);
  assert.match(dam.transcript, /bestimmte aufgenommene Nahrung.*nicht erkennbar/);
  assert.match(coot.transcript, /zwei Blässhühner/);
  assert.match(coot.transcript, /Sonnenreflexe.*überstrahlen/);
  assert.match(coot.transcript, /Füße und Schwimmlappen.*nicht erkennbar/);
  assert.match(coot.transcript, /Gesundheitszustand.*nicht bestimmt/);
  assert.doesNotMatch(coot.transcript, /London|2014/);
  assert.equal(new URL(coot.course, 'https://jagdlatein.invalid').hash, '#lesson-schwimmlappen');
  for (const [item, id] of [[dam, 'damhirsch'], [coot, 'blaesshuhn']]) {
    const soundURL = new URL(item.soundHref, 'https://jagdlatein.invalid');
    assert.equal(soundURL.origin, 'https://jagdlatein.invalid'); assert.equal(soundURL.pathname, '/lernen/tierstimmen');
    assert.equal(soundURL.hash, '#tierstimme-title'); assert.deepEqual([...soundURL.searchParams.keys()], ['stimme']);
    assert.equal(soundURL.searchParams.get('stimme'), id); assert.ok(Object.hasOwn(animalSoundById, id));
    assert.equal(animalSoundById[id].speciesSlug, item.speciesSlug);
  }
});

test('The combined directory and exact reciprocal links include only the two new scenes beyond the nineteen prior videos', () => {
  const { getLearningVideoLibrary } = load('lib/learning-video-library.js');
  const { getWildlifeVideoLinks, getCourseVideoLinks, learningVideoLinks } = load('lib/learning-video-links.js');
  const { searchLearning } = load('lib/learning-search.js');
  const library = getLearningVideoLibrary();
  assert.equal(wildlifeVideoCases.length, 19); assert.equal(wildlifeVideoQuestionCount, 55); assert.equal(library.length, 23);
  assert.deepEqual(wildlifeVideoCases.filter(item => ids.has(item.id)), added);
  for (const item of added) {
    const url = new URL(item.course, 'https://jagdlatein.invalid');
    const moduleId = url.pathname.slice('/kurse/'.length), summary = library.find(row => row.id === `wild-${item.id}`);
    assert.ok(summary); assert.equal(summary.title, item.title); assert.equal(summary.subject, item.species); assert.equal(summary.duration, item.duration);
    assert.equal(summary.poster, item.poster); assert.equal(summary.href, `/lernen/wildtier-videofaelle?eintrag=${item.id}#video-fall`);
    assert.deepEqual(summary.credit, { author: item.author, license: item.license, licenseUrl: item.licenseUrl, source: item.source });
    assert.doesNotMatch(JSON.stringify(summary), /"src"|"questions"|"answers"|"transcript"|"correct"/);
    assert.ok(summary.courses.some(course => new URL(course.href, 'https://jagdlatein.invalid').pathname === url.pathname));
    const link = learningVideoLinks.find(row => row.id === item.id && row.kind === 'wild'); assert.ok(link);
    assert.deepEqual(link.speciesSlugs, [item.speciesSlug]);
    assert.deepEqual([...link.moduleIds].sort(), (item.id === 'blaesshuhn-bled' ? ['wissen-federwild-beobachtung', moduleId] : [moduleId]).sort());
    assert.ok(getWildlifeVideoLinks(item.speciesSlug).some(row => row.id === item.id));
    const soundId = new URL(item.soundHref, 'https://jagdlatein.invalid').searchParams.get('stimme');
    assert.ok(getWildlifeVideoLinks(animalSoundById[soundId].speciesSlug).some(row => row.href === summary.href), 'Sound reader resolves the exact reverse video link');
    assert.ok(getCourseVideoLinks(moduleId).some(row => row.id === item.id));
    assert.ok(searchLearning({ query: item.title }).results.some(row => row.href.split('#')[0] === summary.href.split('#')[0]));
  }
});
