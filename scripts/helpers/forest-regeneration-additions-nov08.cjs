// Isolate exactly two appendices and the explicitly approved one-sentence correction.
const assert = require('node:assert/strict');
const courseId = 'wissen-ausbau-waldverjuengung-verbiss';
const lessonIds = ['vermehrungswege', 'stockausschlag-wurzelbrut'];
const questionIds = ['vermehrungswege-unterschied', 'stock-wurzel-herkunft'];
const sourceURLs = [
  'https://www.sbs.sachsen.de/download/Waldpost_2021_Web_barrierefrei.pdf',
  'https://www.uni-goettingen.de/de/41752.html',
  'https://www.wsl.ch/de/ueber-die-wsl/organisation/programme-und-initiativen/wsl-netzwerk-zur-erforschung-der-waldverjuengung/',
  'https://www.wien.gv.at/spezial/waldleitfaden/files/Waldleitfaden.pdf',
];
const sourceScopes = [lessonIds, lessonIds, [lessonIds[0]], [lessonIds[0]]];
const originalSentence = 'Bei natürlicher Verjüngung müssen Samen auf geeignete Bedingungen treffen und Keimlinge weiterwachsen können.';
const correctedSentence = 'Bei natürlicher Verjüngung aus Samen müssen diese auf geeignete Bedingungen treffen und Keimlinge weiterwachsen können.';
const originalParagraph = 'Waldverjüngung bezeichnet die Entwicklung einer neuen Baumgeneration. Bei natürlicher Verjüngung müssen Samen auf geeignete Bedingungen treffen und Keimlinge weiterwachsen können. Licht, Boden, Wasserangebot und konkurrierende Vegetation wirken zusammen; gepflanzte Jungbäume besitzen ebenfalls solche Standortansprüche. Das Vorhandensein alter Bäume einer Art beweist deshalb nicht, dass diese Art in ausreichendem Umfang nachwächst. Zwischen Samenangebot, Keimung und dem Erreichen weiterer Entwicklungsstufen liegen unterschiedliche Schritte, die nicht mit einem einzigen Blick auf die Kronen beurteilt werden können.';
const correctedParagraph = originalParagraph.replace(originalSentence, correctedSentence);
function stripForestRegenerationAddition(module) {
  if (module?.id !== courseId) return module;
  if (!module.lessons.some(item => lessonIds.includes(item.id))) {
    assert.equal(module.lessons[0].paragraphs[0], originalParagraph);
    return module;
  }
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  assert.deepEqual(module.questions.filter(item => lessonIds.includes(item.lessonId)).map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  assert.deepEqual(module.sources.slice(-4).map(item => item.url), sourceURLs);
  assert.ok(module.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(sourceScopes[index])));
  assert.equal(module.lessons[0].id, 'entstehung');
  assert.equal(module.lessons[0].paragraphs[0], correctedParagraph);
  const lessons = module.lessons.slice(0, -2).map((item, index) => index === 0
    ? { ...item, paragraphs: [originalParagraph, ...item.paragraphs.slice(1)] } : item);
  return { ...module, lessons, questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)), sources: module.sources.slice(0, -4) };
}
function isForestRegenerationCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function forestRegenerationBaselineFixture(overrides = {}) {
  const key = './learning-expansion-nature';
  const exported = Object.hasOwn(overrides, key) ? overrides[key] : require('./project-module.cjs').createLoader(overrides)('lib/learning-expansion-nature.js');
  return { ...overrides, [key]: { ...exported, natureExpansionModules: exported.natureExpansionModules.map(stripForestRegenerationAddition) } };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, sourceScopes, originalSentence, correctedSentence, originalParagraph, correctedParagraph,
  stripForestRegenerationAddition, isForestRegenerationCard, forestRegenerationBaselineFixture };
