// Concrete scene data and preservation checks; source reading and frame review
// are documented separately. This is not biological or media authenticity certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const added = load('lib/wildlife-video-expansion-2026-10-26.js').wildlifeVideoExpansionCases;
const { wildlifeVideoCases, wildlifeVideoQuestionCount, wildlifeVideoAssetPaths } = load('lib/wildlife-video-cases.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const { dachWildlifeBySlug } = load('lib/dach-wildlife.js');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = [
  ['rehwild-galopp', 'Rehe in Bewegung', 'rehwild', 'wissen-rehwild-jahreslauf', 'Moritz Kohls', 'CC BY 4.0', 18],
  ['dachs-fellpflege', 'Dachs bei der Körperpflege', 'dachs', 'wissen-ausbau-raubwildoekologie', 'Lubo Ondrasko', 'CC BY 3.0', 103],
  ['biber-schwimmen', 'Biber am Ufer', 'biber', 'wissen-biber-schneidezaehne-2026', 'Анатолич1', 'CC BY-SA 4.0', 30],
  ['feldhase-feld', 'Feldhase auf offenem Boden', 'feldhase', 'wissen-ausbau-hasenartige', 'NaIzletuSi ™', 'CC BY 3.0', 26],
  ['stockente-gefiederpflege', 'Stockente bei der Gefiederpflege', 'stockente', 'wissen-ausbau-federaufbau-funktion-2026', 'Rhododendrites', 'CC BY-SA 4.0', 44],
  ['eichhoernchen-mauer', 'Eichhörnchen an einer Hauswand', 'eichhoernchen', 'wissen-vertiefung-populationsoekologie', 'WizzSilent', 'CC BY-SA 4.0', 12],
];
const ids = new Set(expected.map(item => item[0]));

test('Six bounded new original scenes resolve to the exact existing species and courses with explicit provenance', () => {
  assert.equal(added.length, 6);
  assert.deepEqual(added.map(item => [item.id, item.title, item.speciesSlug, item.course.split('/').at(-1), item.author, item.license, item.duration]), expected);
  for (const item of added) {
    assert.ok(dachWildlifeBySlug[item.speciesSlug]);
    assert.ok(getLearningModule(item.course.split('/').at(-1)));
    assert.equal(item.mimeType, 'video/mp4');
    assert.equal(item.reviewedOn, '2026-10-26');
    assert.equal(item.src, `/lernen/videos-2026-10-26/${item.id}.mp4`);
    assert.equal(item.poster, `/lernen/videos-2026-10-26/${item.id}-vorschau.jpg`);
    assert.ok(item.source.startsWith('https://commons.wikimedia.org/wiki/File:'));
    assert.ok(item.licenseUrl.startsWith('https://creativecommons.org/licenses/'));
    assert.equal(item.modifications, 'Vollständige Originalaufnahme als MP4/H.264 neu kodiert; Bildfolge und Laufzeit erhalten. Vorschaubild: einzelnes Standbild derselben Aufnahme.');
    assert.equal(item.observations.length, 3);
    assert.ok(item.observations.every(text => text.trim().length >= 40));
    const words = item.transcript.split(/\s+/).length;
    assert.ok(words >= 80 && words <= 120, `${item.id}: ${words} words`);
  }
});

test('The five original video objects, all fifteen old questions and their ordering remain exact', () => {
  const old = wildlifeVideoCases.filter(item => !ids.has(item.id));
  assert.deepEqual(old.map(item => item.id), ['fuchs', 'rotwild', 'schwarzwild', 'stockente', 'rehwild']);
  assert.equal(hash(old), '2da5832fd49a5d9d100f4e00ecc158a1360624f03b377b5aba9ccc61abcb2a27');
  assert.equal(old.flatMap(item => item.questions).length, 15);
  assert.equal(wildlifeVideoCases.length, 11);
  assert.equal(wildlifeVideoQuestionCount, 33);
  assert.deepEqual(wildlifeVideoCases.filter(item => ids.has(item.id)), added);
  assert.equal(new Set(wildlifeVideoCases.map(item => item.id)).size, 11);
  assert.deepEqual(wildlifeVideoAssetPaths, wildlifeVideoCases.flatMap(item => [item.src, item.poster]));
});

test('Eighteen own scene questions are unique, playable within each clip and balanced across answer positions', () => {
  const allStems = wildlifeVideoCases.flatMap(item => item.questions.map(question => question.question.trim().toLocaleLowerCase('de')));
  assert.equal(new Set(allStems).size, allStems.length);
  const positions = [0, 0, 0];
  for (const item of added) {
    assert.equal(item.questions.length, 3);
    assert.equal(new Set(item.questions.map(question => question.id)).size, 3);
    assert.deepEqual(item.questions.map(question => question.answer).sort(), [0, 1, 2]);
    let previous = -1;
    for (const question of item.questions) {
      assert.ok(Number.isFinite(question.at) && question.at >= 0 && question.at < item.duration);
      assert.ok(question.at > previous); previous = question.at;
      assert.equal(question.choices.length, 3);
      assert.equal(new Set(question.choices).size, 3);
      assert.ok(question.choices[question.answer]);
      assert.ok(question.question.trim());
      assert.ok(question.explanation.trim());
      positions[question.answer]++;
    }
  }
  assert.deepEqual(positions, [6, 6, 6]);
});

test('Each transcript preserves its concrete uncertainty rather than inventing location, food, diagnosis or intent', () => {
  const item = id => added.find(value => value.id === id);
  assert.match(item('rehwild-galopp').transcript, /Originalquelle beschreibt.*Blattzeit/);
  assert.match(item('rehwild-galopp').transcript, /weder eine Paarung noch den genauen Fortpflanzungszustand/);
  assert.match(item('dachs-fellpflege').transcript, /keinen Aufnahmeort/);
  assert.match(item('dachs-fellpflege').transcript, /ohne.*Parasitenbefall oder eine Erkrankung abzuleiten/);
  assert.match(item('biber-schwimmen').transcript, /orangefarbene Stücke; ihre Herkunft und ihr Zusammenhang.*unklar/);
  assert.match(item('biber-schwimmen').transcript, /Eine genaue Nahrung.*nicht zuverlässig/);
  assert.match(item('biber-schwimmen').location, /Moskau, Russland/);
  assert.match(item('feldhase-feld').transcript, /Commons-Kategorien.*Italien/);
  assert.match(item('stockente-gefiederpflege').transcript, /beweist keine bestimmte Ölverteilung, Drüsenwirkung oder allgemeine Wasserundurchlässigkeit/);
  assert.match(item('stockente-gefiederpflege').location, /New York, USA/);
  assert.match(item('eichhoernchen-mauer').transcript, /nicht als nachgewiesenes Alter oder sicherer innerer Zustand/);
  assert.match(item('eichhoernchen-mauer').transcript, /keine ausgeschriebene Ortsangabe/);
});

test('The existing video directory and page props expose each exact new scene without media or answer payload', () => {
  const library = load('lib/learning-video-library.js').getLearningVideoLibrary();
  const page = load('pages/lernen/videos.js').getStaticProps().props;
  assert.deepEqual(page.videos, library);
  for (const item of added) {
    const summary = library.find(value => value.id === `wild-${item.id}`);
    assert.ok(summary);
    assert.equal(summary.title, item.title);
    assert.equal(summary.subject, item.species);
    assert.equal(summary.duration, item.duration);
    assert.equal(summary.href, `/lernen/wildtier-videofaelle?eintrag=${item.id}#video-fall`);
    assert.equal(summary.src, undefined);
    assert.equal(summary.poster, undefined);
    assert.equal(summary.questions, undefined);
    assert.equal(summary.transcript, undefined);
  }
});
