const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader({ 'next/image': ({ priority, fill, ...props }) => React.createElement('img', props) });
const { digestiveSources, digestiveTopics } = load('lib/digestive-learning.js');
const { digestiveChoiceCheckedOn, getDigestiveChoiceSources } = load('lib/digestive-choice-sources.js');
const pairs = [
  ['wiederkaeuer-kammern', [digestiveSources.bzl.url, digestiveSources.luzern.url]],
  ['wiederkaeuer-helfer', [digestiveSources.bzl.url, digestiveSources.vetMicrobes.url]],
  ['schwein-pansen', [digestiveSources.uzhPig.url, digestiveSources.thuenenPig.url]],
  ['schwein-mikroben', [digestiveSources.thuenenPig.url, 'https://open.lib.umn.edu/vetphysioapplied/chapter/overview/']],
];

test('Four comparison-source pairs have their own scoped review date and cannot be polluted through returned metadata or prototype keys', () => {
  assert.equal(digestiveChoiceCheckedOn, '2026-11-25');
  for (const [id, urls] of pairs) {
    const first = getDigestiveChoiceSources(id);
    assert.deepEqual(first.map(source => source.url), urls);
    assert.equal(new Set(first.map(source => source.organization)).size, 2);
    first[0].url = 'https://example.invalid/'; first.push({});
    assert.deepEqual(getDigestiveChoiceSources(id).map(source => source.url), urls);
  }
  for (const invalid of ['unknown', 'constructor', '__proto__', '', null, [], {}]) assert.deepEqual(getDigestiveChoiceSources(invalid), []);
  for (const source of Object.values(digestiveSources)) assert.equal(source.reviewedOn, '2026-10-13');
});

test('Comparison citations stay in the single closed final source area; learning, four-choice questions and visible limits remain before it', () => {
  const Component = load('components/DigestiveLearning.js').default;
  for (const topic of digestiveTopics) {
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component, { selectedId: topic.id, hideSelector: true })));
    try {
      const doc = dom.window.document, article = doc.querySelector('article'), details = article.querySelectorAll('details');
      assert.equal(details.length, 1); assert.equal(details[0].open, false); assert.equal(article.lastElementChild, details[0]);
      assert.equal(article.querySelectorAll('input[type=radio]').length, 8); assert.equal(article.querySelectorAll('input:checked').length, 0);
      assert.equal(article.querySelectorAll('[role=status]').length, 0);
      const visible = article.cloneNode(true); visible.querySelector('details').remove();
      assert.ok(visible.textContent.includes(topic.limit)); assert.equal(visible.querySelectorAll('a[target=_blank]').length, 0);
      assert.match(details[0].textContent, /13\. Oktober 2026/); assert.match(details[0].textContent, /25\. November 2026/);
      const heading = [...details[0].querySelectorAll('h4')].find(node => node.textContent === 'Ergänzte Antwortauswahl');
      assert.ok(heading); const list = heading.nextElementSibling.nextElementSibling;
      assert.equal(list.children.length, 2);
      for (const [index, question] of topic.questions.entries()) {
        const row = list.children[index]; assert.ok(row.textContent.includes(question.prompt));
        assert.deepEqual([...row.querySelectorAll('a')].map(node => node.href), pairs.find(([id]) => id === question.id)[1]);
      }
      assert.ok(details[0].textContent.includes(topic.photo.author));
      assert.ok([...details[0].querySelectorAll('a')].some(link => link.href === topic.photo.licenseUrl));
    } finally { dom.window.close(); }
  }
});
