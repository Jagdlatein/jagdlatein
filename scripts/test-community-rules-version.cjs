// Real application validation and the complete local SQL stack. All identities
// are disposable fixtures; no provider, mailbox or remote database is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '',
  'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if (!fs.existsSync(path.join(runtime, 'package.json'))) throw Error('Isolated PGlite is required; rules regression may not be skipped.');
const { PGlite } = require(runtime);
const migrationName = '20261011120000_community_rules_version.sql';
const migration = () => fs.readFileSync(path.join(root, 'supabase/migrations', migrationName), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const setupCheckSql = fs.readFileSync(path.join(root, 'scripts/setup-community.ps1'), 'utf8')
  .match(/\$communitySql = @'\r?\n([\s\S]*?)\r?\n'@/)[1];

function loadServer() {
  const cache = new Map();
  const context = vm.createContext({ process: { env: {} }, Buffer, Date, URL, Response, Request, Headers,
    TextEncoder, TextDecoder, Uint8Array, crypto: webcrypto, atob, AbortSignal, console,
    fetch: async () => { throw Error('Rules regression must not contact a provider'); } });
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const requireLocal = id => {
      if (id === '@supabase/supabase-js') return { createClient() { throw Error('Rules regression must not contact a database provider'); } };
      if (id === 'next/headers') return { cookies() { throw Error('No browser account in rules regression'); } };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, module, module.exports);
    return module.exports;
  }
  return load('lib/community-server.js');
}

async function initialize(pg) {
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  // Include every prior migration, not just the original Community function:
  // authentication, generation checks, blocking and premoderation stay active.
  for (const name of fs.readdirSync(path.join(root, 'supabase/migrations')).filter(name => name.endsWith('.sql') && name < migrationName).sort()) {
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', name), 'utf8'));
  }
}

async function writerSnapshot(pg) {
  return (await pg.query(`SELECT p.oid,p.proname,p.proowner,p.proacl::text,p.prosecdef,p.proconfig,p.prolang,p.provolatile,
    pg_get_functiondef(p.oid) AS definition FROM pg_proc p WHERE p.oid IN (
      'public.community_write(text,text,jsonb)'::regprocedure,
      'public.jagdlatein_community_write_base(text,text,jsonb)'::regprocedure,
      'public.jagdlatein_community_blocking_write_base(text,text,jsonb)'::regprocedure,
      'public.require_current_account_read(text)'::regprocedure) ORDER BY p.proname`)).rows;
}

async function accountSnapshot(pg) {
  return (await pg.query('SELECT to_jsonb(profile) AS value FROM public.userprofile profile ORDER BY email')).rows;
}

async function profileSnapshot(pg, email) {
  return (await pg.query('SELECT to_jsonb(profile) AS value FROM public.community_profiles profile WHERE account_email=$1', [email])).rows;
}

async function write(pg, email, payload, generation) {
  return pg.transaction(async tx => {
    await tx.exec('SET LOCAL ROLE service_role;');
    await tx.query("SELECT set_config('request.headers',$1,true)", [JSON.stringify({
      'x-jagdlatein-account-email': email, 'x-jagdlatein-account-generation': generation,
    })]);
    return (await tx.query('SELECT public.community_write($1,$2,$3::jsonb) AS result',
      [email, payload.action, JSON.stringify(payload)])).rows[0].result;
  });
}

test('Current validated profile payload succeeds through the full SQL stack without rewriting historical consent or permissions', async () => {
  const pg = new PGlite();
  try {
    await initialize(pg);
    const server = loadServer();
    const currentEmail = 'fresh-profile@example.invalid';
    const historicalEmail = 'historical-profile@example.invalid';
    const rejectedEmail = 'rejected-profile@example.invalid';
    const generation = '11111111-1111-4111-8111-111111111111';
    const historicalGeneration = '22222222-2222-4222-8222-222222222222';
    const rejectedGeneration = '33333333-3333-4333-8333-333333333333';
    await pg.query(`INSERT INTO public.userprofile(user_id,email,account_generation,is_admin,is_premium,is_community_moderator)
      VALUES(gen_random_uuid(),$1,$2,false,false,false),(gen_random_uuid(),$3,$4,true,true,true),
        (gen_random_uuid(),$5,$6,false,false,false)`,
    [currentEmail, generation, historicalEmail, historicalGeneration, rejectedEmail, rejectedGeneration]);
    await pg.query(`INSERT INTO public.community_profiles(account_email,display_name,rules_version,rules_accepted_at)
      VALUES($1,'Alter Lernname','2026-10-04','2026-10-04T10:00:00Z')`, [historicalEmail]);
    const historicalBefore = await profileSnapshot(pg, historicalEmail);
    const accountsBefore = await accountSnapshot(pg);
    const writersBefore = await writerSnapshot(pg);
    const checkBefore = (await pg.query(setupCheckSql)).rows[0].community_setup;
    assert.equal(checkBefore.current_rules_version, '2026-10-09');
    assert.equal(checkBefore.current_rules_ready, false);

    // This exact payload comes from today's application validator, not a mock
    // version literal or a directly inserted Community profile fixture.
    const payload = plain(server.validateCommunityWrite('POST', {
      action: 'profile', displayName: '  Waldlerner90  ', acceptedRules: true,
    }));
    assert.equal(payload.rulesVersion, '2026-10-09');
    assert.equal(payload.displayName, 'Waldlerner90');
    await assert.rejects(write(pg, currentEmail, payload, generation), /JL_COMMUNITY_INVALID/);
    assert.deepEqual(await profileSnapshot(pg, currentEmail), []);

    await pg.exec(migration());
    assert.equal((await pg.query(setupCheckSql)).rows[0].community_setup.current_rules_ready, true);
    assert.deepEqual(await profileSnapshot(pg, historicalEmail), historicalBefore);
    assert.deepEqual(await accountSnapshot(pg), accountsBefore);
    const writersAfter = await writerSnapshot(pg);
    const expectedWriters = writersBefore.map(writer => writer.proname === 'jagdlatein_community_write_base' ? {
      ...writer, definition: writer.definition
        .replace("p_payload->>'rulesVersion' IS DISTINCT FROM '2026-10-04'", "p_payload->>'rulesVersion' IS DISTINCT FROM '2026-10-09'")
        .replace("VALUES(p_actor_email,name,'2026-10-04',now_at)", "VALUES(p_actor_email,name,'2026-10-09',now_at)"),
    } : writer);
    assert.deepEqual(writersAfter, expectedWriters, 'Only the validation/insertion literals may change; all function rights and wrappers must match');
    assert.deepEqual(await write(pg, currentEmail, payload, generation), { success: true });
    const created = (await profileSnapshot(pg, currentEmail))[0].value;
    assert.equal(created.rules_version, payload.rulesVersion);
    assert.equal(created.display_name, payload.displayName);
    assert.ok(Date.parse(created.rules_accepted_at) > Date.parse('2026-10-04T10:00:00Z'));

    const rejectedPayload = plain(server.validateCommunityWrite('POST', {
      action: 'profile', displayName: 'Neuer Lernname', acceptedRules: true,
    }));
    for (const changed of [
      { ...rejectedPayload, rulesVersion: '2026-10-04' },
      { ...rejectedPayload, rulesVersion: undefined },
      { ...rejectedPayload, rulesVersion: null },
      { ...rejectedPayload, acceptedRules: false },
      { ...rejectedPayload, displayName: 'Support_Team' },
    ]) {
      await assert.rejects(write(pg, rejectedEmail, changed, rejectedGeneration), /JL_COMMUNITY_INVALID/);
      assert.deepEqual(await profileSnapshot(pg, rejectedEmail), []);
    }
    await assert.rejects(write(pg, rejectedEmail, rejectedPayload, historicalGeneration), /JL_ACCOUNT/);
    assert.deepEqual(await profileSnapshot(pg, rejectedEmail), []);
    assert.throws(() => server.validateCommunityWrite('POST', {
      action: 'profile', displayName: 'Neuer Lernname', acceptedRules: false,
    }), error => error.code === 'RULES_REQUIRED');

    // An existing user may retry their unchanged name with current consent,
    // but this must never rewrite the historical acceptance they recorded.
    const retry = plain(server.validateCommunityWrite('POST', {
      action: 'profile', displayName: 'Alter Lernname', acceptedRules: true,
    }));
    assert.deepEqual(await write(pg, historicalEmail, retry, historicalGeneration), { success: true });
    assert.deepEqual(await profileSnapshot(pg, historicalEmail), historicalBefore);
    await assert.rejects(write(pg, historicalEmail, { ...retry, displayName: 'Anderer Lernname' }, historicalGeneration), /JL_COMMUNITY_IMMUTABLE/);
    assert.deepEqual(await profileSnapshot(pg, historicalEmail), historicalBefore);
    assert.deepEqual(await accountSnapshot(pg), accountsBefore);

    // Idempotent reruns retain the new profile, old profile, wrappers and ACLs.
    await pg.exec(migration());
    assert.deepEqual((await profileSnapshot(pg, currentEmail))[0].value, created);
    assert.deepEqual(await profileSnapshot(pg, historicalEmail), historicalBefore);
    assert.deepEqual(await writerSnapshot(pg), writersAfter);
    const rights = (await pg.query(`SELECT role,
      has_function_privilege(role,'public.jagdlatein_community_write_base(text,text,jsonb)','EXECUTE') AS private_writer,
      has_function_privilege(role,'public.community_write(text,text,jsonb)','EXECUTE') AS public_writer
      FROM (VALUES('anon'),('authenticated'),('service_role')) AS roles(role) ORDER BY role`)).rows;
    assert.deepEqual(rights, [
      { role: 'anon', private_writer: false, public_writer: false },
      { role: 'authenticated', private_writer: false, public_writer: false },
      { role: 'service_role', private_writer: false, public_writer: true },
    ]);

    // Both an unknown version and a customized safeguard with unchanged
    // version literals fail closed, without a partial update.
    const reviewed = writersAfter.find(writer => writer.proname === 'jagdlatein_community_write_base').definition;
    for (const unexpected of [
      reviewed.replace("p_payload->>'rulesVersion' IS DISTINCT FROM '2026-10-09'", "p_payload->>'rulesVersion' IS DISTINCT FROM '2026-11-01'"),
      reviewed.replace('recent_limit := 3; daily_limit := 30;', 'recent_limit := 30; daily_limit := 300;'),
    ]) {
      assert.notEqual(unexpected, reviewed);
      await pg.exec(unexpected);
      const unexpectedBefore = await writerSnapshot(pg);
      await assert.rejects(pg.exec(migration()), /JL_COMMUNITY_RULES_SETUP: unexpected Community writer definition/);
      await pg.exec('ROLLBACK;');
      assert.deepEqual(await writerSnapshot(pg), unexpectedBefore);
      assert.deepEqual(await profileSnapshot(pg, historicalEmail), historicalBefore);
      assert.deepEqual(await accountSnapshot(pg), accountsBefore);
    }
  } finally {
    await pg.close();
  }
});
