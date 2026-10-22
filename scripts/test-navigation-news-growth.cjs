// Real route/component/parser execution. Editorial source accuracy remains a separate review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const now = Date.parse('2026-10-16T12:00:00Z');

function Link({ href, children, prefetch, ...props }) {
  const target = typeof href === 'string' ? href : href.pathname + (Object.keys(href.query || {}).length ? '?' + new URLSearchParams(href.query) : '');
  return React.createElement('a', { ...props, href: target }, children);
}
const uiOverrides = {
  'next/link': Link,
  'next/head': ({ children }) => React.createElement(React.Fragment, null, children),
  'next/router': { useRouter: () => ({ query: {}, isReady: true, push() {} }) },
};
const load = createLoader(uiOverrides);
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
function nodes(tree, predicate, result = []) {
  if (Array.isArray(tree)) { for (const item of tree) nodes(item, predicate, result); return result; }
  if (!tree || typeof tree !== 'object') return result;
  if (predicate(tree)) result.push(tree);
  nodes(tree.props?.children, predicate, result);
  return result;
}
function words(tree) {
  if (tree == null || typeof tree === 'boolean') return '';
  if (Array.isArray(tree)) return tree.map(words).join(' ');
  return typeof tree === 'object' ? words(tree.props?.children) : String(tree);
}
const item = (title, href, date = '2026-10-15T10:00:00Z', description = '') => `<item><title><![CDATA[${title}]]></title><link>${href}</link><pubDate>${date}</pubDate><description><![CDATA[${description}]]></description></item>`;
const rss = entries => `<rss version="2.0"><channel>${entries}</channel></rss>`;
const { newsSources, newsTopics } = load('lib/news-catalog.js');
const { parseNewsFeed, parseNewsHtml, fetchNewsSource, NEWS_MAX_BYTES } = load('lib/jagd-news-feeds.js');
const { communityNewsSource, newsDiscussionHref } = load('lib/news-community-link.js');
const manufacturerSources = newsSources.filter(source => source.sourceType === 'manufacturer');

test('Homepage search is a direct GET into learning search and preserves the requested term', () => {
  const Home = load('components/HomeKnowledgeNavigation.js').default;
  const tree = Home();
  const form = nodes(tree, node => node.type === 'form')[0];
  assert.equal(form.props.action, '/lernen#lernen-suche');
  assert.ok(!form.props.method || form.props.method.toLowerCase() === 'get');
  const input = nodes(form, node => node.type === 'input')[0];
  assert.equal(input.props.type, 'search'); assert.equal(input.props.name, 'q'); assert.equal(input.props.maxLength, 160);
  assert.equal(nodes(form, node => node.type === 'button' && node.props.type === 'submit').length, 1);
  const destination = new URL(form.props.action, 'https://jagdlatein.de');
  destination.searchParams.set(input.props.name, 'Weimaraner');
  assert.equal(destination.pathname, '/lernen'); assert.equal(destination.hash, '#lernen-suche');
  const results = load('lib/learning-search.js').searchLearning({ query: destination.searchParams.get('q') }).results;
  assert.ok(results.length > 0 && results.some(result => /Weimaraner/i.test(JSON.stringify(result))));
  assert.ok(render(Home).includes('aria-label="Jagdwissen durchsuchen"'));
});

test('All twelve homepage knowledge categories resolve through the actual category page data', () => {
  const Home = load('components/HomeKnowledgeNavigation.js').default;
  const categories = load('lib/learning-categories.js').learningCategoryDetails;
  const page = load('pages/lernen/[category].js');
  const paths = page.getStaticPaths();
  assert.equal(paths.fallback, false); assert.equal(categories.length, 12);
  const html = render(Home);
  const categoryNav = html.split('<nav aria-label="Lernkategorien">')[1]?.split('</nav>')[0];
  assert.ok(categoryNav);
  assert.ok(html.indexOf('aria-label="Lernkategorien"') < html.indexOf('<details'), 'Primary knowledge categories are visible before optional shortcuts');
  const links = [...categoryNav.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(links.length, categories.length);
  assert.equal(new Set(links).size, categories.length);
  for (const category of categories) {
    assert.ok(links.includes(`/lernen/${category.slug}`) && categoryNav.includes(category.title.replaceAll('&', '&amp;')));
    assert.ok(paths.paths.some(item => item.params.category === category.slug));
    const result = page.getStaticProps({ params: { category: category.slug } });
    assert.equal(result.props.data.categoryInfo.slug, category.slug);
  }
  assert.deepEqual(page.getStaticProps({ params: { category: 'nonexistent-category' } }), { notFound: true });
});

test('Homepage learning targets are unique real routes and include direct community/news access', () => {
  const { homeKnowledgeGroups, default: Home } = load('components/HomeKnowledgeNavigation.js');
  const routes = homeKnowledgeGroups.flatMap(group => group.links.map(link => link.href));
  assert.equal(new Set(routes).size, routes.length);
  for (const route of routes) {
    assert.ok(route.startsWith('/') && !route.startsWith('//'));
    assert.ok([
      path.join(root, 'pages', route + '.js'), path.join(root, 'pages', route, 'index.js'),
      path.join(root, 'app', route, 'page.js'), path.join(root, 'app', route, 'page.jsx'),
    ].some(file => fs.existsSync(file)), route);
  }
  for (const route of ['/lernen', '/lernen/lernkarten', '/quiz-app', '/community', '/news', '/lernen/tierstimmen', '/lernen/jagdhund-kompass']) assert.ok(routes.includes(route));
  const html = render(Home);
  for (const route of routes) assert.ok(html.includes(`href="${route}"`), route);
  assert.equal((html.match(/href="\/fotohelfer"/g) || []).length, 1);
  assert.ok(html.indexOf('href="/fotohelfer"') < html.indexOf('<details'), 'The photo helper is directly visible before optional shortcuts');
  assert.ok(html.includes('Eigene Revierfotos mit geprüften Merkmalen vergleichen'));
});

test('Homepage actually renders discovery, the existing community invitation, news and separated advertising', () => {
  const minimal = () => null;
  const homeLoad = createLoader({ ...uiOverrides,
    '../lib/account-access': { readRequestAccountSession: () => null },
    '../lib/jagd-news-server': { getInitialJagdNews: () => ({ items: [], sources: [] }) },
    '../lib/revier-moment-server': { getRevierMoment: () => null, getRevierMomentPreview: () => null },
    '../lib/offline-learning': { clearOfflineLearning() {} }, '../lib/daily-review': { clearReviewHistory() {} },
    '@capacitor/core': { Capacitor: { isNativePlatform: () => false } }, '@capacitor/push-notifications': { PushNotifications: {} },
    '../components/RevierMomentEntry': minimal,
  });
  const Home = homeLoad('pages/index.js').default;
  const html = render(Home, { initialNews: { items: [], sources: [] } });
  assert.ok(html.includes('Was möchtest du wissen?'));
  assert.ok(html.includes('Deine Jagdlatein-Community'));
  assert.ok(html.includes('Jagdlatein – Wissen im Blick'));
  assert.ok(html.includes('Werbung · Externer Anbieter'));
  assert.ok(html.indexOf('Was möchtest du wissen?') < html.indexOf('Deutsche Jagdakademie'));
});

// The four destinations were independently opened on 2026-10-16 and match their
// public course/school-information headings. No affiliate URL or logo is imported.
test('DJA promotion is visibly advertising with the verified external destinations and no invented partnership', () => {
  const { default: Promotion, jagdakademieOffers } = load('components/JagdakademiePromotion.js');
  const expected = [
    'https://deutsche-jagdakademie.com/dja-jagdschein-kurs/',
    'https://deutsche-jagdakademie.com/dja-jagdwirt/',
    'https://deutsche-jagdakademie.com/dja-bergjagd/',
    'https://deutsche-jagdakademie.com/dja-jagdschule-guetesiegel/',
  ];
  assert.deepEqual(jagdakademieOffers.map(offer => offer.href), expected);
  const tree = Promotion(); const html = render(Promotion);
  assert.equal(tree.type, 'aside'); assert.equal(tree.props['aria-label'], 'Werbung: Deutsche Jagdakademie');
  assert.ok(html.includes('Werbung · Externer Anbieter'));
  assert.doesNotMatch(html, /(?:partner|kooperat|garantiert|kostenlos|\d+\s*(?:€|EUR|CHF))/i);
  assert.equal(nodes(tree, node => ['img', 'iframe', 'script'].includes(node.type)).length, 0);
  const anchors = nodes(tree, node => node.type === 'a');
  assert.equal(anchors.length, 5);
  for (const anchor of anchors) {
    const url = new URL(anchor.props.href);
    assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'deutsche-jagdakademie.com'); assert.equal(url.search, '');
    assert.equal(anchor.props.target, '_blank');
    for (const token of ['noopener', 'noreferrer', 'sponsored']) assert.ok(anchor.props.rel.split(/\s+/).includes(token));
  }
});

test('Configured manufacturers retain source identity and admit real equipment topics only from equipment titles', () => {
  assert.deepEqual(manufacturerSources.map(source => source.id), ['swarovski', 'waldkauz', 'leica']);
  assert.ok(newsTopics.some(topic => topic.id === 'equipment'));
  for (const source of manufacturerSources) {
    assert.equal(source.equipmentTitleOnly, true);
    const entries = [
      item('Bildstabilisiertes Spektiv für die Naturbeobachtung', new URL('/spektiv', source.homepage).href),
      item('Neue Ferngläser für die Revierbeobachtung', new URL('/fernglas', source.homepage).href),
      item('Wildschweine am Waldrand', new URL('/wild', source.homepage).href, undefined, 'Diese Herstellerreise nutzte ein Fernglas.'),
    ];
    const parsed = parseNewsFeed(rss(entries.join('')), source, now);
    assert.equal(parsed.length, 2, source.id);
    for (const result of parsed) { assert.equal(result.topic, 'equipment'); assert.equal(result.sourceId, source.id); assert.equal(result.sourceLabel, source.label); }
  }
});

test('Manufacturer feeds exclude politics, whisky and unrelated shopping even when equipment is named', () => {
  const titles = ['Bundesregierung fordert neue Ferngläser', 'Fernglas und Whisky im Revier', 'Fernglas-Gewinnspiel', 'Black Friday: Neue Optik', 'Neue Jagdgesetz-Novelle für Wärmebildgeräte'];
  for (const source of manufacturerSources) {
    const parsed = parseNewsFeed(rss(titles.map((title, index) => item(title, new URL(`/excluded-${index}`, source.homepage).href)).join('')), source, now);
    assert.deepEqual(parsed, [], source.id);
  }
});

test('Manufacturer travel stories stay excluded for destinations outside DACH despite equipment keywords', () => {
  const titles = ['Mit dem Fernglas auf Jagdreise in Norwegen', 'Fernglas auf Safari in Botswana', 'Reise nach Schottland mit dem Spektiv', 'Fernglas auf Jagdreise nach Kanada'];
  for (const source of manufacturerSources) {
    for (const [index, title] of titles.entries()) {
      assert.deepEqual(parseNewsFeed(rss(item(title, new URL(`/travel-${index}`, source.homepage).href)), source, now), [], `${source.id}: ${title}`);
    }
  }
});

// Observed card markup from the public Swarovski press index on 2026-10-16;
// irrelevant picture/source attributes are omitted, visible span structure retained.
const observedSwarovskiCards = `<a class="no-decoration flex flex-col swo-css-f2eg8l" href="/at/de/jagd/press-releases/neu-teleskop-at-endura-21-65x75-10-07-2026" data-discover="true"><div class="overflow-hidden"><picture><img alt="AT Endura 75 - H - HOMEPAGE HERO MOBILE"/></picture></div><span class="uppercase font-futura-500">SWAROVSKI OPTIK präsentiert ein neues, leichtes 75-er Teleskop</span><span class="font-minerva-500">Neu: Teleskop AT Endura 21-<span class="normal-case whitespace-nowrap">65x75</span></span><span class="font-futura-300">10. Juli 2026</span></a>
<a class="no-decoration flex flex-col" href="/at/de/jagd/press-releases/swarovski-optik-neue-zielfernrohre-fuer-jede-jagdart-20-01-2026" data-discover="true"><span>Wenn Innovation auf Vertrauen trifft</span><span>SWAROVSKI OPTIK: Neue Zielfernrohre für jede Jagdart</span><span>20. Jänner 2026</span></a>`;
const swarovski = newsSources.find(source => source.id === 'swarovski');

test('The actual Swarovski HTML adapter reads the observed nested cards and their visible German dates', () => {
  const parsed = parseNewsHtml(observedSwarovskiCards, swarovski, now);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].publishedAt, '2026-07-10T12:00:00.000Z');
  assert.equal(parsed[1].publishedAt, '2026-01-20T12:00:00.000Z');
  assert.ok(parsed[0].title.includes('Teleskop AT Endura'));
  assert.equal(parsed[0].url, 'https://www.swarovskioptik.com/at/de/jagd/press-releases/neu-teleskop-at-endura-21-65x75-10-07-2026');
  assert.equal(parsed[0].topic, 'equipment'); assert.equal(parsed[0].sourceId, 'swarovski');
  assert.equal(parsed[0].title.includes('Juli 2026'), false, 'the date is not copied into the title');
  assert.equal(new Set(parsed.map(entry => entry.id)).size, 2);
});

test('Swarovski date guards reject impossible, future, stale and absent visible dates without using URL dates', () => {
  const card = (slug, date, title = 'Neues Fernglas für die Natur') => `<a href="/at/de/jagd/press-releases/${slug}"><span>${title}</span><span>${date}</span></a>`;
  const html = observedSwarovskiCards + [
    card('invalid-day', '31. Februar 2026'), card('invalid-month', '10. Fantasiemonat 2026'),
    card('future', '17. Oktober 2026'), card('old', '1. Januar 2020'), card('url-10-10-2026', ''),
    card('politics', '15. Oktober 2026', 'Ministerin fordert neue Ferngläser'),
    '<a href="https://swarovskioptik.com.evil.example/at/de/jagd/press-releases/foreign"><span>Fernglas</span><span>15. Oktober 2026</span></a>',
  ].join('');
  const parsed = parseNewsHtml(html, swarovski, now);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parseNewsHtml(observedSwarovskiCards.replaceAll('10. Juli 2026', '10. Juli 2027').replaceAll('20. Jänner 2026', '20. Jänner 2027'), swarovski, now), []);
  assert.throws(() => parseNewsHtml('<nav><a href="/shop">Neues Fernglas 15. Oktober 2026</a></nav>', swarovski, now), /Struktur/);
  assert.throws(() => parseNewsHtml('a'.repeat(NEWS_MAX_BYTES + 1), swarovski, now));
  assert.equal(parseNewsHtml(observedSwarovskiCards + observedSwarovskiCards, swarovski, now).length, 2);
});

test('Source retrieval dispatches real Swarovski parsing and keeps safe transport options', async () => {
  let observed;
  const result = await fetchNewsSource(swarovski, { now: () => now, fetchImpl: async (url, options) => { observed = { url, options }; return new Response(observedSwarovskiCards); } });
  assert.equal(observed.url, swarovski.feed); assert.equal(observed.options.redirect, 'error'); assert.equal(observed.options.cache, 'no-store');
  assert.equal(observed.options.headers.Accept, 'text/html'); assert.ok(observed.options.signal instanceof AbortSignal);
  assert.equal(result.fetchedAt, new Date(now).toISOString()); assert.equal(result.items.length, 2);
});

test('Manufacturer cards are distinctly labelled and the community link is a local route', () => {
  const { NewsCard } = load('components/JagdNews.js');
  for (const source of manufacturerSources) {
    const article = { id: source.id, title: 'Neue Ferngläser für die Naturbeobachtung', topic: 'equipment', url: source.homepage, sourceId: source.id, sourceLabel: source.label, publishedAt: '2026-10-15T12:00:00Z' };
    const html = render(NewsCard, { item: article });
    assert.ok(html.includes('Herstellermeldung · Produktinformation')); assert.ok(html.includes('Die Produktangaben stammen vom Hersteller.'));
    assert.ok(html.includes('In der Community besprechen'));
    const external = nodes(NewsCard({ item: article }), node => node.type === 'a')[0];
    assert.equal(external.props.target, '_blank'); assert.equal(external.props.href, source.homepage);
    assert.match(external.props.rel, /noopener/); assert.match(external.props.rel, /noreferrer/);
    const discussion = nodes(NewsCard({ item: article }), node => node.type === Link)[0];
    assert.equal(new URL(discussion.props.href, 'https://jagdlatein.de').pathname, '/community');
  }
});

test('News date-only publications retain date precision in cards, overview and source status markup', () => {
  const { NewsCard, NewsRefreshStatus, default: JagdNews } = load('components/JagdNews.js');
  const source = newsSources[0];
  const article = { id: 'date-only', title: 'Wildtierforschung', topic: 'science', sourceId: source.id, sourceLabel: source.label, url: source.homepage, publishedAt: '2026-10-18T12:00:00.000Z', publishedDate: '2026-10-18' };
  const snapshot = { id: source.id, label: source.label, status: 'ok', stale: false, fetchedAt: '2026-10-18T08:00:00.000Z', lastPublishedAt: article.publishedAt, lastPublishedDate: article.publishedDate };
  const news = { items: [article], sources: [snapshot], generatedAt: snapshot.fetchedAt, latestPublishedAt: article.publishedAt, latestPublishedDate: article.publishedDate };
  for (const html of [render(NewsCard, { item: article }), render(NewsRefreshStatus, { news }), render(JagdNews, { initialNews: news })]) {
    assert.match(html, /datetime="2026-10-18"/i);
    assert.doesNotMatch(html, /datetime="2026-10-18T12:00:00/i);
  }
  const timed = render(NewsCard, { item: { ...article, publishedDate: undefined, publishedAt: '2026-10-18T08:15:00.000Z' } });
  assert.match(timed, /datetime="2026-10-18T08:15:00.000Z"/i);
});

test('News discussion URLs encode bounded titles, trusted sources and topic categories safely', () => {
  for (const [topic, category] of [['equipment', 'ausruestung-technik'], ['hunting', 'jagdpraxis'], ['science', 'natur-revier'], ['nature', 'natur-revier']]) {
    const route = new URL(newsDiscussionHref({ topic, title: 'Gams & Wald? #1\nFragen', url: swarovski.homepage + '#tracking' }), 'https://jagdlatein.de');
    assert.equal(route.origin, 'https://jagdlatein.de'); assert.equal(route.pathname, '/community'); assert.equal(route.hash, '');
    assert.equal(route.searchParams.get('category'), category); assert.equal(route.searchParams.get('thema'), 'Gams & Wald? #1 Fragen');
    assert.equal(route.searchParams.get('quelle'), swarovski.homepage);
  }
  const long = new URL(newsDiscussionHref({ title: 'x'.repeat(300), url: 'https://evil.example/' }), 'https://jagdlatein.de');
  assert.equal(long.searchParams.get('thema').length, 120); assert.equal(long.searchParams.has('quelle'), false);
  const arrayTitle = new URL(newsDiscussionHref({ title: ['wrong'], url: ['wrong'] }), 'https://jagdlatein.de');
  assert.equal(arrayTitle.searchParams.has('thema'), false); assert.equal(arrayTitle.searchParams.has('quelle'), false);
});

test('Community source validation rejects script URLs, credentials, spoofed domains and unexpected query arrays', () => {
  for (const url of ['', 'javascript:alert(1)', '//www.swarovskioptik.com/press', 'http://www.swarovskioptik.com/press', 'https://www.swarovskioptik.com.evil.example/press', 'https://www.swarovskioptik.com@evil.example/press', 'https://person:secret@www.swarovskioptik.com/press', 'https://www.swarovskioptik.com:444/press', 'https://evil.example/', 'x'.repeat(2049), ['https://www.swarovskioptik.com/press']]) assert.equal(communityNewsSource(url), '', String(url));
  for (const source of newsSources) assert.equal(communityNewsSource(source.homepage), source.homepage);
});

function communityProps(href, signedIn) {
  const route = new URL(href, 'https://jagdlatein.de'); const headers = {};
  const page = createLoader({ ...uiOverrides, '../../lib/account-access': { readRequestAccountSession: () => signedIn ? { email: 'not-published@example.test' } : null } })('pages/community/index.js');
  const result = page.getServerSideProps({ req: {}, res: { setHeader: (key, value) => { headers[key] = value; } }, query: Object.fromEntries(route.searchParams) });
  assert.match(headers['Cache-Control'], /private, no-store/);
  return result.props;
}

test('News context survives actual Community SSR, its login next URL and a second page-props round trip', () => {
  const title = 'Fernglas & Natur: Welche Beobachtung hilft?';
  const destination = newsDiscussionHref({ topic: 'equipment', title, url: swarovski.homepage });
  const first = communityProps(destination, false);
  assert.equal(first.initialCategory, 'ausruestung-technik'); assert.equal(first.context, title); assert.equal(first.sourceContext, swarovski.homepage);
  const Community = load('components/Community.js').default;
  const html = render(Community, first);
  const login = html.match(/href="(\/login\?next=[^"]+)"/)[1].replaceAll('&amp;', '&');
  const next = new URL(login, 'https://jagdlatein.de').searchParams.get('next');
  assert.equal(next, destination);
  const second = communityProps(next, true);
  assert.deepEqual(second, { ...first, signedIn: true });
  assert.doesNotMatch(html, /not-published@example/);
  const hostile = communityProps('/community?category=evil&thema=%3Cscript%3Ealert(1)%3C%2Fscript%3E&quelle=javascript%3Aalert(1)', false);
  assert.equal(hostile.initialCategory, 'all'); assert.equal(hostile.sourceContext, '');
  assert.doesNotMatch(render(Community, hostile), /<script>/);
});

function hookFrames() {
  const frames = new Map(); let active;
  const changed = (previous, deps) => !previous || !deps || deps.length !== previous.deps?.length || deps.some((value, index) => !Object.is(value, previous.deps[index]));
  const hooks = { ...React,
    useState(initial) { const frame = active; const index = frame.cursor++; if (!(index in frame.slots)) frame.slots[index] = { value: typeof initial === 'function' ? initial() : initial }; return [frame.slots[index].value, value => { frame.slots[index].value = typeof value === 'function' ? value(frame.slots[index].value) : value; }]; },
    useRef(initial) { const index = active.cursor++; if (!(index in active.slots)) active.slots[index] = { current: initial }; return active.slots[index]; },
    useCallback(fn, deps) { const index = active.cursor++; if (changed(active.slots[index], deps)) active.slots[index] = { value: fn, deps }; return active.slots[index].value; },
    useEffect(fn, deps) { const frame = active; const index = frame.cursor++; const old = frame.slots[index]; if (changed(old, deps)) { frame.slots[index] = { deps, cleanup: old?.cleanup }; frame.effects.push(() => { frame.slots[index].cleanup?.(); frame.slots[index].cleanup = fn(); }); } },
  };
  return { hooks,
    render(key, fn) { let frame = frames.get(key); if (!frame) { frame = { cursor: 0, slots: [], effects: [] }; frames.set(key, frame); } frame.cursor = 0; active = frame; return fn(); },
    flush() { for (const frame of frames.values()) { const pending = frame.effects; frame.effects = []; for (const effect of pending) effect(); } },
    unmount() { for (const frame of frames.values()) for (const slot of frame.slots) slot?.cleanup?.(); },
  };
}

test('A signed-in news discussion opens a prefilled editable draft but sends no post without an explicit submit', async () => {
  const originals = { fetch: global.fetch, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout, document: global.document, window: global.window };
  const requests = []; const timers = new Map(); let timerId = 0;
  global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; }; global.clearTimeout = id => timers.delete(id);
  global.document = { getElementById: () => null }; global.window = { matchMedia: () => ({ matches: true }) };
  global.fetch = async (url, options = {}) => { requests.push({ url, options }); return new Response(JSON.stringify({ viewer: { displayName: 'Lernfuchs', profileRequired: false, canModerate: false }, posts: [], total: 0 })); };
  const e = hookFrames();
  const Community = createLoader({ ...uiOverrides, react: e.hooks })('components/Community.js').default;
  const props = communityProps(newsDiscussionHref({ topic: 'equipment', title: 'Fernglas sinnvoll auswählen', url: swarovski.homepage }), true);
  let tree;
  const run = () => { tree = e.render('community', () => Community(props)); e.flush(); };
  try {
    run(); await new Promise(resolve => setImmediate(resolve)); run(); run();
    const draft = nodes(tree, node => typeof node.type === 'function' && node.type.name === 'Compose')[0];
    assert.ok(draft, 'the authenticated learner receives a composer immediately');
    assert.equal(draft.props.initialTitle, 'Frage zu Fernglas sinnvoll auswählen'); assert.equal(draft.props.initialSource, swarovski.homepage);
    const draftTree = e.render('compose', () => draft.type(draft.props)); e.flush();
    const title = nodes(draftTree, node => node.type === 'input' && node.props.maxLength === 140)[0];
    const body = nodes(draftTree, node => node.type === 'textarea')[0];
    assert.equal(title.props.value, 'Frage zu Fernglas sinnvoll auswählen'); assert.ok(body.props.value.includes(`Quelle: ${swarovski.homepage}`));
    assert.ok(body.props.value.includes('Meine Frage oder Einordnung:')); assert.equal(body.props.disabled, false);
    const consent = nodes(draftTree, node => node.type === 'input' && node.props.type === 'checkbox')[0];
    assert.equal(consent.props.checked, false); assert.equal(consent.props.required, true);
    const submit = nodes(draftTree, node => node.type === 'button' && words(node).includes('Zur Prüfung einreichen'))[0];
    assert.equal(submit.props.disabled, true);
    assert.ok(requests.length >= 1); assert.ok(requests.every(request => !request.options.method || request.options.method === 'GET'));
    assert.ok(requests.every(request => request.url.startsWith('/api/community?')));
  } finally { e.unmount(); Object.assign(global, originals); }
});

// Opt-in: verifies the complete current public HTML through the production fetch
// and parser. Deterministic tests above require neither internet nor third-party uptime.
if (process.env.JL_TEST_LIVE_NEWS === '1') test('Live Swarovski press HTML still matches its adapter and yields dated equipment cards', async () => {
  const result = await fetchNewsSource(swarovski, { now: () => now });
  assert.ok(result.items.length > 0);
  for (const article of result.items) {
    assert.equal(article.topic, 'equipment'); assert.equal(article.sourceId, swarovski.id);
    assert.ok(article.url.startsWith('https://www.swarovskioptik.com/at/de/jagd/press-releases/'));
    assert.ok(Date.parse(article.publishedAt) <= now && Date.parse(article.publishedAt) >= now - 366 * 86400000);
  }
});
