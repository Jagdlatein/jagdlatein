BEGIN;
SET LOCAL search_path=pg_catalog,public;

-- Extend the existing private recipient table only. Existing registration
-- tokens remain token registrations; no recipient, owner or opt-in is changed.
DO $$
DECLARE target oid := to_regclass('public.push_tokens'); browser_role text; item record; token_attribute smallint;
BEGIN
  IF target IS NULL OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid=target AND relkind='r') OR
    EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid=target OR inhparent=target) THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: existing ordinary push_tokens table required';
  END IF;
  LOCK TABLE public.push_tokens IN ACCESS EXCLUSIVE MODE;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role' AND (rolbypassrls OR rolsuper)) THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: service role required';
  END IF;
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=browser_role AND NOT rolbypassrls AND NOT rolsuper) OR
      pg_has_role(browser_role,'service_role','MEMBER') OR
      pg_has_role(browser_role,(SELECT relowner FROM pg_class WHERE oid=target),'MEMBER') THEN
      RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: unsafe browser role';
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('token','text'::regtype),('platform','text'::regtype),
    ('enabled','boolean'::regtype),('updated_at','timestamptz'::regtype),('account_email','text'::regtype)) AS required(name,kind) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=target AND attname=item.name AND attnum>0 AND NOT attisdropped
      AND atttypid=item.kind AND attgenerated='' AND attidentity='') THEN
      RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: incompatible required column';
    END IF;
  END LOOP;
  SELECT attnum INTO token_attribute FROM pg_attribute WHERE attrelid=target AND attname='token' AND NOT attisdropped;
  IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indrelid=target AND indisunique AND indisvalid AND indisready AND
    indimmediate AND indnkeyatts=1 AND indkey[0]=token_attribute AND indexprs IS NULL AND indpred IS NULL) THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: plain token conflict key required';
  END IF;
  IF to_regprocedure('public.require_current_request_actor()') IS NULL OR
    NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=target AND NOT tgisinternal AND tgenabled='O' AND
      tgname='jagdlatein_live_owner' AND tgfoid=to_regprocedure('public.guard_live_account_owner()') AND
      tgtype=23 AND tgargs=decode('6163636f756e745f656d61696c00','hex') AND tgqual IS NULL) THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: current-account owner guard required';
  END IF;
END $$;

ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS registration_kind text NOT NULL DEFAULT 'token';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.push_tokens'::regclass AND attname='registration_kind'
    AND atttypid='text'::regtype AND attnotnull AND attgenerated='' AND attidentity='' AND NOT attisdropped) THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: incompatible registration kind';
  END IF;
  IF EXISTS (SELECT 1 FROM public.push_tokens WHERE registration_kind NOT IN ('token','fid') OR
    (registration_kind='fid' AND (platform IS NULL OR platform NOT IN ('ios','web')))) THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: unsupported existing registration kind';
  END IF;
END $$;
ALTER TABLE public.push_tokens ALTER COLUMN registration_kind SET DEFAULT 'token';
ALTER TABLE public.push_tokens DROP CONSTRAINT IF EXISTS jagdlatein_push_registration_kind;
ALTER TABLE public.push_tokens ADD CONSTRAINT jagdlatein_push_registration_kind
  CHECK (registration_kind IN ('token','fid') AND (registration_kind='token' OR (platform IS NOT NULL AND platform IN ('ios','web'))));
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jagdlatein_server_only ON public.push_tokens;
CREATE POLICY jagdlatein_server_only ON public.push_tokens AS RESTRICTIVE FOR ALL TO PUBLIC USING(false) WITH CHECK(false);
REVOKE ALL ON public.push_tokens FROM PUBLIC,anon,authenticated,service_role;
DO $$
DECLARE columns text; browser_role text;
BEGIN
  SELECT string_agg(format('%I',attname),', ' ORDER BY attnum) INTO columns FROM pg_attribute
    WHERE attrelid='public.push_tokens'::regclass AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.push_tokens FROM PUBLIC,anon,authenticated,service_role',columns);
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(browser_role,'public.push_tokens','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
      has_any_column_privilege(browser_role,'public.push_tokens','SELECT,INSERT,UPDATE,REFERENCES') THEN
      RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: inherited browser privilege';
    END IF;
  END LOOP;
  IF has_table_privilege('service_role','public.push_tokens','DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
    has_any_column_privilege('service_role','public.push_tokens','REFERENCES') THEN
    RAISE EXCEPTION 'JL_PUSH_PLATFORMS_SETUP: inherited service privilege';
  END IF;
END $$;
GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;
CREATE INDEX IF NOT EXISTS push_tokens_platform_kind_enabled ON public.push_tokens(platform,registration_kind) WHERE enabled=true;
NOTIFY pgrst,'reload schema';
COMMIT;
