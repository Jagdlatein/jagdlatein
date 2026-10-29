// Isolated packages, cache doubles and React/JSDOM. No real storage, account,
// request or download is touched by these regression checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const { getCourseLessonPhotos } = load('lib/lesson-photos-server.js');
const { createOfflinePack } = load('lib/offline-learning-server.js');
const { validateOfflinePack, OFFLINE_MAX_PHOTOS } = load('lib/offline-learning.js');
const { learningImagePaths } = load('lib/learning-image-paths.js');
const React = local('react');
const now = Date.parse('2026-10-29T18:00:00Z');
const illustrated = learningModules.filter(course => Object.keys(getCourseLessonPhotos(course)).length);
const clone = value => JSON.parse(JSON.stringify(value));
function pack(ids) {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'isolated-lesson-photo-offline-only';
  try { return createOfflinePack({ courseIds: ids, sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-31T18:00:00Z' }, now); }
  finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
}

function workerFixture() {
  const handlers = {}, entries = new Map(), requests = [];
  const context = {
    self: { location: { origin: 'https://offline.invalid' }, addEventListener: (name, callback) => { handlers[name] = callback; } },
    caches: { open: async () => ({ put: async (key, response) => { entries.set(key, response); }, match: async key => entries.get(key)?.clone(), delete: async key => entries.delete(key) }) },
    URL, Response, Headers,
    fetch: async pathname => {
      requests.push(pathname);
      const response = new Response('isolated cache bytes', { headers: { 'Content-Type': pathname.endsWith('.jpg') ? 'image/jpeg' : 'text/html' } });
      Object.defineProperty(response, 'url', { value: `https://offline.invalid${pathname}` });
      return response;
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/lernen/offline-sw.js'), 'utf8'), context);
  return { handlers, entries, requests,
    async prepare(assets) {
      let completion, message;
      handlers.message({ data: { type: 'PREPARE', assets }, source: { url: 'https://offline.invalid/lernen/offline-rucksack' },
        ports: [{ postMessage: value => { message = value; } }], waitUntil: promise => { completion = promise; } });
      await completion; return message;
    },
  };
}

function offlineCourse(overrides = {}) {
  const filename = path.join(root, 'components/OfflineLearning.js');
  const source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
  const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const module = { exports: {} }, loader = createLoader(overrides);
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return id.startsWith('.') ? loader(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id);
  }, module, module.exports);
  return module.exports.OfflineCourse;
}

test('Each illustrated course exports only its exact own lesson pictures without changing course, questions or review dates', () => {
  assert.equal(illustrated.length, 9);
  assert.equal(illustrated.reduce((sum, course) => sum + Object.keys(getCourseLessonPhotos(course)).length, 0), 10);
  assert.equal(new Set(illustrated.flatMap(course => Object.values(getCourseLessonPhotos(course)).flat().map(photo => photo.src))).size, 12);
  for (const course of illustrated) {
    const before = clone(course), saved = pack([course.id]);
    assert.equal(validateOfflinePack(saved, now), true, course.id);
    assert.deepEqual(saved.courses, [before]); assert.deepEqual(course, before);
    assert.deepEqual(Object.keys(saved.lessonPhotos), [course.id]);
    assert.deepEqual(saved.lessonPhotos[course.id], getCourseLessonPhotos(course));
    for (const [lessonId, photos] of Object.entries(saved.lessonPhotos[course.id])) {
      const lesson = course.lessons.find(lesson => lesson.id === lessonId); assert.ok(lesson);
      assert.ok(photos.length > 0 && photos.length <= 2);
      for (const photo of photos) {
        assert.ok(photo.afterParagraph >= 0 && photo.afterParagraph < lesson.paragraphs.length);
        assert.ok(saved.photos.some(asset => asset.src === photo.src && asset.creditUrl === photo.sourceUrl && asset.licenseUrl === photo.licenseUrl));
      }
    }
  }
  const plain = learningModules.find(course => !Object.keys(getCourseLessonPhotos(course)).length && course.id === 'wissen-ausbau-biologie-wiederkaeuer-2026');
  assert.ok(plain); assert.equal(Object.hasOwn(pack([plain.id]), 'lessonPhotos'), false);
});

test('Legacy version-one packs without lessonPhotos retain their exact data and remain valid', () => {
  const saved = pack(['wissen-ausbau-hasenartige']); delete saved.lessonPhotos;
  saved.photos[0] = { ...saved.photos[0], src: '/wildkunde/feldhase.jpg', credit: 'Synthetic historical attribution' };
  const before = clone(saved);
  assert.equal(validateOfflinePack(saved, now), true); assert.deepEqual(saved, before);
  assert.equal(saved.version, 1); assert.ok(saved.photos.length > 0);
  const normalized = load('lib/offline-photo-retirement.js').normalizeOfflinePackPhotos(saved);
  assert.equal(normalized.pack.photos[0].src, '/wildkunde/nachweise-2026/feldhase.jpg');
  assert.equal(Object.hasOwn(normalized.pack, 'lessonPhotos'), false, 'Retirement migration does not invent current lesson images for old downloads');
  assert.deepEqual(normalized.pack.courses, before.courses); assert.equal(normalized.pack.expiresAt, before.expiresAt);
  assert.equal(validateOfflinePack(normalized.pack, now), true); assert.deepEqual(saved, before);
  assert.equal(validateOfflinePack(saved, saved.expiresAt), false);
});

test('Manipulated course/lesson bindings, external or uncached images and malformed map structures are rejected', () => {
  const original = pack(['wissen-ausbau-hasenartige']);
  const courseId = original.courses[0].id, lessonId = Object.keys(original.lessonPhotos[courseId])[0];
  const changes = [
    saved => { saved.lessonPhotos = null; },
    saved => { saved.lessonPhotos = []; },
    saved => { saved.lessonPhotos.fake = saved.lessonPhotos[courseId]; },
    saved => { saved.lessonPhotos[courseId] = []; },
    saved => { saved.lessonPhotos[courseId].fake = saved.lessonPhotos[courseId][lessonId]; },
    saved => { saved.lessonPhotos[courseId][lessonId] = []; },
    saved => { saved.lessonPhotos[courseId][lessonId].push(saved.lessonPhotos[courseId][lessonId][0]); },
    saved => { saved.photos = saved.photos.filter(photo => photo.src !== saved.lessonPhotos[courseId][lessonId][0].src); },
  ];
  for (const change of changes) { const saved = clone(original); change(saved); assert.equal(validateOfflinePack(saved, now), false); }
  for (const [field, invalid] of [['src', 'https://foreign.invalid/photo.jpg'], ['src', '/lernen/private.jpg'], ['src', '/lernen/../private.jpg'],
    ['width', 0], ['width', 1.5], ['height', 20001], ['alt', ''], ['caption', ''], ['limit', ''], ['caption', '   '], ['limit', '\n'],
    ['afterParagraph', -1], ['afterParagraph', 999], ['afterParagraph', '0'], ['author', ''], ['license', ''],
    ['modifications', ''], ['sourceUrl', 'javascript:alert(1)'], ['sourceUrl', 'https://foreign.invalid/source'],
    ['licenseUrl', 'https://user:secret@example.invalid/license'], ['licenseUrl', 'https://foreign.invalid/license']]) {
    const saved = clone(original); saved.lessonPhotos[courseId][lessonId][0][field] = invalid;
    assert.equal(validateOfflinePack(saved, now), false, `${field}: ${invalid}`);
  }
});

const eightCourseIds = [
  'wissen-vertiefung-jagdhunderassen', 'wissen-vertiefung-wild-kleine-beutegreifer',
  'wissen-vertiefung-wild-alpine-winterstrategien', 'wissen-vertiefung-wild-hirsche-vergleichen',
  'wissen-vertiefung-wild-huehner-nachwuchs', 'wissen-vertiefung-wild-wasservoegel-jahreslauf',
  'wissen-ausbau-hasenartige', 'wissen-vertiefung-laubblatt-merkmale-round4-2026',
];
test('The bounded increase to 64 photos is required by an actual eight-course choice containing 33 distinct photographs', () => {
  const saved = pack(eightCourseIds);
  assert.equal(saved.courses.length, 8); assert.equal(saved.photos.length, 33);
  assert.equal(new Set(saved.photos.map(photo => photo.src)).size, 33);
  assert.equal(OFFLINE_MAX_PHOTOS, 64); assert.equal(validateOfflinePack(saved, now), true);
  saved.photos = Array.from({ length: 65 }, () => saved.photos[0]);
  assert.equal(validateOfflinePack(saved, now), false);
  assert.throws(() => pack([...eightCourseIds, 'wissen-rehwild-jahreslauf']), /ein bis acht/);
});

test('Every actually exported legacy and new photo decodes, has its public exact allowlist and is accepted by worker PREPARE', async () => {
  const paths = new Set();
  for (const course of learningModules) for (const photo of pack([course.id]).photos) paths.add(photo.src);
  assert.equal(paths.size, 37);
  const sharp = local('sharp');
  for (const src of paths) {
    assert.ok(learningImagePaths.includes(src), src);
    assert.equal((await sharp(fs.readFileSync(path.join(root, 'public', src))).metadata()).format, 'jpeg', src);
  }
  for (const course of illustrated) for (const photo of Object.values(getCourseLessonPhotos(course)).flat()) {
    const metadata = await sharp(fs.readFileSync(path.join(root, 'public', photo.src))).metadata();
    assert.equal(metadata.width, photo.width, photo.id); assert.equal(metadata.height, photo.height, photo.id);
  }
  const worker = workerFixture(), result = await worker.prepare([...paths]);
  assert.equal(result.ok, true); assert.equal(worker.entries.size, paths.size + 1);
  for (const src of paths) assert.ok(worker.entries.has(src));
  assert.ok(worker.entries.has('/lernen/hunde-2026/labrador.jpg'), 'The previously rejected real retriever picture now downloads');
});

test('Additional photographs do not open APIs, protected HTML, retired paths or arbitrary neighboring files to the cache', async () => {
  const worker = workerFixture();
  for (const pathname of ['/api/auth/status', '/api/lernen/offline', '/konto', '/preise', '/kurse/wissen-ausbau-hasenartige',
    '/lernen/pflanzen/private.jpg', '/lernen/pflanzen/fichte.jpg.bak', '/wildkunde/rehwild.jpg']) {
    let intercepted = false;
    worker.handlers.fetch({ request: new Request(`https://offline.invalid${pathname}`), respondWith() { intercepted = true; } });
    assert.equal(intercepted, false, pathname);
    assert.equal((await worker.prepare([pathname])).ok, false, pathname);
  }
  assert.deepEqual(worker.requests, []); assert.equal(worker.entries.size, 0);
});

test('Actual offline reader places only matching lesson photos after their paragraph and keeps feedback images hidden until an answer', async t => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://offline.invalid/lernen/offline-rucksack' });
  const savedGlobals = new Map(), requests = [];
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: (...args) => { requests.push(args); throw new Error('Reader must not initiate package or picture requests'); } })) {
    savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const Component = offlineCourse({ 'next/image': ({ unoptimized, priority, ...props }) => React.createElement('img', props) });
  const saved = pack(['wissen-ausbau-hasenartige']), original = saved.courses[0], photoMap = saved.lessonPhotos[original.id];
  const photoLessonId = Object.keys(photoMap)[0], photoIndex = original.lessons.findIndex(lesson => lesson.id === photoLessonId);
  const firstQuestion = original.questions.find(question => question.lessonId === photoLessonId);
  const otherQuestion = original.questions.find(question => !photoMap[question.lessonId]); assert.ok(firstQuestion && otherQuestion);
  const course = { ...original, questions: [firstQuestion, otherQuestion] };
  const root = local('react-dom/client').createRoot(document.getElementById('root'));
  const props = node => node[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
  const render = map => React.createElement(Component, { course, expiresAt: Date.now() + 60000, onExpired() { assert.fail('Live fixture expired'); }, ...(map ? { photoMap: map } : {}) });
  t.after(async () => {
    try { await React.act(async () => root.unmount()); }
    finally { dom.window.close(); for (const [key, descriptor] of savedGlobals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
  });
  await React.act(async () => root.render(render(photoMap)));
  const container = document.getElementById('root'), quiz = () => [...container.querySelectorAll('details')].find(node => node.querySelector('summary')?.textContent === 'Offline-Wissenscheck zum Kurs');
  const lessonSelect = [...container.querySelectorAll('label')].find(node => node.textContent.startsWith('Lektion')).querySelector('select');
  await React.act(async () => props(lessonSelect).onChange({ target: { value: String(photoIndex) } }));
  assert.equal(quiz().querySelectorAll('img').length, 0);
  const inline = container.querySelector('[data-lesson-photos^="offline:"]'); assert.ok(inline);
  assert.equal(inline.previousElementSibling.textContent, original.lessons[photoIndex].paragraphs[0]);
  assert.equal(inline.querySelectorAll('img').length, photoMap[photoLessonId].length);
  for (const image of inline.querySelectorAll('img')) assert.ok(image.getAttribute('src').startsWith('/wildkunde/'));
  const sources = [...container.querySelectorAll('details')].at(-1); assert.equal(sources.querySelector('summary').textContent, 'Quellen und Prüfstand');
  assert.equal(sources.open, false); assert.ok(sources.querySelector('[aria-label="Bildnachweise zu den Erklärungen"]'));
  for (const link of inline.querySelectorAll('a')) assert.fail(`Image attribution must stay in final source panel: ${link.href}`);
  await React.act(async () => props(quiz().querySelector('button')).onClick());
  assert.equal(quiz().querySelectorAll('[data-lesson-photos] img').length, photoMap[photoLessonId].length);
  const next = [...quiz().querySelectorAll('button')].find(button => button.textContent === 'Nächste Frage'); assert.ok(next);
  await React.act(async () => props(next).onClick()); assert.equal(quiz().querySelectorAll('img').length, 0);
  const unrelated = original.lessons.findIndex(lesson => !photoMap[lesson.id]); assert.ok(unrelated >= 0);
  await React.act(async () => props(lessonSelect).onChange({ target: { value: String(unrelated) } }));
  assert.equal(container.querySelectorAll('[data-lesson-photos^="offline:"] img').length, 0);
  await React.act(async () => root.render(render(undefined)));
  assert.equal(container.querySelectorAll('[data-lesson-photos] img').length, 0, 'Legacy course view never acquires current-catalog pictures');
  assert.equal(container.querySelector('[aria-label="Bildnachweise zu den Erklärungen"]'), null);
  assert.deepEqual(requests, []);
});
