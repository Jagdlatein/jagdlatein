const test = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'); const pr = createRequire(path.join(root, 'package.json')); const swc = pr('next/dist/build/swc');
function load(file, overrides = {}, cache = new Map()) {
  const filename = path.join(root, file); if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id.endsWith('.json') ? id : id + '.js')), overrides, cache);
    return pr(id);
  }, mod, mod.exports); cache.set(filename, mod.exports); return mod.exports;
}
const now = Date.parse('2026-10-04T16:00:00Z');
const source = { id: 'test', label: 'Research source', homepage: 'https://research.example/', domains: ['research.example'], defaultTopic: 'nature' };
const item = (title, link = 'https://research.example/article', date = 'Thu, 01 Oct 2026 10:00:00 GMT') => `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate></item>`;
const rss = entries => `<rss version="2.0"><channel><title>Forschung</title>${entries}</channel></rss>`;
test('News accepts dated RSS and Atom only, deduplicates links and strips markup without executing it', () => {
  const { parseNewsFeed } = load('lib/jagd-news-feeds.js');
  const result = parseNewsFeed(rss(item('Studie zur Wildtierforschung <script>danger()</script> &amp; Natur') + item('Doppelte Waldstudie') + item('Neue Waldstudie', 'javascript:alert(1)') + item('Waldbericht', 'https://evil.example/a') + item('Waldstudie ohne Datum', 'https://research.example/no-date', '') + item('Waldstudie aus der Zukunft', 'https://research.example/future', 'Thu, 01 Oct 2027 10:00:00 GMT')), source, now);
  assert.equal(result.length, 1); assert.equal(result[0].title, 'Studie zur Wildtierforschung & Natur'); assert.equal(result[0].topic, 'science');
  assert.ok(!('description' in result[0]) && !('content' in result[0]));
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Gamswild beobachten</title><published>2026-10-02T10:00:00Z</published><link rel="self" href="https://evil.example/self"/><link rel="alternate" href="/gams"/></entry></feed>`;
  assert.equal(parseNewsFeed(atom, source, now)[0].url, 'https://research.example/gams');
});
test('Politics, association positions, administration and distant subjects are excluded from knowledge news', () => {
  const { classifyNews } = load('lib/jagd-news-feeds.js');
  for (const title of ['Jagdpolitik im Wald', 'Ministerin besucht die Wald-Forschung', 'Neue Jagdgesetz-Novelle', 'Partei fordert mehr Jagd', 'Neue Waldschutzverordnung', 'Verbandsposition zur Natur', 'Stellenangebot: Wildtierforschung', 'Korea: Waldwissen', 'Geparden und genetische Forschung']) assert.equal(classifyNews(title), null, title);
  assert.equal(classifyNews('Wildtiere beobachten', 'Die Regierung fordert neue Maßnahmen.'), null);
  for (const title of ['Forstministerin stellt neue Waldstrategie vor', 'Bundesregierung beschließt mehr Schutz für Wildtiere', 'Bundesministerin besucht Wildtierforschung']) assert.equal(classifyNews(title), null, title);
  assert.equal(classifyNews('Studie zu Wildtieren und ihren Lebensräumen'), 'science');
  assert.equal(classifyNews('Gamswild erkennen'), 'hunting'); assert.equal(classifyNews('Waldränder aufwerten'), 'nature');
  assert.equal(classifyNews('Wildtiere sicher immobilisieren', '', 'science'), 'science');
  assert.equal(classifyNews('Hirschkäfer im Wald beobachten'), 'nature');
});
test('XML declarations cannot load entities and malformed, deeply nested or oversized feeds fail closed', () => {
  const { parseNewsFeed, NEWS_MAX_BYTES, trustedNewsUrl } = load('lib/jagd-news-feeds.js');
  assert.throws(() => parseNewsFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///private">]>' + rss(item('Wald &x;')), source, now));
  assert.throws(() => parseNewsFeed('<rss><channel><item></rss>', source, now));
  assert.throws(() => parseNewsFeed('<rss>' + '<x>'.repeat(50) + '</x>'.repeat(50) + '</rss>', source, now));
  assert.throws(() => parseNewsFeed('a'.repeat(NEWS_MAX_BYTES + 1), source, now));
  for (const url of ['', 'https://research.example.evil.example/a', 'https://research.example@evil.example/a', 'https://research.example:8080/a', 'http://research.example/a']) assert.equal(trustedNewsUrl(url, source), null, url);
  assert.equal(trustedNewsUrl('https://research.example/a?utm_source=tracking#foo', source), 'https://research.example/a');
  assert.equal(trustedNewsUrl('http://research.example/a', { ...source, upgradeHttp: true }), 'https://research.example/a');
});
test('Verified HTML adapters read article cards, preserve winter dates and reject a changed source structure', () => {
  const { parseNewsHtml } = load('lib/jagd-news-feeds.js');
  const izw = `<div class="layout_latest arc_5 block"><p><time datetime="2026-09-10T11:00:00+02:00">10.09.2026</time></p><h2><a href="/research">Studie zu Wildtieren</a></h2></div><a href="/unrelated">Waldstudie</a>`;
  assert.equal(parseNewsHtml(izw, { ...source, format: 'izw-html' }, now).length, 1);
  const vetmed = `<div class="col-md-4 news-list-item article-0"><time>01.12.2025</time><a class="news-headline-link" title="Wildtiere" href="/wild">Wildtiere sicher beobachten</a></div>`;
  const result = parseNewsHtml(vetmed, { ...source, format: 'vetmed-html' }, now);
  assert.equal(load('lib/news-catalog.js').formatNewsDate(result[0].publishedAt), '01.12.2025');
  assert.throws(() => parseNewsHtml('<h2>News redesigned</h2>', { ...source, format: 'izw-html' }, now));
});
test('Fetching is bounded and does not follow feed redirects or save transport errors as successes', async () => {
  const { fetchNewsSource, NEWS_MAX_BYTES } = load('lib/jagd-news-feeds.js'); let observed;
  const snapshot = await fetchNewsSource({ ...source, feed: 'https://research.example/rss' }, { now: () => now, fetchImpl: async (url, options) => { observed = { url, options }; return new Response(rss(item('Studie zu Wildtieren'))); } });
  assert.equal(observed.options.redirect, 'error'); assert.equal(snapshot.fetchedAt, new Date(now).toISOString()); assert.equal(snapshot.items.length, 1);
  await assert.rejects(() => fetchNewsSource(source, { fetchImpl: async () => new Response('failed', { status: 503 }) }));
  await assert.rejects(() => fetchNewsSource(source, { fetchImpl: async () => new Response('a'.repeat(NEWS_MAX_BYTES + 1)) }));
});
test('News refreshes in a new 30-minute window; failures preserve truthful dates while other countries keep updating', async () => {
  const { newsSources, newsRefreshSeconds } = load('lib/news-catalog.js'); let time = now; let calls = 0; const fails = new Set();
  const cache = { unstable_cache(fn, keys) { const values = new Map(); return async (...args) => { const key = JSON.stringify(args); if (!values.has(key)) values.set(key, await fn(...args)); return values.get(key); }; } };
  const server = load('lib/jagd-news-server.js', { 'next/cache': cache, './jagd-news-feeds': { fetchNewsSource: async source => { calls++; if (fails.has(source.id)) throw new Error('offline'); return { fetchedAt: new Date(time).toISOString(), items: [{ id: source.id, title: 'Forschung im Wald', url: source.homepage, publishedAt: new Date(now - 3600000).toISOString(), sourceId: source.id, sourceLabel: source.label, topic: 'science' }] }; } } });
  const originalNow = Date.now; Date.now = () => time;
  try {
    const first = await server.getJagdNews(); await server.getJagdNews(); assert.equal(calls, newsSources.length); assert.equal(first.sources.length, newsSources.length);
    time += newsRefreshSeconds * 1000; const second = await server.getJagdNews(); assert.equal(calls, newsSources.length * 2); assert.ok(second.sources.every(s => s.fetchedAt === new Date(time).toISOString()));
    const oldDate = second.sources[0].fetchedAt; fails.add(newsSources[0].id); time += newsRefreshSeconds * 1000;
    const third = await server.getJagdNews(); assert.equal(third.sources[0].status, 'fallback'); assert.equal(third.sources[0].fetchedAt, oldDate); assert.equal(third.sources[1].status, 'ok');
    const mixed = await server.collectJagdNews(async source => { if (source.id === newsSources[0].id) throw new Error('offline'); return { items: [], fetchedAt: new Date(time).toISOString() }; }, time);
    assert.equal(mixed.sources[0].status, 'unavailable'); assert.equal(mixed.sources[0].fetchedAt, null); assert.equal(mixed.sources[1].status, 'ok');
  } finally { Date.now = originalNow; }
});
test('Discovery finds topics and sources; the public API accepts no requested feed URL and page access stays scoped', async () => {
  const { filterNewsItems, newsSources } = load('lib/news-catalog.js');
  const items = [{ title: 'Gämse im Wald', sourceLabel: 'Schweizerische Vogelwarte', topic: 'science', sourceId: 'vogelwarte' }, { title: 'Waldränder', sourceLabel: 'BFW', topic: 'nature', sourceId: 'bfw' }];
  assert.equal(filterNewsItems(items, { query: 'Gaemse' }).length, 1); assert.equal(filterNewsItems(items, { topic: 'nature', source: 'bfw' }).length, 1);
  assert.ok(['DE', 'AT', 'CH'].every(country => newsSources.some(source => source.country === country)));
  let invoked = 0; const route = load('app/api/news/route.js', { '../../../lib/jagd-news-server': { getJagdNews: async () => { invoked++; return { items: [], sources: [] }; } } });
  const response = await route.GET(new Request('https://jagdlatein.example/api/news?feed=http://169.254.169.254/'));
  assert.equal(response.status, 200); assert.equal(invoked, 1); assert.match(response.headers.get('cache-control'), /s-maxage=60/);
  const { middleware } = load('middleware.js', { './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account', readAccountSessionEdge: async () => null } });
  const request = pathname => ({ url: 'https://jagdlatein.example' + pathname, nextUrl: new URL('https://jagdlatein.example' + pathname), cookies: { get: () => undefined } });
  assert.equal((await middleware(request('/news'))).status, 200); assert.equal((await middleware(request('/news/private'))).status, 307);
});
test('Homepage shows three linked real headlines with separate publication dates and source retrieval times', () => {
  const React = pr('react'); const ssr = pr('react-dom/server');
  const links = { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
  const HomeNews = load('components/HomeNews.js', { 'next/link': links }).default;
  const sources = load('lib/news-catalog.js').newsSources; const initialNews = { generatedAt: new Date(now).toISOString(), latestPublishedAt: new Date(now - 3600000).toISOString(), sources: sources.map(s => ({ ...s, status: 'ok', fetchedAt: new Date(now).toISOString() })), items: Array.from({ length: 5 }, (_, i) => ({ id: String(i), title: 'Wildtierforschung ' + i, url: sources[i].homepage, sourceLabel: sources[i].label, sourceId: sources[i].id, publishedAt: new Date(now - 3600000).toISOString(), topic: 'science' })) };
  const html = ssr.renderToStaticMarkup(React.createElement(HomeNews, { initialNews }));
  assert.equal((html.match(/<article/g) || []).length, 3); assert.match(html, /Veröffentlicht:/); assert.match(html, /Quelle abgerufen:/); assert.match(html, /href="\/news"/); assert.ok(!html.includes('Wildtierforschung 4'));
});
