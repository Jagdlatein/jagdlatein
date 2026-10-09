// Test-only preparation SQL against isolated PostgreSQL; no remote requests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '',
  'Jagdlatein', 'paypal-sandbox', 'test-runtime', 'node_modules', '@electric-sql', 'pglite');
if (!fs.existsSync(runtime)) throw new Error('Missing isolated SQL test runtime. Set JL_PAYPAL_TEST_PGLITE_PATH.');
const { PGlite } = require(runtime);
const sql = fs.readFileSync(path.join(__dirname, 'sql/ios-test-push-base.sql'), 'utf8');
const table = 'CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz);';
const migrations = ['20261007105000_account_registration.sql', '20261007110000_apple_subscriptions.sql',
  '20261007120000_account_deletion.sql', '20261008120000_apple_refund_ordering.sql']
  .map(name => fs.readFileSync(path.join(root, 'supabase/migrations', name), 'utf8'));
let pg;

test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE ROLE unsafe_push_admin;');
});
test.beforeEach(async () => {
  await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO PUBLIC;');
});
test.after(async () => { await pg?.close(); });

async function rejected(source = sql) {
  await assert.rejects(pg.exec(source), /JL_IOS_TEST_PUSH_SETUP:/);
  await pg.exec('ROLLBACK;');
}

async function schemaSnapshot() {
  return (await pg.query(`SELECT c.relrowsecurity,
    pg_get_userbyid(c.relowner) AS owner,
    a.attname, format_type(a.atttypid,a.atttypmod) AS type,
    a.attnotnull, a.attgenerated, a.attidentity, a.attacl::text AS column_acl
    FROM pg_class c JOIN pg_attribute a ON a.attrelid=c.oid
    WHERE c.oid=to_regclass('public.push_tokens') AND a.attnum>0 AND NOT a.attisdropped
    ORDER BY a.attnum`)).rows;
}

test('missing table becomes an empty private push base with bounded service grants', async () => {
  // Supabase can have broad default ACLs; these must not leak to new tables.
  await pg.exec('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;');
  try {
    await pg.exec(sql);
    assert.deepEqual((await pg.query('SELECT * FROM public.push_tokens')).rows, []);
    assert.deepEqual((await schemaSnapshot()).map(row => [row.attname,row.type]), [
      ['token','text'],['platform','text'],['enabled','boolean'],['updated_at','timestamp with time zone'],
    ]);
    assert.equal((await schemaSnapshot())[0].relrowsecurity, true);
    const policy = (await pg.query(`SELECT polpermissive,polroles,pg_get_expr(polqual,polrelid) AS using_expr,
      pg_get_expr(polwithcheck,polrelid) AS check_expr FROM pg_policy
      WHERE polrelid='public.push_tokens'::regclass AND polname='jagdlatein_server_only'`)).rows[0];
    assert.equal(policy.polpermissive, false);
    assert.deepEqual(policy.polroles, [0]);
    assert.equal(policy.using_expr, 'false');
    assert.equal(policy.check_expr, 'false');
    for (const role of ['anon','authenticated']) {
      const grants = (await pg.query(`SELECT has_table_privilege($1,'public.push_tokens','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS table_grants,
        has_any_column_privilege($1,'public.push_tokens','SELECT,INSERT,UPDATE,REFERENCES') AS column_grants`, [role])).rows[0];
      assert.deepEqual(grants, { table_grants:false, column_grants:false });
    }
    assert.deepEqual((await pg.query(`SELECT has_table_privilege('service_role','public.push_tokens','SELECT') AS read,
      has_table_privilege('service_role','public.push_tokens','INSERT') AS insert,
      has_table_privilege('service_role','public.push_tokens','UPDATE') AS update,
      has_table_privilege('service_role','public.push_tokens','DELETE,TRUNCATE,REFERENCES,TRIGGER') AS other`)).rows[0],
    { read:true,insert:true,update:true,other:false });
  } finally {
    await pg.exec('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon,authenticated,service_role;');
  }
});

test('compatible replay preserves every row and column while removing direct column grants', async () => {
  await pg.exec(`${table}
    ALTER TABLE public.push_tokens ADD COLUMN account_email text;
    ALTER TABLE public.push_tokens ADD COLUMN note text;
    INSERT INTO public.push_tokens VALUES('synthetic-token','android',true,'2026-10-07T12:00:00Z','owner@example.invalid','keep unchanged');
    GRANT SELECT(token),UPDATE(enabled) ON public.push_tokens TO anon;
    CREATE POLICY existing_policy ON public.push_tokens FOR SELECT TO anon USING(true);`);
  const before = (await pg.query('SELECT * FROM public.push_tokens')).rows;
  const columns = (await schemaSnapshot()).map(row => [row.attname,row.type,row.attnotnull]);
  await pg.exec(sql);
  await pg.exec(sql);
  assert.deepEqual((await pg.query('SELECT * FROM public.push_tokens')).rows, before);
  assert.deepEqual((await schemaSnapshot()).map(row => [row.attname,row.type,row.attnotnull]), columns);
  assert.equal((await pg.query("SELECT has_any_column_privilege('anon','public.push_tokens','SELECT,UPDATE') AS allowed")).rows[0].allowed, false);
  assert.equal((await pg.query("SELECT count(*)::integer AS count FROM pg_policy WHERE polrelid='public.push_tokens'::regclass")).rows[0].count, 2);
});

test('replay accepts the real deletion owner guard and a token key with INCLUDE', async () => {
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec(`CREATE TABLE public.push_tokens(token text,platform text,enabled boolean,updated_at timestamptz,account_email text);
    CREATE UNIQUE INDEX push_token_conflict ON public.push_tokens(token) INCLUDE(platform);`);
  for (const name of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql',
    '20261004190000_learning_community.sql']) {
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', name), 'utf8'));
  }
  await pg.exec(sql);
  for (const migration of migrations) await pg.exec(migration);
  await pg.exec(sql);
  assert.equal((await pg.query("SELECT count(*)::integer AS count FROM pg_trigger WHERE tgrelid='public.push_tokens'::regclass AND tgname='jagdlatein_live_owner'")).rows[0].count, 1);
});

test('incompatible schema aborts before any account migration and preserves data and grants', async () => {
  await pg.exec(`CREATE TABLE public.push_tokens(token uuid PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz);
    INSERT INTO public.push_tokens VALUES('11111111-1111-4111-8111-111111111111','android',true,'2026-10-07T12:00:00Z');
    GRANT SELECT(token) ON public.push_tokens TO anon;`);
  const rows = (await pg.query('SELECT * FROM public.push_tokens')).rows;
  const shape = await schemaSnapshot();
  await rejected([sql,...migrations].join('\n'));
  assert.deepEqual((await pg.query('SELECT * FROM public.push_tokens')).rows, rows);
  assert.deepEqual(await schemaSnapshot(), shape);
  assert.equal((await pg.query("SELECT to_regclass('public.account_registration_codes') IS NULL AS absent")).rows[0].absent, true);
  assert.equal((await pg.query("SELECT to_regprocedure('public.reserve_account_registration_code(text,text)') IS NULL AS absent")).rows[0].absent, true);
});

test('unsafe roles and inherited non-DML grants reject with transactional rollback', async () => {
  await pg.exec('GRANT service_role TO anon;');
  try {
    await rejected();
    assert.equal((await pg.query("SELECT to_regclass('public.push_tokens') IS NULL AS absent")).rows[0].absent, true);
  } finally { await pg.exec('REVOKE service_role FROM anon;'); }
  await pg.exec(`${table} GRANT TRUNCATE ON public.push_tokens TO unsafe_push_admin; GRANT unsafe_push_admin TO anon;`);
  const shape = await schemaSnapshot();
  try {
    await rejected();
    assert.deepEqual(await schemaSnapshot(), shape);
    assert.equal((await pg.query("SELECT count(*)::integer AS count FROM pg_policy WHERE polrelid='public.push_tokens'::regclass")).rows[0].count, 0);
  } finally { await pg.exec('REVOKE unsafe_push_admin FROM anon;'); }
});

test('inherited column REFERENCES cannot bypass the privacy preparation', async () => {
  await pg.exec(`${table} GRANT REFERENCES(token) ON public.push_tokens TO unsafe_push_admin; GRANT unsafe_push_admin TO anon;`);
  const shape = await schemaSnapshot();
  try {
    assert.equal((await pg.query("SELECT has_table_privilege('anon','public.push_tokens','REFERENCES') AS allowed")).rows[0].allowed, false);
    await rejected();
    assert.deepEqual(await schemaSnapshot(), shape);
    assert.equal((await pg.query("SELECT count(*)::integer AS count FROM pg_policy WHERE polrelid='public.push_tokens'::regclass")).rows[0].count, 0);
  } finally { await pg.exec('REVOKE unsafe_push_admin FROM anon;'); }
});

test('a browser executor cannot create a table whose ownership bypasses RLS', async () => {
  await pg.exec('GRANT CREATE ON SCHEMA public TO anon; SET ROLE anon;');
  try { await rejected(); }
  finally { await pg.exec('RESET ROLE;'); }
  assert.equal((await pg.query("SELECT to_regclass('public.push_tokens') IS NULL AS absent")).rows[0].absent, true);
});

test('invalid conflict keys, generated columns, views and unreviewed callbacks fail safely', async () => {
  const variants = [
    'CREATE TABLE public.push_tokens(token text,platform text,enabled boolean,updated_at timestamptz);',
    'CREATE TABLE public.push_tokens(token text,platform text,enabled boolean,updated_at timestamptz, UNIQUE(token,platform));',
    'CREATE TABLE public.push_tokens(token text UNIQUE DEFERRABLE,platform text,enabled boolean,updated_at timestamptz);',
    'CREATE TABLE public.push_tokens(token text,platform text,enabled boolean,updated_at timestamptz); CREATE UNIQUE INDEX partial_token ON public.push_tokens(token) WHERE enabled;',
    'CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean GENERATED ALWAYS AS (true) STORED,updated_at timestamptz);',
    "CREATE VIEW public.push_tokens AS SELECT 'token'::text token,'android'::text platform,true enabled,now() updated_at;",
    `${table} CREATE FUNCTION public.unreviewed_push() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
      CREATE TRIGGER unreviewed BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION public.unreviewed_push();`,
  ];
  for (const variant of variants) {
    await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO PUBLIC;');
    await pg.exec(variant);
    const before = await schemaSnapshot();
    await rejected();
    assert.deepEqual(await schemaSnapshot(), before);
  }
});
