const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const LIVE = 'https://www.paypal.com/myaccount/autopay/';
const SANDBOX = 'https://www.sandbox.paypal.com/myaccount/autopay/';

function load(relative, overrides, context) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' } });
  const mod = { exports: {} };
  const requireLocal = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)), overrides, context);
    return pr(id);
  };
  vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, mod, mod.exports);
  return mod.exports;
}

function accountRoute(env = {}, options = {}) {
  const state = { databaseCalls: 0, subscriptionCalls: 0 };
  const unavailable = () => Object.assign(new Error('Unavailable'), { status: 503 });
  const renewed = () => Object.assign(new Error('Renew session'), { status: 401 });
  const progress = {
    requireAccountSession() { if (options.unsigned) throw renewed(); return { email: 'buyer@example.invalid' }; },
    getAccountDatabase() {
      state.databaseCalls++;
      return { from(table) {
        assert.equal(table, 'userprofile');
        return { select() { return this; }, ilike(column, email) {
          assert.equal(column, 'email'); assert.equal(email, 'buyer@example.invalid'); return this;
        }, async maybeSingle() { return { data: options.missingProfile ? null : {
          email: 'buyer@example.invalid', is_premium: false, is_admin: false,
        }, error: null }; } };
      } };
    },
    accountJson: data => Response.json(data),
    accountErrorResponse: error => Response.json({ error: 'Account unavailable' }, { status: error.status || 503 }),
    accountUnavailable: unavailable, sessionRenewalRequired: renewed,
  };
  const context = vm.createContext({ process: { env }, Response });
  const route = load('app/api/account/route.js', {
    '../../../lib/course-progress-server': progress,
    '../../../lib/subscription-access': { async resolveSubscriptionAccess() {
      state.subscriptionCalls++; return { paid: true, paidUntil: null, accessType: 'trial', status: 'ACTIVE' };
    } },
  }, context);
  return { state, run: () => route.GET({}) };
}

function renderAccount(paypalManagementUrl, overrides = {}, overview = {}) {
  const account = { email: 'buyer@example.invalid', paid: true, admin: false,
    accessType: 'trial', subscriptionStatus: 'ACTIVE', paypalManagementUrl, ...overrides };
  const context = vm.createContext({ Date });
  const Page = load('pages/konto.js', {
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    '../components/AccountLayout': { __esModule: true, default: ({ children }) => React.createElement(React.Fragment, null, children),
      AccountError: () => null, ProgressError: () => null },
    '../hooks/useAccountOverview': () => ({ account, progress: overview.progress || [], accountError: null, progressError: overview.progressError || null,
      loading: false, progressLoading: overview.progressLoading || false, reload() {} }),
    '../lib/account-page': { getAccountPageProps() {} },
    '../lib/course-catalog': { courses: overview.courses || [] },
    '../styles/Account.module.css': { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) },
  }, context).default;
  return renderToStaticMarkup(React.createElement(Page, { courses: overview.courses || [] }));
}

test('Account API chooses the Sandbox administration target only from private test mode', async () => {
  for (const [env, expected] of [[{}, LIVE], [{ JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, SANDBOX],
    [{ NEXT_PUBLIC_TEST_ENVIRONMENT: 'paypal-sandbox', NEXT_PUBLIC_PAYMENT_URL: SANDBOX }, LIVE]]) {
    const ctx = accountRoute(env); const response = await ctx.run();
    assert.equal(response.status, 200); const data = await response.json();
    assert.equal(data.account.paypalManagementUrl, expected);
    assert.equal(data.account.email, 'buyer@example.invalid'); assert.equal(data.account.accessType, 'trial');
    assert.equal(ctx.state.subscriptionCalls, 1);
  }
});

test('Unknown private mode fails closed and ordinary account access checks remain required', async () => {
  const unknown = accountRoute({ JL_TEST_ENVIRONMENT: 'unexpected' });
  assert.equal((await unknown.run()).status, 503); assert.equal(unknown.state.databaseCalls, 0);
  for (const options of [{ unsigned: true }, { missingProfile: true }]) {
    const ctx = accountRoute({ JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, options);
    const response = await ctx.run(); assert.equal(response.status, 401);
    assert.equal(ctx.state.subscriptionCalls, 0); assert.equal((await response.json()).account, undefined);
  }
});

test('Account page renders either exact server target without redirecting Sandbox learners to live PayPal', () => {
  for (const url of [LIVE, SANDBOX]) {
    const html = renderAccount(url);
    assert.ok(html.includes(`href="${url}"`)); assert.match(html, /Abo bei PayPal verwalten/);
    assert.ok(!html.includes(`href="${url === LIVE ? SANDBOX : LIVE}"`));
  }
});

test('Missing or untrusted account target never creates a live fallback administration link', () => {
  for (const url of [undefined, null, '', 'javascript:alert(1)', '//www.paypal.com/myaccount/autopay/',
    'https://www.paypal.com/myaccount/autopay/?next=unsafe', 'https://www.sandbox.paypal.com.evil.invalid/myaccount/autopay/']) {
    assert.doesNotMatch(renderAccount(url), /Abo bei PayPal verwalten/);
  }
  assert.doesNotMatch(renderAccount(SANDBOX, { admin: true }), /Abo bei PayPal verwalten/);
});

test('An unpaid signed-in learner gets one direct checkout action before personal account details', () => {
  const html = renderAccount(LIVE, { paid: false, admin: false, accessType: null, subscriptionStatus: null });
  const checkout = html.match(/<section[^>]*aria-labelledby="account-checkout"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(checkout, 'The signed-in account must offer the next payment step.');
  assert.match(checkout, /Dein Konto ist bereit/);
  assert.match(checkout, /buyer@example\.invalid/);
  assert.match(checkout, /<a href="\/preise" class="button">Abo auswählen und bestätigen<\/a>/);
  assert.equal((html.match(/href="\/preise"/g) || []).length, 1);
  assert.ok(html.indexOf('aria-labelledby="account-checkout"') < html.indexOf('aria-labelledby="account-details"'));
  assert.doesNotMatch(checkout, /href="\/(?:login|registrieren)(?:\?|"|\/)/);
  assert.match(checkout, /Apple-Aboübersicht/);
  assert.match(checkout, /Website und unter Android der PayPal-Abschluss/);
});

test('Paid learners and administrators never receive the account purchase action', () => {
  for (const overrides of [
    { paid: true, admin: false, accessType: 'paid' },
    { paid: true, admin: false, accessType: 'trial' },
    { paid: false, admin: true },
    { paid: true, admin: true },
  ]) {
    const html = renderAccount(LIVE, overrides);
    assert.doesNotMatch(html, /account-checkout|Dein Konto ist bereit|Abo auswählen und bestätigen|href="\/preise"/);
    assert.match(html, /Kontodaten/);
    assert.match(html, /Zur Kursübersicht/);
  }
});

test('Continue learning selects only the latest begun known course and ignores completed or untrusted destinations', () => {
  const overview={courses:[{id:'older',title:'Älterer Kurs',href:'/kurse/older'},{id:'recent',title:'Aktueller Kurs',href:'/kurse/recent'}],
    progress:[{course_id:'older',status:'in_progress',updated_at:'2026-10-10T10:00:00Z'},
      {course_id:'recent',status:'in_progress',updated_at:'2026-10-11T10:00:00Z'},
      {course_id:'unknown',status:'in_progress',updated_at:'2026-10-12T10:00:00Z',href:'https://untrusted.invalid'},
      {course_id:'older',status:'completed',updated_at:'2026-10-12T11:00:00Z'}]};
  const html=renderAccount(LIVE,{accessType:'paid'},overview);
  assert.match(html,/<a href="\/kurse\/recent" class="button">Kurs weiterlernen<\/a>/);
  assert.match(html,/Dein zuletzt begonnener Kurs: <strong>Aktueller Kurs/);
  assert.doesNotMatch(html,/untrusted\.invalid|href="\/kurse\/older"/);
  for(const blocked of [{paid:false,admin:false}]) assert.doesNotMatch(renderAccount(LIVE,blocked,overview),/Kurs weiterlernen/);
  for(const unavailable of [{progressLoading:true},{progressError:{status:503}}])
    assert.doesNotMatch(renderAccount(LIVE,{accessType:'paid'},{...overview,...unavailable}),/Kurs weiterlernen/);
});

test('Existing PayPal trials retain their agreed conditions without being relabeled at the new offer price', () => {
  const html = renderAccount(LIVE, { accessProvider: 'paypal',
    trialUntil: new Date(Date.now() + 86400000).toISOString() });
  assert.match(html, /beim Abschluss in PayPal bestätigten Bedingungen/);
  assert.match(html, /Abo bei PayPal verwalten/);
  assert.doesNotMatch(html, /(?:5|10) € pro Monat/);
});

test('Apple trial and cancellation show Apple management and never claim the PayPal trial price', () => {
  const appleManagementUrl = 'https://apps.apple.com/account/subscriptions/';
  for (const subscriptionStatus of ['ACTIVE', 'CANCELLED']) {
    const html = renderAccount(LIVE, { accessProvider: 'apple', appleManagementUrl, subscriptionStatus,
      trialUntil: new Date(Date.now() + 86400000).toISOString() });
    assert.match(html, /Apple-Abo/);
    assert.match(html, /Abo bei Apple verwalten/);
    assert.ok(html.includes(`href="${appleManagementUrl}"`));
    assert.doesNotMatch(html, /Abo bei PayPal verwalten|(?:5|10) € pro Monat|Testzugang beendet/);
  }
});

test('An unpaid approved or paused PayPal subscription leads to its existing checkout instead of a fresh offer', () => {
  for(const subscriptionStatus of ['APPROVED','ACTIVE','SUSPENDED']) {
    const html=renderAccount(LIVE,{paid:false,accessType:'none',accessProvider:'none',subscriptionStatus});
    const checkout=html.match(/<section[^>]*aria-labelledby="account-checkout"[^>]*>([\s\S]*?)<\/section>/)[1];
    assert.match(checkout,/Vorhandenes Abo prüfen/);
    assert.match(checkout,/Ein weiterer Kauf ist dafür nicht nötig/);
    assert.doesNotMatch(checkout,/Abo auswählen und bestätigen/);
    assert.match(html,/Abo bei PayPal verwalten/);
  }
  const apple=renderAccount(LIVE,{paid:false,accessType:'none',accessProvider:'apple',subscriptionStatus:'ACTIVE'});
  assert.match(apple,/Abo auswählen und bestätigen/);
  assert.doesNotMatch(apple,/Vorhandenes Abo prüfen/);
});

test('Account access can be refreshed in place and privacy guidance covers both billing providers', () => {
  const html=renderAccount(LIVE,{accessProvider:'apple'});
  assert.match(html,/<button type="button" class="secondaryButton">Zugang und Abo aktualisieren<\/button>/);
  assert.match(html,/Apple- oder PayPal-Abo nicht automatisch/);
});

test('A bounded courtesy grant clearly ends without a subscription or automatic payment', () => {
  const html = renderAccount(LIVE, { paid: true, accessType: 'courtesy', accessProvider: 'manual_grant',
    subscriptionStatus: null, trialUntil: null, paidUntil: '2026-10-31T23:00:00.000Z' });
  assert.match(html, /Befristeter Lernzugang aktiv/);
  assert.match(html, /Zugang und Laufzeit ansehen/);
  assert.match(html, /Automatisches Ende/);
  assert.match(html, /01\.11\.2026/);
  assert.match(html, /00:00/);
  assert.match(html, /kein Abo angelegt und keine Zahlung ausgelöst/);
  assert.match(html, /selbst ein neues Abo abschließen/);
  assert.doesNotMatch(html, /Abo bei PayPal verwalten|Abo bei Apple verwalten|Testzugang aktiv|account-checkout|href="\/preise"/);
});

test('Old payment return links verify account access instead of asserting a completed payment', () => {
  const context=vm.createContext({URL});
  const page=load('pages/success.js',{},context);
  const headers={};
  for(const [next,expected] of [['/lernen?thema=gams#quiz','/preise?next=%2Flernen%3Fthema%3Dgams%23quiz'],
    ['/success','/preise'],['/preise?next=/success','/preise'],['//foreign.invalid','/preise'],[undefined,'/preise']]) {
    const result=page.getServerSideProps({res:{setHeader:(name,value)=>headers[name]=value},query:{next}});
    assert.equal(result.redirect.destination,expected); assert.equal(result.redirect.permanent,false);
  }
  assert.match(headers['Cache-Control'],/private, no-store/);
  assert.equal(page.default(),null);
});
