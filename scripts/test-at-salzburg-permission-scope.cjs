const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const { buildRegionalLawBundle, legalSelectionHref } = createLoader()('lib/regional-law-core.js');
const dataset = require('../data/jagdrecht-regional/at.json');
const options = { asOf: '2026-10-24', includeFederal: false };
const fieldText = 'Der Jagderlaubnisschein muß zumindest den Namen des Jagdausübungsberechtigten, die Bezeichnung des Jagdgebietes bzw. Jagdgebietsteiles, die Wildart und die erlaubte Zeitdauer beinhalten.';
const authoredTimeQuestion = {
  id: 'at-s-jagderlaubnisschein-q2',
  prompt: 'Ein Salzburger Jagderlaubnisschein erlaubt eine Wildart nur bis zu einem bestimmten Datum. Welche Aussage stimmt?',
  choices: [
    'Die Jagd hat innerhalb der erteilten Erlaubnis zu bleiben.',
    'Eine gültige Jahresjagdkarte verlängert jede darin genannte Zeitdauer automatisch.',
    'Die Freigabe gilt automatisch für sämtliche jagdbaren Arten im Revier.',
  ],
  correctIndex: 0,
  explanation: 'Die allgemeine persönliche Karte erweitert die besondere Reviererlaubnis nicht.',
};

test('The established Salzburg article link retains its field topic and exact original while the broader question stays gated', () => {
  const bundle = buildRegionalLawBundle(dataset, 'S', options);
  const article = bundle.articles.find(item => item.id === 'at-s-jagderlaubnisschein');
  assert.ok(article && !article.learningReviewed);
  assert.equal(article.title, 'Schriftliche Jagderlaubnis: Inhalt und Grenzen');
  assert.equal(article.citation, '§ 47 Abs. 1 und 2');
  assert.equal(article.officialText, fieldText);
  assert.equal(article.officialTextCitation, '§ 47 Abs. 1 Satz 3');
  assert.equal(article.reviewedOn, '2026-10-23');
  assert.equal(article.summary, '');
  assert.deepEqual(article.questions, []);
  assert.ok(article.sources.every(source => source.kind === 'law'));
  assert.equal(bundle.questions.some(item => item.id === 'at-s-jagderlaubnisschein-q1'), false);
  const stored = dataset.regions.find(region => region.code === 'S').articles.find(item => item.id === article.id);
  assert.deepEqual(stored.questions.map(question => question.id), ['at-s-jagderlaubnisschein-q1']);
  assert.equal(legalSelectionHref('AT', { region: 'S', article: article.id }), '/jagdrecht/at?region=S&artikel=at-s-jagderlaubnisschein');
});

test('Only the unchanged authored time-limit question is released in its narrow new Salzburg block', () => {
  const bundle = buildRegionalLawBundle(dataset, 'S', options);
  const article = bundle.articles.find(item => item.id === 'at-s-jagderlaubnis-zeitdauer');
  assert.ok(article && article.learningReviewed);
  assert.equal(article.citation, '§ 47 Abs. 1 Satz 3 und Abs. 2 Satz 1');
  assert.equal(article.effectiveFrom, '1994-01-01');
  assert.equal(article.reviewedOn, '2026-10-24');
  assert.deepEqual(article.questions, [authoredTimeQuestion]);
  assert.equal(article.officialText, 'Der Jagderlaubnisschein muß zumindest […] die erlaubte Zeitdauer beinhalten.\n\nDer Jagdinhaber hat dafür zu sorgen, daß diese Personen die Jagd im Rahmen der erteilten Jagderlaubnis und unter Beachtung der Vorschriften dieses Gesetzes ausüben.');
  assert.match(article.officialTextCitation, /gekennzeichneter Auslassung/);
  assert.equal(article.sources.length, 2);
  assert.equal(article.sources[0].url, 'https://ris.bka.gv.at/eli/lgbl/SA/1993/100/P47/LSB12008372');
  assert.equal(article.sources[1].publisher, 'Oberster Gerichtshof');
  const prepared = bundle.questions.filter(question => question.id === authoredTimeQuestion.id);
  assert.equal(prepared.length, 1);
  assert.equal(prepared[0].articleId, article.id);
  assert.equal(prepared[0].country, 'AT');
  assert.equal(prepared[0].regionCode, 'S');
  assert.equal(prepared[0].options.find(option => prepared[0].correctIds.includes(option.id)).text, authoredTimeQuestion.choices[0]);
  assert.equal(prepared[0].sourceIds.length, 2);
  assert.equal(dataset.reviewedOn, '2026-10-23');
  for (const region of dataset.regions.filter(region => region.code !== 'S')) {
    assert.equal(buildRegionalLawBundle(dataset, region.code, options).questions.some(question => question.id === authoredTimeQuestion.id), false);
  }
});
