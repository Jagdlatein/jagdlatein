// Real component output plus isolated selection failures. No account, browser
// profile, external service or persistent learner data is read by these tests.
const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const data = createLoader();
const added = data('lib/wildlife-video-expansion-exam-2026-11-01.js').wildlifeVideoExamExpansionNov01Cases;
const { animalSoundById } = data('lib/animal-sounds.js');
let router;
const load = createLoader({
  'next/router': { useRouter: () => router },
  'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children),
  './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
});

test('Each new film presents its complete lesson and precise course, portrait, separate sound and regional-law entry', () => {
  const Component = load('components/WildlifeVideoCases.js').default;
  for (const item of added) {
    router = { isReady: true, query: { eintrag: item.id }, asPath: `/lernen/wildtier-videofaelle?eintrag=${item.id}#video-fall` };
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component)));
    try {
      const document = dom.window.document;
      const body = document.querySelector('section[aria-labelledby="video-fall"]');
      assert.ok(body.querySelector('#video-textfassung').textContent.includes(item.transcript));
      assert.equal(document.querySelectorAll('video').length, 1);
      assert.equal(document.querySelectorAll('audio,iframe').length, 0, 'Onward links never create a second player');
      const player = body.querySelector('video');
      assert.equal(player.querySelector('source').getAttribute('src'), item.src);
      assert.equal(player.preload, 'none'); assert.equal(player.hasAttribute('autoplay'), false);
      const nav = document.querySelector('nav[aria-label="Zum Video weiterlernen"]');
      const hrefs = [...nav.querySelectorAll('a')].map(link => link.getAttribute('href'));
      assert.ok(hrefs.includes(`/wildkunde/${item.speciesSlug}`));
      assert.ok(hrefs.includes(item.course)); assert.ok(hrefs.includes(item.soundHref));
      assert.ok(hrefs.includes('/lernen/jagdrecht'), 'Use the existing regional entry instead of silently choosing a country');
      const soundUrl = new URL(item.soundHref, 'https://jagdlatein.test');
      assert.equal(animalSoundById[soundUrl.searchParams.get('stimme')].speciesSlug, item.speciesSlug);
      assert.equal(soundUrl.hash, '#tierstimme-title');
      assert.match(body.textContent, /Tierstimme ist eine separate Originalaufnahme/);
      assert.equal(body.lastElementChild.tagName, 'DETAILS'); assert.equal(body.lastElementChild.open, false);
      if (item.id === 'blaesshuhn-bled') {
        assert.equal(new URL(item.course, 'https://jagdlatein.test').hash, '#lesson-schwimmlappen');
        assert.match(body.textContent, /Füße und Schwimmlappen sind hier nicht erkennbar/);
      }
    } finally { dom.window.close(); }
  }
});

test('Pending and failed case switches retain the displayed sound and exact lesson links until URL takeover', async t => {
  const [first, second] = added;
  const h = setup('components/WildlifeVideoCases.js', { eintrag: first.id }, { router: { asPath: `/lernen/wildtier-videofaelle?eintrag=${first.id}` } });
  t.after(() => h.dispose());
  const destinations = () => h.nodes(node => node.type === 'nav' && node.props['aria-label'] === 'Zum Video weiterlernen')
    .flatMap(nav => nodes(nav, node => node.props?.href).map(node => node.props.href));
  const before = destinations(); let reject, outgoing;
  h.router.push = (href, as, options) => { outgoing = { href, options }; return new Promise((_, no) => { reject = no; }); };
  const button = h.nodes(node => node.type === 'button' && text(node) === second.title)[0];
  const action = button.props.onClick(); h.render();
  assert.equal(outgoing.href.query.eintrag, second.id);
  assert.deepEqual(outgoing.options, { shallow: true, scroll: false });
  assert.deepEqual(destinations(), before);
  reject(new Error('isolated case navigation failure')); await action; h.render();
  assert.deepEqual(destinations(), before);
  h.navigate({ eintrag: second.id });
  assert.ok(destinations().includes(second.course)); assert.ok(destinations().includes(second.soundHref));
  assert.equal(destinations().includes(first.soundHref), false);
  h.navigate({ eintrag: first.id }); assert.deepEqual(destinations(), before);
});

test('Invalid and unready video URLs expose no guessed learning or sound destinations', () => {
  const Component = load('components/WildlifeVideoCases.js').default;
  for (const candidate of [{ isReady: false, query: { eintrag: added[0].id } }, { isReady: true, query: { eintrag: 'unknown' } }, { isReady: true, query: { eintrag: added.map(item => item.id) } }]) {
    router = { ...candidate, asPath: '/lernen/wildtier-videofaelle' };
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component)));
    try {
      assert.equal(dom.window.document.querySelector('nav[aria-label="Zum Video weiterlernen"]'), null);
      assert.equal(dom.window.document.querySelector('video,audio'), null);
    } finally { dom.window.close(); }
  }
});
