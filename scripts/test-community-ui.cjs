const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const expose = relative === 'components/Community.js' ? '\nexport { ProfileForm, Compose, PostContent };' : '';
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8') + expose, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname + (Object.keys(href.query || {}).length ? '?' + new URLSearchParams(href.query) : ''), ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/router') return { useRouter: () => ({ push() {} }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, cache);
    return pr(id);
  }, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));

test('Community introduction is public, requires sign-in for contributions, and preserves the learning context through login', () => {
  const { default: Community } = load('components/Community.js');
  const html = render(Community, { initialCategory: 'hundewesen', context: 'Rückruf üben' });
  assert.ok(html.includes('Die Community benötigt kein aktives Abo'));
  const login = html.match(/href="(\/login\?next=[^"]+)"/)[1];
  const destination = new URL('https://test.invalid' + login.replace(/&amp;/g, '&')).searchParams.get('next');
  const route = new URL('https://test.invalid' + destination);
  assert.equal(route.pathname, '/community'); assert.equal(route.searchParams.get('category'), 'hundewesen'); assert.equal(route.searchParams.get('thema'), 'Rückruf üben');
  const { communityCategories } = load('lib/community-catalog.js');
  assert.equal(communityCategories.length, 13);
  for (const category of communityCategories) assert.ok(html.includes(category.title.replace(/&/g, '&amp;')));
  assert.ok(!html.includes('Antwort veröffentlichen') && !html.includes('Thema veröffentlichen'));
});
test('Choosing a public learner name and publishing text require deliberate rule acceptance and bounded input', () => {
  const { ProfileForm, Compose } = load('components/Community.js');
  const profile = render(ProfileForm, { onSubmit() {}, busy: false });
  assert.ok(profile.includes('type="checkbox"') && profile.includes('required=""'));
  assert.ok(profile.includes('maxLength="30"') && profile.includes('value=""'));
  assert.ok(profile.includes('disabled=""') && !profile.includes('@'));
  const post = render(Compose, { initialCategory: 'wildkunde', onSubmit() {}, busy: false });
  const reply = render(Compose, { threadId: '11111111-1111-4111-8111-111111111111', onSubmit() {}, busy: false });
  assert.ok(post.includes('maxLength="140"') && post.includes('maxLength="6000"'));
  assert.ok(reply.includes('maxLength="4000"') && !reply.includes('Beitragsart'));
  assert.ok(post.includes('Thema veröffentlichen') && reply.includes('Antwort veröffentlichen'));
});
test('User contributions render as plain text and reveal only their public learner name', () => {
  const { PostContent } = load('components/Community.js');
  const html = render(PostContent, { post: { id: '11111111-1111-4111-8111-111111111111', body: '<script>window.attack()</script> https://example.invalid', displayName: 'Lernfuchs', createdAt: '2026-10-04T10:00:00Z', owned: false, status: 'visible' }, setReport() {}, setRemoval() {} });
  assert.ok(html.includes('&lt;script&gt;window.attack()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>') && !html.includes('href="https://example.invalid"'));
  assert.ok(html.includes('Lernfuchs') && html.includes('Beitrag melden'));
  assert.ok(!html.includes('Eigenen Beitrag entfernen') && !html.includes('Ausblenden'));
});
test('Forum pages validate route identifiers and keep signed identity pages private without querying payment access', () => {
  const landing = load('pages/community/index.js', { '../../lib/account-access': { readRequestAccountSession: () => null } });
  const headers = {}; const result = landing.getServerSideProps({ req: {}, res: { setHeader: (key, value) => headers[key] = value }, query: { category: 'not-a-category', thema: ['ignored', 'array'] } });
  assert.deepEqual(result.props, { signedIn: false, initialCategory: 'all', context: '' });
  assert.match(headers['Cache-Control'], /private, no-store/);
  const page = load('pages/community/[id].js', { '../../lib/account-page': { getAccountPageProps: () => ({ redirect: { destination: '/login' } }) } });
  assert.deepEqual(page.getServerSideProps({ params: { id: 'invalid' } }), { notFound: true });
  assert.equal(page.getServerSideProps({ params: { id: '11111111-1111-4111-8111-111111111111' } }).redirect.destination, '/login');
});
test('Middleware opens only the introduction and signed community threads while other learning access stays protected', async () => {
  let session = null;
  const { middleware } = load('middleware.js', { 'next/server': { NextResponse: { next: () => ({ state: 'next' }), redirect: url => ({ state: 'redirect', url: url.href }) } }, './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'test', readAccountSessionEdge: async () => session } });
  const request = route => ({ url: 'https://test.invalid' + route, nextUrl: new URL('https://test.invalid' + route), cookies: { get: () => null } });
  assert.equal((await middleware(request('/community'))).state, 'next');
  assert.equal((await middleware(request('/community/11111111-1111-4111-8111-111111111111'))).url, 'https://test.invalid/login?next=%2Fcommunity%2F11111111-1111-4111-8111-111111111111');
  session = { paid: false, admin: false, accessExpiresAt: Math.floor(Date.now() / 1000) + 60 };
  assert.equal((await middleware(request('/community/11111111-1111-4111-8111-111111111111'))).state, 'next');
  assert.equal((await middleware(request('/lernen'))).state, 'redirect');
  assert.equal((await middleware(request('/community/private'))).state, 'redirect');
});
