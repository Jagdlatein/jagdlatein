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
function load(relative, overrides = {}, globals = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'window', 'setTimeout', 'clearTimeout', 'process', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, globals);
    return pr(id);
  }, mod, mod.exports, globals.fetch, globals.window, globals.setTimeout || setTimeout, globals.clearTimeout || clearTimeout, globals.process || process);
  return mod.exports;
}
const { getNextUrl, getLoginDestination } = load('lib/login-destination.js');
const unpaid = { paid: false, admin: false };
test('An unpaid learner returns to the free community with category, topic and thread context preserved', () => {
  for (const route of ['/community', '/community/?category=hundewesen&thema=R%C3%BCckruf#frage', '/community/11111111-1111-4111-8111-111111111111']) {
    assert.equal(getLoginDestination(route, unpaid), route);
  }
});
test('Personal account and statistics need identity, while learning and unknown forum paths still lead to prices', () => {
  for (const route of ['/konto', '/meine-kurse', '/auswertungen', '/quiz-app/stats', '/quiz/stats']) assert.equal(getLoginDestination(route, unpaid), route);
  for (const route of ['/lernen', '/community/admin', '/community/not-a-thread', '/kurse/hundewesen?modus=test#quiz']) {
    assert.equal(new URL(getLoginDestination(route, unpaid), 'https://test.invalid').searchParams.get('next'), route);
  }
});
test('Paid or administrator access returns directly to the selected safe learning page', () => {
  for (const account of [{ paid: true }, { admin: true }]) assert.equal(getLoginDestination('/lernen?suche=gams', account), '/lernen?suche=gams');
  assert.match(getLoginDestination('/lernen', { paid: 'true', admin: 1 }), /^\/preise\?/);
});
test('Unsafe return URLs and login loops cannot become navigation destinations', () => {
  for (const route of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/%5cevil.invalid', '/%2f%2fevil.invalid', '/login', '/registrieren', '/login/?next=/lernen', '/%6cogin', '/bad%escape', '/%0anews', '/\nnews', null]) assert.equal(getNextUrl(route), '/');
  assert.equal(getNextUrl(['/community', 'https://evil.invalid']), '/community');
  assert.equal(getLoginDestination('/lernen#quiz', unpaid, '/preise?aktion=abo#paypal'), '/preise?aktion=abo&next=%2Flernen%23quiz#paypal');
});

function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, json: async () => body });
function harness(fetch, props = {}) {
  const states = ['member@example.invalid', '123456', 'code', '', false], refs = [], effects = [], timers = new Map(), calls = [];
  let cursor = 0, refCursor = 0, sequence = 0;
  const window = { location: { href: null } };
  const Component = load('pages/login.js', { react: { ...React,
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ||= { current: initial }; },
    useEffect(fn) { if (!effects.length) effects.push(fn()); },
  }, 'next/router': { useRouter: () => ({ query: { next: '/community?category=hundewesen' } }) } }, {
    fetch: async (...args) => { calls.push(args); return fetch(...args); }, window,
    setTimeout: (fn, delay) => { timers.set(++sequence, { fn, delay }); return sequence; }, clearTimeout: id => timers.delete(id),
  }).default;
  const render = () => { cursor = 0; refCursor = 0; return Component(props); };
  return { states, calls, timers, window, render, unmount: () => effects.forEach(fn => fn?.()),
    submit: tree => find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }),
  };
}

test('Registration confirms through the free-account endpoint and preserves a free community destination', async () => {
  const h = harness(() => response({ success: true, paid: false, admin: false }), { registration: true, allowRegistration: true });
  await h.submit(h.render());
  assert.equal(h.calls[0][0], '/api/auth/register-verify');
  assert.deepEqual(JSON.parse(h.calls[0][1].body), { email: 'member@example.invalid', code: '123456' });
  const navigation = [...h.timers.values()].find(item => item.delay === 500);
  navigation.fn();
  assert.equal(h.window.location.href, '/community?category=hundewesen');
});

test('Requesting a code preserves the neutral server message without claiming the account exists or mail arrived', async () => {
  const message = 'Falls diese E-Mail registriert ist, wurde ein Login-Code versendet.';
  for (const serverMessage of [message, undefined]) {
    const h = harness(() => response({ success: true, ...(serverMessage ? { message: serverMessage } : {}) }));
    h.states[2] = 'email'; h.states[1] = '';
    await h.submit(h.render());
    assert.equal(h.calls[0][0], '/api/auth/request-code');
    assert.equal(h.states[2], 'code'); assert.equal(h.states[3], message);
    const html = renderToStaticMarkup(h.render());
    assert.match(html, /Code für/); assert.ok(!html.includes('Wir haben dir'));
    h.unmount();
  }
  const registrationMessage = 'Falls die Adresse erreichbar ist, wurde ein Bestätigungscode versendet. Bitte prüfe auch den Spamordner.';
  const h = harness(() => response({ success: true, message: registrationMessage }), { registration: true });
  h.states[2] = 'email'; h.states[1] = '';
  await h.submit(h.render());
  assert.equal(h.calls[0][0], '/api/auth/register-request'); assert.equal(h.states[3], registrationMessage);
  h.unmount();
});

test('Authentication pages expose only a private-derived mail mode, never tester addresses or transport credentials', async () => {
  for (const isolated of [false, true]) for (const mode of [undefined, 'sink', 'tester-smtp']) {
    const env = { ACCOUNT_REGISTRATION_ENABLED: 'true', JL_TEST_MAIL_MODE: mode,
      JL_TEST_MAIL_RECIPIENTS: 'private-tester@example.invalid', JL_TEST_SMTP_PASS: 'private-test-smtp-password',
      JL_TEST_SMTP_USER: 'private-sender@example.invalid', JL_TEST_SMTP_FROM: 'private-from@example.invalid',
      ...(isolated ? { JL_TEST_ENVIRONMENT: 'paypal-sandbox' } : {}) };
    const globals = { process: { env } };
    const login = await load('pages/login.js', {}, globals).getServerSideProps({ req: { cookies: {} },
      query: { isTestMail: isolated ? 'false' : 'true', testMailMode: isolated ? 'sink' : 'tester-smtp' } });
    const registration = await load('pages/registrieren.js', {}, globals).getServerSideProps({});
    const testMailMode = isolated ? mode || 'sink' : null;
    assert.deepEqual(login.props, { allowRegistration: true, isTestMail: isolated, testMailMode, allowReviewLogin: false });
    assert.deepEqual(registration.props, { registration: true, allowRegistration: true, isTestMail: isolated, testMailMode });
    const exposed = JSON.stringify([login.props, registration.props]);
    for (const key of ['JL_TEST_MAIL_RECIPIENTS', 'JL_TEST_SMTP_USER', 'JL_TEST_SMTP_PASS', 'JL_TEST_SMTP_FROM']) {
      assert.ok(!exposed.includes(key)); assert.ok(!exposed.includes(env[key]));
    }
  }
});

function reviewEntryEnvironment(changes = {}) {
  const now = Date.now();
  return { ACCOUNT_REGISTRATION_ENABLED: 'true', ACCOUNT_GENERATION_ENABLED: 'true',
    APPLE_SUBSCRIPTIONS_ENABLED: 'true', APPLE_STORE_ENVIRONMENT: 'Production',
    APPLE_REVIEW_SANDBOX_ENABLED: 'true', APPLE_REVIEW_LOGIN_ENABLED: 'true',
    APPLE_REVIEW_ACCOUNT_GENERATION: '4ccfa30c-1cde-4f60-b991-341ccddac3f1',
    APPLE_REVIEW_APP_ACCOUNT_TOKEN: 'f2ae242e-ac4d-4390-a8db-07d477ff2541',
    APPLE_REVIEW_VALID_FROM: new Date(now - 60000).toISOString(),
    APPLE_REVIEW_VALID_UNTIL: new Date(now + 86400000).toISOString(),
    APPLE_REVIEW_LOGIN_CREDENTIAL_ID: '4c7534f9-6725-4ab2-a146-0ad2e3c5452b',
    APPLE_REVIEW_LOGIN_PASSWORD_HASH: '$2b$12$' + 'a'.repeat(53),
    JL_SESSION_SECRET: 'synthetic-private-review-entry-session-secret', ...changes };
}

test('The actual ordinary sign-in page exposes a same-origin review entry only for a valid active private Production policy', async () => {
  const disabled = [
    { APPLE_REVIEW_LOGIN_ENABLED: undefined }, { APPLE_REVIEW_LOGIN_ENABLED: 'false' },
    { APPLE_REVIEW_SANDBOX_ENABLED: 'false' }, { APPLE_REVIEW_LOGIN_ENABLED: 'TRUE' },
    { APPLE_REVIEW_LOGIN_PASSWORD_HASH: 'not-a-hash' }, { APPLE_REVIEW_LOGIN_CREDENTIAL_ID: 'invalid' },
    { APPLE_REVIEW_APP_ACCOUNT_TOKEN: 'invalid' }, { APPLE_REVIEW_ACCOUNT_GENERATION: 'invalid' },
    { APPLE_REVIEW_VALID_FROM: new Date(Date.now() + 600000).toISOString() },
    { APPLE_REVIEW_VALID_UNTIL: new Date(Date.now() - 1000).toISOString() },
    { APPLE_REVIEW_VALID_UNTIL: new Date(Date.now() + 15 * 86400000).toISOString() },
    { APPLE_REVIEW_VALID_FROM: '2026-10-09T14:00:00Z' },
    { JL_SESSION_SECRET: 'short' }, { ACCOUNT_GENERATION_ENABLED: 'false' },
    { APPLE_SUBSCRIPTIONS_ENABLED: 'false' },
    { APPLE_STORE_ENVIRONMENT: 'Sandbox', JL_TEST_ENVIRONMENT: 'paypal-sandbox' },
    { JL_TEST_ENVIRONMENT: 'paypal-sandbox' },
  ];
  for (const changes of [{}, ...disabled]) {
    const env = reviewEntryEnvironment(changes);
    const page = load('pages/login.js', {}, { process: { env } });
    const headers = {};
    const result = await page.getServerSideProps({ req: { cookies: {} }, query: { allowReviewLogin: 'true' },
      res: { setHeader: (key, value) => headers[key] = value } });
    const expected = Object.keys(changes).length === 0;
    assert.equal(result.props.allowReviewLogin, expected, JSON.stringify(changes));
    assert.match(headers['Cache-Control'], /private, no-store/);
    const html = renderToStaticMarkup(React.createElement(page.default, result.props));
    assert.equal(html.includes('href="/review-login?next=%2Fkonto"'), expected);
    assert.equal(html.includes('Mit Prüfkonto anmelden'), expected);
    assert.match(html, /Login-Code senden/);
    const publicResult = JSON.stringify(result) + html;
    for (const key of ['APPLE_REVIEW_ACCOUNT_GENERATION', 'APPLE_REVIEW_APP_ACCOUNT_TOKEN',
      'APPLE_REVIEW_LOGIN_PASSWORD_HASH', 'APPLE_REVIEW_LOGIN_CREDENTIAL_ID', 'JL_SESSION_SECRET']) {
      assert.ok(!publicResult.includes(key));
      assert.ok(!publicResult.includes(env[key]));
    }
  }
});

test('Review entry preserves safe in-app destinations and never appears in registration or isolated tester forms', async () => {
  const env = reviewEntryEnvironment();
  const globals = { process: { env } };
  for (const [next, expected] of [
    ['/community?category=hundewesen#frage', '/community?category=hundewesen#frage'],
    ['/lernen?suche=gams', '/lernen?suche=gams'],
    ['//evil.invalid', '/konto'], ['/%5cevil.invalid', '/konto'],
    ['/review-login', '/konto'], ['/review-login/?next=/lernen', '/konto'], ['/%72eview-login', '/konto'],
  ]) {
    const page = load('pages/login.js', { 'next/router': { useRouter: () => ({ query: { next } }) } }, globals);
    const result = await page.getServerSideProps({ req: { cookies: {} }, query: { next } });
    const html = renderToStaticMarkup(React.createElement(page.default, result.props));
    const href = html.match(/href="(\/review-login\?[^"]+)"/)[1];
    const url = new URL(href, 'https://jagdlatein.de');
    assert.equal(url.origin, 'https://jagdlatein.de');
    assert.equal(url.searchParams.get('next'), expected);
    for (const props of [{ registration: true }, { isTestMail: true }]) {
      const hidden = renderToStaticMarkup(React.createElement(page.default, { ...result.props, ...props }));
      assert.ok(!hidden.includes('/review-login'));
    }
  }
  const registration = load('pages/registrieren.js', {}, globals);
  const result = await registration.getServerSideProps({});
  assert.ok(!Object.hasOwn(result.props, 'allowReviewLogin'));
  const html = renderToStaticMarkup(React.createElement(registration.default, result.props));
  assert.ok(!html.includes('/review-login'));
});

test('Invalid private mail modes cannot silently render a misleading sink or tester hint', async () => {
  for (const mode of ['', 'smtp', 'TESTER-SMTP']) {
    const globals = { process: { env: { ACCOUNT_REGISTRATION_ENABLED: 'true',
      JL_TEST_ENVIRONMENT: 'paypal-sandbox', JL_TEST_MAIL_MODE: mode } } };
    await assert.rejects(load('pages/login.js', {}, globals).getServerSideProps({ req: { cookies: {} }, query: {} }),
      error => error.status === 503);
    await assert.rejects(load('pages/registrieren.js', {}, globals).getServerSideProps({}), error => error.status === 503);
  }
  const publicGlobals = { process: { env: { ACCOUNT_REGISTRATION_ENABLED: 'true', JL_TEST_MAIL_MODE: 'invalid-private-mode' } } };
  const publicProps = await load('pages/login.js', {}, publicGlobals).getServerSideProps({ req: { cookies: {} }, query: {} });
  assert.equal(publicProps.props.isTestMail, false); assert.equal(publicProps.props.testMailMode, null);
});

test('Sandbox login and registration explain the isolated inbox and separate accounts; public pages omit that hint', () => {
  const Login = load('pages/login.js').default;
  for (const registration of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Login, { registration, allowRegistration: true, isTestMail: true }));
    assert.match(html, /ausschließlich im getrennten Testpostfach/);
    assert.match(html, /normales E-Mail-Postfach erhält keine Nachricht/);
    assert.match(html, /Konten der öffentlichen App werden hier nicht übernommen/);
    assert.match(html, registration ? /bestätigst du dein eigenes Testkonto/ : /wähle zuerst „Kostenlos registrieren“/);
    const publicHtml = renderToStaticMarkup(React.createElement(Login, { registration, allowRegistration: true, isTestMail: false }));
    assert.ok(!publicHtml.includes('Testpostfach')); assert.ok(!publicHtml.includes('Testumgebung:'));
  }
});

test('Opt-in tester login explains real delivery and separate accounts without promising a message to every address', () => {
  const Login = load('pages/login.js').default;
  for (const registration of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Login, {
      registration, allowRegistration: true, isTestMail: true, testMailMode: 'tester-smtp',
    }));
    assert.match(html, /Freigegebene Tester erhalten/); assert.match(html, /per E-Mail/);
    assert.match(html, /Spamordner/); assert.match(html, /Konten der öffentlichen App werden hier nicht übernommen/);
    assert.ok(!html.includes('normales E-Mail-Postfach erhält keine Nachricht'));
    assert.ok(!html.includes('ausschließlich im getrennten Testpostfach'));
    if (registration) assert.match(html, /freigegebenen E-Mail-Adresse/);
    const publicHtml = renderToStaticMarkup(React.createElement(Login, {
      registration, allowRegistration: true, isTestMail: false, testMailMode: 'tester-smtp',
    }));
    assert.ok(!publicHtml.includes('Freigegebene Tester')); assert.ok(!publicHtml.includes('Testumgebung:'));
  }
});
test('Duplicate code confirmation and changing email stay blocked through the successful navigation', async () => {
  const pending = deferred(), h = harness(() => pending.promise), tree = h.render();
  const first = h.submit(tree); await h.submit(tree); assert.equal(h.calls.length, 1);
  pending.resolve(response({ success: true, paid: false, admin: false })); await first;
  const updated = h.render(); assert.equal(find(updated, node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(find(updated, node => node.type === 'button' && node.props.type === 'button').props.disabled, true);
  const navigation = [...h.timers.values()].find(timer => timer.delay === 500); assert.ok(navigation); navigation.fn();
  assert.equal(h.window.location.href, '/community?category=hundewesen'); h.unmount();
});
test('A failed code can be corrected and submitted again without leaving the learner stuck', async () => {
  const h = harness(() => Promise.resolve(response({ success: false, message: 'Code abgelaufen' }, 400)));
  await h.submit(h.render()); assert.equal(h.states[4], false); assert.equal(h.states[3], 'Code abgelaufen');
  await h.submit(h.render()); assert.equal(h.calls.length, 2); assert.equal(h.window.location.href, null); h.unmount();
});
test('Leaving the login page cancels the request and ignores a late successful response', async () => {
  const pending = deferred(), h = harness(() => pending.promise); const action = h.submit(h.render());
  h.unmount(); assert.equal(h.calls[0][1].signal.aborted, true);
  pending.resolve(response({ success: true, paid: true })); await action;
  assert.equal(h.window.location.href, null); assert.equal(h.states[3], ''); assert.equal(h.timers.size, 0);
});
test('A stalled authentication request times out and offers another attempt', async () => {
  const h = harness((url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })));
  const action = h.submit(h.render()); [...h.timers.values()].find(timer => timer.delay === 18000).fn(); await action;
  assert.equal(h.states[4], false); assert.match(h.states[3], /erneut versuchen/); assert.equal(h.timers.size, 0); h.unmount();
});
test('Login and personal pages use the shared design, explicit field labels and private metadata', () => {
  const Login = load('pages/login.js').default;
  const html = renderToStaticMarkup(React.createElement(Login));
  assert.match(html, /class="header"/); assert.match(html, /<label>E-Mail-Adresse/); assert.match(html, /noindex, nofollow/);
  const headers = {}; load('pages/login.js').getServerSideProps({ req: { cookies: {} }, res: { setHeader: (key, value) => headers[key] = value }, query: {} });
  assert.match(headers['Cache-Control'], /private, no-store/);
  const AccountLayout = load('components/AccountLayout.js').default;
  const account = renderToStaticMarkup(React.createElement(AccountLayout, { title: 'Mein Konto', description: 'Dein Lernfortschritt', active: 'account' }));
  assert.equal((account.match(/<h1>/g) || []).length, 1); assert.match(account, /aria-label="Kontomenü"/); assert.match(account, /aria-current="page"/); assert.match(account, /class="header"/);
});
