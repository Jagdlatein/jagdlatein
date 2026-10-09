BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Only creates private schema and RPCs. No existing account is changed and no
-- free or paid access is granted by applying this migration.
DO $$
DECLARE item record; target oid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon' AND NOT rolbypassrls AND NOT rolsuper) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated' AND NOT rolbypassrls AND NOT rolsuper) OR
    pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') THEN
    RAISE EXCEPTION 'JL_REGISTER_SETUP: unsafe database roles';
  END IF;
  FOR item IN SELECT * FROM (VALUES
    ('email','text'::regtype),('user_id','uuid'::regtype),('is_premium','boolean'::regtype),
    ('is_admin','boolean'::regtype),('updated_at','timestamptz'::regtype)
  ) AS required(column_name,column_type) LOOP
    target := to_regclass('public.userprofile');
    IF target IS NULL OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = target AND
      attname = item.column_name AND attnum > 0 AND NOT attisdropped AND atttypid = item.column_type) THEN
      RAISE EXCEPTION 'JL_REGISTER_SETUP: unexpected userprofile schema';
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM public.userprofile GROUP BY lower(btrim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'JL_REGISTER_SETUP: duplicate normalized emails';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.account_registration_codes (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  registration_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  code_hash text NOT NULL CHECK (code_hash ~ '^\$2[aby]\$10\$[./A-Za-z0-9]{53}$'),
  expires_at timestamptz NOT NULL,
  requested_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  CHECK (expires_at > requested_at AND expires_at <= requested_at + interval '10 minutes')
);
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES ('email','text'::regtype),('registration_id','uuid'::regtype),
    ('code_hash','text'::regtype),('expires_at','timestamptz'::regtype),('requested_at','timestamptz'::regtype),
    ('attempts','integer'::regtype)) AS required(column_name,column_type) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.account_registration_codes'::regclass AND
      attname = item.column_name AND atttypid = item.column_type AND attnum > 0 AND NOT attisdropped AND attnotnull) THEN
      RAISE EXCEPTION 'JL_REGISTER_SETUP: unexpected registration-code schema';
    END IF;
  END LOOP;
END $$;
ALTER TABLE public.account_registration_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS account_registration_codes_expiry ON public.account_registration_codes(expires_at);
REVOKE ALL ON public.account_registration_codes FROM PUBLIC,anon,authenticated;
-- Even the application service may access this table only through the bounded
-- RPCs. A browser role cannot request codes or create a profile directly.
REVOKE ALL ON public.account_registration_codes FROM service_role;

CREATE OR REPLACE FUNCTION public.reserve_account_registration_code(p_email text,p_code_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE last_requested timestamptz; requested timestamptz := clock_timestamp();
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320 OR
    p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_email ~ '[[:cntrl:]]' OR
    p_code_hash IS NULL OR p_code_hash !~ '^\$2[aby]\$10\$[./A-Za-z0-9]{53}$' THEN
    RAISE EXCEPTION 'JL_REGISTER_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,731004));
  SELECT requested_at INTO last_requested FROM public.account_registration_codes WHERE email = p_email FOR UPDATE;
  IF FOUND AND last_requested > requested - interval '60 seconds' THEN RETURN jsonb_build_object('reserved',false); END IF;
  -- Remove expired codes only during a real request; their email addresses are
  -- temporary. The bounded lifetime also applies to verification below.
  DELETE FROM public.account_registration_codes AS codes USING (
    SELECT email FROM public.account_registration_codes WHERE expires_at <= requested AND email <> p_email
      ORDER BY expires_at FOR UPDATE SKIP LOCKED LIMIT 100
  ) AS expired WHERE codes.email = expired.email;
  INSERT INTO public.account_registration_codes(email,registration_id,code_hash,requested_at,expires_at,attempts)
    VALUES(p_email,gen_random_uuid(),p_code_hash,requested,requested + interval '10 minutes',0)
    ON CONFLICT(email) DO UPDATE SET registration_id = EXCLUDED.registration_id,code_hash = EXCLUDED.code_hash,
      requested_at = EXCLUDED.requested_at,expires_at = EXCLUDED.expires_at,attempts = 0;
  RETURN jsonb_build_object('reserved',true);
END $$;

CREATE OR REPLACE FUNCTION public.begin_account_registration_attempt(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE code_row public.account_registration_codes;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320 THEN
    RAISE EXCEPTION 'JL_REGISTER_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,731004));
  SELECT * INTO code_row FROM public.account_registration_codes WHERE email = p_email FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid',false); END IF;
  IF code_row.expires_at <= clock_timestamp() THEN
    DELETE FROM public.account_registration_codes WHERE email = p_email;
    RETURN jsonb_build_object('valid',false);
  END IF;
  IF code_row.attempts >= 5 THEN RETURN jsonb_build_object('valid',false,'limited',true); END IF;
  UPDATE public.account_registration_codes SET attempts = attempts + 1 WHERE email = p_email;
  RETURN jsonb_build_object('valid',true,'registrationId',code_row.registration_id,'codeHash',code_row.code_hash);
END $$;

CREATE OR REPLACE FUNCTION public.consume_account_registration_code(p_email text,p_registration_id uuid,p_code_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE code_row public.account_registration_codes; profile_row public.userprofile;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320 OR
    p_registration_id IS NULL OR p_code_hash IS NULL THEN RAISE EXCEPTION 'JL_REGISTER_INVALID'; END IF;
  -- Same lock order as deletion, PayPal creation and community/quiz identity.
  -- Email ownership is verified by the private server before this consume RPC.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,731004));
  SELECT * INTO code_row FROM public.account_registration_codes WHERE email = p_email FOR UPDATE;
  IF NOT FOUND OR code_row.registration_id IS DISTINCT FROM p_registration_id OR code_row.code_hash <> p_code_hash OR
    code_row.expires_at <= clock_timestamp() OR code_row.attempts NOT BETWEEN 1 AND 5 THEN
    RETURN jsonb_build_object('consumed',false);
  END IF;
  SELECT * INTO profile_row FROM public.userprofile WHERE lower(btrim(email)) = p_email FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.userprofile(user_id,email,is_premium,is_admin,updated_at)
      VALUES(gen_random_uuid(),p_email,false,false,clock_timestamp()) RETURNING * INTO profile_row;
  END IF;
  -- Existing flags, billing data and immutable generation are never reset.
  -- New profiles use the generation-column default when installed by the Apple
  -- or deletion migration. A new account never inherits a removed generation.
  DELETE FROM public.account_registration_codes WHERE email = p_email AND registration_id = p_registration_id;
  RETURN jsonb_build_object('consumed',true,'profile',to_jsonb(profile_row));
END $$;

REVOKE ALL ON FUNCTION public.reserve_account_registration_code(text,text),public.begin_account_registration_attempt(text),
  public.consume_account_registration_code(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_account_registration_code(text,text),public.begin_account_registration_attempt(text),
  public.consume_account_registration_code(text,uuid,text) TO service_role;
COMMIT;
