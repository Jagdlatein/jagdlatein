// Synthetic PostgreSQL/WASM only. Column names/types follow the reviewed
// production schema; no connection string, secret or real account is read.
const fs = require('node:fs');
const path = require('node:path');
const { root, createLoader } = require('./project-module.cjs');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if (!fs.existsSync(runtime)) throw new Error('Use the already installed isolated PGlite runtime; never a live database.');
const { PGlite } = require(runtime);
const ADMIN = 'isolated-operator@example.invalid', MEMBER = 'isolated-learner@example.invalid';
const ADMIN_GENERATION = 'a1111111-1111-4111-8111-111111111111', MEMBER_GENERATION = 'b2222222-2222-4222-8222-222222222222';
const TOKEN = 'c3333333-3333-4333-8333-333333333333';
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261108130000_admin_overview.sql'), 'utf8');
const prior = fs.readFileSync(path.join(root, 'supabase/migrations/20261007120000_account_deletion.sql'), 'utf8');
const actorGuard = prior.match(/CREATE OR REPLACE FUNCTION public\.require_current_request_actor\(\)[\s\S]*?END \$\$;/)[0];

async function createAdminAnalyticsFixture() {
  const pg = new PGlite();
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE TABLE userprofile(email text PRIMARY KEY,account_generation uuid UNIQUE,is_admin boolean NOT NULL DEFAULT false,is_premium boolean NOT NULL DEFAULT false,exam_country text,exam_region text);
    CREATE TABLE activity_results(account_email text,event_id uuid,type text,country text,topic text,total_questions integer,correct_answers integer,timed_out_answers integer,points integer,duration_seconds integer,finished_at timestamptz,verification text);
    CREATE TABLE course_progress(account_email text,course_id text,status text,completed_at timestamptz,updated_at timestamptz);
    CREATE TABLE paypal_subscriptions(subscription_id text,account_email text,account_generation uuid,account_deleted_at timestamptz,plan_id text,status text,paid_until timestamptz,trial_started_at timestamptz,trial_until timestamptz,review_reason text,verified_at timestamptz);
    CREATE TABLE paypal_subscription_payments(subscription_id text,payment_id text,status text,paid_at timestamptz,period_until timestamptz,amount text,currency text);
    CREATE TABLE apple_account_tokens(app_account_token uuid,account_email text,account_generation uuid,deleted_at timestamptz);
    CREATE TABLE apple_subscriptions(environment text,original_transaction_id text,app_account_token uuid,latest_transaction_id text,status integer,auto_renew boolean,access_until timestamptz,is_trial boolean,grace_until timestamptz,verified_at timestamptz);
    CREATE TABLE apple_subscription_transactions(environment text,transaction_id text,original_transaction_id text,app_account_token uuid,purchased_at timestamptz,expires_at timestamptz,revoked_at timestamptz,is_upgraded boolean,is_trial boolean);
    CREATE TABLE account_access_grants(account_generation uuid,starts_at timestamptz,expires_at timestamptz);
    CREATE TABLE usage_collection_settings(singleton boolean PRIMARY KEY,started_at timestamptz);
    CREATE TABLE usage_daily_counts(day date,page_key text,event_kind text,events bigint,last_at timestamptz);
    CREATE TABLE community_posts(account_email text,parent_id uuid,created_at timestamptz);
    CREATE TABLE community_reports(resolved_at timestamptz);
    CREATE TABLE photo_recognition_requests(created_at timestamptz);
    CREATE TABLE photo_recognition_months(month_start date,attempts integer);
    CREATE TABLE operator_trial_notification_outbox(state text);
    DO $$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.tablename);
      EXECUTE format('CREATE POLICY private_aggregate_fixture ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC USING(false) WITH CHECK(false)',t.tablename);
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t.tablename);
      EXECUTE format('GRANT SELECT ON public.%I TO service_role',t.tablename);
    END LOOP; END $$;`);
  await pg.exec(actorGuard);
  await pg.query('INSERT INTO userprofile(email,account_generation,is_admin,exam_country,exam_region) VALUES($1,$2,true,NULL,NULL),($3,$4,false,$5,$6)', [ADMIN, ADMIN_GENERATION, MEMBER, MEMBER_GENERATION, 'CH', 'ZH']);
  await pg.exec(migration);
  const headers = async (values = { 'x-jagdlatein-account-email': ADMIN, 'x-jagdlatein-account-generation': ADMIN_GENERATION }) => pg.query("SELECT set_config('request.headers',$1,false)", [JSON.stringify(values)]);
  await headers();
  const raw = async (options = {}) => {
    const args = { email: ADMIN, generation: ADMIN_GENERATION, from: '2026-10-25', to: '2026-10-25', environment: 'Production', paypal: 'Production', ...options };
    return (await pg.query('SELECT public.get_admin_overview($1,$2,$3,$4,$5,$6) AS value', [args.email, args.generation, args.from, args.to, args.environment, args.paypal])).rows[0].value;
  };
  const server = createLoader({
    './course-catalog': { courses: [{ id: 'fixture-course', title: 'Synthetischer Lernkurs' }] },
    './usage-analytics': { USAGE_PAGES: { lernen: 'Lernbereich' } },
    './admin-trial-overview': { trialOverviewJson: (value, status = 200) => Response.json(value, { status }) },
  })('lib/admin-overview-server.js');
  const client = createLoader()('lib/admin-overview-client.js');
  const rpc = { rpc: async (name, args) => {
    if (name !== 'get_admin_overview') throw new Error('Only the reviewed aggregate RPC is allowed.');
    try { return { data: await raw({ email: args.p_email, generation: args.p_account_generation, from: args.p_from, to: args.p_to, environment: args.p_environment, paypal: args.p_paypal_environment }), error: null }; }
    catch (error) { return { data: null, error: { code: error.code } }; }
  } };
  const dto = async (options = {}) => server.getAdminOverview(rpc, { email: ADMIN, accountGeneration: ADMIN_GENERATION }, { from: '2026-10-25', to: '2026-10-25', environment: 'Production', paypalEnvironment: 'Production', ...options });
  const sourceCounts = async () => (await pg.query(`SELECT jsonb_object_agg(table_name,total) AS counts FROM (
    SELECT 'userprofile' AS table_name,count(*) AS total FROM userprofile UNION ALL
    SELECT 'activity_results',count(*) FROM activity_results UNION ALL SELECT 'course_progress',count(*) FROM course_progress UNION ALL
    SELECT 'paypal_subscriptions',count(*) FROM paypal_subscriptions UNION ALL SELECT 'paypal_subscription_payments',count(*) FROM paypal_subscription_payments UNION ALL
    SELECT 'apple_account_tokens',count(*) FROM apple_account_tokens UNION ALL SELECT 'apple_subscriptions',count(*) FROM apple_subscriptions UNION ALL
    SELECT 'apple_subscription_transactions',count(*) FROM apple_subscription_transactions UNION ALL SELECT 'account_access_grants',count(*) FROM account_access_grants UNION ALL
    SELECT 'usage_collection_settings',count(*) FROM usage_collection_settings UNION ALL SELECT 'usage_daily_counts',count(*) FROM usage_daily_counts UNION ALL
    SELECT 'community_posts',count(*) FROM community_posts UNION ALL SELECT 'community_reports',count(*) FROM community_reports UNION ALL
    SELECT 'photo_recognition_requests',count(*) FROM photo_recognition_requests UNION ALL SELECT 'photo_recognition_months',count(*) FROM photo_recognition_months UNION ALL
    SELECT 'operator_trial_notification_outbox',count(*) FROM operator_trial_notification_outbox) q`)).rows[0].counts;
  return { pg, raw, dto, rpc, headers, server, client, migration, sourceCounts, close: () => pg.close() };
}
module.exports = { createAdminAnalyticsFixture, ADMIN, MEMBER, ADMIN_GENERATION, MEMBER_GENERATION, TOKEN };
