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
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const expose = relative === 'components/Community.js' ? '\nexport { ProfileForm, Compose, PostContent, PostActions, CommunityToolbar, CommunitySearch, useCommunityData, focusSection };' : '';
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8') + expose, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname + (Object.keys(href.query || {}).length ? '?' + new URLSearchParams(href.query) : ''), ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: false, push() {} }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), /\.(js|json)$/.test(id) ? id : id + '.js')), overrides, cache);
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
  assert.ok(post.includes('Zur Prüfung einreichen') && reply.includes('Zur Prüfung einreichen'));
  assert.ok(post.includes('Bis zur Freigabe sehen nur du und die Moderation') && reply.includes('Bis zur Freigabe sehen nur du und die Moderation'));
});
test('User contributions render as plain text and reveal only their public learner name', () => {
  const { PostContent } = load('components/Community.js');
  const html = render(PostContent, { post: { id: '11111111-1111-4111-8111-111111111111', body: '<script>window.attack()</script> https://example.invalid', displayName: 'Lernfuchs', createdAt: '2026-10-04T10:00:00Z', owned: false, status: 'visible' }, setReport() {}, setRemoval() {} });
  assert.ok(html.includes('&lt;script&gt;window.attack()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>') && !html.includes('href="https://example.invalid"'));
  assert.ok(html.includes('Lernfuchs') && html.includes('Beitrag melden') && html.includes('Nutzer blockieren'));
  assert.ok(!html.includes('Eigenen Beitrag entfernen') && !html.includes('Ausblenden'));
});

test('Community keeps writing visible and moves views and moderator options into the lower menu', () => {
  const { CommunityToolbar } = load('components/Community.js');
  const html = render(CommunityToolbar, { viewer: { displayName: 'Lernfuchs', canModerate: false }, view: 'posts' });
  assert.match(html, /Frage stellen/);
  assert.doesNotMatch(html, /Community-Ansicht|Meine Einreichungen|Weitere Optionen|Neue Beiträge prüfen|Gemeldete Beiträge prüfen/);
  const MenuToolbar = load('components/Community.js', { './PageMenu': { __esModule: true, default: ({ title, children }) => React.createElement('section', { 'data-lower-menu': title }, children), closePageMenu() {} } }).CommunityToolbar;
  const menu = render(MenuToolbar, { viewer: { canModerate: false }, view: 'posts' });
  assert.match(menu, /data-lower-menu="Community auswählen"/);
  assert.match(menu, /aria-label="Community-Ansicht"/);
  assert.match(menu, /aria-pressed="true"[^>]*>Alle Themen/);
  assert.match(menu, /Meine Einreichungen/);
  assert.doesNotMatch(menu, /Neue Beiträge prüfen|Gemeldete Beiträge prüfen/);
  const moderator = render(MenuToolbar, { viewer: { canModerate: true }, view: 'moderation' });
  assert.ok(moderator.includes('Neue Beiträge prüfen') && moderator.includes('Gemeldete Beiträge prüfen'));
  const writing = render(MenuToolbar, { viewer: { canModerate: true }, compose: true });
  assert.doesNotMatch(writing, /Frage stellen|Community-Ansicht|Neue Beiträge prüfen/);
});

test('Search defaults to compact inputs and keeps selected restrictions understandable', () => {
  const { CommunitySearch } = load('components/Community.js');
  const base = { query: '', category: 'all', type: 'all', unanswered: false, search: '', total: 1 };
  const html = render(CommunitySearch, base);
  assert.match(html, /enterKeyHint="search"/);
  assert.ok(html.includes('Treffer anzeigen') && html.includes('1 Thema'));
  assert.ok(!html.includes('open=""') && !html.includes('Auswahl zurücksetzen'));
  const filtered = render(CommunitySearch, { ...base, category: 'wildkunde', type: 'question', search: 'Gams' });
  assert.ok(filtered.includes('open=""') && filtered.includes('Filter aktiv') && filtered.includes('Auswahl zurücksetzen'));
  assert.match(filtered, /Thema für „Gams“/);
});

test('New contribution forms start with the text and retain explicit review consent', () => {
  const { Compose, ProfileForm } = load('components/Community.js');
  const html = render(Compose, { initialCategory: 'wildkunde', onSubmit() {} });
  assert.ok(html.indexOf('>Titel<') < html.indexOf('>Beschreibung<'));
  assert.ok(html.indexOf('>Beschreibung<') < html.indexOf('>Themenbereich<'));
  assert.match(html, /id="community-compose" tabindex="-1"/);
  assert.ok(html.includes('Wildkunde · Frage · ändern') && html.includes('Zur Prüfung einreichen'));
  const profile = render(ProfileForm, { onSubmit() {} });
  assert.ok(profile.includes('3–30 Zeichen') && profile.includes('sind reserviert'));
  assert.ok(profile.includes('type="checkbox"') && profile.includes('disabled=""'));
});

test('Changing search keeps viewer context and inputs available without returning old results', () => {
  const viewer = { displayName: 'Lernfuchs', profileRequired: false, canModerate: false };
  const selection = JSON.stringify([undefined, 'all', '', 1, 'all', false, 'posts']);
  let position = 0;
  const values = [{ result: { viewer, posts: [{ title: 'Old search' }] }, selection }, null, false, 0];
  const fakeReact = { ...React, useState: () => [values[position++], () => {}], useEffect() {}, useCallback: callback => callback };
  const { useCommunityData } = load('components/Community.js', { react: fakeReact });
  const result = useCommunityData({ signedIn: true, category: 'all', query: 'Gams', page: 1, type: 'all', unanswered: false, view: 'posts' });
  assert.equal(result.data, null);
  assert.equal(result.viewer, viewer);
  assert.equal(result.loading, true);
  position = 0;
  const signedOut = useCommunityData({ signedIn: false, category: 'all', query: '', page: 1, type: 'all', unanswered: false, view: 'posts' });
  assert.equal(signedOut.viewer, null);
  assert.equal(signedOut.data, null);
});

test('Explicit actions reveal and focus their section with reduced motion respected', () => {
  const { focusSection } = load('components/Community.js');
  const oldDocument = global.document; const oldWindow = global.window;
  const calls = [];
  global.document = { getElementById: id => id === 'community-compose' ? { scrollIntoView: options => calls.push(['scroll', options]), focus: options => calls.push(['focus', options]) } : null };
  global.window = { matchMedia: () => ({ matches: true }) };
  try {
    assert.equal(focusSection('missing'), false);
    assert.equal(focusSection('community-compose'), true);
    assert.deepEqual(calls, [['scroll', { block: 'start', behavior: 'auto' }], ['focus', { preventScroll: true }]]);
  } finally { global.document = oldDocument; global.window = oldWindow; }
});

test('A reading error keeps the active draft form mounted and expired sessions disable writing', () => {
  function htmlFor(code) {
    const viewer = { displayName: 'Lernfuchs', profileRequired: false, canModerate: false };
    const selection = JSON.stringify([undefined, 'all', '', 1, 'all', false, 'posts']);
    const values = ['all', '', '', 1, 'all', false, 'posts', true, false, null, '', '', null, '', null, null, null,
      { result: { viewer }, selection }, { code, message: 'Der Abruf ist fehlgeschlagen.' }, false, 0];
    let position = 0;
    const fakeReact = { ...React, useState: initial => [position < values.length ? values[position++] : initial, () => {}], useEffect() {}, useCallback: callback => callback, useRef: value => ({ current: value }) };
    const { default: Community } = load('components/Community.js', { react: fakeReact });
    return render(Community, { signedIn: true });
  }
  const unavailable = htmlFor('COMMUNITY_UNAVAILABLE');
  assert.ok(unavailable.includes('Der Abruf ist fehlgeschlagen.') && unavailable.includes('id="community-compose"'));
  assert.match(unavailable, /<textarea[^>]*maxLength="6000"/);
  assert.doesNotMatch(unavailable, /<textarea[^>]*disabled/);
  const expired = htmlFor('AUTH_REQUIRED');
  assert.ok(expired.includes('id="community-compose"') && expired.includes('Erneut anmelden'));
  assert.match(expired, /<textarea[^>]*disabled/);
});

test('New typing cancels delayed result focus and a new post action clears older notices', () => {
  const viewer = { displayName: 'Lernfuchs', profileRequired: false, canModerate: false };
  const selection = JSON.stringify([undefined, 'all', '', 1, 'all', false, 'posts']);
  const post = { id: '11111111-1111-4111-8111-111111111111', body: 'Eine Lernfrage', title: 'Eine Lernfrage', category: 'allgemein', owned: false };
  const values = ['all', '', '', 1, 'all', false, 'posts', false, false, null, 'Gespeichert.', '', null, '', null, null, null,
    { result: { viewer, posts: [post], total: 1 }, selection }, null, false, 0];
  const writes = []; const pendingFocus = { current: true }; let position = 0;
  const fakeReact = { ...React, useState: initial => { const index = position++; return [index < values.length ? values[index] : initial, value => writes.push([index, value])]; }, useEffect() {}, useCallback: callback => callback, useRef: () => pendingFocus };
  const { default: Community, CommunitySearch, PostActions } = load('components/Community.js', { react: fakeReact });
  function find(element, type) {
    if (!element || typeof element !== 'object') return null;
    if (element.type === type) return element;
    return React.Children.toArray(element.props?.children).map(child => find(child, type)).find(Boolean);
  }
  const tree = Community({ signedIn: true });
  find(tree, CommunitySearch).props.onQuery('Gams');
  assert.equal(pendingFocus.current, false);
  assert.ok(writes.some(([index, value]) => index === 1 && value === 'Gams'));
  find(tree, PostActions).props.setBlock({ postId: post.id, displayName: 'Waldlerner' });
  assert.ok(writes.some(([index, value]) => index === 10 && value === ''));
  assert.ok(writes.some(([index, value]) => index === 9 && value === null));
  assert.ok(writes.some(([index, value]) => index === 15 && value.postId === post.id));
});
test('Forum pages validate route identifiers and keep signed identity pages private without querying payment access', () => {
  const landing = load('pages/community/index.js', { '../../lib/account-access': { readRequestAccountSession: () => null } });
  const headers = {}; const result = landing.getServerSideProps({ req: {}, res: { setHeader: (key, value) => headers[key] = value }, query: { category: 'not-a-category', thema: ['ignored', 'array'] } });
  assert.deepEqual(result.props, { signedIn: false, initialCategory: 'all', context: '', sourceContext: '' });
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
