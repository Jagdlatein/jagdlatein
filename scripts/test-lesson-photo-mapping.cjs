// Independent placement/SSG/preservation checks. No image, data, storage or
// network mutation: every photograph is an existing local published asset.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const sharp = local('sharp'), swc = local('next/dist/build/swc');
const revision = '7722b8d0a918bce26e51f7984d3dd877709ab60f';
const load = createLoader(), project = load('lib/lesson-photos-server.js').getCourseLessonPhotos;
const curriculum = load('lib/learning-curriculum.js');
const { learningModules, getLearningModule } = curriculum;

// Editorially approved lesson/paragraph/photo boundaries, independent of the
// implementation's private placement table. Other lessons receive no image.
const expected = {
  'wissen-ausbau-raubwildoekologie': {vielfalt:['wildlife-fuchs','wildlife-dachs']},
  'wissen-federwild-beobachtung': {'vogel-merkmale':['wildlife-stockente','wildlife-fasan']},
  'wissen-vertiefung-wild-huehner-nachwuchs': {feldhuehner:['wildlife-rebhuhn']},
  'wissen-vertiefung-kiefernzapfen-round6-2026': {zapfenschuppen:['plant-waldkiefer']},
  'wissen-ausbau-federaufbau-funktion-2026': {feinbau:['detail-mallardFeather']},
  'wissen-vertiefung-geweih-horn-gewebe-2026': {gewebe:['detail-rehSkull']},
  'wissen-gams-steinbock': { 'berg-merkmale': ['wildlife-gamswild', 'wildlife-steinwild'] },
  'wissen-ausbau-hasenartige': { merkmale: ['wildlife-feldhase', 'wildlife-wildkaninchen'] },
  'wissen-vertiefung-wild-hirsche-vergleichen': { jahresmerkmale: ['wildlife-damwild'] },
  'wissen-vertiefung-wild-kleine-beutegreifer': { marder:['wildlife-baummarder','wildlife-steinmarder'], wiesel: ['wildlife-hermelin'] },
  'wissen-ausbau-baumarten-waldaufbau': { nadelmerkmale: ['plant-fichte'], laubmerkmale:['plant-stieleiche'] },
  'wissen-vertiefung-laubblatt-merkmale-round4-2026': { 'blatt-oder-blaettchen':['plant-eberesche'], nervatur: ['plant-rotbuche'], 'umriss-rand': ['plant-haengebirke'] },
  'wissen-vertiefung-jagdhunderassen': { 'kurzhaar-drahthaar': ['breed-deutsch-drahthaar'] },
  'wissen-vertiefung-waldstruktur-standort': { schichten: ['landscape-wald-pflanzen'] },
  'wissen-lebensraeume-biotopverbund': { 'biotop-funktion': ['landscape-natur-revier'] },
};
const expectedPaths = {
  ...Object.fromEntries(['fuchs','dachs','stockente','fasan','rebhuhn','baummarder','steinmarder'].map(id=>['wildlife-'+id,`/wildkunde/nachweise-2026/${id}.jpg`])),
  ...Object.fromEntries(['stieleiche','eberesche','waldkiefer'].map(id=>['plant-'+id,`/lernen/pflanzen/${id}.jpg`])),
  'detail-mallardFeather':'/lernen/wilddetails-2026/stockente-feder.jpg',
  'detail-rehSkull':'/lernen/wilddetails-2026/reh-schaedel.jpg',
  'wildlife-gamswild': '/wildkunde/nachweise-2026/gamswild.jpg',
  'wildlife-steinwild': '/wildkunde/nachweise-2026/steinwild.jpg',
  'wildlife-feldhase': '/wildkunde/nachweise-2026/feldhase.jpg',
  'wildlife-wildkaninchen': '/wildkunde/nachweise-2026/wildkaninchen.jpg',
  'wildlife-damwild': '/wildkunde/nachweise-2026/damwild.jpg',
  'wildlife-hermelin': '/wildkunde/nachweise-2026/hermelin.jpg',
  'plant-fichte': '/lernen/pflanzen/fichte.jpg',
  'plant-rotbuche': '/lernen/pflanzen/rotbuche.jpg',
  'plant-haengebirke': '/lernen/pflanzen/haengebirke.jpg',
  'breed-deutsch-drahthaar': '/lernen/deutsch-drahthaar.jpg',
  'landscape-wald-pflanzen': '/lernen/kategorien-2026/wald-pflanzen.jpg',
  'landscape-natur-revier': '/lernen/kategorien-2026/natur-revier.jpg',
};
const allMaps = learningModules.map(module => [module, project(module)]);
const photos = allMaps.flatMap(([, map]) => Object.values(map).flat());
const paragraphFor = photo => ({'wildlife-fasan':1,'wildlife-rebhuhn':2,'plant-eberesche':1}[photo.id] || 0);
const expandedCourse = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const newQuestion = expandedCourse+'-vogelblinddaerme-funktion';
function formerCourse(course) {
  if(course.id !== expandedCourse) return course;
  return {...course,lessons:course.lessons.filter(lesson=>lesson.id!=='vogelblinddaerme'),questions:course.questions.filter(question=>question.id!==newQuestion),sources:course.sources.filter(source=>!source.lessonIds?.includes('vogelblinddaerme'))};
}

function historicalLoader() {
  const cache = new Map();
  function oldLoad(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(filename, module);
    if (gitPath.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => {
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      return id.startsWith('.') ? oldLoad(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id);
    }, module, module.exports);
    return module.exports;
  }
  return oldLoad;
}
const old = historicalLoader();

test('Exactly fifteen real courses, nineteen exact lessons and twenty-four approved photographs receive audited paragraph placements', () => {
  assert.equal(Object.keys(expected).length, 15);
  let courseCount = 0, lessonCount = 0;
  for (const [module, map] of allMaps) {
    const intended = expected[module.id] || {};
    assert.deepEqual(Object.keys(map), Object.keys(intended), module.id);
    if (Object.keys(map).length) courseCount++;
    for (const [lessonId, images] of Object.entries(map)) {
      lessonCount++;
      const lesson = module.lessons.find(lesson => lesson.id === lessonId); assert.ok(lesson);
      assert.deepEqual(images.map(photo => photo.id), intended[lessonId]);
      for (const photo of images) {
        assert.equal(photo.afterParagraph, paragraphFor(photo)); assert.ok(lesson.paragraphs[photo.afterParagraph]);
        assert.equal(photo.src, expectedPaths[photo.id]);
      }
    }
  }
  assert.equal(courseCount, 15); assert.equal(lessonCount, 19); assert.equal(photos.length, 24);
  assert.equal(new Set(photos.map(photo => photo.src)).size, 24);
});

test('The complete874-lesson inventory contains no image on any unapproved lesson or paragraph', () => {
  let lessons = 0, unillustrated = 0;
  for (const [module, map] of allMaps) for (const lesson of module.lessons) {
    lessons++;
    if (!expected[module.id]?.[lesson.id]) { unillustrated++; assert.equal(Object.hasOwn(map, lesson.id), false); }
    for (const photo of map[lesson.id] || []) assert.equal(photo.afterParagraph,paragraphFor(photo));
  }
  assert.equal(lessons, 874); assert.equal(unillustrated, 855);
  for (const value of [undefined, null, false, '', [], {}, { id: 'unknown' }, { id: 'wissen-rehwild-jahreslauf', lessons: [] }]) assert.deepEqual(project(value), {});
  const course = getLearningModule('wissen-gams-steinbock');
  assert.throws(() => project({ ...course, lessons: course.lessons.filter(lesson => lesson.id !== 'berg-merkmale') }), /Missing audited photo lesson/);
});

test('All twenty-four actual JPEG files exist in the public allowlist and their decoded pixel dimensions match the payload', async () => {
  const allowed = new Set(load('lib/learning-image-paths.js').learningImagePaths);
  const publicRoot = path.join(root, 'public');
  await Promise.all(photos.map(async photo => {
    assert.ok(allowed.has(photo.src), photo.src); assert.match(photo.src, /^\/(?:lernen|wildkunde)\/.+\.jpg$/);
    const filename = path.resolve(publicRoot, `.${photo.src}`);
    assert.ok(filename.startsWith(publicRoot + path.sep)); assert.ok(fs.statSync(filename).isFile());
    const actual = await sharp(filename).metadata();
    assert.equal(actual.format, 'jpeg', photo.src);
    assert.equal(actual.width, photo.width, photo.src); assert.equal(actual.height, photo.height, photo.src);
    assert.ok(photo.width >= 250 && photo.height >= 300);
  }));
});

test('Every payload carries a visible explanation and limit plus the existing author, license, original source and documented modifications', () => {
  const wildlife = load('lib/wildlife-photographs.js').wildlifePhotographs;
  const plants = load('lib/nature-photos.js').plantPhotos;
  const details = load('lib/wild-detail-atlas.js').wildDetailPhotos;
  const landscapes = load('lib/learning-category-photos.js').categoryPhotographs;
  const breeds = load('lib/learning-media.js').breedPictures;
  for (const photo of photos) {
    assert.deepEqual(Object.keys(photo).sort(), ['id', 'src', 'width', 'height', 'alt', 'caption', 'limit', 'afterParagraph', 'author', 'license', 'licenseUrl', 'sourceUrl', 'modifications'].sort());
    assert.equal(photo.alt, photo.caption); assert.ok(photo.caption.length > 65 && photo.limit.length > 55);
    assert.ok(photo.author && photo.modifications); assert.equal(new URL(photo.sourceUrl).hostname, 'commons.wikimedia.org');
    if(photo.id==='plant-waldkiefer'){assert.equal(photo.license,'Public domain');assert.equal(photo.licenseUrl,'https://commons.wikimedia.org/wiki/Commons:Public_domain');}
    else{assert.equal(new URL(photo.licenseUrl).hostname, 'creativecommons.org'); assert.match(photo.license, /CC/);}
    const [kind, ...parts] = photo.id.split('-'), sourceKey = parts.join('-');
    const source = kind === 'wildlife' ? wildlife[sourceKey] : kind === 'plant' ? plants[sourceKey] : kind === 'landscape' ? landscapes[sourceKey] : kind==='detail'?details[sourceKey]:breeds.find(item => item.src === photo.src);
    assert.ok(source); assert.equal(photo.license, source.license); assert.equal(photo.licenseUrl, source.licenseUrl);
    assert.equal(photo.sourceUrl, source.sourceUrl || source.sourcePage || source.creditUrl || source.url);
    if (source.author === 'Giles Laurent') assert.equal(photo.author, '© Giles Laurent · gileslaurent.com');
    else if (sourceKey === 'hermelin') assert.equal(photo.author, 'James Lindsey at Ecology of Commanster');
    else assert.equal(photo.author, source.author);
  }
  const byId = Object.fromEntries(photos.map(photo => [photo.id, photo]));
  assert.match(byId['wildlife-wildkaninchen'].limit, /Tasmanien/);
  assert.match(byId['wildlife-steinwild'].limit, /keinen gemeinsamen Maßstab/);
  assert.match(byId['plant-fichte'].limit, /Nadelunterseite/);
  assert.match(byId['breed-deutsch-drahthaar'].limit, /Ausbildungsstand, Gesundheit und individuelle Eignung/);
  assert.match(byId['wildlife-damwild'].modifications, /Originalausschnitt von Ellicrum/);
});

test('Projection does not mutate any raw course or shared photo object and callers cannot contaminate later results', () => {
  const photographModules = ['lib/wildlife-photographs.js', 'lib/nature-photos.js', 'lib/learning-category-photos.js', 'lib/learning-media.js'];
  const sources = photographModules.map(file => load(file));
  const beforeCourses = JSON.stringify(learningModules), beforePhotos = JSON.stringify(sources);
  for (const module of learningModules) project(module);
  assert.equal(JSON.stringify(learningModules), beforeCourses); assert.equal(JSON.stringify(sources), beforePhotos);
  const module = getLearningModule('wissen-gams-steinbock'), first = project(module);
  first['berg-merkmale'][0].caption = 'caller-only modification'; first['berg-merkmale'].push({ src: 'caller-only' });
  const later = project(module);
  assert.equal(later['berg-merkmale'].length, 2); assert.notEqual(later['berg-merkmale'][0].caption, 'caller-only modification');
  assert.equal(JSON.stringify(learningModules), beforeCourses); assert.equal(JSON.stringify(sources), beforePhotos);
});

test('All old courses, lessons, rotated question fields and review dates equal7722b8d beyond one explicit avian append', () => {
  const baseline = old('lib/learning-curriculum.js');
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 874, questions: 2748 });
  assert.deepEqual(learningModules.map(formerCourse), baseline.learningModules);
  assert.deepEqual(curriculum.learningQuestions.filter(question=>question.id!==newQuestion), baseline.learningQuestions);
});

test('All1755 existing cards including the116 starter objects retain full fields/order and no photo metadata enters the ranked question bank', () => {
  const cards = load('lib/learning-flashcards.js').getFlashcards(), before = old('lib/learning-flashcards.js').getFlashcards();
  assert.equal(cards.length, 1756); const oldIds=new Set(before.map(card=>card.id));assert.deepEqual(cards.filter(card=>oldIds.has(card.id)), before); assert.deepEqual(cards.slice(0, 116), before.slice(0, 116));
  assert.deepEqual(load('data/questions-full.js').QUESTIONS.filter(question=>question.id!==newQuestion), old('data/questions-full.js').QUESTIONS);
  const question = curriculum.learningQuestions.find(question => question.learningCategory === 'Wildkunde');
  const state = { phase: 'asking', index: 0, questions: [question], roundId: 'synthetic', country: 'CH', topic: 'Wildkunde', points: 0, correctAnswers: 0, timedOutAnswers: 0, serverNow: 1000, deadlineAt: 2000 };
  const live = load('lib/ranked-quiz-server.js').publicRound(state);
  assert.deepEqual(live, old('lib/ranked-quiz-server.js').publicRound(state));
  assert.deepEqual(Object.keys(live.question).sort(), ['id', 'q', 'answers'].sort());
  for (const file of ['lib/learning-flashcards.js', 'components/LearningFlashcards.js', 'lib/ranked-quiz-server.js', 'app/quiz-app/run/page.jsx']) assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /lesson-photos-server|LessonPhotos|lessonPhotos/);
});

test('All198 real SSG routes retain their seven exact former props and pass only their own new photo map as the eighth prop', () => {
  const page = load('pages/kurse/[slug].js'), baseline = old('pages/kurse/[slug].js');
  assert.deepEqual(page.getStaticPaths(), baseline.getStaticPaths());
  for (const module of learningModules) {
    const result = page.getStaticProps({ params: { slug: module.id } }), previous = baseline.getStaticProps({ params: { slug: module.id } });
    assert.deepEqual(Object.keys(result.props), ['module', 'flashcards', 'wildlifeLinks', 'miniCourseLinks', 'glossaryLinks', 'oralExamLinks', 'practiceLinks', 'lessonPhotos']);
    const { lessonPhotos, ...oldProps } = result.props;
    const former={...oldProps,module:formerCourse(oldProps.module)};
    if(module.id===expandedCourse){former.flashcards={...oldProps.flashcards,total:oldProps.flashcards.total-1,lessons:{...oldProps.flashcards.lessons}};delete former.flashcards.lessons.vogelblinddaerme;}
    assert.deepEqual(former, previous.props, module.id);
    assert.deepEqual(lessonPhotos, project(module)); assert.ok(Buffer.byteLength(JSON.stringify(lessonPhotos)) < 6000);
    const child = page.default(result.props);
    for (const prop of Object.keys(result.props)) assert.equal(child.props[prop], result.props[prop]);
  }
  assert.deepEqual(page.getStaticProps({ params: { slug: 'unlisted' } }), { notFound: true });
});

test('The course-page client transform excludes the complete photo catalog and server projection', () => {
  const filename = path.join(root, 'pages/kurse/[slug].js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, isPageFile: true, disableNextSsg: false, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  assert.match(code, /__N_SSG/); assert.doesNotMatch(code, /lesson-photos-server|wildlife-photographs|nature-photos|learning-category-photos|learning-curriculum/);
  assert.match(code, /lessonPhotos/);
});
