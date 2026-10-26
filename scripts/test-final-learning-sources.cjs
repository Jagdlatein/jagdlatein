// Real SSR and ReactDOM/effect checks with local data only; no account, network or legal review.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const wildlife = load('lib/dach-wildlife.js');
const { communityWeeklyCases } = load('lib/community-weekly-case.js');
const links = ({ href, children, prefetch, scroll, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname }, children);
const layout = { __esModule: true, default: ({ children }) => React.createElement('main', null, children) };
function loader(router) {
  return createLoader({ 'next/router': { useRouter: () => router }, 'next/link': links, '../../components/LearningToolLayout': layout });
}
const props = element => element[Object.keys(element).find(key => key.startsWith('__reactProps$'))];
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
async function fixture(file, componentProps = {}, query = {}) {
  const dom = new JSDOM('<!doctype html><div id="mount"></div>', { url: 'https://jagdlatein.test/' });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key));
    Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  const router = { query, isReady: true };
  const Component = loader(router)(file).default;
  const root = local('react-dom/client').createRoot(dom.window.document.getElementById('mount'));
  const render = async () => { await React.act(async () => { root.render(React.createElement(Component, componentProps)); await flush(); }); };
  await render();
  return {
    document: dom.window.document, router, render,
    async change(element, value) { await React.act(async () => { props(element).onChange({ target: { value } }); await flush(); }); },
    async click(element) { await React.act(async () => { element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await flush(); }); },
    async dispose() { await React.act(async () => root.unmount()); dom.window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(global, key, value); else delete global[key]; } },
  };
}
function checkWildlifePage(document, country) {
  const main = document.querySelector('main');
  const sources = document.querySelector('#wildarten-quellen');
  assert.ok(sources);
  assert.equal(main.lastElementChild, sources);
  assert.equal(sources.open, false);
  assert.equal(document.querySelectorAll('details').length, 1);
  assert.ok(sources.querySelector('h2').textContent.includes(wildlife.dachCountries.find(value => value.id === country).name));
  const articles = [...main.querySelectorAll('article')];
  assert.equal(sources.querySelectorAll('section[aria-labelledby]').length, articles.length);
  for (const article of articles) {
    const name = article.querySelector('h2').textContent;
    const species = wildlife.dachWildlife.find(value => value.name === name);
    assert.ok(species);
    assert.equal(article.querySelector('strong').textContent, wildlife.legalStatusLabels[species.legal[country].status]);
    assert.ok(article.textContent.includes(species.legal[country].note));
    assert.equal(article.querySelector('details'), null);
    assert.equal(article.querySelectorAll('a').length, 1);
    assert.equal(article.querySelector('a').getAttribute('href'), `/wildkunde/${species.slug}`);
    const credit = document.getElementById(`wildarten-quelle-${species.slug}`).parentElement;
    assert.equal(credit.querySelector('h3').textContent, species.name);
    assert.deepEqual([...credit.querySelectorAll('a')].map(link => link.getAttribute('href')), species.legal[country].sources.map(key => wildlife.legalSources[key].url));
  }
  const globalList = sources.lastElementChild;
  assert.deepEqual([...globalList.querySelectorAll('a')].map(link => link.getAttribute('href')), Object.values(wildlife.legalSources).map(source => source.url));
  assert.ok(main.textContent.includes('Die geprüften Beispiele ersetzen keine vollständige aktuelle Tabelle sämtlicher Bundesländer und Kantone.'));
  return articles.map(article => article.querySelector('h2').textContent);
}
function checkWeeklyCase(document, item) {
  const section = document.getElementById('community-wochenfall');
  const sources = document.getElementById('community-wochenfall-quellen');
  const facts = document.getElementById('community-wochenfall-wissen').parentElement;
  assert.equal(section.lastElementChild, sources);
  assert.equal(sources.open, false);
  assert.equal(section.querySelectorAll('details').length, 1);
  assert.equal(facts.closest('details'), null);
  for (const fact of item.facts) {
    assert.ok(facts.textContent.includes(`${fact.title}: ${fact.text}`));
    assert.ok(!sources.textContent.includes(fact.text));
  }
  assert.equal(facts.querySelector('a').getAttribute('href'), item.href);
  assert.equal(section.querySelector('h2').textContent, item.question);
  assert.ok(section.textContent.includes(item.limit));
  assert.ok(sources.previousElementSibling.textContent.includes('Eure Beiträge werden vor Veröffentlichung moderiert'));
  assert.deepEqual([...sources.querySelector('ul').querySelectorAll('a')].map(link => link.getAttribute('href')), item.sources.map(source => source.url));
  const photo = section.querySelector('figure');
  assert.equal(photo.querySelector('img').getAttribute('src'), item.photo.src);
  assert.equal(photo.querySelector('figcaption').textContent, item.photoContext);
  const credit = document.getElementById(photo.getAttribute('aria-describedby'));
  assert.ok(sources.contains(credit));
  assert.ok(credit.textContent.includes(item.photo.author));
  assert.deepEqual([...credit.querySelectorAll('a')].map(link => [link.getAttribute('href'), link.textContent]), [[item.photo.licenseUrl, item.photo.license], [item.photo.sourceUrl, 'Bildnachweis']]);
  const date = new Intl.DateTimeFormat('de-CH', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${item.reviewedOn}T00:00:00Z`));
  assert.ok(sources.textContent.includes(`Diese Erklärung wurde inhaltlich am ${date} geprüft.`));
}

test('Wildlife SSR has complete unchanged law notes and one closed final source block with exact species attribution', () => {
  const Component = loader({ query: {}, isReady: false })('pages/jagdrecht/wildarten.js').default;
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component)));
  try { assert.equal(checkWildlifePage(dom.window.document, 'DE').length, 18); } finally { dom.window.close(); }
});

test('Real wildlife country and page changes keep every displayed species bound to its exact law sources', async () => {
  const f = await fixture('pages/jagdrecht/wildarten.js');
  try {
    for (const country of ['DE', 'AT', 'CH']) {
      await f.change(f.document.querySelector('select'), country);
      const seen = [];
      while (true) {
        seen.push(...checkWildlifePage(f.document, country));
        const next = [...f.document.querySelectorAll('button')].find(button => button.textContent === 'Weitere Wildarten');
        if (!next || next.disabled) break;
        await f.click(next);
      }
      assert.deepEqual(seen, wildlife.filterDachWildlife({ query: '', group: 'all', country, status: 'all' }).map(species => species.name));
    }
    f.router.query = { art: 'wolf', land: 'CH' }; await f.render();
    assert.deepEqual(checkWildlifePage(f.document, 'CH'), ['Wolf']);
    await f.change(f.document.querySelectorAll('select')[2], 'season');
    assert.deepEqual(checkWildlifePage(f.document, 'CH'), []);
    assert.ok(f.document.body.textContent.includes('Keine Art passt zu dieser Kombination.'));
  } finally { await f.dispose(); }
});

test('Weekly-case SSR exposes the complete facts and learning link before final closed sources without answering', () => {
  const Component = loader({ query: {} })('components/CommunityWeeklyCase.js').default;
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component, { canDiscuss: false })));
  try { checkWeeklyCase(dom.window.document, communityWeeklyCases[0]); assert.equal(dom.window.document.querySelector('[role="status"]'), null); } finally { dom.window.close(); }
});

test('Real case selection and feedback retain all nine exact texts, dates, photo credits and discussion targets', async () => {
  const discussions = [];
  const f = await fixture('components/CommunityWeeklyCase.js', { canDiscuss: true, onDiscuss: item => discussions.push(item.id) }, { fall: communityWeeklyCases[0].id });
  try {
    for (const item of communityWeeklyCases) {
      await f.change(f.document.querySelector('select'), item.id);
      checkWeeklyCase(f.document, item);
      assert.equal(f.document.querySelector('[role="status"]'), null);
      await f.change(f.document.querySelectorAll('input[type="radio"]')[item.answer], '');
      const feedback = f.document.querySelector('[role="status"]');
      assert.ok(feedback.textContent.includes('Richtig eingeordnet.'));
      assert.ok(feedback.textContent.includes(item.explanation));
      checkWeeklyCase(f.document, item);
      const discuss = [...f.document.querySelectorAll('button')].find(button => button.textContent === 'Deine Überlegung teilen');
      await f.click(discuss);
    }
    assert.deepEqual(discussions, communityWeeklyCases.map(item => item.id));
  } finally { await f.dispose(); }
});
