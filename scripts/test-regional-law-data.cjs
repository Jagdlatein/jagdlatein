const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const core = load('lib/regional-law-core.js');
const registry = {
  CH: load('public/data/jagdrecht/ch/kantone.json'),
  DE: load('public/data/jagdrecht/de/laender.json'),
  AT: load('public/data/jagdrecht/at/bundeslaender.json'),
};

for (const country of ['CH', 'DE', 'AT']) {
  test(`${country}: regional catalog covers the actual registry and every released question stays inside its jurisdiction`, () => {
    const data = load(`data/jagdrecht-regional/${country.toLowerCase()}.json`);
    const expected = (Array.isArray(registry[country]) ? registry[country] : registry[country].items || registry[country].regions).map(region => region.code || region.kurz || region.id);
    assert.equal(data.country, country);
    assert.deepEqual(data.regions.filter(region => region.code !== 'BUND').map(region => region.code).sort(), expected.sort());
    assert.equal(new Set(data.regions.map(region => region.code)).size, data.regions.length);
    const ids = new Set(), questionIds = new Set();
    for (const region of data.regions) {
      assert.ok(region.name && region.lawTitle && new URL(region.officialUrl).protocol === 'https:', `${country}/${region.code}: official collection`);
      assert.ok(typeof region.examNotes === 'string' && region.examNotes.length > 0, `${country}/${region.code}: original-question availability must be stated honestly`);
      assert.ok(Array.isArray(region.examResources), `${country}/${region.code}: original sources are explicit`);
      for (const resource of region.examResources) {
        assert.ok(['official-catalog','official-sample','association-catalog','exam-rules'].includes(resource.kind));
        assert.ok(resource.title && resource.publisher && resource.notes && new URL(resource.url).protocol === 'https:');
        assert.match(resource.reviewedOn,/^\d{4}-\d{2}-\d{2}$/);
      }
      for (const article of region.articles) {
        assert.ok(!ids.has(article.id), `duplicate norm ${article.id}`); ids.add(article.id);
        if (article.originalVerified) {
          assert.ok(core.isReadableLegalArticle(article), `original ${article.id} needs current source, exact text and citation`);
          assert.ok(article.officialTextCitation || article.citation);
        }
        if (article.verified) assert.ok(core.isReviewedLegalArticle(article), `${article.id}: reviewed learning requires original plus independent source`);
        for (const question of article.questions || []) {
          assert.ok(!questionIds.has(question.id), `duplicate question ${question.id}`); questionIds.add(question.id);
          assert.ok(core.isValidLegalQuestion(question), `question structure ${question.id}`);
        }
      }
      const bundle = core.buildRegionalLawBundle(data, region.code);
      assert.ok(bundle.articles.every(article => [region.code, 'BUND'].includes(article.regionCode)));
      assert.ok(bundle.questions.every(question => question.country === country && [region.code, 'BUND'].includes(question.regionCode)));
      assert.ok(bundle.questions.every(question => bundle.articles.some(article => article.id === question.articleId && article.learningReviewed)));
      for (const article of bundle.articles.filter(article => !article.learningReviewed)) {
        assert.equal(article.summary, ''); assert.deepEqual(article.questions, []);
        assert.ok(article.sources.every(source => source.kind === 'law'));
      }
    }
  });
}

test('Public static region metadata contains counts and destinations, no paid question bank or statute bodies', () => {
  const data = load('lib/regional-law-data.js');
  for (const country of data.getAllLegalCountryMetadata()) {
    assert.equal(country.country, country.code, 'The reader receives the exact country used by the authenticated API.');
    const serialized = JSON.stringify(country);
    for (const field of ['officialText', 'summary', 'correctIndex', 'prompt', 'questions', 'choices']) assert.ok(!serialized.includes(`"${field}"`), field);
    for (const region of country.regions) {
      assert.ok(Number.isInteger(region.articleCount) && Number.isInteger(region.questionCount));
      const bundle = core.buildRegionalLawBundle(data.getLegalDataset(country.code), region.code, { includeFederal: false });
      assert.equal(region.articleCount, bundle.articles.length); assert.equal(region.questionCount, bundle.questions.length);
    }
  }
});

test('The recorded Glarus law version remains readable through 31 December and expires only on 1 January', () => {
  const data = load('data/jagdrecht-regional/ch.json');
  const article = data.regions.find(region => region.code === 'GL').articles.find(article => article.id === 'ch-gl-patentsystem');
  assert.equal(article.effectiveUntil, '2027-01-01', 'The core treats the end date as exclusive');
  assert.equal(core.isReadableLegalArticle(article, '2026-12-31'), true);
  assert.equal(core.isReadableLegalArticle(article, '2027-01-01'), false);
});
