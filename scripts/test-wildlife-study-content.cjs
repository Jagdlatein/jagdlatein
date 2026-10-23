const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { getWildlifeStudyContent } = load('lib/wildlife-study-content.js');
const { getWildlifeLearningGuide } = load('lib/wildlife-learning-guide.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const species = load('lib/european-wildlife-discovery.js').europeanWildlifeBySlug;

test('Every species learning branch delivers the exact complete authored lessons without a second text copy or unrelated course', () => {
  let checked = 0;
  for (const slug of Object.keys(species)) for (const target of getWildlifeLearningGuide(slug)) {
    const value = getWildlifeStudyContent(slug, target.moduleId), module = getLearningModule(target.moduleId);
    assert.ok(value, `${slug}/${target.moduleId}`);
    const expected = module.lessons.filter(lesson => !target.lessonId || lesson.id === target.lessonId);
    assert.ok(expected.length, `${slug}: lesson IDs must match the real curriculum`);
    assert.deepEqual(value.lessons.map(lesson => lesson.paragraphs), expected.map(lesson => lesson.paragraphs));
    assert.deepEqual(value.lessons.map(lesson => lesson.takeaway), expected.map(lesson => lesson.takeaway));
    assert.deepEqual(value.sources, module.sources);
    assert.deepEqual(value.scopeNotes, [...new Set(Object.values(module.countryNotes || {}))], 'The inline reader retains the scope and model limitations of the source lesson');
    assert.equal(value.reviewedOn, module.reviewedOn);
    assert.equal(value.questions, undefined, 'The reading endpoint does not load quiz answer banks');
    checked++;
  }
  assert.ok(checked > 100);
  assert.equal(getWildlifeStudyContent('rotwild', 'wissen-waffensicherheit'), null);
  assert.equal(getWildlifeStudyContent('unknown-species', 'wissen-rotwild-sozialverhalten'), null);
});

test('The species reading endpoint checks live paid access before content and rejects ambiguous or unrelated selections', async () => {
  let accesses = 0, error = null;
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => { accesses++; if (error) throw error; } } })('app/api/lernen/artenwissen/route.js');
  const run = suffix => route.GET(new Request(`https://jagdlatein.test/api/lernen/artenwissen${suffix}`));
  let response = await run('?art=rotwild&kurs=wissen-rotwild-sozialverhalten');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal((await response.json()).species, 'rotwild');
  for (const suffix of ['', '?art=rotwild&art=fuchs&kurs=wissen-rotwild-sozialverhalten', '?art=rotwild&kurs=x&kurs=y']) assert.equal((await run(suffix)).status, 400);
  assert.equal((await run('?art=fuchs&kurs=wissen-rotwild-sozialverhalten')).status, 404);
  for (const status of [401, 403, 500]) { error = { status }; response = await run('?art=rotwild&kurs=wissen-rotwild-sozialverhalten'); assert.equal(response.status, status === 500 ? 503 : status); assert.equal((await response.json()).lessons, undefined); }
  assert.equal(accesses, 8);
});

test('The portrait renders complete text, explanation and diagrams before supplementary sources, and hides a stale species response', () => {
  const target = getWildlifeLearningGuide('rotwild')[0];
  const content = getWildlifeStudyContent('rotwild', target.moduleId);
  let state = { key: `rotwild:${target.moduleId}`, content, error: '', status: 200 };
  const Component = createLoader({ react: { ...React, useState: () => [state, () => {}], useEffect: () => {} } })('components/WildlifeStudyContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { slug: 'rotwild', target }));
  for (const paragraph of content.lessons.flatMap(lesson => lesson.paragraphs)) assert.ok(html.includes(paragraph.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')));
  assert.ok(html.indexOf('Ergänzende Fachquellen') > html.lastIndexOf('Zum Nachdenken:'));
  for (const note of content.scopeNotes) assert.ok(html.includes(note.replace(/&/g, '&amp;')), 'Scope stays directly readable before the sources');
  assert.ok(html.indexOf('Einordnung dieses Wissens') < html.indexOf('Ergänzende Fachquellen'));
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.doesNotMatch(html, /Lektion öffnen|Weiterlesen auf/);
  const stale = renderToStaticMarkup(React.createElement(Component, { slug: 'fuchs', target }));
  assert.match(stale, /Wissenstext wird geladen/);
  assert.ok(!stale.includes(content.lessons[0].paragraphs[0].slice(0, 50)));
});
