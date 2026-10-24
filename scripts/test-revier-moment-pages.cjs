const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), pr = createRequire(path.join(root, 'package.json'));
const React = pr('react'), swc = pr('next/dist/build/swc');
const { renderToStaticMarkup } = pr('react-dom/server');
function load(relative, overrides = {}, cache = new Map()) {
  const file = path.join(root, relative);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file);
  const { code } = swc.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/image') return ({ priority, ...props }) => React.createElement('img', props);
    if (id === 'next/head') return () => null;
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), path.extname(id) ? id : `${id}.js`)), overrides, cache);
    return pr(id);
  }, mod, mod.exports); cache.set(file, mod.exports); return mod.exports;
}
const server = load('lib/revier-moment-server.js');
const moment = server.getRevierMoment(new Date('2026-10-16T12:00:00Z'));

test('Home passes only the explicit public teaser, without answer fields or an extra external request', async () => {
  const page = load('pages/index.js', {
    '../lib/account-access': { readRequestAccountSession: () => null },
    '../lib/jagd-news-server': { getInitialJagdNews: () => ({ items: [], sources: [] }) },
    '../lib/revier-moment-server': { getRevierMoment: () => moment, getRevierMomentPreview: server.getRevierMomentPreview },
    '../components/HomeNews': () => null, '../components/Community': {}, '../lib/offline-learning': {}, '../lib/daily-review': {}, '@capacitor/core': {}, '@capacitor/push-notifications': {},
  });
  const { props } = await page.getServerSideProps({ req: {} });
  assert.deepEqual(props.revierMoment, { dateKey: moment.dateKey, displayDate: moment.displayDate, prompt: moment.question.prompt, topicTitle: moment.topic.title });
  assert.doesNotMatch(JSON.stringify(props), /correctIds|expectedOrder|explanation|sourceIds|options|questions|photo/);
  const Entry = load('components/RevierMomentEntry.js').default;
  const html = renderToStaticMarkup(React.createElement(Entry, { preview: props.revierMoment }));
  assert.equal((html.match(/href="\/tagesquiz"/g) || []).length, 1);
  assert.doesNotMatch(html, /<button|Ranglistenpunkte sammeln|Serie verloren/);
  assert.match(html, /ohne Zeitlimit/);
});

test('The protected daily page sends one case with no-store and preserves its original review date', async () => {
  const headers = new Map();
  const page = load('pages/tagesquiz.js', { '../lib/revier-moment-server': { getRevierMoment: () => moment } });
  const result = page.getServerSideProps({ res: { setHeader: (key, value) => headers.set(key, value) } });
  assert.equal(headers.get('Cache-Control'), 'private, no-store');
  assert.equal(result.props.moment, moment);
  const { middleware } = load('middleware.js', { './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account', readAccountSessionEdge: async () => null } });
  const url = 'https://jagdlatein.example/tagesquiz';
  const response = await middleware({ url, nextUrl: new URL(url), cookies: { get: () => undefined } });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get('location')).searchParams.get('next'), '/tagesquiz');
});

test('Daily page links to the selected dossier and separates local repetition from server-ranked rounds', () => {
  const Page = load('components/RevierMoment.js', { 'next/router': { useRouter: () => ({ query: {} }) } }).default;
  const html = renderToStaticMarkup(React.createElement(Page, { moment }));
  assert.match(html, new RegExp(`thema=${moment.topic.id}#revierwissen-inhalt`));
  assert.match(html, /href="\/lernen\/fuenf-minuten"/);
  assert.match(html, /href="\/quiz-app"/);
  assert.doesNotMatch(html, /href="\/lernen#lernen-suche"/);
  assert.match(html, /class="header titleHeader"/);
  assert.match(html, /keine Antworten gespeichert/);
  assert.match(html, /keine Ranglistenpunkte/);
  assert.match(html, new RegExp(moment.question.reviewedOn));
  assert.match(html, new RegExp(moment.photo.credit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /Runde auswerten|Nächste Frage|Neu gemischt üben/);
});
