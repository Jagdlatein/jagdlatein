const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');

const load = createLoader();
const { answerJagdlateinLawQuestion: answer } = load('lib/jagdlatein-chat-law.js');
const { getLegalDataset } = load('lib/regional-law-data.js');
const { buildRegionalLawBundle } = load('lib/regional-law-core.js');
const asOf = '2026-11-10';
const selected = (country, region) => ({ country, region });
const ask = (question, country, region, date = asOf) => answer(question, selected(country, region), { asOf: date });

function assertReviewedAnswer(result, country, region, id, scope = region) {
  const expected = buildRegionalLawBundle(getLegalDataset(country), scope, { includeFederal: false, asOf })
    .articles.find(article => article.id === id);
  assert.equal(result.kind, 'region');
  assert.equal(expected.learningReviewed, true);
  assert.deepEqual(result.law, {
    jurisdiction: result.law.jurisdiction,
    lawTitle: expected.lawTitle,
    citation: expected.citation,
    reviewedOn: expected.reviewedOn,
  });
  assert.ok(result.text.endsWith(expected.summary), id);
  const internal = new URL(result.links[0].href, 'https://jagdlatein.de');
  assert.equal(internal.pathname, '/jagdrecht/' + country.toLowerCase());
  assert.equal(internal.searchParams.get('region'), region);
  assert.equal(internal.searchParams.get('artikel'), id);
  assert.equal(internal.searchParams.get('thema'), expected.topic);
  assert.equal(internal.searchParams.get('bund'), scope === 'BUND' ? null : '0');
  assert.deepEqual(result.links.slice(1), expected.sources.filter(source => source.kind === 'law')
    .map(source => ({ label: source.title, href: new URL(source.url).href })));
}

function assertAbstains(result) {
  assert.equal(result.kind, 'region');
  assert.equal(result.law, undefined);
  assert.ok(result.links.every(link => link.href.startsWith('/jagdrecht')));
}

test('Clear regional questions answer directly with the existing summary, jurisdiction and exact original statute link', () => {
  for (const [question, country, region, id, scope, answerText] of [
    ['Welches Jagdsystem gilt in Zürich?', 'CH', 'ZH', 'ch-zh-revierpacht', 'Kanton Zürich · Schweiz', /Reviersystem/],
    ['Welches Jagdsystem gilt in Bern?', 'CH', 'BE', 'ch-be-patentjagd', 'Kanton Bern · Schweiz', /Patentsystem/],
    ['Wer ist für die Nachsuche verantwortlich?', 'CH', 'BE', 'ch-be-nachsuche', 'Kanton Bern · Schweiz', /Verantwortung/],
    ['Welche Mindestgrösse hat ein Eigenjagdrevier in Bayern?', 'DE', 'BY', 'de-by-eigenjagd-groesse', 'Bundesland Bayern · Deutschland', /81,755 ha.*300 ha/],
    ['Wie viele Fragen hat die schriftliche Jägerprüfung in Bayern?', 'DE', 'BY', 'de-by-schriftliche-pruefung', 'Bundesland Bayern · Deutschland', /100 Fragen in 100 Minuten/],
    ['Ab welchem Alter kommt die Jahresjagdkarte in Salzburg in Betracht?', 'AT', 'S', 'at-s-jahresjagdkarte', 'Bundesland Salzburg · Österreich', /16\. Lebensjahr.*weiteren|16\. Lebensjahr.*mehreren/],
  ]) {
    const result = ask(question, country, region);
    assertReviewedAnswer(result, country, region, id);
    assert.equal(result.law.jurisdiction, scope);
    assert.match(result.text, answerText);
  }
});

test('An identical vetted learning question answers with its saved choice and explanation, including legal boundaries', () => {
  const article = getLegalDataset('AT').regions.find(region => region.code === 'NOE').articles
    .find(article => article.id === 'at-noe-verweigerung');
  const [question] = article.questions;
  const result = ask(question.prompt, 'AT', 'NOE');
  assertReviewedAnswer(result, 'AT', 'NOE', article.id);
  assert.equal(result.text.split('\n\n')[0], question.choices[question.correctIndex]);
  assert.ok(result.text.includes(question.explanation));
  assert.match(result.text, /Dauer dieses Verbots/);
});

test('Federal rules are identified as federal and retain the selected regional law landing context', () => {
  for (const question of ['Wo gilt mein Jagdschein bundesweit?', 'Wo gilt der deutsche Jagdschein?', 'Was steht in § 15 Abs. 3 BJagdG?']) {
    const result = ask(question, 'DE', 'BY');
    assertReviewedAnswer(result, 'DE', 'BY', 'de-bund-jagdschein-gebiet', 'BUND');
    assert.equal(result.law.jurisdiction, 'Bundesrecht · Deutschland');
    assert.match(result.text, /bundesweit/);
    assert.match(result.text, /keine freie Jagderlaubnis/);
  }
  const result = ask('Was bestimmt Art. 3 JSG?', 'CH', 'ZH');
  assertReviewedAnswer(result, 'CH', 'ZH', 'ch-bund-zustaendigkeit', 'BUND');
  assert.equal(result.law.jurisdiction, 'Bundesrecht · Schweiz');
  assert.match(result.law.citation, /JSG/);
  assertAbstains(ask('Wo gilt mein Jagdschein?', 'DE', 'BY'));
  assertAbstains(ask('Wo gilt der deutsche Jagdschein?', 'AT', 'S'));
});

test('Country-only, ambiguous, foreign or conflicting scopes never use a different jurisdiction', () => {
  const nationwide = ask('Welches Jagdsystem gilt in der Schweiz?', 'CH', 'ZH');
  assertAbstains(nationwide);
  assert.equal(nationwide.links[0].href, '/jagdrecht/ch');
  const both = ask('Welches Jagdsystem gilt im Kanton Zürich in der Schweiz?', 'CH', 'ZH');
  assertReviewedAnswer(both, 'CH', 'ZH', 'ch-zh-revierpacht');
  for (const [question, country, region] of [
    ['Wie viele Fragen hat die niedersächsische Jägerprüfung?', 'DE', 'BY'],
    ['Welche Mindestgrösse hat ein Eigenjagdrevier in Bayern und Niedersachsen?', 'DE', 'BY'],
    ['Welche Mindestgrösse hat ein Eigenjagdrevier in Frankreich?', 'DE', 'BY'],
    ['Muss ich in Frankreich meinen Jagdschein bundesweit mitführen?', 'DE', 'BY'],
    ['Welches Jagdsystem gilt in BE?', 'CH', 'BE'],
    ['Welches Jagdsystem gilt in CH/BE?', 'DE', 'BE'],
    ['Was bestimmt Art. 3 JSG?', 'DE', 'BY'],
    ['Welche Jagdzeiten gelten in Bayern?', 'CH', 'ZH'],
  ]) assertAbstains(ask(question, country, region));
  const code = ask('Welches Jagdsystem gilt in CH/BE?', 'CH', 'BE');
  assertReviewedAnswer(code, 'CH', 'BE', 'ch-be-patentjagd');
  const noProfile = answer('Welches Jagdsystem gilt in Zürich?', null, { asOf });
  assertAbstains(noProfile);
  assert.equal(noProfile.links[0].href, '/jagdrecht');
});

test('Number-only, mismatched statutory reference types and unsupported paragraph numbers abstain', () => {
  for (const [question, country, region] of [
    ['§ 2 Abs. 1', 'CH', 'ZH'],
    ['Was steht in Art. 4 Abs. 1?', 'CH', 'BE'],
    ['§ 59 Abs. 2', 'AT', 'NOE'],
    ['Was steht in § 8 BayJG?', 'DE', 'BY'],
    ['Was steht in Art. 8 Abs. 9 BayJG?', 'DE', 'BY'],
    ['Was steht in § 15 BJagdG?', 'DE', 'BY'],
  ]) assertAbstains(ask(question, country, region));
  assertReviewedAnswer(ask('Was steht in Art. 8 BayJG?', 'DE', 'BY'), 'DE', 'BY', 'de-by-eigenjagd-groesse');
});

test('Unreviewed original text and stored but withheld questions never become direct legal advice', () => {
  const unreviewed = buildRegionalLawBundle(getLegalDataset('CH'), 'ZH', { includeFederal: false, asOf }).articles
    .find(article => article.id === 'ch-zh-treffsicherheit');
  assert.equal(unreviewed.learningReviewed, false);
  assert.ok(unreviewed.officialText);
  const hiddenPrompt = getLegalDataset('CH').regions.find(region => region.code === 'ZH').articles
    .find(article => article.id === unreviewed.id).questions[0].prompt;
  assertAbstains(ask(hiddenPrompt, 'CH', 'ZH'));
  assertAbstains(ask('Wie alt darf mein Treffsicherheitsnachweis sein?', 'CH', 'ZH'));
  assertAbstains(ask('Kann ich nach bestandener Jagdprüfung schon mit 15 die burgenländische Jagdkarte erhalten?', 'AT', 'B'));
  assertAbstains(ask('Was ist das Mindestalter für die burgenländische Jagdkarte?', 'AT', 'B'));
});

test('Effective dates use the existing legal publication gate and historical or practical scenarios abstain', () => {
  const record = getLegalDataset('CH').regions.find(region => region.code === 'GL').articles
    .find(article => article.id === 'ch-gl-patentsystem');
  const query = 'Welches Jagdsystem schreibt das Glarner Jagdgesetz vor?';
  assert.equal(ask(query, 'CH', 'GL', '2026-12-31').law.citation, record.citation);
  assertAbstains(ask(query, 'CH', 'GL', record.effectiveUntil));
  assertAbstains(ask(query, 'CH', 'GL', '2026-10-22'));
  assertAbstains(ask('Gilt die sechsmonatige Mentorat-Ausbildung 2028?', 'DE', 'RP'));
  assertAbstains(ask('Darf ich morgen in Zürich jagen?', 'CH', 'ZH'));
  assertAbstains(ask('Welche Jagdzeiten gelten in Zürich?', 'CH', 'ZH'));
  assertAbstains(ask('Darf ich nach Art. 3ter JSV nachts im Wald ohne Bewilligung jagen, wenn ich selbst Wildschaden vermute?', 'CH', 'ZH'));
  const night = ask('Was steht in Art. 3ter JSV?', 'CH', 'ZH');
  assertReviewedAnswer(night, 'CH', 'ZH', 'ch-bund-nachtjagd-wald', 'BUND');
  assert.match(night.text, /nicht schon daraus.*selbst einen Schaden vermutet/);
});

test('St. Gallen links the applicable enactment for both the hunting system and proof of marksmanship', () => {
  const system = ask('Welches Jagdsystem gilt in St. Gallen?', 'CH', 'SG');
  assertReviewedAnswer(system, 'CH', 'SG', 'ch-sg-jagdpacht');
  assert.match(system.text, /Jagdpachtsystem/);
  const proof = ask('Wie lange ist der JFK-Treffsicherheitsnachweis nach der geltenden St. Galler Grundregel gültig?', 'CH', 'SG');
  assertReviewedAnswer(proof, 'CH', 'SG', 'ch-sg-treffsicherheitsnachweis');
  assert.equal(proof.law.lawTitle, 'Jagdverordnung (JV), sGS 853.11');
  assert.match(proof.law.citation, /Art\. 24.+Art\. 26/);
  assert.deepEqual(proof.links.slice(1).map(link => link.href), [
    'https://www.gesetzessammlung.sg.ch/api/de/versions/3479/pdf_file_with_annexes',
  ]);
});
