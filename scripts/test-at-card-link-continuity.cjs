const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const { buildRegionalLawBundle, legalSelectionHref } = createLoader()('lib/regional-law-core.js');
const dataset = require('../data/jagdrecht-regional/at.json');
const options = { asOf: '2026-10-24', includeFederal: false };

test('The established NÖ weapons-ban article link keeps its title, exact Z-2 excerpt and the same authored question', () => {
  const bundle = buildRegionalLawBundle(dataset, 'NOE', options);
  const article = bundle.articles.find(item => item.id === 'at-noe-verweigerung');
  assert.ok(article && article.learningReviewed);
  assert.equal(article.title, 'Waffenverbot trotz bestandener Jagdprüfung');
  assert.equal(article.citation, '§ 61 Abs. 1 Z 2');
  assert.equal(article.officialTextCitation, '§ 61 Abs. 1 Einleitung und Z 2');
  assert.match(article.officialText, /denen der Besitz von Waffen nach den waffenrechtlichen Vorschriften verboten wurde auf die Dauer des Verbotes/);
  assert.equal(bundle.questions.find(item => item.id === 'at-noe-verweigerung-q1').articleId, article.id);
  assert.equal(legalSelectionHref('AT', { region: 'NOE', article: article.id }), '/jagdrecht/at?region=NOE&artikel=at-noe-verweigerung');
});

test('The separately checked application question keeps its own article and cannot be attributed to the weapons-ban case', () => {
  const bundle = buildRegionalLawBundle(dataset, 'NOE', options);
  const rest = bundle.articles.find(item => item.id === 'at-noe-weitere-voraussetzungen');
  assert.ok(rest && rest.learningReviewed);
  assert.equal(rest.title, 'Weitere Voraussetzungen trotz bestandener Jagdprüfung');
  assert.deepEqual(rest.questions.map(item => item.id), ['at-noe-verweigerung-q2']);
  assert.equal(bundle.questions.find(item => item.id === 'at-noe-verweigerung-q2').articleId, rest.id);
  assert.ok(rest.sources.some(source => source.url === 'https://www.noejagdverband.at/wp-content/uploads/Servicemappe-2026.pdf'));
  const weapons = bundle.articles.find(item => item.id === 'at-noe-verweigerung');
  assert.deepEqual(weapons.questions.map(item => item.id), ['at-noe-verweigerung-q1']);
  assert.equal(legalSelectionHref('AT', { region: 'NOE', article: rest.id }), '/jagdrecht/at?region=NOE&artikel=at-noe-weitere-voraussetzungen');
});
