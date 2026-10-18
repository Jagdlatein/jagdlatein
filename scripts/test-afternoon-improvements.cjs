// These tests check references, discovery, arithmetic, rendering and grading.
// They do not replace the documented reading and assessment of scientific sources.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const swc = pr('next/dist/build/swc');
const sharp = pr('sharp');
function load(relative, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  function resolve(id) {
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => children;
    if (id === 'next/image') return ({ priority, fill, ...props }) => React.createElement('img', props);
    if (id === 'next/router') return { useRouter: () => ({ isReady: true, query: {}, asPath: '/lernen', replace: async () => true }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), cache);
    return pr(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}

test('Twelve new courses cover every existing category, with real lesson evidence and varied well-formed questions', () => {
  const cache = new Map();
  const { afternoonModules } = load('lib/learning-afternoon-expansion.js', cache);
  const { learningCategories } = load('lib/learning-categories.js', cache);
  const { learningModules, learningQuestions } = load('lib/learning-curriculum.js', cache);
  assert.equal(afternoonModules.length, 12);
  assert.deepEqual(afternoonModules.map(item => item.category).sort(), [...learningCategories].sort());
  assert.equal(new Set(learningModules.map(item => item.id)).size, learningModules.length);
  assert.equal(new Set(learningQuestions.map(item => item.id)).size, learningQuestions.length);
  let addedQuestions = 0;
  for (const module of afternoonModules) {
    assert.ok(module.id.startsWith('wissen-vertiefung-'), module.id);
    assert.equal(module.reviewedOn, '2026-10-16');
    assert.ok(module.lessons.length >= 2 && module.questions.length >= 6, module.id);
    assert.ok(module.sources.length >= 2 && module.objectives.length >= 2, module.id);
    assert.ok(new Set(module.sources.map(source => source.organization)).size >= 2, module.id);
    for (const lesson of module.lessons) {
      assert.ok(lesson.paragraphs.length >= 2 && lesson.takeaway && lesson.exercise, lesson.id);
      assert.ok(lesson.evidence.length, lesson.id);
      for (const item of lesson.evidence) {
        assert.ok(item.claim);
        assert.ok(new Set(item.sources.map(source => source.url)).size >= 2, `${module.id}/${lesson.id}`);
        for (const source of item.sources) assert.ok(module.sources.some(actual => actual.url === source.url && actual.label === source.label));
      }
    }
    const prepared = learningModules.find(item => item.id === module.id);
    for (const question of prepared.questions) {
      assert.equal(question.answers.length, 4);
      assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
      assert.equal(question.correct.length, 1);
      assert.ok(question.answers.some(answer => question.correct.includes(answer.id)));
      assert.ok(prepared.lessons.some(lesson => lesson.id === question.lessonId));
      assert.ok(question.explain.length > 30);
    }
    addedQuestions += prepared.questions.length;
  }
  assert.ok(addedQuestions >= 72);
});

test('Each category shows its newest course first, while summary payloads and search omit lessons and answer keys', () => {
  const cache = new Map();
  const { learningCategoryDetails } = load('lib/learning-categories.js', cache);
  const { getLearningOverviewData } = load('lib/learning-overview-server.js', cache);
  const { learningModules } = load('lib/learning-curriculum.js', cache);
  const search = load('lib/learning-search.js', cache).searchLearning;
  for (const category of learningCategoryDetails) {
    const data = getLearningOverviewData(category.slug);
    const latest = learningModules.filter(module => module.category === category.title).reduce((date, module) => module.contentAddedOn > date ? module.contentAddedOn : date, '');
    assert.equal(data.modules[0].contentAddedOn, latest, category.slug);
    assert.equal(data.modules[0].coverIndex, null, `${category.slug}: a text course needs no decorative category photo`);
    assert.ok(data.modules.every(item => !item.lessons && !item.questions && !item.evidence));
    const result = search({ query: data.modules[0].title });
    assert.ok(result.results.some(item => item.href.startsWith(`/kurse/${data.modules[0].id}`)), category.slug);
    assert.ok(result.results.every(item => !item.answers && !item.correct && !item.questions && !item.lessons));
  }
});

test('Lesson evidence shows the exact claims, source labels and section review date; old lessons stay unchanged', () => {
  const Component = load('components/LessonEvidence.js').default;
  assert.equal(renderToStaticMarkup(React.createElement(Component, { lesson: { paragraphs: ['Bestand'] } })), '');
  const module = load('lib/learning-afternoon-expansion.js').afternoonModules[0];
  const lesson = module.lessons[0];
  const html = renderToStaticMarkup(React.createElement(Component, { lesson, reviewedOn: module.reviewedOn }));
  assert.match(html, /<summary>Belege zu dieser Lektion<\/summary>/);
  assert.match(html, /16\. Oktober 2026/);
  for (const item of lesson.evidence) {
    assert.ok(html.includes(item.claim.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;')));
    for (const source of item.sources) assert.ok(html.includes(`href="${source.url.replaceAll('&', '&amp;')}"`));
  }
});

test('Every published dental formula retains its three original counting checks within a varied sourced question bank', () => {
  const { dentitionProfiles } = load('lib/wildlife-dentition.js');
  const { makeDentitionQuestions } = load('lib/dentition-questions.js');
  const { gradeResearchQuestion } = load('lib/research-question-round.js');
  const { answerOrder } = load('lib/answer-order.js');
  assert.deepEqual(makeDentitionQuestions(null), []);
  assert.deepEqual(makeDentitionQuestions({ formula: {} }), []);
  for (const profile of dentitionProfiles) {
    const questions = makeDentitionQuestions(profile);
    assert.equal(questions.length, 16, profile.slug);
    assert.equal(new Set(questions.map(question => question.id)).size, questions.length);
    if (profile.variants?.length) assert.ok(questions.every(question => question.prompt.includes('Grundform')), profile.slug);
    const expected = [profile.total, profile.count.upper * 2, profile.formula.M[1]];
    questions.slice(0, 3).forEach((question, index) => {
      assert.equal(question.context, profile.scope);
      assert.deepEqual(question.sourceIds, profile.sourceIds);
      assert.equal(new Set(question.options.map(option => option.text)).size, 4);
      const correct = question.options.find(option => question.correctIds.includes(option.id));
      assert.equal(parseInt(correct.text), expected[index]);
      assert.equal(gradeResearchQuestion(question, [correct.id]).correct, true);
      assert.equal(gradeResearchQuestion(question, [question.options.find(option => option.id !== correct.id).id]).correct, false);
      const positions = new Set(Array.from({ length: 12 }, (_, seed) => answerOrder(question.options, question.id, seed).map(i => question.options[i].id).indexOf(correct.id)));
      assert.ok(positions.size > 1, `${question.id}: answer positions vary`);
    });
  }
});

test('Species searches open existing matching sections, including withheld formulas and the new bird beak sections', () => {
  const catalog = load('lib/european-wildlife.js');
  const { matchWildlifeSection } = load('lib/wildlife-section-match.js');
  const search = load('lib/learning-search.js').searchLearning;
  for (const [slug, query] of [['rotwild', 'Rotwild Zahnformel'], ['sikawild', 'Sika Zahnformel'], ['rentier', 'Rentier Zähne'], ['wisent', 'Wisent Gebiss'], ['rothuhn', 'Rothuhn Zähne']]) {
    assert.equal(matchWildlifeSection(catalog.europeanWildlifeBySlug[slug], query).href, `/wildkunde/${slug}#gebiss`);
    assert.ok(catalog.filterEuropeanWildlife({ query }).some(item => item.slug === slug), query);
    assert.ok(search({ query, type: 'species' }).results.some(item => item.href === `/wildkunde/${slug}#gebiss`), query);
  }
  for (const species of catalog.europeanExpansion) {
    assert.equal(matchWildlifeSection(species, species.name), null);
    const section = species.sections[0];
    const match = matchWildlifeSection(species, section.title);
    assert.ok(match?.href.startsWith(`/wildkunde/${species.slug}#art-`), species.slug);
    assert.ok(species.sections.some(item => match.href.endsWith(`#art-${item.id}`)));
  }
  assert.equal(matchWildlifeSection(null, 'Gebiss'), null);
  for (const slug of ['rentier', 'pyrenaeengaemse', 'iberiensteinbock']) {
    const species = catalog.europeanWildlifeBySlug[slug];
    assert.ok(species.limits.some(limit => limit.includes('Gebissabschnitt')));
    assert.ok(species.limits.some(limit => limit.includes('Zahnwechselkalender') && limit.includes('weiterhin')));
  }
});

test('Species discovery matches the full catalog without importing full European sources or quiz keys into navigation', () => {
  const cache = new Map();
  const discovery = load('lib/european-wildlife-discovery.js', cache);
  const complete = load('lib/european-wildlife.js');
  assert.deepEqual(discovery.europeanWildlife.map(item => item.slug), complete.europeanWildlife.map(item => item.slug));
  for (const species of discovery.europeanWildlife.filter(item => item.europeanOnly)) {
    const full = complete.europeanWildlifeBySlug[species.slug];
    for (const key of ['name', 'scientificName', 'group', 'identification', 'habitat']) assert.equal(species[key], full[key]);
    assert.ok(!species.questions && !species.biologySources && !species.photo && !species.limits);
    for (const section of species.sections) {
      const original = full.sections.find(item => item.id === section.id);
      assert.equal(section.title, original.title);
      assert.deepEqual(section.paragraphs, original.paragraphs);
      assert.ok(!section.sources && !section.sourceIds);
    }
  }
  for (const query of ['Kegelrobbe Zahnformel', 'Rothuhn Fleckenlatz', 'Moorschneehuhn Knospen', 'Iberischer Hase', 'Rentier Zähne', 'Wisent Gebiss']) {
    assert.deepEqual(discovery.filterEuropeanWildlife({ query }).map(item => item.slug), complete.filterEuropeanWildlife({ query }).map(item => item.slug));
  }
  for (const component of ['components/WildlifePortraitLayout.js', 'pages/wildkunde/index.js']) {
    const graph = new Map(); load(component, graph);
    assert.ok([...graph.keys()].every(filename => !filename.replaceAll('\\', '/').endsWith('/lib/european-wildlife.js')), component);
  }
});

test('The five added real photos decode with exact size, checksum, provenance and an explicit public image allowlist entry', async () => {
  const { europeanExpansion } = load('lib/european-wildlife.js');
  const { learningImagePaths } = load('lib/learning-image-paths.js');
  const { birdDentitionSlugs } = load('lib/wildlife-dentition.js');
  const added = europeanExpansion.filter(item => ['rothuhn', 'chukarhuhn', 'moorschneehuhn', 'kegelrobbe', 'iberischer-hase'].includes(item.slug));
  assert.equal(added.length, 5);
  for (const species of added) {
    const photo = species.photo;
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    const actual = await sharp(bytes).metadata();
    assert.equal(actual.width, photo.width, species.slug);
    assert.equal(actual.height, photo.height, species.slug);
    assert.ok(Math.max(actual.width, actual.height) <= 1600);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), photo.sha256);
    assert.equal(photo.aiGenerated, false);
    assert.ok(photo.sourcePage && photo.author && photo.licenseUrl && photo.modifications);
    assert.ok(learningImagePaths.includes(photo.src));
    assert.equal(birdDentitionSlugs.has(species.slug), species.group === 'Hühner und Raufußhühner');
    assert.ok(species.questions?.length >= 3);
    const sources = new Set(species.biologySources.map(source => source.id));
    for (const question of species.questions) {
      assert.equal(new Set(question.options.map(option => option.text)).size, 4);
      assert.ok(question.correctIds.length === 1 && question.options.some(option => question.correctIds.includes(option.id)));
      assert.ok(question.sourceIds.length >= 2 && question.sourceIds.every(id => sources.has(id)));
    }
  }
});

test('The two foldable portrait quizzes have independent accessible section IDs and keep variable dental totals explicit', () => {
  const species = load('lib/european-wildlife.js').europeanWildlifeBySlug.kegelrobbe;
  const html = renderToStaticMarkup(React.createElement(load('components/EuropeanWildlifePortrait.js').default, { species }));
  assert.match(html, /id="artencheck-kegelrobbe"/);
  assert.match(html, /id="gebisscheck-kegelrobbe"/);
  assert.match(html, /Grundform: 34 Zähne/);
  assert.match(html, /35 beziehungsweise 36/);
  assert.equal((html.match(/id="gebiss-title"/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});
