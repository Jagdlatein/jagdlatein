// Real bcrypt + isolated PostgreSQL tests, with synthetic mail delivery only.
// No remote database, real email, private credential or payment is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const bcrypt = pr('bcryptjs');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '',
  'Jagdlatein', 'paypal-sandbox', 'test-runtime', 'node_modules', '@electric-sql', 'pglite');
if (!fs.existsSync(runtime)) throw new Error('Missing isolated SQL test runtime. Set JL_PAYPAL_TEST_PGLITE_PATH.');
const { PGlite } = require(runtime);
const EMAIL = 'new-learner@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';
const migration = () => fs.readFileSync(path.join(root, 'supabase/migrations/20261007105000_account_registration.sql'), 'utf8');
let pg;

function api(options = {}) {
  const mail = [];
  const database = { calls: 0, rpcCalls: 0,
    async rpc(name, parameters) {
      this.rpcCalls++;
      const calls = {
        reserve_account_registration_code: ['SELECT public.reserve_account_registration_code($1,$2) AS data', [parameters.p_email, parameters.p_code_hash]],
        begin_account_registration_attempt: ['SELECT public.begin_account_registration_attempt($1) AS data', [parameters.p_email]],
        consume_account_registration_code: ['SELECT public.consume_account_registration_code($1,$2::uuid,$3) AS data', [parameters.p_email, parameters.p_registration_id, parameters.p_code_hash]],
      };
      assert.ok(calls[name], 'Only the reviewed private registration RPCs may run.');
      try { return { data: (await pg.query(...calls[name])).rows[0].data, error: null }; }
      catch (error) { return { data: null, error }; }
    },
  };
  const env = { ACCOUNT_REGISTRATION_ENABLED: options.disabled ? 'false' : 'true', NODE_ENV: 'production',
    JL_SESSION_SECRET: options.noSession ? '' : 'synthetic-registration-session-secret-more-than-32-bytes',
    SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-a-key',
    ACCOUNT_DELETION_ENABLED: options.generation ? 'true' : 'false', ...options.env };
  const cache = new Map();
  const context = vm.createContext({ process: { env }, Buffer, Date, URL, TextDecoder, Uint8Array, Response, console });
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const req = id => {
      if (id === '@supabase/supabase-js') return { createClient() { database.calls++; return database; } };
      if (id === './email') return { async sendLoginCode(email, code) { mail.push({ email, code }); } };
      if (id === './subscription-access') return { async resolveSubscriptionAccess(db, email, settings) {
        assert.equal(db, database); assert.equal(email, EMAIL);
        return { paid: settings.legacyPaid, paidUntil: null, accessType: settings.legacyPaid ? 'paid' : 'none' };
      } };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
    return mod.exports;
  }
  const requestRoute = load('app/api/auth/register-request/route.js');
  const verifyRoute = load('app/api/auth/register-verify/route.js');
  function request(verifying = false, overrides = {}) {
    const headers = { origin: 'https://app.example.invalid', 'content-type': 'application/json', ...overrides.headers };
    for (const [key, value] of Object.entries(headers)) if (value === null) delete headers[key];
    const body = Object.hasOwn(overrides, 'body') ? overrides.body : { email: EMAIL, ...(verifying ? { code: mail.at(-1)?.code || '000000' } : {}) };
    return new Request(`https://app.example.invalid/api/auth/register-${verifying ? 'verify' : 'request'}`, {
      method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }
  return { database, mail, requestRoute, verifyRoute, request, load, env };
}

test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec(migration());
});
test.after(async () => { await pg?.close(); });
async function clear() { await pg.exec('TRUNCATE public.account_registration_codes,public.userprofile CASCADE;'); }
async function requestCode(ctx) {
  assert.equal((await ctx.requestRoute.POST(ctx.request())).status, 200);
  assert.equal(ctx.mail.length, 1);
  return ctx.mail[0].code;
}

const REGISTRATION_REQUEST_MESSAGE = 'Falls die Adresse erreichbar ist, wurde ein Bestätigungscode versendet. Bitte prüfe auch den Spamordner.';
function testerEnv(overrides = {}) {
  return { JL_TEST_ENVIRONMENT: 'paypal-sandbox', PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com',
    JL_TEST_MAIL_MODE: 'tester-smtp', JL_TEST_SMTP_HOST: 'asmtp.mail.hostpoint.ch', JL_TEST_SMTP_PORT: '465',
    JL_TEST_SMTP_USER: 'test-sender@example.invalid', JL_TEST_SMTP_PASS: 'synthetic-test-smtp-password',
    JL_TEST_SMTP_FROM: 'info@example.invalid', JL_TEST_MAIL_RECIPIENTS: EMAIL, ...overrides };
}

test('Feature-disabled or missing-session deployments do not access the database or send email', async () => {
  for (const options of [{ disabled: true }, { noSession: true }]) {
    const ctx = api(options);
    assert.equal((await ctx.requestRoute.POST(ctx.request())).status, 503);
    assert.equal((await ctx.verifyRoute.POST(ctx.request(true))).status, 503);
    assert.equal(ctx.database.calls, 0); assert.equal(ctx.mail.length, 0);
  }
  assert.deepEqual(await (await api({ disabled: true }).requestRoute.GET()).json(), { enabled: false });
});

test('Cross-origin, non-JSON, extra fields and oversized bodies fail before a reservation', async () => {
  for (const headers of [{ origin: null }, { origin: 'null' }, { origin: 'https://evil.example.invalid' },
    { origin: 'https://app.example.invalid/path' }, { origin: 'https://name@app.example.invalid' }, { 'sec-fetch-site': 'cross-site' }]) {
    const ctx = api(); assert.equal((await ctx.requestRoute.POST(ctx.request(false, { headers }))).status, 403);
    assert.equal(ctx.database.rpcCalls, 0); assert.equal(ctx.mail.length, 0);
  }
  for (const body of [{ email: EMAIL, paid: true }, { email: 'bad\n@example.invalid' }, [], null, '{']) {
    const ctx = api(); assert.equal((await ctx.requestRoute.POST(ctx.request(false, { body }))).status, 400);
    assert.equal(ctx.database.rpcCalls, 0);
  }
  assert.equal((await api().requestRoute.POST(api().request(false, { body: 'x'.repeat(2049) }))).status, 413);
  const ctx = api(); assert.equal((await ctx.requestRoute.POST(ctx.request(false, { headers: { 'content-type': 'text/plain' } }))).status, 415);
});

test('Nonapproved tester registration stays neutral and creates no database client, code or profile', async () => {
  await clear();
  const ctx = api({ env: testerEnv({ JL_TEST_MAIL_RECIPIENTS: 'approved-other@example.invalid' }) });
  const response = await ctx.requestRoute.POST(ctx.request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, message: REGISTRATION_REQUEST_MESSAGE });
  assert.equal(ctx.database.calls, 0); assert.equal(ctx.database.rpcCalls, 0); assert.equal(ctx.mail.length, 0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.account_registration_codes')).rows[0].count, 0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 0);
});

test('Registration helper also rejects unlisted recipients before an RPC even when called directly', async () => {
  const ctx = api({ env: testerEnv({ JL_TEST_MAIL_RECIPIENTS: 'approved-other@example.invalid' }) });
  const result = await ctx.load('lib/account-registration.js').requestAccountRegistration(ctx.database, EMAIL);
  assert.deepEqual({ ...result }, { success: true, message: REGISTRATION_REQUEST_MESSAGE });
  assert.equal(ctx.database.rpcCalls, 0); assert.equal(ctx.mail.length, 0);
});

test('Approved tester registration normalizes the exact address and preserves the ordinary hash and rate limit', async () => {
  await clear();
  const ctx = api({ env: testerEnv({ JL_TEST_MAIL_RECIPIENTS: `other@example.invalid, ${EMAIL.toUpperCase()} ` }) });
  const response = await ctx.requestRoute.POST(ctx.request(false, { body: { email: ` ${EMAIL.toUpperCase()} ` } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, message: REGISTRATION_REQUEST_MESSAGE });
  assert.equal(ctx.mail.length, 1); assert.equal(ctx.mail[0].email, EMAIL);
  const row = (await pg.query('SELECT email,code_hash FROM public.account_registration_codes WHERE email=$1', [EMAIL])).rows[0];
  assert.equal(row.email, EMAIL); assert.notEqual(row.code_hash, ctx.mail[0].code);
  assert.equal(await bcrypt.compare(ctx.mail[0].code, row.code_hash), true);
  await ctx.requestRoute.POST(ctx.request()); assert.equal(ctx.mail.length, 1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 0);
});

test('Invalid tester delivery settings cannot reserve registration codes or silently use production credentials', async () => {
  for (const values of [{ JL_TEST_MAIL_RECIPIENTS: undefined }, { JL_TEST_SMTP_PASS: undefined },
    { JL_TEST_SMTP_FROM: undefined, MAIL_FROM: 'info@example.invalid' },
    { JL_TEST_SMTP_HOST: undefined, SMTP_HOST: 'asmtp.mail.hostpoint.ch' },
    { PAYPAL_API_BASE: 'https://api-m.paypal.com' }, { JL_TEST_MAIL_MODE: 'smtp' }]) {
    const ctx = api({ env: testerEnv(values) });
    const response = await ctx.requestRoute.POST(ctx.request());
    assert.equal(response.status, 503); assert.equal(ctx.database.calls, 0);
    assert.equal(ctx.database.rpcCalls, 0); assert.equal(ctx.mail.length, 0);
    assert.deepEqual(await response.json(), { success: false, code: 'REGISTRATION_UNAVAILABLE',
      message: 'Die Registrierung ist derzeit nicht verfügbar. Bitte später erneut versuchen.' });
  }
});

test('Registration allowlist is checked again after the route and helper have loaded', async () => {
  const ctx = api({ env: testerEnv() });
  ctx.env.JL_TEST_MAIL_RECIPIENTS = 'another@example.invalid';
  assert.deepEqual(await (await ctx.requestRoute.POST(ctx.request())).json(), { success: true, message: REGISTRATION_REQUEST_MESSAGE });
  assert.equal(ctx.database.calls, 0); assert.equal(ctx.database.rpcCalls, 0); assert.equal(ctx.mail.length, 0);
});

test('Code requests store a real bcrypt hash, create no profile, and reserve only one mail in the rate window', async () => {
  await clear(); const ctx = api(); const code = await requestCode(ctx);
  const rows = (await pg.query('SELECT * FROM public.account_registration_codes WHERE email=$1', [EMAIL])).rows;
  assert.equal(rows.length, 1); assert.notEqual(rows[0].code_hash, code);
  assert.equal(await bcrypt.compare(code, rows[0].code_hash), true);
  assert.equal(rows[0].attempts, 0);
  assert.equal(new Date(rows[0].expires_at) - new Date(rows[0].requested_at), 10 * 60_000);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 0);
  const before = await (await ctx.requestRoute.POST(ctx.request())).json();
  const concurrent = await Promise.all(Array.from({ length: 3 }, () => ctx.requestRoute.POST(ctx.request())));
  for (const response of concurrent) assert.deepEqual(await response.json(), before);
  assert.equal(ctx.mail.length, 1);
});

test('Verified email atomically creates only a free profile, consumes the code, and signs an actual fresh login', async () => {
  await clear(); const ctx = api(); await requestCode(ctx);
  const started = Math.floor(Date.now() / 1000);
  const response = await ctx.verifyRoute.POST(ctx.request(true));
  assert.equal(response.status, 200); const result = await response.json();
  assert.equal(result.success, true); assert.equal(result.paid, false); assert.equal(result.admin, false);
  const profile = (await pg.query('SELECT * FROM public.userprofile WHERE email=$1', [EMAIL])).rows[0];
  assert.match(profile.user_id, /^[0-9a-f-]{36}$/); assert.equal(profile.is_premium, false); assert.equal(profile.is_admin, false);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.account_registration_codes')).rows[0].count, 0);
  const token = response.cookies.get('jl_account_session').value;
  const session = ctx.load('lib/account-session.js').readAccountSession(token);
  assert.equal(session.email, EMAIL); assert.equal(session.paid, false); assert.equal(session.admin, false);
  assert.ok(session.authenticatedAt >= started); assert.equal(session.expiresAt, session.authenticatedAt + 40 * 86400);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/); assert.match(response.headers.get('set-cookie'), /Secure/);
  assert.equal((await ctx.verifyRoute.POST(ctx.request(true))).status, 400);
});

test('Five incorrect guesses consume the bounded attempt budget and cannot create an account', async () => {
  await clear(); const ctx = api(); const code = await requestCode(ctx); const wrong = code === '111111' ? '222222' : '111111';
  const responses = await Promise.all(Array.from({ length: 5 }, () => ctx.verifyRoute.POST(ctx.request(true, { body: { email: EMAIL, code: wrong } }))));
  for (const response of responses) assert.equal(response.status, 400);
  assert.equal((await pg.query('SELECT attempts FROM public.account_registration_codes WHERE email=$1', [EMAIL])).rows[0].attempts, 5);
  assert.equal((await ctx.verifyRoute.POST(ctx.request(true))).status, 429);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 0);
});

test('Expired and superseded codes cannot create profiles or revive an earlier pending reservation', async () => {
  await clear(); const ctx = api(); await requestCode(ctx);
  const old = (await pg.query('SELECT * FROM public.account_registration_codes WHERE email=$1', [EMAIL])).rows[0];
  await pg.query("UPDATE public.account_registration_codes SET requested_at=now()-interval '11minutes',expires_at=now()-interval '1minute' WHERE email=$1", [EMAIL]);
  assert.equal((await ctx.verifyRoute.POST(ctx.request(true))).status, 400);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 0);
  await ctx.requestRoute.POST(ctx.request()); assert.equal(ctx.mail.length, 2);
  await pg.query('SELECT public.begin_account_registration_attempt($1)', [EMAIL]);
  const stale = (await pg.query('SELECT public.consume_account_registration_code($1,$2::uuid,$3) AS data', [EMAIL,old.registration_id,old.code_hash])).rows[0].data;
  assert.deepEqual(stale, { consumed: false });
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 0);
});

test('An existing verified profile keeps its premium/admin flags and immutable identity', async () => {
  await clear(); const ctx = api();
  const identity = (await pg.query('INSERT INTO public.userprofile(user_id,email,is_premium,is_admin) VALUES(gen_random_uuid(),$1,true,true) RETURNING user_id', [EMAIL])).rows[0].user_id;
  await requestCode(ctx); const response = await ctx.verifyRoute.POST(ctx.request(true));
  assert.equal(response.status, 200); const result = await response.json(); assert.equal(result.paid, true); assert.equal(result.admin, true);
  const profile = (await pg.query('SELECT * FROM public.userprofile WHERE email=$1', [EMAIL])).rows[0];
  assert.equal(profile.user_id, identity); assert.equal(profile.is_premium, true); assert.equal(profile.is_admin, true);
});

test('Concurrent successful verifications consume once and create exactly one profile', async () => {
  await clear(); const ctx = api(); await requestCode(ctx);
  const responses = await Promise.all([ctx.verifyRoute.POST(ctx.request(true)), ctx.verifyRoute.POST(ctx.request(true))]);
  assert.deepEqual(responses.map(value => value.status).sort(), [200,400]);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 1);
});

test('Browser roles cannot see registration codes or invoke private profile-creation RPCs', async () => {
  await clear(); const ctx = api(); await requestCode(ctx);
  for (const role of ['anon','authenticated']) {
    try {
      await pg.exec(`SET ROLE ${role}`);
      await assert.rejects(pg.query('SELECT * FROM public.account_registration_codes'), /permission denied/);
      await assert.rejects(pg.query('SELECT public.begin_account_registration_attempt($1)', [EMAIL]), /permission denied/);
      await assert.rejects(pg.query('SELECT public.consume_account_registration_code($1,$2::uuid,$3)', [EMAIL,GENERATION,'private-hash']), /permission denied/);
    } finally { await pg.exec('RESET ROLE'); }
  }
});

test('New generation defaults and verified existing generations are included in signed sessions', async () => {
  await pg.exec('ALTER TABLE public.userprofile ADD COLUMN account_generation uuid NOT NULL DEFAULT gen_random_uuid();');
  await clear(); const ctx = api({ generation: true }); await requestCode(ctx);
  const first = await ctx.verifyRoute.POST(ctx.request(true)); assert.equal(first.status, 200);
  const original = (await pg.query('SELECT user_id,account_generation FROM public.userprofile WHERE email=$1', [EMAIL])).rows[0];
  const session = ctx.load('lib/account-session.js').readAccountSession(first.cookies.get('jl_account_session').value);
  assert.equal(session.accountGeneration, original.account_generation);
  await pg.query('UPDATE public.account_registration_codes SET requested_at=requested_at-interval\'61seconds\',expires_at=expires_at-interval\'61seconds\' WHERE email=$1', [EMAIL]);
  await ctx.requestRoute.POST(ctx.request()); const next = await ctx.verifyRoute.POST(ctx.request(true)); assert.equal(next.status, 200);
  const after = (await pg.query('SELECT user_id,account_generation FROM public.userprofile WHERE email=$1', [EMAIL])).rows[0];
  assert.deepEqual(after, original);
});
