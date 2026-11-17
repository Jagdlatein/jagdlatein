// Regression checks for two narrowly sourced appended lessons, not a curriculum certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const baseline = 'b9ed55f832c73b5cb7805759ed0b0809267e7e20';
function historicalLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (filename.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) } : id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return load;
}
const load = createLoader(), old = historicalLoader();
const curriculum = load('lib/learning-curriculum.js'), previous = old('lib/learning-curriculum.js');
const specs = [
  { course: 'wissen-optik', lesson: 'fernglas-einstellungen', title: 'Fernglas einstellen', questionIds: ['fernglas-dioptrie', 'fernglas-fokus'], sources: [
    'https://imaging.nikon.com/sport-optics/guide/binoculars/using/using_01/',
    'https://leica-camera.com/sites/default/files/2021-10/Trinovid_DE_Upd%2B2021.pdf',
    'https://imaging.nikon.com/sport-optics/guide/binoculars/using/using_04/',
  ] },
  { course: 'wissen-wildbrethygiene', lesson: 'messort-temperatur', title: 'Temperatur messen', questionIds: ['temperatur-oberflaeche', 'temperatur-kuehlgeraet'], sources: [
    'https://www.foodstandards.gov.au/business/food-safety/thermometers',
    'https://www.lwk-niedersachsen.de/lwk/news/42763_Thermometer_im_Einsatz_fuer_die_Hygiene_-_Wissen_fuer_die_Praxis',
    'https://www.foodstandards.gov.scot/business-guidance/running-a-food-business/publications/cooksafe-guide/cooksafe-guide-web-version/cooksafe-guide-web-version-section-3',
  ] },
];
const newQuestionIds = specs.flatMap(spec => spec.questionIds.map(id => `${spec.course}-${id}`));
const ownCard = card => specs.some(spec => card.moduleId === spec.course && card.lessonId === spec.lesson);
function strip(module) {
  const spec = specs.find(spec => spec.course === module.id);
  return spec ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== spec.lesson), questions: module.questions.filter(question => question.lessonId !== spec.lesson), sources: module.sources.filter(source => !spec.sources.includes(source.url)) } : module;
}

test('The complete raw practice corpus is unchanged apart from two tail lessons, four tail questions and their six lesson-scoped sources', () => {
  const current = load('lib/learning-practice.js').practiceModules, before = old('lib/learning-practice.js').practiceModules;
  assert.deepEqual(current.map(strip), before);
  for (const spec of specs) {
    const module = current.find(item => item.id === spec.course), original = before.find(item => item.id === spec.course);
    assert.deepEqual(module.lessons.slice(0, -1), original.lessons);
    assert.deepEqual(module.questions.slice(0, -2), original.questions);
    assert.deepEqual(module.sources.slice(0, -3), original.sources);
    assert.equal(module.lessons.at(-1).id, spec.lesson);
    assert.deepEqual(module.questions.slice(-2).map(question => question.id), spec.questionIds);
    assert.deepEqual(module.sources.slice(-3).map(source => source.url), spec.sources);
    assert.ok(module.sources.slice(-3).every(source => source.organization && source.supports && JSON.stringify(source.lessonIds) === JSON.stringify([spec.lesson])));
    assert.equal(curriculum.getLearningModule(spec.course).reviewedOn, '2026-10-04');
  }
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The new explanations have narrow claim-level independent sources, their own actual dates and visible safety/method limits', () => {
  for (const spec of specs) {
    const course = curriculum.getLearningModule(spec.course), lesson = course.lessons.at(-1);
    assert.equal(lesson.title, spec.title); assert.equal(lesson.reviewedOn, '2026-11-17'); assert.equal(lesson.flashcardExpansion, true);
    assert.ok(lesson.paragraphs.join(' ').split(/\s+/).length >= 140); assert.ok(lesson.exercise && lesson.takeaway);
    assert.equal(lesson.evidence.length, 3);
    for (const evidence of lesson.evidence) {
      assert.ok(evidence.claim && evidence.sources.length >= 2);
      assert.ok(evidence.sources.every(source => spec.sources.includes(source.url)));
      assert.ok(new Set(evidence.sources.map(source => source.organization)).size >= 2, evidence.claim);
    }
    for (const prior of course.lessons.slice(0, -1)) assert.deepEqual(prior, previous.getLearningModule(spec.course).lessons.find(item => item.id === prior.id));
  }
  const optics = curriculum.getLearningModule(specs[0].course).lessons.at(-1).paragraphs.join(' ');
  assert.match(optics, /Zentralfokussierung/); assert.match(optics, /Abstand der beiden Okulare/); assert.match(optics, /Unterschied zwischen rechtem und linkem Auge/); assert.match(optics, /anderen Beobachtungsabstand.*Mitteltrieb/); assert.match(optics, /keine identische Bedienfolge für jede Bauart/); assert.match(optics, /niemals.*in die Sonne/);
  const food = curriculum.getLearningModule(specs[1].course).lessons.at(-1).paragraphs.join(' ');
  assert.match(food, /häufig die Luft/); assert.match(food, /Infrarotthermometer erfasst eine Oberflächentemperatur/); assert.match(food, /misst nicht durch das Fleisch/); assert.match(food, /geeignetes Einstechthermometer/); assert.match(food, /vor und nach der Benutzung/); assert.match(food, /noch keine Freigabe/); assert.match(food, /keine allgemeine Temperaturgrenze/);
  assert.doesNotMatch(food, /\d|°|garantiert|steril|immer sicher|Parasiten abtöten/);
});

test('Four new quiz questions keep four unique choices and become four explained cards without replacing any published card or starter', () => {
  const cards = load('lib/learning-flashcards.js').getFlashcards(), oldCards = old('lib/learning-flashcards.js').getFlashcards();
  const oldIds = new Set(oldCards.map(card => card.id));
  assert.deepEqual(cards.filter(card => oldIds.has(card.id)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  const additions = cards.filter(ownCard);
  assert.equal(additions.length, 4); assert.deepEqual(additions.map(card => card.id).sort(), newQuestionIds.map(id => `flash-${id}`).sort());
  for (const spec of specs) {
    const course = curriculum.getLearningModule(spec.course), questions = course.questions.filter(question => question.lessonId === spec.lesson);
    assert.equal(questions.length, 2);
    for (const question of questions) {
      assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4); assert.equal(question.correct.length, 1); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
      const card = additions.find(card => card.id === `flash-${question.id}`);
      assert.equal(card.question, question.q); assert.equal(card.explanation, question.explain); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
      const sourceOrder = spec.course === 'wissen-wildbrethygiene' ? [0, 2, 1] : [0, 1, 2];
      assert.equal(card.sourceScope, 'lesson'); assert.equal(card.reviewedOn, '2026-11-17'); assert.equal(card.courseHref, `/kurse/${spec.course}#lesson-${spec.lesson}`); assert.deepEqual(card.sources.map(source => source.url), sourceOrder.map(index => spec.sources[index]));
    }
  }
});

test('Existing course, category, search, quiz and scoped flashcard exports include the two actual lessons without new routes or topic branches', () => {
  const coursePage = load('pages/kurse/[slug].js'), flashcards = load('lib/learning-flashcards.js');
  assert.deepEqual(coursePage.getStaticPaths(), old('pages/kurse/[slug].js').getStaticPaths());
  const topicTree = load('lib/learning-topic-tree.js'), beforeTree = old('lib/learning-topic-tree.js');
  for (const [spec, term] of [[specs[0], 'Dioptrienausgleich'], [specs[1], 'Infrarotthermometer']]) {
    const props = coursePage.getStaticProps({ params: { slug: spec.course } }).props;
    assert.equal(props.module.lessons.at(-1).id, spec.lesson); assert.equal(props.flashcards.lessons[spec.lesson], 2);
    assert.deepEqual(topicTree.getLearningTopicLocation(spec.course), beforeTree.getLearningTopicLocation(spec.course));
    const exported = flashcards.getFlashcardExport({ courseId: spec.course, lessonId: spec.lesson }, { withChoices: true });
    assert.equal(exported.cards.length, 2); assert.ok(exported.cards.every(card => card.choices.length === 4)); assert.equal(exported.selection.returnHref, `/kurse/${spec.course}#lesson-${spec.lesson}`);
    const search = load('lib/learning-search.js').searchLearning({ query: term, type: 'course' }).results.find(item => item.id === `course:${spec.course}`);
    assert.ok(search, term); assert.equal(search.href, `/kurse/${spec.course}#lesson-${spec.lesson}`);
    const category = load('lib/learning-categories.js').getLearningCategoryByTitle(props.module.category);
    const overview = load('lib/learning-overview-server.js').getLearningOverviewData(category.slug);
    const summary = overview.modules.find(module => module.id === spec.course);
    assert.ok(summary.topics.some(topic => topic.href === `/kurse/${spec.course}#lesson-${spec.lesson}`));
  }
  const bank = load('data/questions-full.js').QUESTIONS;
  assert.ok(newQuestionIds.every(id => bank.some(question => question.id === id)));
  assert.ok(!bank.some(question => question.id === 'JL-118'), 'Do not revive the excluded blanket cooling guarantee');
});
