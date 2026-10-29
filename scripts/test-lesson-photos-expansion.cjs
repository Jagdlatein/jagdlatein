// Independent delta checks against the first published lesson-photo package.
// Uses historical Git objects, local image bytes and synthetic offline/quiz data.
// Concurrent new biology lessons are allowed; old card objects are checked by ID.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const revision = '9f16930e3008fe7892fd3cc5fec76de61daff2fb';
const swc = local('next/dist/build/swc');
const load = createLoader();
const clone = value => JSON.parse(JSON.stringify(value));
const gitBytes = name => execFileSync('git', ['show', `${revision}:${name}`], { cwd: root, maxBuffer: 35 * 1024 * 1024 });
function historicalLoader() {
  const cache = new Map();
  function oldLoad(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = gitBytes(name).toString('utf8'), module = { exports: {} };
    cache.set(filename, module);
    if (name.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
      module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => {
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      return id.startsWith('.') ? oldLoad(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id);
    }, module, module.exports);
    return module.exports;
  }
  return oldLoad;
}
const old = historicalLoader();
const courses = load('lib/learning-curriculum.js').learningModules;
const oldCourses = old('lib/learning-curriculum.js').learningModules;
const project = load('lib/lesson-photos-server.js').getCourseLessonPhotos;
const oldProject = old('lib/lesson-photos-server.js').getCourseLessonPhotos;
const entries = courses.flatMap(course => Object.entries(project(course)).flatMap(([lessonId, photos]) => photos.map(photo => ({ courseId: course.id, lessonId, photo }))));
const oldEntries = oldCourses.flatMap(course => Object.entries(oldProject(course)).flatMap(([lessonId, photos]) => photos.map(photo => ({ courseId: course.id, lessonId, photo }))));
const identity = entry => `${entry.courseId}/${entry.lessonId}/${entry.photo.id}`;
const expectedAdditions = [
  ['wissen-ausbau-raubwildoekologie', 'vielfalt', 'wildlife-fuchs', 0],
  ['wissen-ausbau-raubwildoekologie', 'vielfalt', 'wildlife-dachs', 0],
  ['wissen-vertiefung-wild-kleine-beutegreifer', 'marder', 'wildlife-baummarder', 0],
  ['wissen-vertiefung-wild-kleine-beutegreifer', 'marder', 'wildlife-steinmarder', 0],
  ['wissen-federwild-beobachtung', 'vogel-merkmale', 'wildlife-stockente', 0],
  ['wissen-federwild-beobachtung', 'vogel-merkmale', 'wildlife-fasan', 1],
  ['wissen-vertiefung-wild-huehner-nachwuchs', 'feldhuehner', 'wildlife-rebhuhn', 2],
  ['wissen-vertiefung-kiefernzapfen-round6-2026', 'zapfenschuppen', 'plant-waldkiefer', 0],
  ['wissen-ausbau-baumarten-waldaufbau', 'laubmerkmale', 'plant-stieleiche', 0],
  ['wissen-vertiefung-laubblatt-merkmale-round4-2026', 'blatt-oder-blaettchen', 'plant-eberesche', 1],
  ['wissen-ausbau-federaufbau-funktion-2026', 'feinbau', 'detail-mallardFeather', 0],
  ['wissen-vertiefung-geweih-horn-gewebe-2026', 'gewebe', 'detail-rehSkull', 0],
];
const tuple = entry => [entry.courseId, entry.lessonId, entry.photo.id, entry.photo.afterParagraph];
const ordered = values => [...values].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const byPhotoId = Object.fromEntries(entries.map(entry => [entry.photo.id, entry.photo]));

test('The twelve original projected photo objects and their relative order remain exact; only twelve named placements are added', () => {
  assert.equal(oldEntries.length, 12, 'Historical package is a real twelve-photo baseline');
  const formerIds = new Set(oldEntries.map(identity));
  assert.equal(formerIds.size, 12);
  assert.deepEqual(entries.filter(entry => formerIds.has(identity(entry))), oldEntries);
  assert.equal(JSON.stringify(entries.filter(entry => formerIds.has(identity(entry)))), JSON.stringify(oldEntries), 'Existing image field order is also preserved');
  assert.deepEqual(ordered(entries.filter(entry => !formerIds.has(identity(entry))).map(tuple)), ordered(expectedAdditions));
  assert.equal(entries.length, 24);
  assert.equal(new Set(entries.map(entry => entry.courseId)).size, 15);
  assert.equal(new Set(entries.map(entry => `${entry.courseId}/${entry.lessonId}`)).size, 19);
  assert.equal(new Set(entries.map(entry => entry.photo.src)).size, 24);
});

test('Each new photo is bound to its actual paragraph and exposes only bounded image provenance, with decoded dimensions', async () => {
  const sharp = local('sharp'), allowed = new Set(load('lib/learning-image-paths.js').learningImagePaths);
  const keys = ['id', 'src', 'width', 'height', 'alt', 'caption', 'limit', 'afterParagraph', 'author', 'license', 'licenseUrl', 'sourceUrl', 'modifications'];
  for (const entry of entries) {
    const { photo } = entry, course = courses.find(course => course.id === entry.courseId);
    const lesson = course.lessons.find(lesson => lesson.id === entry.lessonId);
    assert.ok(lesson && Number.isInteger(photo.afterParagraph) && lesson.paragraphs[photo.afterParagraph], identity(entry));
    assert.deepEqual(Object.keys(photo), keys, identity(entry));
    for (const key of ['alt', 'caption', 'limit', 'author', 'license', 'modifications']) assert.ok(typeof photo[key] === 'string' && photo[key].trim(), `${photo.id}:${key}`);
    assert.equal(photo.alt, photo.caption); assert.ok(allowed.has(photo.src));
    assert.match(photo.src, /^\/(?:lernen|wildkunde)\/[\w/-]+\.jpg$/);
    assert.equal(new URL(photo.sourceUrl).hostname, 'commons.wikimedia.org');
    assert.equal(new URL(photo.licenseUrl).protocol, 'https:');
    const image = await sharp(fs.readFileSync(path.join(root, 'public', photo.src))).metadata();
    assert.equal(image.format, 'jpeg'); assert.equal(image.width, photo.width, photo.id); assert.equal(image.height, photo.height, photo.id);
    assert.ok(Object.values(project(course)).every(photos => photos.length <= 2));
  }
});

const wildlifeCorrections = {
  fasan: {
    credit: 'Foto: Common_Pheasant_Phasianus_Colchicus.jpg : David Croad derivative work: Donkey shot ( talk ) · CC BY 3.0 · Auf Commons horizontal gespiegelt und leicht aufgehellt.',
    modifications: 'Originalfoto von David Croad; Commons-Bearbeitung von Donkey shot horizontal gespiegelt und leicht aufgehellt. Hier proportional skaliert; keine weitere Motivbearbeitung.',
  },
  steinmarder: {
    credit: 'Foto: Charles J. Sharp · CC BY-SA 4.0 · Focus-Stacking aus mehreren Aufnahmen.',
    modifications: 'Die Originalquelle kennzeichnet das Foto als Focus-Stacking: mehrere Aufnahmen wurden per Software zusammengesetzt; Übergänge können von einer einzelnen Momentaufnahme abweichen. Commons-Vorschaubild proportional skaliert; hier keine weitere Motivbearbeitung.',
  },
  stockente: {
    author: 'Andreas Trepte, www.avi-fauna.info', credit: 'Foto: Andreas Trepte, www.avi-fauna.info · CC BY-SA 2.5',
    modifications: 'Zwei getrennte Stockentenansichten in einer vorhandenen Bildtafel; Commons-Vorschaubild proportional skaliert. Hier keine weitere Motivbearbeitung.',
  },
};
const oakCorrection = {
  alt: 'Echte Aufnahme von Stieleichenblättern und zwei grünen Eicheln in Fruchtbechern an einem gemeinsamen Stiel.',
  displayCaption: 'Die beiden grünen Eicheln sitzen in schuppigen Fruchtbechern an einem gemeinsamen Stiel. Vergleiche zusätzlich Blattstiel, Blattgrund und gelappte Spreite; das Foto allein ersetzt keine vollständige Bestimmung.',
};
test('Central registries retain every old field except three documented wildlife credits and the confirmed oak-caption correction', () => {
  const former = clone(old('lib/wildlife-photographs.js').wildlifePhotographs);
  for (const [key, correction] of Object.entries(wildlifeCorrections)) Object.assign(former[key], correction);
  assert.deepEqual(load('lib/wildlife-photographs.js').wildlifePhotographs, former);
  const plants = clone(old('lib/nature-photos.js').plantPhotos);
  Object.assign(plants.stieleiche, oakCorrection);
  assert.deepEqual(load('lib/nature-photos.js').plantPhotos, plants);
  const publicPlants = JSON.parse(gitBytes('public/lernen/pflanzen/bildnachweise.json').toString('utf8'));
  Object.assign(publicPlants.find(photo => photo.id === 'stieleiche'), oakCorrection);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'public/lernen/pflanzen/bildnachweise.json'), 'utf8')), publicPlants);
  for (const [file, exported] of [['lib/nature-photos.js', 'tracksPhotos'], ['lib/learning-category-photos.js', 'categoryPhotographs'], ['lib/dog-photographs.js', 'dogPhotographs']]) {
    assert.deepEqual(load(file)[exported], old(file)[exported], exported);
  }
  assert.equal(fs.readFileSync(path.join(root, 'lib/wild-detail-atlas.js'), 'utf8'), gitBytes('lib/wild-detail-atlas.js').toString('utf8'));
});

test('All registered original photograph bytes remain identical to historical Git blobs; added explanations reuse those same files', () => {
  const sources = [
    ['lib/wildlife-photographs.js', 'wildlifePhotographs'], ['lib/nature-photos.js', 'plantPhotos'], ['lib/nature-photos.js', 'tracksPhotos'],
    ['lib/learning-category-photos.js', 'categoryPhotographs'], ['lib/dog-photographs.js', 'dogPhotographs'], ['lib/wild-detail-atlas.js', 'wildDetailPhotos'], ['lib/learning-media.js', 'breedPictures'],
  ];
  const paths = new Set(sources.flatMap(([file, exported]) => Object.values(old(file)[exported]).map(photo => photo.src)));
  assert.ok(paths.size > 80, 'Covers complete source registries, beyond only the twelve additions');
  const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  for (const src of paths) assert.equal(sha(fs.readFileSync(path.join(root, 'public', src))), sha(gitBytes(`public${src}`)), src);
  for (const entry of entries) assert.ok(paths.has(entry.photo.src), `${entry.photo.id} already existed in the published asset inventory`);
});

test('Correct original credit and material modifications survive both explanation display and complete final source rendering', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const ui = createLoader({ 'next/image': ({ unoptimized, priority, ...props }) => React.createElement('img', props) })('components/LessonPhotos.js');
  const photos = ['wildlife-stockente', 'wildlife-fasan', 'wildlife-steinmarder'].map(id => byPhotoId[id]);
  const shown = renderToStaticMarkup(React.createElement(ui.LessonPhotos, { photos }));
  const sources = renderToStaticMarkup(React.createElement(ui.LessonPhotoSources, { photoMap: { synthetic: photos } }));
  assert.match(shown, /Andreas Trepte, www\.avi-fauna\.info/);
  assert.match(shown, /mehreren Fotografien/);
  assert.match(sources, /Andreas Trepte, www\.avi-fauna\.info/);
  assert.match(sources, /David Croad/); assert.match(sources, /Donkey shot horizontal gespiegelt und leicht aufgehellt/);
  assert.match(sources, /Focus-Stacking/); assert.match(sources, /mehrere Aufnahmen wurden per Software zusammengesetzt/);
  assert.match(sources, /Bildnachweise zu den Erklärungen/);
  for (const photo of photos) {
    assert.ok(sources.includes(photo.sourceUrl)); assert.ok(sources.includes(photo.licenseUrl));
    assert.ok(sources.includes(photo.modifications));
  }
  assert.match(byPhotoId['plant-stieleiche'].caption, /zwei grüne Eicheln/);
  assert.match(byPhotoId['detail-mallardFeather'].limit, /Häkchen.*nicht einzeln/);
  assert.match(byPhotoId['detail-rehSkull'].limit, /kein genaues Lebensalter/);
});

test('Actual single-course offline exports retain precise image scope and credit, while legacy map-free packs remain valid', () => {
  const { createOfflinePack } = load('lib/offline-learning-server.js');
  const { validateOfflinePack } = load('lib/offline-learning.js');
  const now = Date.parse('2026-10-29T18:00:00Z'), previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'synthetic-photo-expansion-regression-only';
  try {
    for (const courseId of new Set(entries.map(entry => entry.courseId))) {
      const course = courses.find(course => course.id === courseId);
      const saved = createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-31T18:00:00Z' }, now);
      assert.equal(validateOfflinePack(saved, now), true, courseId);
      assert.deepEqual(saved.courses, [course]);
      assert.deepEqual(Object.keys(saved.lessonPhotos), [courseId]);
      assert.deepEqual(saved.lessonPhotos[courseId], project(course));
      for (const photo of Object.values(saved.lessonPhotos[courseId]).flat()) {
        const asset = saved.photos.find(asset => asset.src === photo.src);
        assert.ok(asset, photo.src); assert.equal(asset.creditUrl, photo.sourceUrl); assert.equal(asset.licenseUrl, photo.licenseUrl);
        assert.ok(asset.credit.includes(photo.author), photo.id);
      }
      const historicalShape = clone(saved); delete historicalShape.lessonPhotos;
      assert.equal(validateOfflinePack(historicalShape, now), true, `${courseId}: old optional-map shape`);
    }
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});

test('Every old flashcard remains object-identical and in relative order, allowing unrelated new biology cards', () => {
  const former = old('lib/learning-flashcards.js').getFlashcards(), current = load('lib/learning-flashcards.js').getFlashcards();
  const ids = new Set(former.map(card => card.id));
  assert.equal(ids.size, former.length);
  assert.deepEqual(current.filter(card => ids.has(card.id)), former);
  assert.equal(JSON.stringify(current.filter(card => ids.has(card.id))), JSON.stringify(former), 'Old card field order is retained as well');
  const correctedPaths = ['stockente', 'fasan', 'steinmarder'].map(id => `/wildkunde/nachweise-2026/${id}.jpg`);
  for (const card of former) for (const src of correctedPaths) assert.equal(JSON.stringify(card).includes(src), false, 'No old starter card silently acquires a changed credit');
});

test('Ranked asking payload explicitly excludes photo captions, source metadata and stored answer keys', () => {
  const { publicRound } = load('lib/ranked-quiz-server.js');
  const question = { id: 'synthetic', q: 'Synthetic prompt', answers: [{ id: 'a', text: 'A', correct: true }, { id: 'b', text: 'B' }],
    correct: ['a'], explain: 'answer explanation sentinel', source: 'source sentinel', lessonPhotos: byPhotoId, caption: 'caption sentinel' };
  const visible = publicRound({ roundId: 'synthetic-round', phase: 'asking', index: 0, questions: [question],
    feedback: { correctAnswerIds: ['a'], explain: question.explain }, country: 'CH', topic: 'Wildkunde', points: 0, correctAnswers: 0, timedOutAnswers: 0 });
  assert.deepEqual(visible.question, { id: 'synthetic', q: 'Synthetic prompt', answers: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] });
  assert.equal(visible.feedback, null);
  assert.doesNotMatch(JSON.stringify(visible), /lessonPhotos|caption sentinel|source sentinel|answer explanation sentinel|correctAnswerIds/);
});
