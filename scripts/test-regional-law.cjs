const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const core = createLoader()('lib/regional-law-core.js');
const source = (publisher, kind) => ({ title: `${publisher} test source`, publisher, kind, url: `https://${publisher}.example.invalid/law` });
const article = (id, changes = {}) => ({ id, title: `Synthetic test ${id}`, lawTitle: 'Synthetic test law', citation: 'Art. 1 Abs. 2',
  topic: 'zulassung', summary: 'Synthetic explanation for isolated tests, no real legal assertion.',
  officialText: 'Synthetic exact text used only for unit tests.', originalVerified: true, verified: true, reviewedOn: '2026-10-23',
  sources: [source('legislature', 'law'), source('education', 'context')],
  questions: [{ id: `${id}-question`, prompt: `Test question ${id}`, choices: ['Alpha', 'Beta', 'Gamma'], correctIndex: 1, explanation: 'Synthetic explanation.' }], ...changes });
const dataset = () => ({ country: 'CH', regions: [
  { code: 'SG', name: 'St. Gallen', lawTitle: 'SG test law', officialUrl: 'https://sg.example.invalid', articles: [article('sg-a')] },
  { code: 'ZH', name: 'Zürich', lawTitle: 'ZH test law', officialUrl: 'https://zh.example.invalid', articles: [article('zh-a')] },
  { code: 'BUND', name: 'Schweizer Bundesrecht', lawTitle: 'Federal test law', officialUrl: 'https://ch.example.invalid', articles: [article('bund-a')] },
  { code: 'GE', name: 'Genf', lawTitle: 'GE test law', officialUrl: 'https://ge.example.invalid', articles: [article('ge-unreviewed', { verified: false })] },
] });

test('A selected canton includes only that canton and explicitly optional federal law', () => {
  const all = core.buildRegionalLawBundle(dataset(), 'SG', { asOf: '2026-10-23' });
  assert.deepEqual(all.articles.map(value => value.id), ['sg-a', 'bund-a']);
  assert.deepEqual(all.questions.map(value => value.regionCode), ['SG', 'BUND']);
  assert.ok(all.questions.every(value => value.country === 'CH' && !value.id.includes('zh')));
  assert.ok(all.questions.every(value => value.sourceIds.every(id => all.sources.some(source => source.id === id))));
  assert.equal(all.questions[0].correctIds[0], 'sg-a-question-option-1');
  assert.match(all.questions[0].context, /St\. Gallen.*Art\. 1 Abs\. 2/);
  const local = core.buildRegionalLawBundle(dataset(), 'sg', { includeFederal: false, asOf: '2026-10-23' });
  assert.deepEqual(local.articles.map(value => value.id), ['sg-a']); assert.equal(local.includesFederal, false);
  const federal = core.buildRegionalLawBundle(dataset(), 'BUND', { asOf: '2026-10-23' });
  assert.deepEqual(federal.articles.map(value => value.id), ['bund-a']); assert.equal(federal.includesFederal, false);
});

test('Missing regions and unreviewed or unsupported originals never borrow another region’s questions', () => {
  assert.equal(core.buildRegionalLawBundle(dataset(), 'BE'), null);
  const pending = core.buildRegionalLawBundle(dataset(), 'GE', { includeFederal: false });
  assert.equal(pending.articles.length, 1); assert.equal(pending.questions.length, 0);
  assert.equal(pending.articles[0].learningReviewed, false); assert.equal(pending.articles[0].summary, '');
  assert.ok(pending.articles[0].sources.every(source => source.kind === 'law'));
  assert.equal(core.buildRegionalLawBundle({ ...dataset(), regions: [{...dataset().regions[0], articles: [article('unread', { originalVerified: false })] }] }, 'SG').articles.length, 0);
  for (const changes of [{ officialText: '' }, { verified: false }, { reviewedOn: '2099-01-01' },
    { sources: [source('one', 'law'), source('ONE', 'context')] },
    { sources: [source('one', 'context'), source('two', 'context')] },
    { sources: [{ ...source('one', 'law'), url: 'javascript:alert(1)' }, source('two', 'context')] }])
    assert.equal(core.isReviewedLegalArticle(article('invalid', changes), '2026-10-23'), false);
});

test('Future and superseded norms stay outside the current learning and questions pool', () => {
  const value = article('version', { effectiveFrom: '2027-01-01' });
  assert.equal(core.isReviewedLegalArticle(value, '2026-12-31'), false);
  assert.equal(core.isReviewedLegalArticle(value, '2027-01-01'), true);
  const old = article('old', { effectiveUntil: '2027-01-01' });
  assert.equal(core.isReviewedLegalArticle(old, '2026-12-31'), true);
  assert.equal(core.isReviewedLegalArticle(old, '2027-01-01'), false);
});

test('Original exam documents remain source links and never turn authored questions or rules into official questions', () => {
  const data = dataset();
  data.regions[0].examNotes = 'Synthetic verification note.';
  data.regions[0].examResources = [
    {title:'Synthetic official sample',publisher:'Synthetic authority',url:'https://example.invalid/sample',kind:'official-sample',reviewedOn:'2026-10-23',notes:'A sample, not a full catalog.'},
    {title:'Synthetic exam rules',publisher:'Synthetic authority',url:'https://example.invalid/rules',kind:'exam-rules',reviewedOn:'2026-10-23'},
    {title:'Unsafe',publisher:'Synthetic authority',url:'javascript:alert(1)',kind:'official-catalog',reviewedOn:'2026-10-23'},
    {title:'Unchecked future',publisher:'Synthetic authority',url:'https://example.invalid/future',kind:'official-catalog',reviewedOn:'2099-10-23'},
  ];
  const result = core.buildRegionalLawBundle(data, 'SG', {asOf:'2026-10-23',includeFederal:false});
  assert.deepEqual(result.region.examResources.map(resource=>resource.kind),['official-sample','exam-rules']);
  assert.equal(result.region.examNotes,'Synthetic verification note.');
  assert.deepEqual(result.questions.map(question=>question.id),['sg-a-question']);
  const choice=core.legalSelection({region:'SG',ansicht:'originale'},core.legalRegionMetadata(data));
  assert.equal(choice.view,'originale'); assert.equal(core.legalSelectionHref('CH',choice),'/jagdrecht/ch?region=SG&ansicht=originale');
});

test('Incomplete or ambiguous questions cannot enter a practice round', () => {
  const base = article('fixture').questions[0];
  assert.equal(core.isValidLegalQuestion(base), true);
  for (const changes of [{ choices: ['A', 'A', 'B'] }, { choices: ['A', 'B'] }, { correctIndex: 3 },
    { correctIndex: -1 }, { explanation: '' }, { prompt: '' }]) assert.equal(core.isValidLegalQuestion({ ...base, ...changes }), false);
  const data = dataset(); data.regions[0].articles[0].questions.push({ ...base, id: 'bad', correctIndex: 99 });
  assert.equal(core.buildRegionalLawBundle(data, 'SG', { includeFederal: false }).questions.length, 1);
});

test('Selection links preserve the chosen jurisdiction, topic and reading mode without guessing an invalid region', () => {
  const regions = core.legalRegionMetadata(dataset());
  const selection = core.legalSelection({ region: 'sg', thema: 'zulassung', artikel: 'sg-a', ansicht: 'fragen', bund: '0' }, regions);
  assert.equal(selection.region, 'SG'); assert.equal(selection.includeFederal, false);
  const href = core.legalSelectionHref('CH', selection), params = new URL(href, 'https://example.invalid').searchParams;
  assert.equal(params.get('region'), 'SG'); assert.equal(params.get('thema'), 'zulassung');
  assert.equal(params.get('ansicht'), 'fragen'); assert.equal(params.get('artikel'), 'sg-a');
  for (const region of [['SG', 'ZH'], '../ZH', 'ZZ', '']) {
    const value = core.legalSelection({ region, thema: [], artikel: [], ansicht: 'foreign' }, regions);
    assert.equal(value.region, ''); assert.equal(value.invalidRegion, true); assert.equal(value.topic, 'all'); assert.equal(value.article, ''); assert.equal(value.view, 'wissen');
  }
  assert.equal(core.legalSelectionHref('foreign', selection), '/jagdrecht');
});

test('Remembering a learning region stores only the valid country and region and tolerates blocked storage', () => {
  let stored;
  const storage = { getItem: () => stored, setItem(key, value) { assert.equal(key, core.LEGAL_REGION_STORAGE_KEY); stored = value; } };
  assert.equal(core.saveLegalRegionPreference(storage, 'CH', 'SG', dataset().regions), true);
  assert.deepEqual(JSON.parse(stored), { country: 'CH', region: 'SG' });
  assert.deepEqual(core.readLegalRegionPreference(storage), { country: 'CH', region: 'SG' });
  assert.equal(core.saveLegalRegionPreference(storage, 'CH', 'foreign', dataset().regions), false);
  stored = '{broken'; assert.equal(core.readLegalRegionPreference(storage), null);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(core.readLegalRegionPreference(blocked), null); assert.equal(core.saveLegalRegionPreference(blocked, 'CH', 'SG', dataset().regions), false);
});

function route({ status = 0 } = {}) {
  let loaded = 0, verified = 0;
  const load = createLoader({ '../../../../lib/account-access': { async requirePaidAccount() { verified++; if (status) throw Object.assign(Error('denied'), { status }); } },
    '../../../../lib/regional-law-data': { getLegalDataset(country) { loaded++; return country === 'CH' ? dataset() : null; } } });
  const api = load('app/api/jagdrecht/region/route.js');
  return { get loaded() { return loaded; }, get verified() { return verified; }, run: query => api.GET({ url: `https://example.invalid/api/jagdrecht/region?${query}` }) };
}

test('Regional law API requires paid account access before reading the legal catalog and never caches private results', async () => {
  for (const status of [401, 403, 503]) {
    const value = route({ status }), response = await value.run('land=CH&region=SG');
    assert.equal(response.status, status); assert.equal(value.loaded, 0); assert.equal(value.verified, 1);
  }
  const value = route(), response = await value.run('land=CH&region=SG&bund=0'), body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.region.code, 'SG'); assert.equal(body.questions.length, 1);
  assert.match(response.headers.get('Cache-Control'), /private, no-store/); assert.equal(response.headers.get('Vary'), 'Cookie');
});

test('Regional law API rejects repeated, invalid and cross-country region inputs instead of silently returning another region', async () => {
  for (const query of ['land=CH&region=SG&region=ZH', 'land=CH&land=DE&region=SG', 'land=CH&region=SG&bund=2',
    'land=CH', 'region=SG', 'land=CH&region=SG&bund=0&bund=1']) assert.equal((await route().run(query)).status, 400, query);
  for (const query of ['land=DE&region=SG', 'land=CH&region=BY', 'land=XX&region=SG']) assert.equal((await route().run(query)).status, 404, query);
});
