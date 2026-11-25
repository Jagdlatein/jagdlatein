const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
let router;
const load = createLoader({
  'next/router': { useRouter: () => router },
  'next/script': () => null,
  './LearningToolLayout': ({ children }) => React.createElement('main', null, children),
});
const { anatomyModels, anatomyQuestions, anatomySources } = load('lib/anatomy-explorer.js');
const { anatomyChoiceCheckedOn, getAnatomyChoiceSources } = load('lib/anatomy-choice-sources.js');
const record = anatomyModels.find(model => model.id === 'vorderlauf').source;
const skull = anatomySources[0].url;
const viewer = 'https://github.com/google/model-viewer/blob/v4.1.0/packages/modelviewer.dev/data/docs.json';
const pairs = new Map([
  ['art', [record, 'https://animaldiversity.org/accounts/Dama_dama/']],
  ['auge', [skull, 'https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception']],
  ['luecke', [skull, 'https://www.utep.edu/leb/keys/glossary.htm']],
  ['weichteil', [record, viewer]], ['groessen', [record, viewer]], ['scan', [record, viewer]],
]);

test('Six museum comparisons expose exact independent interpretation pairs and a separately scoped date, with fresh metadata and no prototype leakage', () => {
  assert.equal(anatomyChoiceCheckedOn, '2026-11-25'); assert.equal(pairs.size, 6);
  for (const [id, urls] of pairs) {
    const first = getAnatomyChoiceSources(id);
    assert.deepEqual(first.map(source => source.url), urls);
    assert.equal(new Set(first.map(source => source.organization)).size, 2);
    first[0].title = 'polluted'; first[0].url = 'https://example.invalid/'; first.push({});
    assert.deepEqual(getAnatomyChoiceSources(id).map(source => source.url), urls);
    assert.ok(getAnatomyChoiceSources(id).every(source => source.title !== 'polluted'));
  }
  for (const invalid of ['unknown', 'constructor', '__proto__', '', null, [], {}]) assert.deepEqual(getAnatomyChoiceSources(invalid), []);
});

test('Every museum model retains its original lesson date and visible scope, and groups only its own two new comparison references in the closed final source section', () => {
  const Component = load('components/AnatomyExplorer.js').default;
  for (const model of anatomyModels) {
    router = { isReady: true, asPath: `/lernen/anatomie?eintrag=${model.id}`, query: { eintrag: model.id } };
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component)));
    try {
      const doc = dom.window.document;
      const details = [...doc.querySelectorAll('details')].find(node => node.querySelector('summary')?.textContent === 'Fachliche Quellen und Modellnachweise');
      assert.ok(details); assert.equal(details.open, false); assert.equal(details.parentElement.lastElementChild, details);
      assert.match(details.textContent, /4\. Oktober 2026/); assert.match(details.textContent, /25\. November 2026/);
      assert.match(details.textContent, /keine zweite Bestimmung derselben Abgüsse/);
      const heading = [...details.querySelectorAll('h3')].find(node => node.textContent === 'Ergänzte Antwortauswahl');
      assert.ok(heading); const list = heading.nextElementSibling.nextElementSibling;
      const questions = anatomyQuestions.filter(question => question.modelId === model.id);
      assert.equal(questions.length, 2); assert.equal(list.children.length, 2);
      for (const [index, question] of questions.entries()) {
        const row = list.children[index]; assert.ok(row.textContent.includes(question.question));
        assert.deepEqual([...row.querySelectorAll('a')].map(link => link.href), pairs.get(question.id));
      }
      const hrefs = [...details.querySelectorAll('a')].map(link => link.href);
      for (const source of anatomySources) assert.ok(hrefs.includes(source.url));
      assert.equal(doc.querySelectorAll('model-viewer').length, 0, 'Source reading never starts a 3D download');
      assert.match(doc.querySelector('main').textContent, /nordamerikanischen Weißwedelhirsches/);
      assert.match(doc.querySelector('main').textContent, /nicht maßstabsgleich/);
    } finally { dom.window.close(); }
  }
});
