const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const BUYER = 'sandbox-buyer@personal.example.com';

function fixture(overrides = {}) {
  const env = {
    JL_TEST_ENVIRONMENT: 'paypal-sandbox', PAYPAL_API_BASE: SANDBOX_API,
    SMTP_HOST: 'smtp.ethereal.email', SMTP_PORT: '587',
    SMTP_USER: 'isolated-sink@ethereal.email', SMTP_PASS: 'isolated-fake-sink-password',
    MAIL_FROM: 'must-not-be-used@example.invalid',
    PAYPAL_CLIENT_ID: 'isolated-fake-client', PAYPAL_SECRET: 'isolated-fake-paypal-secret',
    ADMIN_PASS: 'isolated-fake-admin', FIREBASE_SERVICE_ACCOUNT_BASE64: 'must-not-be-read',
    SUPABASE_URL: 'https://test-database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'isolated-fake-db-key',
    JL_SESSION_SECRET: 'isolated-sandbox-session-secret-with-32-characters', ...overrides,
  };
  const calls = []; const cache = new Map(); let codeReservation = null;
  const database = {
    from(table) {
      calls.push({ type: 'table', table }); let candidate;
      const query = {
        select() { return query; }, eq() { return query; }, ilike() { return query; },
        insert(row) { candidate = row; codeReservation = row; return query; },
        upsert(row) { calls.push({ type: 'push-write', row }); return query; },
        async maybeSingle() {
          return { data: table === 'userprofile' ? { email: BUYER } : candidate ? { email: candidate.email } : null, error: null };
        },
        then(resolve) { resolve({ data: table === 'push_tokens' ? [{ token: 'isolated-fake-token' }] : [], error: null }); },
      };
      return query;
    },
  };
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' },
    });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', 'process', 'fetch', 'console', code)(id => {
      if (id === 'nodemailer') return { createTransport(options) {
        calls.push({ type: 'mail-transport', options });
        return { async sendMail(message) { calls.push({ type: 'mail-message', message }); return { messageId: 'isolated-fake-id' }; } };
      } };
      if (id === '@supabase/supabase-js') return { createClient() { calls.push({ type: 'database-client' }); return database; } };
      if (id === 'firebase-admin/app') return {
        getApps() { calls.push({ type: 'firebase-apps' }); return [{}]; },
        cert() { calls.push({ type: 'firebase-cert' }); throw new Error('FCM must not be initialized in sandbox'); },
        initializeApp() { calls.push({ type: 'firebase-initialize' }); throw new Error('FCM must not be initialized in sandbox'); },
      };
      if (id === 'firebase-admin/messaging') return { getMessaging() {
        calls.push({ type: 'firebase-messaging' });
        return { async sendEachForMulticast(message) {
          calls.push({ type: 'firebase-send', message });
          return { successCount: message.tokens.length, failureCount: 0, responses: message.tokens.map(() => ({ success: true })) };
        } };
      } };
      if (id === 'crypto') return { ...pr(id), randomInt: () => 12345 };
      if (id.startsWith('.')) {
        const file = path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`);
        if (file === path.join(root, 'lib', 'account-access.js')) return { readRequestAccountSession() {
          calls.push({ type: 'read-session' }); return { email: BUYER };
        } };
        return file.endsWith('.js') ? load(path.relative(root, file)) : pr(file);
      }
      return pr(id);
    }, mod, mod.exports, { env }, async (url, options) => {
      calls.push({ type: 'fetch', url, options });
      return Response.json(url.endsWith('/v1/oauth2/token') ? { access_token: 'isolated-fake-token' } : { id: 'isolated-resource' });
    }, { error: (...args) => calls.push({ type: 'error-log', args }) });
    return mod.exports;
  }
  return { env, calls, load, reservation: () => codeReservation };
}

test('Sandbox login codes use only the Ethereal transport and require verified STARTTLS', async () => {
  const ctx = fixture(); await ctx.load('lib/email.js').sendLoginCode(BUYER, '012345');
  const options = ctx.calls.find(call => call.type === 'mail-transport').options;
  assert.equal(options.host, 'smtp.ethereal.email'); assert.equal(options.port, 587);
  assert.equal(options.secure, false); assert.equal(options.requireTLS, true);
  assert.deepEqual(options.tls, { servername: 'smtp.ethereal.email', rejectUnauthorized: true });
  assert.deepEqual(options.auth, { user: ctx.env.SMTP_USER, pass: ctx.env.SMTP_PASS });
  const message = ctx.calls.find(call => call.type === 'mail-message').message;
  assert.equal(message.from, ctx.env.SMTP_USER); assert.equal(message.to, BUYER);
  assert.match(message.html, /012345/); assert.match(message.html, /10 Minuten/);
});

const invalidMailSettings = {
  'real SMTP host': { SMTP_HOST: 'mail.hostpoint.ch' },
  'missing SMTP host': { SMTP_HOST: undefined },
  'missing SMTP port': { SMTP_PORT: undefined },
  'wrong SMTP port': { SMTP_PORT: '465' },
  'missing SMTP user': { SMTP_USER: undefined },
  'live SMTP user': { SMTP_USER: 'production@example.invalid' },
  'missing SMTP password': { SMTP_PASS: undefined },
  'blank SMTP password': { SMTP_PASS: ' ' },
  'missing PayPal API': { PAYPAL_API_BASE: undefined },
  'live PayPal API': { PAYPAL_API_BASE: 'https://api-m.paypal.com' },
  'mistyped isolation mode': { JL_TEST_ENVIRONMENT: 'paypal-sandbxo' },
};
for (const [name, values] of Object.entries(invalidMailSettings)) test(`Sandbox rejects ${name} before constructing or sending mail`, async () => {
  const ctx = fixture(values);
  await assert.rejects(ctx.load('lib/email.js').sendLoginCode(BUYER, '012345'), error => error.status === 503);
  assert.equal(ctx.calls.length, 0);
});

test('Mail isolation is revalidated when sending rather than captured at module import', async () => {
  const ctx = fixture(); const mail = ctx.load('lib/email.js');
  ctx.env.SMTP_HOST = 'mail.hostpoint.ch';
  await assert.rejects(mail.sendLoginCode(BUYER, '012345'), error => error.status === 503);
  assert.equal(ctx.calls.length, 0);
});

test('Unset test mode preserves existing live SMTP settings and login content', async () => {
  const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, PAYPAL_API_BASE: undefined,
    SMTP_HOST: 'production-smtp.example.invalid', SMTP_PORT: '2525',
    SMTP_USER: 'live-user', SMTP_PASS: 'fake-live-password', MAIL_FROM: 'configured@example.invalid' });
  await ctx.load('lib/email.js').sendLoginCode(BUYER, '012345');
  assert.deepEqual(ctx.calls[0].options, { host: 'production-smtp.example.invalid', port: 2525, secure: false,
    auth: { user: 'live-user', pass: 'fake-live-password' } });
  assert.equal(ctx.calls[1].message.from, 'configured@example.invalid');
});

test('Unset test mode preserves the existing SMTP and sender defaults', async () => {
  const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, SMTP_HOST: undefined, SMTP_PORT: undefined,
    SMTP_USER: undefined, SMTP_PASS: undefined, MAIL_FROM: undefined });
  await ctx.load('lib/email.js').sendLoginCode(BUYER, '012345');
  assert.equal(ctx.calls[0].options.host, 'mail.hostpoint.ch'); assert.equal(ctx.calls[0].options.port, 587);
  assert.equal(ctx.calls[1].message.from, 'info@jagdlatein.de');
});

test('The real request-code route stores a hash while the sink receives the six-digit code', async () => {
  const ctx = fixture(); const response = await ctx.load('app/api/auth/request-code/route.js').POST(
    new Request('https://jagdlatein-test.vercel.app/api/auth/request-code', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: BUYER }),
    })
  );
  assert.equal(response.status, 200);
  const responseText = JSON.stringify(await response.json()); assert.ok(!responseText.includes('012345'));
  const saved = ctx.reservation(); assert.equal(saved.email, BUYER); assert.notEqual(saved.code_hash, '012345');
  assert.equal(await pr('bcryptjs').compare('012345', saved.code_hash), true);
  assert.match(ctx.calls.find(call => call.type === 'mail-message').message.html, /012345/);
  assert.ok(!ctx.calls.some(call => call.type === 'fetch'));
});

for (const route of ['register', 'send']) {
  test(`Sandbox push/${route} rejects before parsing, sessions, database or Firebase, even with live-shaped credentials`, async () => {
    const ctx = fixture();
    const response = await ctx.load(`app/api/push/${route}/route.js`).POST({
      headers: new Headers({ authorization: `Bearer ${ctx.env.ADMIN_PASS}` }),
      async json() { throw new Error('Request body must not be inspected in isolated test mode'); },
    });
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(ctx.calls, []); assert.match((await response.json()).error, /deaktiviert/);
  });

  test(`Unset test mode preserves the existing authorized push/${route} behavior`, async () => {
    const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined });
    const response = await ctx.load(`app/api/push/${route}/route.js`).POST(new Request(
      `https://jagdlatein-test.vercel.app/api/push/${route}`, {
        method: 'POST', headers: { authorization: `Bearer ${ctx.env.ADMIN_PASS}`, 'content-type': 'application/json' },
        body: JSON.stringify(route === 'register' ? { token: 'isolated-fake-token' } : { title: 'Test', body: 'Test body' }),
      }
    ));
    assert.equal(response.status, 200); assert.ok(ctx.calls.some(call => call.type === 'database-client'));
    assert.equal(ctx.calls.filter(call => call.type === 'firebase-send').length, route === 'send' ? 1 : 0);
  });
}

test('Sandbox PayPal requests reject every live/default API before credentials leave the process', async () => {
  for (const api of [undefined, 'https://api-m.paypal.com', 'https://api.paypal.com']) {
    const ctx = fixture({ PAYPAL_API_BASE: api });
    await assert.rejects(ctx.load('app/api/paypal/webhook/_base.js').paypalRequest('/v1/billing/plans/P-TEST'),
      error => error.status === 503);
    assert.deepEqual(ctx.calls, []);
  }
});

test('Sandbox PayPal requests remain usable and use the sandbox for token and resource', async () => {
  const ctx = fixture(); const result = await ctx.load('app/api/paypal/webhook/_base.js').paypalRequest('/v1/billing/plans/P-TEST');
  assert.equal(result.id, 'isolated-resource'); assert.equal(ctx.calls.length, 2);
  assert.ok(ctx.calls.every(call => new URL(call.url).origin === SANDBOX_API));
});

test('Unset test mode preserves the existing default live PayPal base', () => {
  const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, PAYPAL_API_BASE: undefined });
  assert.deepEqual(ctx.load('app/api/paypal/webhook/_base.js').paypalBase(), { base: 'https://api-m.paypal.com' });
  assert.deepEqual(ctx.calls, []);
});
