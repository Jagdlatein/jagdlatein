const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const { buildRegionalLawBundle } = createLoader()('lib/regional-law-core.js');
const dataset = require('../data/jagdrecht-regional/at.json');
const options = { asOf: '2026-10-24', includeFederal: false };
const question = {
  id: 'at-noe-verweigerung-q2',
  prompt: 'Welche Aussage beschreibt das Verhältnis von NÖ Jagdprüfung und Kartenausstellung?',
  choices: [
    'Auch nach bestandener Prüfung sind die übrigen Voraussetzungen und Verweigerungsgründe zu prüfen.',
    'Mit dem Prüfungszeugnis ist die Karte ohne weiteres Verfahren automatisch ausgestellt.',
    'Ein Verweigerungsgrund ist nur vor Beginn des Kurses von Bedeutung.',
  ],
  correctIndex: 0,
  explanation: 'Der Prüfungserfolg ersetzt die übrigen Voraussetzungen der Jagdkarte nicht.',
};
const original = 'Die Ausstellung der Jagdkarte ist Personen zu verweigern: […] denen eine der im § 58 geforderten Voraussetzungen fehlt,\n\nBei erstmaliger Bewerbung um eine Jagdkarte hat der Bewerber den Nachweis der jagdlichen Eignung durch die erfolgreiche Ablegung einer Prüfung […] zu erbringen (Jagdprüfung).\n\nBei Vorliegen der Voraussetzungen hat die Bezirksverwaltungsbehörde die Jagdkarte auszufertigen.';

test('Only the unchanged NÖ examination/application distinction is released against the current originals and independently authored guide', () => {
  const bundle = buildRegionalLawBundle(dataset, 'NOE', options);
  const article = bundle.articles.find(item => item.id === 'at-noe-weitere-voraussetzungen');
  assert.ok(article && article.learningReviewed);
  assert.deepEqual(article.questions, [question]);
  assert.equal(article.officialText, original);
  assert.equal(article.officialTextCitation, '§ 61 Abs. 1 Einleitung und Z 1; § 58 Abs. 5 Satz 1 mit gekennzeichneter Auslassung und Abs. 8 Satz 1');
  assert.equal(article.citation, '§ 58 Abs. 5 Satz 1 und Abs. 8 Satz 1; § 61 Abs. 1 Z 1');
  assert.equal(article.summary, 'Die NÖ Jagdprüfung dient dem Nachweis der jagdlichen Eignung. Der Prüfungserfolg allein ist noch keine ausgestellte Jagdkarte: Für die Kartenausstellung folgt ein eigener Antrag, bei dem auch die übrigen Voraussetzungen und Verweigerungsgründe zu prüfen sind. Der Lernfall behandelt diese Trennung, nicht die einzelnen weiteren Ausschlussgründe oder Fristen.');
  assert.equal(article.reviewedOn, '2026-10-24');
  assert.deepEqual(article.sources.filter(source => source.kind === 'law').map(source => source.url), [
    'https://ris.bka.gv.at/eli/lgbl/NI/6500/P61/LNO40035284',
    'https://ris.bka.gv.at/eli/lgbl/NI/6500/P58/LNO40085768',
  ]);
  const guide = article.sources.find(source => source.url === 'https://www.noejagdverband.at/wp-content/uploads/Servicemappe-2026.pdf');
  assert.equal(guide.publisher, 'NÖ Landesjagdverband');
  assert.equal(guide.kind, 'context');
  assert.match(guide.title, /Seiten 1–2/);
  const stored = dataset.regions.find(region => region.code === 'NOE').articles.find(item => item.id === article.id);
  assert.match(stored.verificationNote, /zählt nicht als unabhängiger Zweitbeleg/);
  assert.match(stored.verificationNote, /Einzelne weitere Verweigerungsgründe, Fristen, Gebühren, Versicherungsumfang und örtliche Zuständigkeiten werden nicht neu gelehrt/);
  const prepared = bundle.questions.filter(item => item.id === question.id);
  assert.equal(prepared.length, 1);
  assert.equal(prepared[0].articleId, article.id);
  assert.equal(prepared[0].regionCode, 'NOE');
  assert.equal(prepared[0].options.find(option => prepared[0].correctIds.includes(option.id)).text, question.choices[0]);
});

test('The NÖ guide does not release other unverified AT subjects or change the country-wide review date', () => {
  assert.equal(dataset.reviewedOn, '2026-10-23');
  const gated = [
    ['B', 'at-b-verweigerung', 2],
    ['OOE', 'at-ooe-voraussetzungen', 2],
    ['S', 'at-s-jagderlaubnisschein', 1],
    ['T', 'at-t-kartenpflicht', 2],
    ['W', 'at-w-gastkarte-original', 0],
  ];
  for (const [region, id, storedCount] of gated) {
    const article = buildRegionalLawBundle(dataset, region, options).articles.find(item => item.id === id);
    assert.ok(article && !article.learningReviewed, id);
    assert.equal(article.summary, '');
    assert.deepEqual(article.questions, []);
    const stored = dataset.regions.find(item => item.code === region).articles.find(item => item.id === id);
    assert.equal(stored.questions.length, storedCount);
  }
  for (const region of dataset.regions.filter(item => item.code !== 'NOE')) {
    assert.equal(buildRegionalLawBundle(dataset, region.code, options).questions.some(item => item.id === question.id), false);
  }
});
