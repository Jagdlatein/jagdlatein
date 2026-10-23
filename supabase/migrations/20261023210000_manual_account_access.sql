BEGIN;
SET LOCAL search_path=pg_catalog,public;

-- Operator-created, finite courtesy coverage. This migration grants nobody
-- access and creates no payment, provider contract or renewal instruction.
DO $$
BEGIN
  IF to_regprocedure('public.require_complete_account_deletion_dependencies()') IS NULL OR
    NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.userprofile') AND
      attname='account_generation' AND atttypid='uuid'::regtype AND attnotnull AND NOT attisdropped) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role' AND (rolbypassrls OR rolsuper)) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon' AND NOT rolbypassrls AND NOT rolsuper) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated' AND NOT rolbypassrls AND NOT rolsuper) OR
    pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') THEN
    RAISE EXCEPTION 'JL_MANUAL_ACCESS_SETUP';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.account_access_grants (
  account_generation uuid PRIMARY KEY REFERENCES public.userprofile(account_generation) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 240),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (isfinite(starts_at) AND isfinite(expires_at) AND isfinite(created_at) AND expires_at > starts_at)
);
-- Refuse an incompatible pre-existing table instead of making it writable.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM (VALUES ('account_generation','uuid'::regtype),('starts_at','timestamptz'::regtype),
      ('expires_at','timestamptz'::regtype),('reason','text'::regtype),('created_at','timestamptz'::regtype)) AS expected(name,kind)
    WHERE NOT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid='public.account_access_grants'::regclass
      AND a.attname=expected.name AND a.atttypid=expected.kind AND a.attnotnull AND NOT a.attisdropped)) OR
    NOT EXISTS (SELECT 1 FROM pg_constraint fk WHERE fk.conrelid='public.account_access_grants'::regclass
      AND fk.confrelid='public.userprofile'::regclass AND fk.contype='f' AND fk.confdeltype='c'
      AND fk.conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.account_access_grants'::regclass AND attname='account_generation')]
      AND fk.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.userprofile'::regclass AND attname='account_generation')]) THEN
    RAISE EXCEPTION 'JL_MANUAL_ACCESS_SETUP';
  END IF;
END $$;
ALTER TABLE public.account_access_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.account_access_grants FROM PUBLIC,anon,authenticated,service_role;
DO $$
DECLARE column_name text; role_name text;
BEGIN
  FOR column_name IN SELECT attname FROM pg_attribute WHERE attrelid='public.account_access_grants'::regclass
      AND attnum>0 AND NOT attisdropped LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON TABLE public.account_access_grants FROM PUBLIC,anon,authenticated,service_role',column_name);
  END LOOP;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF has_table_privilege(role_name,'public.account_access_grants','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
      has_any_column_privilege(role_name,'public.account_access_grants','INSERT,UPDATE,REFERENCES') OR
      (role_name <> 'service_role' AND (has_table_privilege(role_name,'public.account_access_grants','SELECT') OR
        has_any_column_privilege(role_name,'public.account_access_grants','SELECT'))) THEN
      RAISE EXCEPTION 'JL_MANUAL_ACCESS_SETUP: inherited table privilege';
    END IF;
  END LOOP;
END $$;
GRANT SELECT ON TABLE public.account_access_grants TO service_role;

-- Extend the latest installed deletion dependency check by this exact cascade
-- dependency. Unreviewed dependencies on the new table must still fail closed.
CREATE OR REPLACE FUNCTION public.require_complete_account_deletion_dependencies()
RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint fk WHERE fk.contype='f' AND fk.confrelid IN (
      to_regclass('public.userprofile'),to_regclass('public.login_codes'),to_regclass('public.push_tokens'),
      to_regclass('public.course_progress'),to_regclass('public.activity_results'),
      to_regclass('public.ranked_quiz_rounds'),to_regclass('public.verified_quiz_scores'),
      to_regclass('public.quiz_identities'),to_regclass('public.community_profiles'),
      to_regclass('public.community_reports'),to_regclass('public.community_events'),to_regclass('public.community_blocks'),
      to_regclass('public.account_registration_codes'),to_regclass('public.paypal_subscriptions'),
      to_regclass('public.paypal_subscription_payments'),to_regclass('public.paypal_checkout_requests'),
      to_regclass('public.apple_account_tokens'),to_regclass('public.apple_subscriptions'),
      to_regclass('public.apple_subscription_transactions'),to_regclass('public.apple_subscription_notifications'),
      to_regclass('public.apple_review_login_limits'),to_regclass('public.operator_trial_notification_outbox'),
      to_regclass('public.account_access_grants')
    ) AND NOT EXISTS (
      SELECT 1 FROM (VALUES
        ('quiz_identities','ranked_quiz_rounds',ARRAY['account_email'],ARRAY['account_email']),
        ('quiz_identities','verified_quiz_scores',ARRAY['account_email'],ARRAY['account_email']),
        ('community_profiles','community_posts',ARRAY['account_email'],ARRAY['account_email']),
        ('community_profiles','community_reports',ARRAY['account_email'],ARRAY['reporter_email']),
        ('community_profiles','community_events',ARRAY['account_email'],ARRAY['account_email']),
        ('userprofile','paypal_subscriptions',ARRAY['account_generation'],ARRAY['account_generation']),
        ('userprofile','paypal_checkout_requests',ARRAY['account_generation'],ARRAY['account_generation']),
        ('userprofile','operator_trial_notification_outbox',ARRAY['account_generation'],ARRAY['account_generation']),
        ('userprofile','account_access_grants',ARRAY['account_generation'],ARRAY['account_generation']),
        ('paypal_subscriptions','paypal_subscription_payments',ARRAY['subscription_id'],ARRAY['subscription_id']),
        ('apple_account_tokens','apple_subscriptions',ARRAY['app_account_token'],ARRAY['app_account_token']),
        ('apple_account_tokens','apple_subscription_transactions',ARRAY['app_account_token'],ARRAY['app_account_token']),
        ('apple_subscriptions','apple_subscription_transactions',ARRAY['environment','original_transaction_id'],ARRAY['environment','original_transaction_id']),
        ('apple_subscriptions','apple_subscription_notifications',ARRAY['environment','original_transaction_id'],ARRAY['environment','original_transaction_id'])
      ) AS known(parent_table,child_table,parent_columns,child_columns)
      WHERE fk.confrelid=to_regclass(format('public.%I',known.parent_table))
        AND fk.conrelid=to_regclass(format('public.%I',known.child_table))
        AND fk.conkey=ARRAY(SELECT attribute.attnum FROM unnest(known.child_columns) WITH ORDINALITY AS column_name(name,ordinal)
          JOIN pg_attribute attribute ON attribute.attrelid=fk.conrelid AND attribute.attname=column_name.name
            AND NOT attribute.attisdropped ORDER BY column_name.ordinal)
        AND fk.confkey=ARRAY(SELECT attribute.attnum FROM unnest(known.parent_columns) WITH ORDINALITY AS column_name(name,ordinal)
          JOIN pg_attribute attribute ON attribute.attrelid=fk.confrelid AND attribute.attname=column_name.name
            AND NOT attribute.attisdropped ORDER BY column_name.ordinal)
    )
  ) THEN RAISE EXCEPTION 'JL_DELETE_SETUP: unreviewed account dependency'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.require_complete_account_deletion_dependencies() FROM PUBLIC,anon,authenticated,service_role;
SELECT public.require_complete_account_deletion_dependencies();
NOTIFY pgrst,'reload schema';
COMMIT;
