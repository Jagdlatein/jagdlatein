const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const swc = projectRequire('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript' }, target: 'es2020' }, module: { type: 'commonjs' },
  });
  const localRequire = id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`))) : projectRequire(id);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  cache.set(filename, module.exports);
  return module.exports;
}
const { wildlifeDepthBySlug: profiles, wildlifeDepthSlugs: slugs } = load('lib/wildlife-depth.js');
const { wildlifeDepthModules: courses } = load('lib/learning-wildlife-depth.js');

test('Deepening attaches only to existing species and preserves the wider DACH catalog', () => {
  const { dachWildlifeBySlug, dachWildlife } = load('lib/dach-wildlife.js');
  assert.equal(slugs.length, 33);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(dachWildlife.length >= 100);
  for (const slug of slugs) assert.ok(dachWildlifeBySlug[slug], `No invented species route: ${slug}`);
  for (const slug of ['gamswild', 'steinwild', 'rotwild', 'rehwild', 'schwarzwild', 'murmeltier', 'schneehuhn']) assert.ok(profiles[slug]);
});

test('Every deep profile offers distinct biological sections and an explained knowledge check', () => {
  for (const [slug, profile] of Object.entries(profiles)) {
    assert.equal(profile.reviewedOn, '2026-10-12');
    const texts = ['seasonalLife', 'fieldSigns', 'comparisons', 'observation'].flatMap(key => {
      assert.ok(profile[key].length >= 2, `${slug}:${key}`);
      for (const paragraph of profile[key]) assert.ok(typeof paragraph === 'string' && paragraph.length > 35, `${slug}:${key}`);
      return profile[key];
    });
    assert.equal(new Set(texts).size, texts.length, `${slug}: duplicated filler`);
    for (const question of profile.learningQuestions) for (const key of ['q', 'answer', 'explain']) assert.ok(question[key]?.length > 15, `${slug}:${key}`);
  }
});

test('Species deepening and course links agree without referring to missing lessons', () => {
  const byId = new Map(courses.map(course => [course.id, course]));
  assert.equal(byId.size, 6);
  for (const [slug, profile] of Object.entries(profiles)) for (const id of profile.courseIds) {
    assert.ok(byId.has(id), `${slug}:${id}`);
    assert.ok(byId.get(id).speciesSlugs.includes(slug), `${slug} missing from linked course`);
  }
  for (const course of courses) {
    for (const slug of course.speciesSlugs) assert.ok(profiles[slug].courseIds.includes(course.id));
    const lessonIds = new Set(course.lessons.map(lesson => lesson.id));
    assert.equal(lessonIds.size, 5);
    assert.equal(course.questions.length, 10);
    assert.equal(new Set(course.questions.map(question => question.id)).size, course.questions.length);
    for (const question of course.questions) {
      assert.ok(lessonIds.has(question.lessonId), `${course.id}:${question.id}`);
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer <= 3);
      assert.ok(question.explain.length > 35);
    }
    for (const id of lessonIds) assert.ok(course.questions.some(question => question.lessonId === id), `No applied check: ${course.id}:${id}`);
  }
});

test('All lessons contain original paragraphs and carry regional context rather than a hunting permission', () => {
  const paragraphs = [];
  for (const course of courses) {
    assert.equal(course.category, 'Wildkunde');
    assert.equal(course.topic, 'Wildkunde');
    assert.equal(course.reviewedOn, '2026-10-12');
    assert.deepEqual(course.countries, ['DE', 'AT', 'CH']);
    for (const country of course.countries) assert.ok(course.countryNotes[country].length > 60);
    for (const lesson of course.lessons) {
      assert.equal(lesson.paragraphs.length, 3);
      for (const paragraph of lesson.paragraphs) {
        assert.ok(paragraph.split(/\s+/).length >= 35, `${course.id}:${lesson.id}: missing teaching depth`);
        paragraphs.push(paragraph);
      }
      assert.ok(lesson.takeaway && lesson.exercise);
    }
  }
  assert.equal(paragraphs.length, 90);
  assert.equal(new Set(paragraphs).size, paragraphs.length);
});

test('Linked evidence uses named primary sources and contains no local files or credentials', () => {
  const sources = [...Object.values(profiles), ...courses].flatMap(item => item.sources);
  const domains = new Set(['www.wildtierportal.bayern.de', 'nationalpark.ch', 'www.jagdverband.de', 'www.bfn.de', 'www.kora.ch', 'www.lfu.bayern.de', 'lfu.brandenburg.de', 'wnsinfo.fva-bw.de', 'www.fva-bw.de', 'www.vetmeduni.ac.at', 'www.nature.com']);
  for (const source of sources) {
    assert.ok(source.label?.length > 5);
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(domains.has(url.hostname), source.url);
    assert.equal(url.username, '');
    assert.equal(url.password, '');
  }
});

test('Common biological traps retain explicit distinctions', () => {
  const text = slug => JSON.stringify(profiles[slug]);
  assert.match(text('steinwild'), /Schmuckknoten/);
  assert.match(text('steinwild'), /Jahresringe/);
  assert.match(text('gamswild'), /Beide Geschlechter/);
  assert.match(text('dachs'), /Winterruhe/);
  assert.match(text('murmeltier'), /echten Winterschlaf/);
  assert.match(text('wildkatze'), /keine allein sichere/);
  assert.match(text('luchs'), /können Krallen dennoch/);
  assert.match(text('stockente'), /Schwingenmauser/);
  assert.match(text('krickente'), /Wintergäste und Brutbestand/);
});
