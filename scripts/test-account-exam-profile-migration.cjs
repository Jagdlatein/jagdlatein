// Execute the additive migration against isolated PostgreSQL/WASM only.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./helpers/project-module.cjs');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
const { PGlite } = require(runtime);
const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261101150000_account_exam_profile.sql'), 'utf8');
const prior = fs.readFileSync(path.join(root, 'supabase/migrations/20261007120000_account_deletion.sql'), 'utf8');
const actorGuard = prior.match(/CREATE OR REPLACE FUNCTION public\.require_current_request_actor\(\)[\s\S]*?END \$\$;/)[0];
const GENERATION = 'a1111111-1111-4111-8111-111111111111';
const OTHER = 'b2222222-2222-4222-8222-222222222222';
const EMAIL = 'migration-exam@example.invalid';
let pg;

test.before(async () => {
  pg = new PGlite();
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE TABLE public.userprofile(email text PRIMARY KEY, account_generation uuid NOT NULL DEFAULT gen_random_uuid(),
      is_premium boolean NOT NULL DEFAULT false, is_admin boolean NOT NULL DEFAULT false, untouched text);
    ALTER TABLE public.userprofile ENABLE ROW LEVEL SECURITY;
    CREATE POLICY private_profiles ON public.userprofile AS RESTRICTIVE FOR ALL TO PUBLIC USING(false) WITH CHECK(false);
    GRANT SELECT,INSERT ON public.userprofile TO service_role;`);
  await pg.exec(actorGuard);
  await pg.query('INSERT INTO public.userprofile(email,account_generation,is_premium,is_admin,untouched) VALUES ($1,$2,true,true,$3)', [EMAIL, GENERATION, 'unchanged existing account']);
  await pg.exec(migration);
});
test.after(async () => { if (pg) await pg.close(); });

test('Migration keeps existing account values and table privileges, and can be reapplied', async () => {
  await pg.exec(migration);
  const { rows } = await pg.query('SELECT * FROM public.userprofile WHERE email=$1', [EMAIL]);
  assert.deepEqual(rows[0], { email: EMAIL, account_generation: GENERATION, is_premium: true, is_admin: true,
    untouched: 'unchanged existing account', exam_country: null, exam_region: null });
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const result = await pg.query(`SELECT has_table_privilege($1,'public.userprofile','SELECT') AS sel,
      has_table_privilege($1,'public.userprofile','UPDATE') AS upd,
      has_function_privilege($1,'public.set_account_exam_profile(text,uuid,text,text)','EXECUTE') AS rpc`, [role]);
    assert.deepEqual(result.rows[0], { sel: role === 'service_role', upd: false, rpc: role === 'service_role' });
  }
});

test('All 51 allowed country/region pairs pass the actual SQL check and no other uppercase pair does', async () => {
  const { examCountries } = createLoader()('lib/exam-profile.js');
  const regions = [...new Set(examCountries.flatMap(country => country.regions.map(region => region.code)))];
  let allowed = 0, rejected = 0;
  for (const country of examCountries) for (const region of regions) {
    const query = () => pg.query('UPDATE public.userprofile SET exam_country=$1,exam_region=$2 WHERE email=$3', [country.code, region, EMAIL]);
    if (country.regions.some(item => item.code === region)) { await query(); allowed++; }
    else { await assert.rejects(query(), /userprofile_exam_profile_valid/); rejected++; }
  }
  assert.equal(allowed, 51); assert.ok(rejected > 50);
});

test('Partial nulls, foreign casing, unknown regions and federal defaults fail the real SQL constraint', async () => {
  for (const pair of [[null, 'ZH'], ['CH', null], ['ch', 'ZH'], ['CH', 'zh'], ['XX', 'ZH'], ['DE', 'BUND'], ['AT', 'BUND']]) {
    await assert.rejects(pg.query('UPDATE public.userprofile SET exam_country=$1,exam_region=$2 WHERE email=$3', [...pair, EMAIL]), /userprofile_exam_profile_valid/);
  }
  await pg.query('UPDATE public.userprofile SET exam_country=NULL,exam_region=NULL WHERE email=$1', [EMAIL]);
});

test('Only the restricted service RPC writes preferences; entitlements and other values stay unchanged', async () => {
  await pg.exec('SET ROLE service_role');
  try {
    await assert.rejects(pg.query('UPDATE public.userprofile SET exam_country=$1,exam_region=$2 WHERE email=$3', ['CH', 'ZH', EMAIL]), /permission denied/);
    const result = await pg.query('SELECT public.set_account_exam_profile($1,$2,$3,$4) AS profile', [EMAIL, GENERATION, 'CH', 'ZH']);
    assert.deepEqual(result.rows[0].profile, { country: 'CH', region: 'ZH' });
  } finally { await pg.exec('RESET ROLE'); }
  const result = await pg.query('SELECT is_premium,is_admin,untouched FROM public.userprofile WHERE email=$1', [EMAIL]);
  assert.deepEqual(result.rows[0], { is_premium: true, is_admin: true, untouched: 'unchanged existing account' });
  for (const role of ['anon', 'authenticated']) {
    await pg.exec(`SET ROLE ${role}`);
    try { await assert.rejects(pg.query('SELECT public.set_account_exam_profile($1,$2,$3,$4)', [EMAIL, GENERATION, 'DE', 'BY']), /permission denied/); }
    finally { await pg.exec('RESET ROLE'); }
  }
});

test('RPC rejects wrong generations and mismatched current-actor headers', async () => {
  await assert.rejects(pg.query('SELECT public.set_account_exam_profile($1,$2,$3,$4)', [EMAIL, OTHER, 'AT', 'T']), /JL_EXAM_PROFILE_IDENTITY/);
  await pg.query("SELECT set_config('request.headers',$1,false)", [JSON.stringify({ 'x-jagdlatein-account-email': EMAIL, 'x-jagdlatein-account-generation': OTHER })]);
  try { await assert.rejects(pg.query('SELECT public.set_account_exam_profile($1,$2,$3,$4)', [EMAIL, GENERATION, 'AT', 'T']), /JL_ACCOUNT_GENERATION_MISMATCH/); }
  finally { await pg.query("SELECT set_config('request.headers','{}',false)"); }
  await pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES ($1,$2)', ['other-exam@example.invalid', OTHER]);
  await pg.query("SELECT set_config('request.headers',$1,false)", [JSON.stringify({ 'x-jagdlatein-account-email': EMAIL, 'x-jagdlatein-account-generation': GENERATION })]);
  try { await assert.rejects(pg.query('SELECT public.set_account_exam_profile($1,$2,$3,$4)', ['other-exam@example.invalid', OTHER, 'AT', 'T']), /JL_EXAM_PROFILE_IDENTITY/); }
  finally { await pg.query("SELECT set_config('request.headers','{}',false)"); }
});

test('Deleting/recreating the same email loses the old preference and cannot be reached by an old generation', async () => {
  await pg.query('DELETE FROM public.userprofile WHERE email=$1', [EMAIL]);
  await pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES ($1,$2)', [EMAIL, OTHER]);
  await assert.rejects(pg.query('SELECT public.set_account_exam_profile($1,$2,$3,$4)', [EMAIL, GENERATION, 'AT', 'T']), /JL_EXAM_PROFILE_IDENTITY/);
  const result = await pg.query('SELECT exam_country,exam_region FROM public.userprofile WHERE email=$1', [EMAIL]);
  assert.deepEqual(result.rows[0], { exam_country: null, exam_region: null });
});
