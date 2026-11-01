// Concrete preservation, actual-image and reader integration checks; the
// independent source reading and visual review are recorded separately.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, root, local } = require('./helpers/project-module.cjs');
const { stockenteLamellaeBaselineFixture } = require('./helpers/stockente-lamellae-addition-nov01.cjs');
const { beforeBirdLegGuide, stripBirdLegDataset } = require('./helpers/bird-leg-addition-nov01.cjs');
const createLoader = overrides => createProjectLoader(stockenteLamellaeBaselineFixture(overrides));
const revision = '6cb07b1600990c94793b78e65e06db0365ac1115';
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026', lessonId = 'schwimmlappen';
const questionId = `${courseId}-${lessonId}-anordnung`;
const sourceURLs = ['https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/blaesshuhn/', 'https://www.rspb.org.uk/birds-and-wildlife/eurasian-coot', 'https://www.bluehendesoesterreich.at/naturlexikon/blaesshuhn'];
const imagePath = '/lernen/pruefungswissen-2026-11-01/blaesshuhn-schwimmlappen.jpg';
const imageHash = 'e2489b2211a92cb2d002c64a48c57b8e2fc06136d15130ec5a478fb6c4fa0f18';

function historicalLoader() {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function historic(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(filename, module);
    if (filename.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css')
      ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
      : id.startsWith('.') ? historic(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return historic;
}
const load = createLoader(), old = historicalLoader();
const raw = stripBirdLegDataset(load('data/learning-expansion-biology-2026-10-16.json')), beforeRaw = old('data/learning-expansion-biology-2026-10-16.json');
const curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);
const flashcards = load('lib/learning-flashcards.js'), cards = flashcards.getFlashcards();
const photos = load('lib/lesson-photos-server.js').getCourseLessonPhotos(course), photo = photos[lessonId]?.[0];
const isNewCard = card => card.moduleId === courseId && card.lessonId === lessonId;
const strip = module => module.id !== courseId ? module : { ...module,
  lessons: module.lessons.filter(item => item.id !== lessonId), questions: module.questions.filter(item => item.id !== 'schwimmlappen-anordnung' && item.id !== questionId),
  sources: module.sources.filter(item => !(sourceURLs.includes(item.url) && item.lessonIds?.length === 1 && item.lessonIds[0] === lessonId)) };

test('Only a ninth lesson, one own question, three scoped sources and their evidence extend the exact biology baseline', () => {
  const previous = beforeRaw.modules.find(item => item.id === courseId), current = raw.modules.find(item => item.id === courseId);
  assert.deepEqual([previous.lessons.length, previous.questions.length, previous.sources.length], [8, 38, 19]);
  assert.deepEqual([current.lessons.length, current.questions.length, current.sources.length], [9, 39, 22]);
  assert.deepEqual(current.lessons.slice(0, 8), previous.lessons); assert.deepEqual(current.questions.slice(0, 38), previous.questions); assert.deepEqual(current.sources.slice(0, 19), previous.sources);
  const restored = { ...raw, modules: raw.modules.map(strip), evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)) };
  assert.equal(JSON.stringify(restored), JSON.stringify(beforeRaw));
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All198 old full courses and1757 complete cards including116 starters remain exact and ordered', () => {
  const before = old('lib/learning-curriculum.js'), beforeCards = old('lib/learning-flashcards.js').getFlashcards();
  assert.deepEqual(before.learningCounts, { modules: 198, lessons: 875, questions: 2749 });
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 876, questions: 2750 });
  assert.deepEqual(curriculum.learningModules.map(strip), before.learningModules);
  assert.deepEqual(curriculum.learningQuestions.filter(item => item.id !== questionId), before.learningQuestions);
  assert.equal(beforeCards.length, 1757); assert.equal(cards.length, 1758);
  assert.deepEqual(cards.filter(card => !isNewCard(card)), beforeCards); assert.deepEqual(cards.slice(0, 116), beforeCards.slice(0, 116));
  assert.deepEqual(cards.filter(isNewCard).map(card => card.id), [`flash-${questionId}`]);
});

test('The115-word structural explanation has two exact independent-source pairings and visible standstill limits', () => {
  assert.equal(course.lessons.at(-1), lesson); assert.equal(lesson.title, 'Schwimmlappen'); assert.equal(lesson.reviewedOn, '2026-11-01');
  const text = lesson.paragraphs.join(' '); assert.equal(text.split(/\s+/).length, 115);
  assert.match(text, /Hautlappen an den einzelnen Zehen/); assert.match(text, /durchgehende Schwimmhaut zwischen benachbarten Zehen/);
  assert.match(text, /Schwimmlappen unterstützen das Schwimmen/); assert.match(text, /keine Messung der Schwimmgeschwindigkeit/);
  assert.match(text, /andere Aufnahme als der schwimmende Vogel im Lernfilm/); assert.match(text, /zeigt aber keinen Schwimmstoß/);
  assert.match(text, /weitere Merkmale nötig/);
  assert.doesNotMatch(text, /\d|schneller|Widerstand|Rückholbewegung|Effizienz|Antriebs|Experiment|Originalstudie/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  assert.deepEqual(course.sources.slice(-3).map(item => item.url), sourceURLs);
  assert.ok(course.sources.slice(-3).every(item => item.checkedOn === '2026-11-01' && JSON.stringify(item.lessonIds) === '["schwimmlappen"]'));
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[sourceURLs[0], sourceURLs[1]], [sourceURLs[1], sourceURLs[2]]]);
  for (const previous of course.lessons.slice(0, -1)) assert.ok(previous.evidence.every(item => item.sources.every(source => !sourceURLs.includes(source.url))));
});

test('The actual unmodified1280 Wikimedia JPEG decodes fully and has exact authorship, source derivative and license metadata', async () => {
  const record = load('data/reviews/coot-foot-photo-2026-11-01.json').assets[0];
  assert.equal(record.src, imagePath); assert.equal(record.bytes, 484501); assert.equal(record.sha256, imageHash);
  assert.equal(record.author, 'Shyamal'); assert.equal(record.license, 'CC BY-SA 3.0'); assert.equal(record.licenseUrl, 'https://creativecommons.org/licenses/by-sa/3.0/');
  assert.equal(record.sourceUrl, 'https://commons.wikimedia.org/wiki/File:Coot_feet.jpg');
  assert.equal(record.downloadedUrl, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Coot_feet.jpg/1280px-Coot_feet.jpg');
  assert.equal(record.downloadedHttpStatus, 200); assert.equal(record.originalDownloadHttpStatus, 429); assert.equal(record.recordedOn, '2014-08');
  assert.equal(record.aiGenerated, false); assert.match(record.location, /London/);
  const bytes = fs.readFileSync(path.join(root, 'public', imagePath));
  assert.equal(bytes.length, 484501); assert.equal(createHash('sha256').update(bytes).digest('hex'), imageHash);
  const image = local('sharp')(bytes), metadata = await image.metadata();
  assert.equal(metadata.format, 'jpeg'); assert.deepEqual([metadata.width, metadata.height], [1280, 1067]);
  const actual = await image.raw().toBuffer({ resolveWithObject: true });
  assert.equal(actual.data.length, 1280 * 1067 * actual.info.channels);
  assert.ok(load('lib/learning-image-paths.js').learningImagePaths.includes(imagePath));
});

test('All old lesson-photo projections remain exact; only this precise course/lesson receives one complete credited image', () => {
  const previousCurriculum = old('lib/learning-curriculum.js'), previousPhotos = old('lib/lesson-photos-server.js');
  const project = load('lib/lesson-photos-server.js').getCourseLessonPhotos;
  let oldCount = 0, currentCount = 0, oldCourses = 0, currentCourses = 0, oldLessons = 0, currentLessons = 0;
  for (const module of curriculum.learningModules) {
    const beforeCourse = previousCurriculum.getLearningModule(module.id), before = previousPhotos.getCourseLessonPhotos(beforeCourse), current = project(module);
    oldCount += Object.values(before).flat().length; currentCount += Object.values(current).flat().length;
    oldCourses += Number(Object.keys(before).length > 0); currentCourses += Number(Object.keys(current).length > 0);
    oldLessons += Object.keys(before).length; currentLessons += Object.keys(current).length;
    const preserved = module.id === courseId ? Object.fromEntries(Object.entries(current).filter(([id]) => id !== lessonId)) : current;
    assert.deepEqual(preserved, before, module.id);
  }
  assert.deepEqual([oldCourses, oldLessons, oldCount], [15, 19, 24]);
  assert.deepEqual([currentCourses, currentLessons, currentCount], [16, 20, 25]);
  assert.deepEqual(Object.keys(photos), [lessonId]); assert.equal(photos[lessonId].length, 1);
  assert.deepEqual(Object.keys(photo).sort(), ['id','src','width','height','alt','caption','limit','afterParagraph','author','license','licenseUrl','sourceUrl','modifications'].sort());
  assert.equal(photo.src, imagePath); assert.equal(photo.afterParagraph, 0); assert.equal(photo.author, 'Shyamal'); assert.equal(photo.license, 'CC BY-SA 3.0');
  assert.match(photo.caption, /einzelnen Zehen.*seitlichen Hautlappen/); assert.match(photo.limit, /London, August 2014/); assert.match(photo.limit, /andere Aufnahme.*Bled/);
  assert.match(photo.limit, /keinen Schwimmstoß und keine gemessene Leistung/);
});

test('One standalone explanation card and the common DACH quiz reuse the new question without changing the old bank', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId), card = cards.find(isNewCard);
  assert.deepEqual(questions.map(item => item.id), [questionId]); const question = questions[0];
  assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.deepEqual(question.countries, ['DE','AT','CH']);
  assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text); assert.equal(card.explanation, question.explain);
  assert.equal(card.reviewedOn, '2026-11-01'); assert.equal(card.sourceScope, 'lesson'); assert.deepEqual(card.sources.map(item => item.url), sourceURLs);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  const bank = load('data/questions-full.js').QUESTIONS; assert.deepEqual(bank.filter(item => item.id !== questionId), old('data/questions-full.js').QUESTIONS);
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE','AT','CH']) assert.ok(quizLearningPool(bank, { country, topic:'Wildkunde' }).some(item => item.id === questionId));
  assert.deepEqual(flashcards.getFlashcardExport({ courseId, lessonId }).cards, [card]);
  assert.deepEqual(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex([card]).sourceList.map(item => item.url), sourceURLs);
});

test('Search, course props and all114 old guide targets stay exact apart from the actual one-card count increase', () => {
  const result = load('lib/learning-search.js').searchLearning({ query: 'Schwimmlappen', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(result); assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId), old('lib/learning-topic-tree.js').getLearningTopicLocation(courseId));
  const page = load('pages/kurse/[slug].js'); assert.deepEqual(page.getStaticPaths(), old('pages/kurse/[slug].js').getStaticPaths());
  const props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 1); assert.deepEqual(props.lessonPhotos, photos);
  const guides = load('lib/wildlife-learning-guide.js'), previousGuides = old('lib/wildlife-learning-guide.js');
  assert.deepEqual(guides.wildlifeGuideTargets, previousGuides.wildlifeGuideTargets);
  const slugs = Object.keys(load('lib/european-wildlife-discovery.js').europeanWildlifeBySlug); assert.equal(slugs.length, 114);
  for (const slug of slugs) assert.deepEqual(beforeBirdLegGuide(guides.getWildlifeLearningGuide(slug)), previousGuides.getWildlifeLearningGuide(slug).map(target => target.moduleId === courseId ? { ...target, flashcardCount: target.flashcardCount + 1 } : target), slug);
});

test('The actual online reader places photo, complete lesson and visible limits before its closed final scientific/photo sources', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 8 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}`, isReady: true }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, lessonPhotos: photos, flashcards: flashcards.getFlashcardLessonSummary(courseId) }));
  const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  assert.ok(html.slice(0, boundary).includes(`src="${imagePath}"`)); assert.ok(html.slice(0, boundary).includes(photo.limit));
  for (const url of [...sourceURLs, photo.sourceUrl, photo.licenseUrl]) { assert.ok(!html.slice(0, boundary).includes(url)); assert.ok(html.slice(boundary).includes(url)); }
  assert.match(html.slice(boundary), /Shyamal/); assert.match(html, /Lektion 9 von 9/); assert.match(html.slice(boundary), /1\. November 2026/);
  assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('The offline pack retains exact image provenance, lesson evidence and old date while enforcing its existing expiry', () => {
  const beforeSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-coot-foot-offline';
  try {
    const now = Date.parse('2026-11-01T10:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds:[courseId], sounds:false }, { email:'synthetic@example.invalid', paidUntil:'2026-11-03T10:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js'); assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-01');
    assert.deepEqual(pack.lessonPhotos[courseId], photos);
    const stored = pack.photos.find(item => item.src === imagePath); assert.ok(stored); assert.match(stored.credit, /Shyamal.*CC BY-SA 3\.0/);
    assert.equal(stored.creditUrl, photo.sourceUrl); assert.equal(stored.licenseUrl, photo.licenseUrl);
  } finally { if (beforeSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = beforeSecret; }
});
