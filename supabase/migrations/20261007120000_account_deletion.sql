BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Manual schema preparation only: applying this file does not delete an account.
-- Enable ACCOUNT_DELETION_ENABLED only after this migration and the matching
-- generation-aware session/backend release are in place.
DO $$
DECLARE role_name text; item record; target oid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) THEN
    RAISE EXCEPTION 'JL_DELETE_SETUP: service_role must already bypass RLS';
  END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) OR
      EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name AND (rolbypassrls OR rolsuper)) OR
      pg_has_role(role_name,'service_role','MEMBER') THEN
      RAISE EXCEPTION 'JL_DELETE_SETUP: unsafe browser role';
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES
    ('userprofile','email'),('login_codes','email'),('push_tokens','token'),
    ('course_progress','account_email'),('activity_results','account_email'),
    ('quiz_identities','account_email'),('ranked_quiz_rounds','account_email'),
    ('verified_quiz_scores','account_email'),('community_profiles','account_email'),
    ('community_posts','account_email'),('community_reports','reporter_email'),
    ('community_events','account_email'),('paypal_subscriptions','account_email')
  ) AS required(table_name,column_name) LOOP
    target := to_regclass(format('public.%I',item.table_name));
    IF target IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_attribute WHERE attrelid = target AND attname = item.column_name
        AND attnum > 0 AND NOT attisdropped AND atttypid IN ('text'::regtype,'varchar'::regtype)
    ) THEN RAISE EXCEPTION 'JL_DELETE_SETUP: unexpected %.% schema',item.table_name,item.column_name; END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM public.userprofile GROUP BY lower(btrim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'JL_DELETE_SETUP: duplicate normalized account emails';
  END IF;
END $$;

ALTER TABLE public.userprofile ADD COLUMN IF NOT EXISTS account_generation uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.paypal_subscriptions ADD COLUMN IF NOT EXISTS account_deleted_at timestamptz;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS account_email text;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.userprofile'::regclass AND attname = 'account_generation'
    AND (atttypid <> 'uuid'::regtype OR NOT attnotnull OR attgenerated <> '' OR attidentity <> '')) OR
    EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.paypal_subscriptions'::regclass AND attname = 'account_deleted_at'
      AND (atttypid <> 'timestamptz'::regtype OR attgenerated <> '' OR attidentity <> '')) OR
    EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.push_tokens'::regclass AND attname = 'account_email'
      AND (atttypid <> 'text'::regtype OR attgenerated <> '' OR attidentity <> '')) THEN
    RAISE EXCEPTION 'JL_DELETE_SETUP: unexpected deletion column types';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS userprofile_account_generation_unique ON public.userprofile(account_generation);
CREATE INDEX IF NOT EXISTS push_tokens_account ON public.push_tokens(account_email);

-- Legacy registrations never recorded an owner; assigning one would be a guess.
-- Disable these orphan tokens. The next authenticated device registration
-- records its owner before enabling notifications again.
UPDATE public.push_tokens SET enabled = false WHERE account_email IS NULL AND enabled IS TRUE;

-- A removed author's own content becomes an empty, hidden tombstone. Other
-- learners' replies keep their parent reference and their own ownership.
ALTER TABLE public.community_posts ALTER COLUMN account_email DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_account_generation()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog,public AS $$
BEGIN
  IF NEW.account_generation IS DISTINCT FROM OLD.account_generation THEN
    RAISE EXCEPTION 'JL_ACCOUNT_GENERATION_IMMUTABLE';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS userprofile_generation_immutable ON public.userprofile;
CREATE TRIGGER userprofile_generation_immutable BEFORE UPDATE ON public.userprofile
FOR EACH ROW EXECUTE FUNCTION public.guard_account_generation();

-- Prevent a request which checked its session just before deletion from writing
-- personal data after the profile has been removed. KEY SHARE makes the check
-- and the data write serialize with the deletion transaction's profile lock.
CREATE OR REPLACE FUNCTION public.require_current_request_actor()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE
  request_headers jsonb := coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
  actor_email text := request_headers->>'x-jagdlatein-account-email';
  actor_generation text := request_headers->>'x-jagdlatein-account-generation';
  current_generation uuid;
BEGIN
  -- Provider verification and email-code reservations have no signed actor yet.
  -- Authenticated application clients always send both server-chosen headers.
  IF actor_email IS NULL AND actor_generation IS NULL THEN RETURN; END IF;
  IF actor_email IS NULL OR actor_generation IS NULL OR actor_email <> lower(btrim(actor_email)) OR
    actor_generation !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'JL_ACCOUNT_GENERATION_MISMATCH';
  END IF;
  SELECT account_generation INTO current_generation FROM public.userprofile
    WHERE lower(btrim(email)) = actor_email FOR KEY SHARE;
  IF NOT FOUND OR current_generation::text <> lower(actor_generation) THEN
    RAISE EXCEPTION 'JL_ACCOUNT_GENERATION_MISMATCH';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.guard_live_account_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE owner_email text := to_jsonb(NEW)->>TG_ARGV[0];
BEGIN
  PERFORM public.require_current_request_actor();
  IF owner_email IS NULL AND TG_TABLE_NAME = 'push_tokens' THEN
    IF to_jsonb(NEW)->>'enabled' = 'true' THEN RAISE EXCEPTION 'JL_ACCOUNT_OWNER_REQUIRED'; END IF;
    RETURN NEW;
  END IF;
  IF owner_email IS NULL AND TG_TABLE_NAME = 'community_posts' AND to_jsonb(NEW)->>'status' = 'deleted' THEN RETURN NEW; END IF;
  IF owner_email IS NULL OR owner_email <> lower(btrim(owner_email)) THEN
    RAISE EXCEPTION 'JL_ACCOUNT_OWNER_REQUIRED';
  END IF;
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = owner_email FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_ACCOUNT_OWNER_MISSING'; END IF;
  RETURN NEW;
END $$;
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('login_codes','email'),('course_progress','account_email'),('activity_results','account_email'),
    ('quiz_identities','account_email'),('ranked_quiz_rounds','account_email'),('verified_quiz_scores','account_email'),
    ('community_profiles','account_email'),('community_posts','account_email'),('community_events','account_email'),
    ('community_reports','reporter_email'),('push_tokens','account_email')
  ) AS owned(table_name,column_name) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS jagdlatein_live_owner ON public.%I',item.table_name);
    EXECUTE format('CREATE TRIGGER jagdlatein_live_owner BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_live_account_owner(%L)',item.table_name,item.column_name);
  END LOOP;
END $$;

-- Preserve the reviewed read queries under private names and guard the public
-- RPC entry points in the same transaction. A profile KEY SHARE lock prevents
-- deletion/recreation between generation verification and the returned data.
DO $$
BEGIN
  IF to_regprocedure('public.jagdlatein_activity_statistics_base(text)') IS NULL THEN
    ALTER FUNCTION public.get_activity_statistics(text) RENAME TO jagdlatein_activity_statistics_base;
  END IF;
  IF to_regprocedure('public.jagdlatein_community_read_base(text,text,jsonb)') IS NULL THEN
    ALTER FUNCTION public.community_read(text,text,jsonb) RENAME TO jagdlatein_community_read_base;
  END IF;
  IF to_regprocedure('public.jagdlatein_ranked_read_base(text,uuid)') IS NULL THEN
    ALTER FUNCTION public.read_ranked_quiz(text,uuid) RENAME TO jagdlatein_ranked_read_base;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.require_current_account_read(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE request_headers jsonb := coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
BEGIN
  PERFORM public.require_current_request_actor();
  IF request_headers ? 'x-jagdlatein-account-email' AND request_headers->>'x-jagdlatein-account-email' IS DISTINCT FROM p_email THEN
    RAISE EXCEPTION 'JL_ACCOUNT_GENERATION_MISMATCH';
  END IF;
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = p_email FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_ACCOUNT_OWNER_MISSING'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_activity_statistics(p_account_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
BEGIN
  PERFORM public.require_current_account_read(p_account_email);
  RETURN public.jagdlatein_activity_statistics_base(p_account_email);
END $$;
CREATE OR REPLACE FUNCTION public.community_read(p_actor_email text,p_mode text,p_options jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
BEGIN
  PERFORM public.require_current_account_read(p_actor_email);
  RETURN public.jagdlatein_community_read_base(p_actor_email,p_mode,p_options);
END $$;
CREATE OR REPLACE FUNCTION public.read_ranked_quiz(p_email text,p_round_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
BEGIN
  PERFORM public.require_current_account_read(p_email);
  RETURN public.jagdlatein_ranked_read_base(p_email,p_round_id);
END $$;

CREATE OR REPLACE FUNCTION public.get_current_course_progress(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
  PERFORM public.require_current_account_read(p_email);
  SELECT coalesce(jsonb_agg(to_jsonb(progress) ORDER BY progress.updated_at DESC,progress.course_id),'[]'::jsonb)
    INTO result FROM (
      SELECT course_id,status,answered_questions,total_questions,score,best_score,completed_at,updated_at
      FROM public.course_progress WHERE account_email = p_email
    ) progress;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_current_quiz_identity(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
  PERFORM public.require_current_account_read(p_email);
  SELECT jsonb_build_object('username',username,'country',country) INTO result
    FROM public.quiz_identities WHERE account_email = p_email;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_current_quiz_score(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
  PERFORM public.require_current_account_read(p_email);
  SELECT jsonb_build_object('username',username,'country',country,'total_points',total_points,
    'rounds',rounds,'updated_at',updated_at) INTO result FROM public.verified_quiz_scores WHERE account_email = p_email;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.guard_deleted_paypal_contract()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog,public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM public.paypal_subscriptions WHERE subscription_id = NEW.subscription_id AND account_deleted_at IS NOT NULL
  ) THEN RAISE EXCEPTION 'JL_DELETED_PAYPAL_CONTRACT'; END IF;
  IF TG_OP = 'UPDATE' AND OLD.account_deleted_at IS NOT NULL THEN
    IF NEW.account_deleted_at IS DISTINCT FROM OLD.account_deleted_at OR
      NEW.account_email IS DISTINCT FROM OLD.account_email OR NEW.paid_until IS NOT NULL OR
      NEW.trial_started_at IS NOT NULL OR NEW.trial_until IS NOT NULL THEN
      RAISE EXCEPTION 'JL_DELETED_PAYPAL_CONTRACT';
    END IF;
    NEW.review_reason := 'deleted_account';
  END IF;
  IF NEW.account_deleted_at IS NULL THEN
    PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = NEW.account_email FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_ACCOUNT_OWNER_MISSING'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS paypal_deleted_contract_guard ON public.paypal_subscriptions;
CREATE TRIGGER paypal_deleted_contract_guard BEFORE INSERT OR UPDATE ON public.paypal_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.guard_deleted_paypal_contract();

CREATE OR REPLACE FUNCTION public.ensure_paypal_account_profile(p_subscription_id text,p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE subscription_row public.paypal_subscriptions; profile_email text;
BEGIN
  IF p_subscription_id IS NULL OR p_subscription_id !~* '^I-[A-Z0-9]{6,64}$' OR
    p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320 THEN
    RAISE EXCEPTION 'JL_PAYPAL_PROFILE_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  SELECT * INTO subscription_row FROM public.paypal_subscriptions WHERE subscription_id = p_subscription_id FOR UPDATE;
  IF FOUND THEN
    IF subscription_row.account_deleted_at IS NOT NULL THEN RETURN jsonb_build_object('deleted',true); END IF;
    IF subscription_row.account_email <> p_email THEN RAISE EXCEPTION 'JL_PAYPAL_PROFILE_MISMATCH'; END IF;
  END IF;
  SELECT email INTO profile_email FROM public.userprofile WHERE lower(btrim(email)) = p_email FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.userprofile(user_id,email,is_premium,is_admin,updated_at)
      VALUES(gen_random_uuid(),p_email,false,false,clock_timestamp());
  END IF;
  RETURN jsonb_build_object('deleted',false);
END $$;

CREATE OR REPLACE FUNCTION public.delete_jagdlatein_account(p_email text,p_account_generation uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE
  account_row public.userprofile;
  removed_at timestamptz := clock_timestamp();
  detached_email text := gen_random_uuid()::text || '@deleted.invalid';
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320 OR
    p_account_generation IS NULL THEN RAISE EXCEPTION 'JL_DELETE_ACCOUNT_MISSING'; END IF;
  -- Refuse unknown dependencies instead of following a cascading foreign key
  -- into data which this deletion routine has never reviewed. Check on every
  -- call as well as relying on transactional rollback of ordinary FK failures.
  IF EXISTS (
    SELECT 1 FROM pg_constraint fk WHERE fk.contype = 'f' AND (fk.confrelid IN (
      'public.userprofile'::regclass,'public.login_codes'::regclass,'public.push_tokens'::regclass,
      'public.course_progress'::regclass,'public.activity_results'::regclass,
      'public.ranked_quiz_rounds'::regclass,'public.verified_quiz_scores'::regclass,
      'public.quiz_identities'::regclass,'public.community_profiles'::regclass,
      'public.community_reports'::regclass,'public.community_events'::regclass
    ) OR fk.confrelid = to_regclass('public.account_registration_codes')
    ) AND NOT EXISTS (
      SELECT 1 FROM (VALUES
        ('quiz_identities','ranked_quiz_rounds','account_email'),
        ('quiz_identities','verified_quiz_scores','account_email'),
        ('community_profiles','community_posts','account_email'),
        ('community_profiles','community_reports','reporter_email'),
        ('community_profiles','community_events','account_email')
      ) AS known(parent_table,child_table,child_column)
      WHERE fk.confrelid = to_regclass(format('public.%I',known.parent_table))
        AND fk.conrelid = to_regclass(format('public.%I',known.child_table))
        AND fk.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = fk.conrelid AND attname = known.child_column AND NOT attisdropped)]
        AND fk.confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = fk.confrelid AND attname = 'account_email' AND NOT attisdropped)]
    )
  ) THEN RAISE EXCEPTION 'JL_DELETE_SETUP: unreviewed account dependency'; END IF;
  -- Use the same lock order as PayPal account creation and quiz/community RPCs.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,731004));
  SELECT * INTO account_row FROM public.userprofile WHERE lower(btrim(email)) = p_email FOR UPDATE;
  IF NOT FOUND OR account_row.account_generation IS DISTINCT FROM p_account_generation THEN
    RAISE EXCEPTION 'JL_DELETE_ACCOUNT_MISSING';
  END IF;

  -- Block concurrent community/quiz RPCs through their existing account locks.
  -- Profile-presence triggers cover API writes that have already checked auth.
  IF to_regclass('public.apple_account_tokens') IS NOT NULL THEN
    IF to_regprocedure('public.detach_apple_account(text,uuid)') IS NULL THEN
      RAISE EXCEPTION 'JL_DELETE_SETUP: Apple detachment helper missing';
    END IF;
    PERFORM public.detach_apple_account(p_email,p_account_generation);
  END IF;

  DELETE FROM public.login_codes WHERE lower(btrim(email)) = p_email;
  IF to_regclass('public.account_registration_codes') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.account_registration_codes'::regclass
      AND attname = 'email' AND atttypid = 'text'::regtype AND NOT attisdropped) THEN
      RAISE EXCEPTION 'JL_DELETE_SETUP: unexpected registration code schema';
    END IF;
    EXECUTE 'DELETE FROM public.account_registration_codes WHERE lower(btrim(email)) = $1' USING p_email;
  END IF;
  DELETE FROM public.push_tokens WHERE account_email = p_email;
  DELETE FROM public.course_progress WHERE account_email = p_email;
  DELETE FROM public.activity_results WHERE account_email = p_email;
  DELETE FROM public.ranked_quiz_rounds WHERE account_email = p_email;
  DELETE FROM public.verified_quiz_scores WHERE account_email = p_email;
  DELETE FROM public.quiz_identities WHERE account_email = p_email;

  DELETE FROM public.community_reports WHERE reporter_email = p_email OR
    post_id IN (SELECT id FROM public.community_posts WHERE account_email = p_email);
  UPDATE public.community_reports SET resolved_by = NULL WHERE resolved_by = p_email;
  UPDATE public.community_posts SET moderated_by = NULL WHERE moderated_by = p_email;
  UPDATE public.community_posts SET account_email = NULL,status = 'deleted',solved = false,
    title = CASE WHEN parent_id IS NULL THEN 'Gelöschter Beitrag' ELSE NULL END,
    body = 'Inhalt entfernt.',updated_at = removed_at,moderated_by = NULL,moderated_at = NULL
    WHERE account_email = p_email;
  DELETE FROM public.community_events WHERE account_email = p_email;
  DELETE FROM public.community_profiles WHERE account_email = p_email;

  -- Keep provider/transaction references for billing reconciliation; remove the
  -- email and all entitlement. A new account with the same email receives a new
  -- generation and can never inherit this detached provider contract.
  UPDATE public.paypal_subscriptions SET account_email = detached_email,account_deleted_at = removed_at,
    paid_until = NULL,trial_started_at = NULL,trial_until = NULL,review_reason = 'deleted_account'
    WHERE account_email = p_email AND account_deleted_at IS NULL;
  DELETE FROM public.userprofile WHERE account_generation = p_account_generation;
  RETURN jsonb_build_object('deleted',true);
END $$;

REVOKE ALL ON FUNCTION public.guard_account_generation(),public.guard_live_account_owner(),
  public.require_current_request_actor(),public.guard_deleted_paypal_contract(),public.ensure_paypal_account_profile(text,text),public.delete_jagdlatein_account(text,uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.jagdlatein_activity_statistics_base(text),public.jagdlatein_community_read_base(text,text,jsonb),
  public.jagdlatein_ranked_read_base(text,uuid),public.require_current_account_read(text)
  FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_activity_statistics(text),public.community_read(text,text,jsonb),public.read_ranked_quiz(text,uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_statistics(text),public.community_read(text,text,jsonb),public.read_ranked_quiz(text,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_current_course_progress(text),public.get_current_quiz_identity(text),public.get_current_quiz_score(text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_course_progress(text),public.get_current_quiz_identity(text),public.get_current_quiz_score(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_paypal_account_profile(text,text),public.delete_jagdlatein_account(text,uuid) TO service_role;

COMMIT;
