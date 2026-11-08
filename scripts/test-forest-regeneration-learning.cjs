// Exact forest-learning preservation and integration checks; no scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { marmotHibernationBaselineFixture } = require('./helpers/marmot-hibernation-addition-nov08.cjs');
const { courseId, lessonIds, questionIds, sourceURLs: urls, sourceScopes, originalParagraph, correctedParagraph, stripForestRegenerationAddition, forestRegenerationBaselineFixture } = require('./helpers/forest-regeneration-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(marmotHibernationBaselineFixture(overrides));
const load = createLoader(), rawModules = load('lib/learning-expansion-nature.js').natureExpansionModules;
const raw = rawModules.find(item => item.id === courseId), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expectedSources = [urls, urls.slice(0, 2)];

test('Only two appendices and one precisely approved scope sentence change the full historical nature module', () => {
  assert.equal(hash(rawModules.map(stripForestRegenerationAddition)), '64859bf4c8cd423e27565126436b24eb0bbdb9d70908bba6e460840d22d3fe79');
  assert.equal(hash(stripForestRegenerationAddition(raw)), 'faa5f818c764dff74b9e27f9bfbe27512dd06e4a57b0a0ae0b00618aba8ea1b7');
  assert.equal(hash(stripForestRegenerationAddition(course)), 'e1e6cfa921dc34c7a53ed3eb7c60590d7ee0156784a4876d7e4d29e9feff4eeb');
  assert.equal(raw.lessons[0].paragraphs[0], correctedParagraph);
  assert.equal(stripForestRegenerationAddition(raw).lessons[0].paragraphs[0], originalParagraph);
  assert.equal(Object.hasOwn(raw, 'reviewedOn'), false); assert.equal(course.reviewedOn, '2026-10-04');
  assert.equal(course.lessons.length, 9); assert.equal(course.questions.length, 16); assert.equal(course.sources.length, 12);
  assert.deepEqual(course.lessons.slice(0, 7).map(item => item.id), ['entstehung', 'bestimmung', 'schaden', 'erhebung', 'weiser', 'waldziel', 'samenmast']);
  assert.ok(raw.lessons.slice(0, 6).every(item => !Object.hasOwn(item, 'reviewedOn'))); assert.equal(raw.lessons[6].reviewedOn, '2026-10-29');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 old course objects after only that sentence restoration and all 1773 original cards retain exact content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 892, questions: 2767 });
  assert.equal(hash(curriculum.learningModules.map(stripForestRegenerationAddition)), '46e9a61194fd23536c5782c12edf1ca0ad85bfee1043d3b044beae2f462d0fca');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), 'b0a956529bad8e63e3c169c2cbee037979d2d2e329d368b973ca47c2b032475a');
  assert.equal(cards.length, 1775);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), '527bfdba701b5785a6ba9c12d1449e4f2bfd10e7fbc1ae538b91549a74535b1c');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.deepEqual(createLoader(forestRegenerationBaselineFixture())('lib/learning-curriculum.js').learningModules, curriculum.learningModules.map(stripForestRegenerationAddition));
});

test('The first new lesson separates biological seed or plant-part origin from natural regeneration, sowing and planting', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[0]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 142);
  assert.match(text, /üblichen Samenweg der Waldbäume/); assert.match(text, /Nachwuchs generativ/);
  assert.match(text, /Vegetative Verjüngung setzt dagegen an vorhandenen Pflanzenteilen an/);
  assert.match(text, /nicht für jeden neuen Trieb zuvor ein neuer Samen/);
  assert.match(text, /Naturverjüngung kann durch natürliche Ansamung oder vegetativen Nachwuchs/);
  assert.match(text, /biologische Samenweg wird dadurch nicht vegetativ/);
  assert.match(text, /Pflanzung.*verrät für sich allein noch nicht, wie diese zuvor vermehrt wurde/);
  assert.match(text, /Eigene Prüfungsübung/); assert.match(text, /keine Anleitung zur Waldbegründung/);
  assert.doesNotMatch(text, /\d|Genotyp|Klon|Umtriebszeit|Ertrags|Vorteil|identisch|Niederwald|Hochwald|Mittelwald/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 3), [urls[0], urls[2], urls[3]]]);
});

test('The second lesson distinguishes stump and root origin using a bounded linden example and a non-invasive paper exercise', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[1]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 151);
  assert.match(text, /nach der Fällung verbliebenen Stammstock/); assert.match(text, /direkt aus Knospen an Wurzeln/);
  assert.match(text, /pflanzliche Organ ihres Ursprungs/); assert.match(text, /Linden liefern ein belegtes Beispiel für beide vegetativen Wege/);
  assert.match(text, /kein Merkmal aller Baumarten/); assert.match(text, /Mehrere sichtbare Triebe.*nicht automatisch mehrere unabhängig aus Samen/);
  assert.match(text, /bloße Nachbarschaft realer Triebe beweist ihre Verbindung nicht/);
  assert.match(text, /Wurzeln werden für diese Lernaufgabe nicht freigelegt/);
  assert.doesNotMatch(text, /\d|Genotyp|Klon|Qualität|Ertrags|identisches Erbgut|Umtriebszeit|Abschuss|Herbizid/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 2), urls.slice(0, 2)]);
});

test('Four directly read independent institutions have exact lesson roles and real dates without copied photographs, legal promises or the dead OÖ link', () => {
  for (const lesson of course.lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.image, undefined); }
  assert.deepEqual(course.sources.slice(-4).map(item => item.url), urls);
  assert.ok(course.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(sourceScopes[index])));
  assert.match(course.sources.at(-4).supports, /gedruckter S\. 47, physischer PDF-S\. 47/);
  assert.match(course.sources.at(-3).supports, /Enges Artbeispiel/);
  assert.match(course.sources.at(-2).supports, /keine experimentelle Replikation/);
  assert.match(course.sources.at(-1).supports, /1\.6\.1.*tatsächlich gelesen/);
  assert.match(course.sources.at(-1).supports, /keine aktuelle Gesetzesfassung behauptet/);
  assert.doesNotMatch(JSON.stringify(course.sources), /ooeljv|ooe.*Grundkenntnisse/);
  assert.ok(raw.lessons.slice(0, 7).every(item => !item.evidence || item.evidence.every(record => record.sources.every(source => !urls.includes(source.url)))));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Two own four-answer recall questions become two actual dated source-specific cards in every DACH learning pool', () => {
  const selected = course.questions.filter(item => lessonIds.includes(item.lessonId)); assert.deepEqual(selected.map(item => item.id), newIds);
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  selected.forEach((question, index) => {
    assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(all, { country, topic: course.topic }).some(item => item.id === question.id));
    const card = cards.find(item => item.id === `flash-${question.id}`); assert.ok(card, 'An actual standalone flashcard must exist, not merely a quiz question');
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-08'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${question.lessonId}`);
    assert.deepEqual(card.sources.map(item => item.url), expectedSources[index]);
  });
});

test('Existing forest category, direct course reader, shared search and real selected-card exports connect both lessons', () => {
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId), { categorySlug: 'wald-pflanzen', groupId: 'waldentwicklung-jahreslauf', groupTitle: 'Waldentwicklung & Jahreslauf' });
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  lessonIds.forEach((lessonId, index) => {
    const result = load('lib/learning-search.js').searchLearning({ query: index === 0 ? 'generative vegetative Verjüngung' : 'Stockausschlag Wurzelbrut', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(props.flashcards.lessons[lessonId], 1);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(exported.cards[0].id, newCardIds[index]);
  });
});

test('Both real readers place complete explanations and scope before closed final sources, with exact lesson evidence inside the course appendix', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  lessonIds.forEach((id, index) => {
    const lesson = course.lessons[7 + index]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 7 + index : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    assert.ok(expectedSources[index].every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    const lessonEvidence = html.slice(boundary, html.indexOf('Eigene Lerntexte und Übungsfragen', boundary));
    assert.ok(expectedSources[index].every(url => lessonEvidence.includes(url)));
    const excluded = urls.filter(url => !expectedSources[index].includes(url)); assert.ok(excluded.every(url => !lessonEvidence.includes(url)));
    assert.match(html.slice(boundary), /Alle Quellen dieses Themenbereichs/);
    assert.match(html, new RegExp(`Lektion ${8 + index} von 9`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /4\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  });
});

test('The protected exact-lesson card API and actual print reader retain complete answers, source scope and dates without an unauthenticated leak', async () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const denied = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => null } })('app/api/lernen/lernkarten/route.js');
  const noAccess = await denied.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=stockausschlag-wurzelbrut`));
  assert.equal(noAccess.status, 401); assert.doesNotMatch(await noAccess.text(), /Stockausschlag|Wurzelbrut|generativ/);
  const route = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  for (let index = 0; index < lessonIds.length; index++) {
    const lessonId = lessonIds[index], response = await route.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
    const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
    assert.deepEqual(deck.cards, cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId)); assert.equal(deck.cards.length, 1);
    const Print = createLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
      '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
      '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} } })('pages/lernen/lernkarten-drucken.js').default;
    const html = renderToStaticMarkup(React.createElement(Print)), appendix = html.indexOf('id="lernkarten-quellen"'); assert.ok(appendix > 0);
    for (const card of deck.cards) { assert.ok(html.indexOf(card.answer) < appendix); assert.ok(html.indexOf(card.explanation) < appendix); }
    assert.match(html, /Stand der Ausgangslektion: 8\.11\.2026/); assert.ok(expectedSources[index].every(url => html.slice(appendix).includes(url)));
  }
});

test('Isolated signed offline packs preserve all nine full lessons and scoped evidence while retaining the old course date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-forest-regeneration-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-04'); assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 2));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});

test('Historical isolation validates the whole corrected paragraph and refuses unapproved old-text or appendix-scope changes', () => {
  const unrelated = { id: 'unrelated', lessons: [{ id: 'vermehrungswege', paragraphs: ['unchanged'] }] };
  assert.equal(stripForestRegenerationAddition(unrelated), unrelated);
  const badText = structuredClone(raw); badText.lessons[0].paragraphs[0] += ' Neue unbelegte Alttextänderung.';
  assert.throws(() => stripForestRegenerationAddition(badText));
  const badScope = structuredClone(raw); badScope.sources.at(-1).lessonIds.push('entstehung');
  assert.throws(() => stripForestRegenerationAddition(badScope));
  const nearby = structuredClone(raw); nearby.lessons.splice(7, 0, { id: 'vermehrungswege-zusatz', paragraphs: ['keep'] });
  assert.equal(stripForestRegenerationAddition(nearby).lessons.at(-1).id, 'vermehrungswege-zusatz');
  const restored = stripForestRegenerationAddition(raw); assert.equal(stripForestRegenerationAddition(restored), restored);
});
