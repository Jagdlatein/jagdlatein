// Synthetic accounts and an in-memory PostgreSQL engine; no remote services.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein', 'paypal-sandbox', 'test-runtime', 'node_modules', '@electric-sql', 'pglite');
if (!fs.existsSync(runtime)) throw new Error('Missing isolated SQL test runtime. Set JL_PAYPAL_TEST_PGLITE_PATH to the PGlite package directory.');
const { PGlite } = require(runtime);
const EMAIL = 'remove-me@example.invalid', OTHER = 'keep-me@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111', OTHER_GENERATION = '22222222-2222-4222-8222-222222222222';
const SUBSCRIPTION = 'I-DELETE123456', PLAN = 'P-DELETION1234';
const POST = '33333333-3333-4333-8333-333333333333', THREAD = '44444444-4444-4444-8444-444444444444';
const NOW = Date.now();
let pg;
const migration = () => fs.readFileSync(path.join(root, 'supabase/migrations/20261007120000_account_deletion.sql'), 'utf8');

function moduleLoader(env, database) {
  const cache = new Map();
  const context = vm.createContext({ process: { env }, Buffer, Date, URL, TextDecoder, Uint8Array, Response, console });
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const req = id => {
      if (id === '@supabase/supabase-js') return { createClient(url, key, options) { database.calls++; database.options = options; return database; } };
      if (id === './course-catalog') return { courses: [] };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

function api(options = {}) {
  const state = { calls: 0, rpcCalls: 0 };
  const database = { ...state,
    from(name) {
      assert.equal(name, 'userprofile');
      return { select() { return this; }, ilike(column, email) { assert.equal(column, 'email'); this.email = email.replace(/\\([\\%_])/g, '$1'); return this; },
        async maybeSingle() { return { data: (await pg.query('SELECT * FROM public.userprofile WHERE email=$1', [this.email])).rows[0] || null, error: null }; } };
    },
    async rpc(name, parameters) {
      assert.equal(name, 'delete_jagdlatein_account'); this.rpcCalls++;
      try {
        const result = await pg.transaction(async transaction => {
          await transaction.query("SELECT set_config('request.headers',$1,true)", [JSON.stringify(this.options?.global?.headers || {})]);
          return transaction.query('SELECT public.delete_jagdlatein_account($1,$2::uuid) AS data', [parameters.p_email, parameters.p_account_generation]);
        });
        return { data: result.rows[0].data, error: null };
      } catch (error) { return { data: null, error }; }
    },
  };
  const env = { ACCOUNT_DELETION_ENABLED: options.disabled ? 'false' : 'true', NODE_ENV: 'production',
    JL_SESSION_SECRET: 'synthetic-account-deletion-secret-more-than-32-bytes', SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-a-key' };
  const load = moduleLoader(env, database);
  const session = load('lib/account-session.js');
  const token = options.unsigned ? 'invalid' : session.createAccountSession(EMAIL, NOW, {
    paid: false, admin: false, authenticatedAt: Math.floor(NOW / 1000) - (options.old ? 601 : 0),
    accountGeneration: options.wrongGeneration ? OTHER_GENERATION : GENERATION,
  });
  const route = load('app/api/account/delete/route.js');
  function request(overrides = {}) {
    const headers = { origin: 'https://app.example.invalid', 'content-type': 'application/json', ...overrides.headers };
    for (const [key, value] of Object.entries(headers)) if (value === null) delete headers[key];
    const body = overrides.body ?? JSON.stringify({ confirmation: 'KONTO LÖSCHEN', acknowledgeSubscriptions: true });
    const req = new Request('https://app.example.invalid/api/account/delete', { method: 'DELETE', headers, body });
    req.cookies = { get() { return { value: token }; } };
    return req;
  }
  return { database, route, request, load };
}

test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  for (const file of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql','20261004190000_learning_community.sql',
    '20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql']) {
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8'));
  }
  await pg.exec(migration());
});
test.after(async () => { await pg?.close(); });

async function fixture() {
  await pg.exec('TRUNCATE public.account_registration_codes,public.apple_account_tokens,public.community_posts,public.community_profiles,public.quiz_identities,public.course_progress,public.activity_results,public.push_tokens,public.login_codes,public.paypal_subscriptions,public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2),(gen_random_uuid(),$3,$4)', [EMAIL,GENERATION,OTHER,OTHER_GENERATION]);
  await pg.query('INSERT INTO public.login_codes VALUES($1,$2,now()+interval\'10minutes\',0,now())', [EMAIL,'synthetic-code-hash']);
  await pg.query('INSERT INTO public.push_tokens(token,enabled,account_email) VALUES($1,true,$2),($3,true,$4)', ['owned-device',EMAIL,'other-device',OTHER]);
  await pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'test-course\',\'in_progress\',1,2,1),($2,\'test-course\',\'in_progress\',1,2,1)', [EMAIL,OTHER]);
  await pg.query('INSERT INTO public.activity_results(account_email,event_id,type,topic,total_questions,correct_answers,timed_out_answers,points,duration_seconds) VALUES($1,gen_random_uuid(),\'ansitz\',\'Ansitzsimulator\',25,10,0,10,20)', [EMAIL]);
  await pg.query('INSERT INTO public.quiz_identities(account_email,username,country) VALUES($1,\'remove-quiz\',\'DE\')', [EMAIL]);
  await pg.query('INSERT INTO public.ranked_quiz_rounds VALUES(gen_random_uuid(),$1,\'{}\',now())', [EMAIL]);
  await pg.query('INSERT INTO public.verified_quiz_scores VALUES($1,\'remove-quiz\',\'DE\',100,1,now())', [EMAIL]);
  await pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Remove Name\',\'test\'),($2,\'Keep Name\',\'test\')', [EMAIL,OTHER]);
  await pg.query('INSERT INTO public.community_posts(id,account_email,category,kind,title,body) VALUES($1,$2,\'allgemein\',\'question\',\'Private owned title\',\'Private owned content\'),($3,$4,\'allgemein\',\'question\',\'Other public title\',\'Other public content\')', [POST,EMAIL,THREAD,OTHER]);
  await pg.query('INSERT INTO public.community_posts(id,parent_id,account_email,category,kind,body,moderated_by) VALUES(gen_random_uuid(),$1,$2,\'allgemein\',\'reply\',\'Keep this reply\',$3),(gen_random_uuid(),$4,$3,\'allgemein\',\'reply\',\'Remove this reply\',null)', [POST,OTHER,EMAIL,THREAD]);
  await pg.query('INSERT INTO public.community_reports(post_id,reporter_email,reason) VALUES($1,$2,\'Remove report\'),($3,$4,\'Other report on removed post\')', [THREAD,EMAIL,POST,OTHER]);
  await pg.query('INSERT INTO public.community_events(account_email,action) VALUES($1,\'post\')', [EMAIL]);
  await pg.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,plan_id,status,paid_until,verified_at) VALUES($1,$2,$3,\'ACTIVE\',now()+interval\'30 days\',now())', [SUBSCRIPTION,EMAIL,PLAN]);
  await pg.query('INSERT INTO public.paypal_subscription_payments(subscription_id,payment_id,status,paid_at,period_until,amount,currency,observed_at) VALUES($1,\'PAYMENT-DELETE123\',\'COMPLETED\',now(),now()+interval\'30 days\',\'5.00\',\'EUR\',now())', [SUBSCRIPTION]);
}

test('Disabled deployment exposes no deletion and never contacts a database', async () => {
  const ctx = api({ disabled: true });
  const get = await ctx.route.GET(ctx.request());
  assert.deepEqual(await get.json(), { enabled: false });
  assert.equal((await ctx.route.DELETE(ctx.request())).status, 503);
  assert.equal(ctx.database.calls, 0);
});

test('Absent, foreign, opaque, misleading Origin and cross-site fetches are rejected before data access', async () => {
  for (const headers of [{ origin: null },{ origin: 'null' },{ origin: 'https://evil.example.invalid' },
    { origin: 'https://app.example.invalid.evil.invalid' },{ origin: 'https://app.example.invalid/path' },
    { origin: 'https://name@app.example.invalid' },{ 'sec-fetch-site': 'cross-site' }]) {
    const ctx = api(); assert.equal((await ctx.route.DELETE(ctx.request({ headers }))).status, 403);
    assert.equal(ctx.database.calls, 0);
  }
});

test('Unsigned and old authenticated sessions cannot reach a deletion RPC', async () => {
  for (const options of [{ unsigned: true },{ old: true }]) {
    const ctx = api(options); const response = await ctx.route.DELETE(ctx.request());
    assert.equal(response.status, 401); assert.equal(ctx.database.rpcCalls, 0);
    assert.equal(ctx.database.calls, 0);
  }
});

test('Body must contain exactly the typed confirmation and explicit subscription acknowledgement', async () => {
  const values = [{},{ confirmation: 'KONTO LÖSCHEN', acknowledgeSubscriptions: false },
    { confirmation: 'konto löschen', acknowledgeSubscriptions: true },
    { confirmation: 'KONTO LÖSCHEN', acknowledgeSubscriptions: true, email: OTHER },[],null];
  for (const value of values) {
    const ctx = api(); const response = await ctx.route.DELETE(ctx.request({ body: JSON.stringify(value) }));
    assert.equal(response.status, 400); assert.equal(ctx.database.calls, 0);
  }
  const ctx = api(); assert.equal((await ctx.route.DELETE(ctx.request({ body: '{' }))).status, 400);
  assert.equal((await ctx.route.DELETE(ctx.request({ body: 'x'.repeat(2049) }))).status, 413);
  assert.equal((await ctx.route.DELETE(ctx.request({ headers: { 'content-type': 'text/plain' } }))).status, 415);
});

test('Account generation is validated against the current profile before mutation', async () => {
  await fixture(); const ctx = api({ wrongGeneration: true });
  assert.equal((await ctx.route.DELETE(ctx.request())).status, 401); assert.equal(ctx.database.rpcCalls, 0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 2);
});

test('Successful API deletion atomically removes personal data, preserves other accounts, and expires all identity cookies', async () => {
  await fixture(); const ctx = api();
  const response = await ctx.route.DELETE(ctx.request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { deleted: true });
  const cookies = response.headers.get('set-cookie');
  for (const name of ['jl_account_session','jl_session','jl_paid','jl_email','jl_admin']) assert.ok(cookies.includes(`${name}=;`));
  assert.match(cookies, /Max-Age=0/); assert.match(cookies, /HttpOnly/); assert.match(cookies, /Secure/);
  for (const table of ['userprofile','login_codes','course_progress','activity_results','quiz_identities','ranked_quiz_rounds','verified_quiz_scores','community_profiles','community_events']) {
    const column = ['userprofile','login_codes'].includes(table) ? 'email' : 'account_email';
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE ${column}=$1`, [EMAIL])).rows[0].count, 0, table);
  }
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.push_tokens WHERE account_email=$1', [EMAIL])).rows[0].count, 0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.community_reports')).rows[0].count, 0);
  const own = (await pg.query('SELECT * FROM public.community_posts WHERE id=$1',[POST])).rows[0];
  assert.equal(own.account_email,null); assert.equal(own.status,'deleted'); assert.equal(own.body,'Inhalt entfernt.');
  assert.equal((await pg.query('SELECT body FROM public.community_posts WHERE parent_id=$1 AND account_email=$2',[POST,OTHER])).rows[0].body,'Keep this reply');
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[OTHER])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.course_progress WHERE account_email=$1',[OTHER])).rows[0].count,1);
});

test('Retained PayPal contracts lose email and all entitlement and cannot be remapped by a replay', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  const row = (await pg.query('SELECT * FROM public.paypal_subscriptions WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0];
  assert.notEqual(row.account_email, EMAIL); assert.match(row.account_email, /@deleted\.invalid$/);
  assert.ok(row.account_deleted_at); assert.equal(row.paid_until,null); assert.equal(row.review_reason,'deleted_account');
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscription_payments WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,1);
  assert.deepEqual((await pg.query('SELECT public.ensure_paypal_account_profile($1,$2) AS result',[SUBSCRIPTION,EMAIL])).rows[0].result,{ deleted:true });
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,0);
  await assert.rejects(pg.query('UPDATE public.paypal_subscriptions SET account_email=$1 WHERE subscription_id=$2',[EMAIL,SUBSCRIPTION]),/JL_DELETED_PAYPAL_CONTRACT/);
  await assert.rejects(pg.query('UPDATE public.paypal_subscriptions SET paid_until=now()+interval\'1 day\' WHERE subscription_id=$1',[SUBSCRIPTION]),/JL_DELETED_PAYPAL_CONTRACT/);
  await assert.rejects(pg.query('SELECT public.apply_paypal_subscription_snapshot($1::jsonb)',[JSON.stringify({ subscription_id:SUBSCRIPTION,account_email:EMAIL,plan_id:PLAN,status:'ACTIVE',observed_at:new Date().toISOString(),payments:[] })]),/JL_DELETED_PAYPAL_CONTRACT/);
});

test('A genuinely new provider contract gets a new account generation; old deletion/session generation cannot remove it', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  assert.deepEqual((await pg.query('SELECT public.ensure_paypal_account_profile($1,$2) AS result',['I-NEWCONTRACT123',EMAIL])).rows[0].result,{ deleted:false });
  const generation = (await pg.query('SELECT account_generation FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].account_generation;
  assert.notEqual(generation,GENERATION);
  await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]),/JL_DELETE_ACCOUNT_MISSING/);
  const ctx = api(); assert.equal((await ctx.route.DELETE(ctx.request())).status,401);
});

test('Unknown cascading dependencies abort with a full rollback instead of deleting unreviewed data', async () => {
  await fixture(); await pg.exec('CREATE TABLE public.unreviewed_account_notes(user_id uuid REFERENCES public.userprofile(user_id) ON DELETE CASCADE,note text);');
  try {
    await pg.query('INSERT INTO public.unreviewed_account_notes SELECT user_id,\'Do not delete\' FROM public.userprofile WHERE email=$1',[EMAIL]);
    await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]),/unreviewed account dependency/);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.unreviewed_account_notes')).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.course_progress WHERE account_email=$1',[EMAIL])).rows[0].count,1);
    assert.equal((await pg.query('SELECT account_email FROM public.paypal_subscriptions WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].account_email,EMAIL);
  } finally { await pg.exec('DROP TABLE public.unreviewed_account_notes'); }
});

test('In-flight writes after profile removal fail instead of recreating progress, community profile or login code', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  await assert.rejects(pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'late\',\'in_progress\',1,2,1)',[EMAIL]),/JL_ACCOUNT_OWNER_MISSING/);
  await assert.rejects(pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Late Profile\',\'test\')',[EMAIL]),/JL_ACCOUNT_OWNER_MISSING/);
  await assert.rejects(pg.query('INSERT INTO public.login_codes VALUES($1,\'late\',now()+interval\'10minutes\',0,now())',[EMAIL]),/JL_ACCOUNT_OWNER_MISSING/);
});

test('Deletion function is service-only and migration is repeatable without deleting accounts', async () => {
  await fixture(); await pg.exec(migration());
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count,2);
  assert.equal((await pg.query("SELECT has_function_privilege('anon','public.delete_jagdlatein_account(text,uuid)','EXECUTE') AS allowed")).rows[0].allowed,false);
  assert.equal((await pg.query("SELECT has_function_privilege('authenticated','public.delete_jagdlatein_account(text,uuid)','EXECUTE') AS allowed")).rows[0].allowed,false);
  assert.equal((await pg.query("SELECT has_function_privilege('service_role','public.delete_jagdlatein_account(text,uuid)','EXECUTE') AS allowed")).rows[0].allowed,true);
});

test('Old server actor headers cannot write into an account recreated with the same email', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  await pg.query('SELECT public.ensure_paypal_account_profile($1,$2)',['I-NEWCONTRACT456',EMAIL]);
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    await assert.rejects(pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'late\',\'in_progress\',1,2,1)',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Late Profile\',\'test\')',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('SELECT public.get_activity_statistics($1)',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('SELECT public.community_read($1,\'posts\',\'{}\')',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('SELECT public.read_ranked_quiz($1,$2)',[EMAIL,POST]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    for (const rpc of ['get_current_course_progress','get_current_quiz_identity','get_current_quiz_score']) {
      await assert.rejects(pg.query(`SELECT public.${rpc}($1)`,[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    }
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});

test('Current actor generation may read its own RPC data and mutate another owner only with its existing application rights', async () => {
  await fixture();
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    const stats = (await pg.query('SELECT public.get_activity_statistics($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(stats.ansitz.rounds,1);
    const community = (await pg.query('SELECT public.community_read($1,\'posts\',\'{}\') AS data',[EMAIL])).rows[0].data;
    assert.equal(community.total,2);
    await assert.rejects(pg.query('SELECT public.get_activity_statistics($1)',[OTHER]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await pg.query('UPDATE public.community_posts SET moderated_by=NULL WHERE id=$1',[THREAD]);
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});

test('An Apple mapping is detached in the deletion transaction and preserved without an email', async () => {
  await fixture();
  const original = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS token',[EMAIL,GENERATION])).rows[0].token;
  await pg.query('INSERT INTO public.apple_subscriptions(environment,original_transaction_id,app_account_token,latest_transaction_id,status,auto_renew,access_until,verified_at) VALUES(\'Sandbox\',\'1234567890\',$1,\'1234567891\',1,true,now()+interval\'1 month\',now())',[original.app_account_token]);
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  const token = (await pg.query('SELECT * FROM public.apple_account_tokens')).rows[0];
  assert.equal(token.account_email,null); assert.equal(token.account_generation,GENERATION); assert.ok(token.deleted_at);
  assert.equal(token.app_account_token,original.app_account_token);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_subscriptions')).rows[0].count,1);
  await assert.rejects(pg.query('SELECT public.ensure_apple_account_token($1,$2)',[EMAIL,GENERATION]),/JL_APPLE_ACCOUNT/);
  await pg.query('SELECT public.ensure_paypal_account_profile($1,$2)',['I-NEWCONTRACT789',EMAIL]);
  const next = (await pg.query('SELECT public.ensure_apple_account_token($1,account_generation) AS token FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].token;
  assert.notEqual(next.app_account_token,original.app_account_token);
  assert.notEqual(next.account_generation,GENERATION);
});

test('A stale generation cannot write quiz or community data after same-email recreation', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  await pg.query('SELECT public.ensure_paypal_account_profile($1,$2)',['I-NEWCONTRACTABC',EMAIL]);
  await pg.query('INSERT INTO public.quiz_identities(account_email,username,country) VALUES($1,\'new-identity\',\'DE\')',[EMAIL]);
  await pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'New Name\',\'test\')',[EMAIL]);
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    for (const statement of [
      'INSERT INTO public.ranked_quiz_rounds VALUES(gen_random_uuid(),$1,\'{}\',now())',
      'INSERT INTO public.verified_quiz_scores VALUES($1,\'new-identity\',\'DE\',100,1,now())',
      'INSERT INTO public.community_events(account_email,action) VALUES($1,\'reply\')',
      'INSERT INTO public.community_posts(account_email,category,kind,title,body) VALUES($1,\'allgemein\',\'question\',\'Late private title\',\'Late private content\')',
      'INSERT INTO public.community_reports(post_id,reporter_email,reason) VALUES(\'44444444-4444-4444-8444-444444444444\',$1,\'Late report\')',
      'INSERT INTO public.push_tokens(token,enabled,account_email) VALUES(\'late-device\',true,$1)',
    ]) await assert.rejects(pg.query(statement,[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});

test('A pending registration challenge is removed so its old verified request cannot recreate the deleted account', async () => {
  await fixture();
  const codeHash = '$2a$10$' + 'A'.repeat(53);
  const reserve = (await pg.query('SELECT public.reserve_account_registration_code($1,$2) AS data',[EMAIL,codeHash])).rows[0].data;
  assert.equal(reserve.reserved,true);
  const challenge = (await pg.query('SELECT * FROM public.account_registration_codes WHERE email=$1',[EMAIL])).rows[0];
  assert.equal((await pg.query('SELECT public.begin_account_registration_attempt($1) AS data',[EMAIL])).rows[0].data.valid,true);
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.account_registration_codes WHERE email=$1',[EMAIL])).rows[0].count,0);
  assert.deepEqual((await pg.query('SELECT public.consume_account_registration_code($1,$2,$3) AS data',[EMAIL,challenge.registration_id,codeHash])).rows[0].data,{ consumed:false });
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,0);
});

test('Generation-guarded personal read RPCs expose only the account fields and preserve latest-course ordering', async () => {
  await fixture();
  await pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'later-course\',\'in_progress\',1,3,1)',[EMAIL]);
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    const progress = (await pg.query('SELECT public.get_current_course_progress($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(progress.length,2); assert.equal(progress[0].course_id,'later-course');
    assert.deepEqual(Object.keys(progress[0]).sort(),['course_id','status','answered_questions','total_questions','score','best_score','completed_at','updated_at'].sort());
    assert.equal(progress.some(entry => Object.hasOwn(entry,'account_email')),false);
    const identity = (await pg.query('SELECT public.get_current_quiz_identity($1) AS data',[EMAIL])).rows[0].data;
    assert.deepEqual(identity,{ username:'remove-quiz',country:'DE' });
    const score = (await pg.query('SELECT public.get_current_quiz_score($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(score.total_points,100); assert.equal(score.rounds,1);
    assert.deepEqual(Object.keys(score).sort(),['username','country','total_points','rounds','updated_at'].sort());
    for (const rpc of ['get_current_course_progress','get_current_quiz_identity','get_current_quiz_score']) {
      await assert.rejects(pg.query(`SELECT public.${rpc}($1)`,[OTHER]),/JL_ACCOUNT_GENERATION_MISMATCH/);
      assert.equal((await pg.query(`SELECT has_function_privilege('anon','public.${rpc}(text)','EXECUTE') AS allowed`)).rows[0].allowed,false);
      assert.equal((await pg.query(`SELECT has_function_privilege('authenticated','public.${rpc}(text)','EXECUTE') AS allowed`)).rows[0].allowed,false);
      assert.equal((await pg.query(`SELECT has_function_privilege('service_role','public.${rpc}(text)','EXECUTE') AS allowed`)).rows[0].allowed,true);
    }
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':OTHER,'x-jagdlatein-account-generation':OTHER_GENERATION })]);
  try {
    assert.equal((await pg.query('SELECT public.get_current_quiz_identity($1) AS data',[OTHER])).rows[0].data,null);
    assert.equal((await pg.query('SELECT public.get_current_quiz_score($1) AS data',[OTHER])).rows[0].data,null);
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});
