const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader({ 'next/image': { __esModule: true, default: props => React.createElement('img', props) } });
const { parasiteTopics, parasiteSources } = load('lib/parasite-learning.js');
const { getParasiteChoiceSources, parasiteChoiceCheckedOn } = load('lib/parasite-choice-sources.js');
const Component = load('components/ParasiteLearning.js').default;

test('All three real parasite readers keep the full learning and eight blind radios before one last closed evidence area', () => {
  for (const topic of parasiteTopics) {
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component, { selectedId: topic.id, hideSelector: true })));
    try {
      const article = dom.window.document.querySelector('article'), evidence = article.lastElementChild;
      assert.equal(evidence.tagName, 'DETAILS'); assert.equal(evidence.open, false);
      assert.equal(article.querySelectorAll('details').length, 1);
      assert.equal(article.querySelectorAll('input[type=radio]').length, 8);
      assert.equal(article.querySelectorAll('[role=status]').length, 0);
      const visible = [...article.children].slice(0, -1), words = visible.map(node => node.textContent).join(' ');
      for (const text of [topic.summary, topic.photoContext, topic.limit, ...topic.facts.map(fact => fact.text), ...topic.cycle.steps.flatMap(step => [step.title, step.text]), ...topic.questions.map(question => question.prompt)]) assert.ok(words.includes(text), text);
      const earlyLinks = visible.flatMap(node => [...node.querySelectorAll('a')].map(link => link.href));
      assert.deepEqual(earlyLinks, [topic.photo.sourceUrl, topic.photo.licenseUrl], 'Only the unchanged mandatory photograph credits precede the evidence appendix');
      assert.match(evidence.textContent, /13\. Oktober 2026/); assert.match(evidence.textContent, /25\. November 2026/);
      const rows = [...evidence.querySelectorAll(':scope > ul > li')];
      for (const fact of [...topic.facts, { title: topic.cycle.title, sourceIds: topic.cycle.sourceIds }]) {
        const row = rows.find(row => row.querySelector(':scope > strong')?.textContent === fact.title); assert.ok(row);
        assert.deepEqual(new Set([...row.querySelectorAll('a')].map(link => link.href)), new Set(fact.sourceIds.map(id => parasiteSources[id].url)));
      }
      for (const question of topic.questions) {
        const row = rows.find(row => row.querySelector(':scope > strong')?.textContent === question.prompt); assert.ok(row);
        const expected = topic.facts.filter(fact => question.factIds.includes(fact.id)).flatMap(fact => fact.sourceIds);
        assert.deepEqual(new Set([...row.querySelectorAll('a')].map(link => link.href)), new Set(expected.map(id => parasiteSources[id].url)));
      }
      for (const id of new Set([...topic.facts.flatMap(fact => fact.sourceIds), ...topic.cycle.sourceIds])) assert.ok(evidence.textContent.includes(parasiteSources[id].scope));
    } finally { dom.window.close(); }
  }
});

test('Only the six added comparisons have a fresh narrow source check; original provenance and review dates remain untouched', () => {
  const expected = {
    'trich-stadium': ['bfrTrich','cdcTrich','blvTrich'], 'trich-foto': ['blvTrich','bfrTrich','cdcTrich'],
    'echino-rollen': ['fli','uzhEchino','blvEchino'], 'echino-ei': ['fli','uzhEchino','meduniFluke','cdcFluke'],
    'fasciola-schnecke-frage': ['meduniFluke','cdcFluke'], 'fasciola-infektioes': ['meduniFluke','cdcFluke'],
  };
  const cdcFluke = 'https://www.cdc.gov/dpdx/fascioliasis/index.html';
  assert.equal(parasiteChoiceCheckedOn, '2026-11-25');
  for (const topic of parasiteTopics) for (const question of topic.questions) {
    const sources = getParasiteChoiceSources(question.id);
    assert.deepEqual(sources.map(source => source.url), expected[question.id].map(id => id === 'cdcFluke' ? cdcFluke : parasiteSources[id].url));
    assert.ok(new Set(sources.map(source => source.organization)).size >= 2);
    assert.ok(sources.every(source => source.title && source.organization && /^https:\/\//.test(source.url)));
    sources[0].title = 'isolated caller mutation';
    assert.notEqual(getParasiteChoiceSources(question.id)[0].title, 'isolated caller mutation');
  }
  for (const invalid of ['unknown','constructor','toString',undefined,null,[]]) assert.deepEqual(getParasiteChoiceSources(invalid), []);
  assert.ok(Object.values(parasiteSources).every(source => source.reviewedOn === '2026-10-13'));
});
