BEGIN;
SET LOCAL search_path = pg_catalog,public;

-- Private counters only; no credentials, raw IPs or email addresses. Applying
-- this migration enables no login and changes no account or entitlement.
DO $$
DECLARE item record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) OR
     NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon' AND NOT rolbypassrls AND NOT rolsuper) OR
     NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated' AND NOT rolbypassrls AND NOT rolsuper) OR
     pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') OR
     to_regclass('public.apple_account_tokens') IS NULL OR to_regclass('public.userprofile') IS NULL THEN
    RAISE EXCEPTION 'JL_REVIEW_LOGIN_SETUP';
  END IF;
  FOR item IN SELECT * FROM (VALUES
    ('userprofile','account_generation','uuid'::regtype,true),
    ('userprofile','email','text'::regtype,NULL::boolean),
    ('userprofile','is_admin','boolean'::regtype,NULL::boolean),
    ('userprofile','is_premium','boolean'::regtype,NULL::boolean),
    ('apple_account_tokens','app_account_token','uuid'::regtype,true),
    ('apple_account_tokens','account_generation','uuid'::regtype,true),
    ('apple_account_tokens','account_email','text'::regtype,false),
    ('apple_account_tokens','deleted_at','timestamptz'::regtype,false)
  ) AS required(table_name,column_name,column_type,required_not_null) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass(format('public.%I',item.table_name)) AND
      attname = item.column_name AND atttypid = item.column_type AND attnum > 0 AND NOT attisdropped AND
      (item.required_not_null IS NULL OR attnotnull = item.required_not_null)) THEN
      RAISE EXCEPTION 'JL_REVIEW_LOGIN_SETUP: unexpected account binding schema';
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.apple_review_login_limits (
  account_generation uuid NOT NULL,
  app_account_token uuid NOT NULL,
  bucket_kind text NOT NULL CHECK (bucket_kind IN ('account','ip')),
  ip_bucket text NOT NULL CHECK (ip_bucket ~ '^[a-f0-9]{64}$'),
  window_start timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts BETWEEN 0 AND 30),
  PRIMARY KEY (account_generation,app_account_token,bucket_kind,ip_bucket,window_start),
  CHECK (expires_at = window_start + interval '10 minutes')
);
ALTER TABLE public.apple_review_login_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.apple_review_login_limits FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX IF NOT EXISTS apple_review_login_limits_expiry ON public.apple_review_login_limits(expires_at);

CREATE OR REPLACE FUNCTION public.reserve_apple_review_login_attempt(
  p_account_generation uuid,p_app_account_token uuid,p_ip_bucket text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE
  owner_email text; profile_row public.userprofile;
  observed timestamptz := clock_timestamp(); window_at timestamptz;
  account_count integer; ip_count integer;
  account_bucket constant text := repeat('0',64);
BEGIN
  IF p_account_generation IS NULL OR p_app_account_token IS NULL OR p_ip_bucket IS NULL OR
    p_ip_bucket !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'JL_REVIEW_LOGIN_INVALID'; END IF;
  SELECT account_email INTO owner_email FROM public.apple_account_tokens
    WHERE app_account_token = p_app_account_token AND account_generation = p_account_generation AND deleted_at IS NULL;
  IF NOT FOUND OR owner_email IS NULL THEN RETURN jsonb_build_object('allowed',false,'identityMissing',true); END IF;
  -- Match the existing account-deletion lock order before locking either row.
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_email,731004));
  SELECT * INTO profile_row FROM public.userprofile WHERE lower(btrim(email)) = owner_email FOR UPDATE;
  IF NOT FOUND OR profile_row.account_generation IS DISTINCT FROM p_account_generation OR
    profile_row.is_admin IS DISTINCT FROM false OR profile_row.is_premium IS DISTINCT FROM false THEN
    RETURN jsonb_build_object('allowed',false,'identityMissing',true);
  END IF;
  PERFORM 1 FROM public.apple_account_tokens WHERE app_account_token = p_app_account_token AND
    account_generation = p_account_generation AND account_email = owner_email AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed',false,'identityMissing',true); END IF;
  observed := clock_timestamp();
  window_at := to_timestamp(floor(extract(epoch FROM observed) / 600) * 600);
  SELECT attempts INTO account_count FROM public.apple_review_login_limits WHERE account_generation = p_account_generation
    AND app_account_token = p_app_account_token AND bucket_kind = 'account' AND ip_bucket = account_bucket AND window_start = window_at;
  SELECT attempts INTO ip_count FROM public.apple_review_login_limits WHERE account_generation = p_account_generation
    AND app_account_token = p_app_account_token AND bucket_kind = 'ip' AND ip_bucket = p_ip_bucket AND window_start = window_at;
  IF coalesce(account_count,0) >= 30 OR coalesce(ip_count,0) >= 10 THEN
    RETURN jsonb_build_object('allowed',false,'retryAfter',greatest(1,ceil(extract(epoch FROM window_at + interval '10 minutes' - observed))::integer));
  END IF;
  INSERT INTO public.apple_review_login_limits(account_generation,app_account_token,bucket_kind,ip_bucket,window_start,expires_at,attempts)
    VALUES(p_account_generation,p_app_account_token,'account',account_bucket,window_at,window_at + interval '10 minutes',1),
          (p_account_generation,p_app_account_token,'ip',p_ip_bucket,window_at,window_at + interval '10 minutes',1)
    ON CONFLICT(account_generation,app_account_token,bucket_kind,ip_bucket,window_start)
      DO UPDATE SET attempts = public.apple_review_login_limits.attempts + 1;
  DELETE FROM public.apple_review_login_limits AS limits USING (
    SELECT account_generation,app_account_token,bucket_kind,ip_bucket,window_start FROM public.apple_review_login_limits
      WHERE expires_at <= observed ORDER BY expires_at FOR UPDATE SKIP LOCKED LIMIT 100
  ) AS expired WHERE limits.account_generation = expired.account_generation AND limits.app_account_token = expired.app_account_token
    AND limits.bucket_kind = expired.bucket_kind AND limits.ip_bucket = expired.ip_bucket AND limits.window_start = expired.window_start;
  RETURN jsonb_build_object('allowed',true);
END $$;

REVOKE ALL ON FUNCTION public.reserve_apple_review_login_attempt(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_apple_review_login_attempt(uuid,uuid,text) TO service_role;

-- A closed counting window is not a background deletion job. Active requests
-- prune expired counters in bounded batches; actual account deletion removes
-- all counters of that immutable generation even if no later login occurs.
CREATE OR REPLACE FUNCTION public.delete_apple_review_login_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
BEGIN
  DELETE FROM public.apple_review_login_limits WHERE account_generation = OLD.account_generation;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.delete_apple_review_login_limits() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS delete_apple_review_login_limits ON public.userprofile;
CREATE TRIGGER delete_apple_review_login_limits AFTER DELETE ON public.userprofile
  FOR EACH ROW EXECUTE FUNCTION public.delete_apple_review_login_limits();
NOTIFY pgrst,'reload schema';
COMMIT;
