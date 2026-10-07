-- TEST ONLY: missing historical push baseline for xwkvrsuplytalwploebw.
-- Kept outside supabase/migrations so production db-push cannot apply it.
-- Creates an empty private table if missing; existing rows/columns are untouched.
BEGIN;
SET LOCAL search_path = pg_catalog, public;

DO $$
DECLARE
  browser_role text;
  target oid := to_regclass('public.push_tokens');
  target_kind "char";
  target_owner oid;
  item record;
  token_attribute smallint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) THEN
    RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: service_role must already bypass RLS';
  END IF;
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role AND NOT rolbypassrls AND NOT rolsuper) OR
      pg_has_role(browser_role,'service_role','MEMBER') THEN
      RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: unsafe browser role';
    END IF;
  END LOOP;

  IF target IS NULL THEN
    CREATE TABLE public.push_tokens (
      token text PRIMARY KEY,
      platform text,
      enabled boolean,
      updated_at timestamptz
    );
    target := 'public.push_tokens'::regclass;
  ELSE
    SELECT relkind,relowner INTO target_kind,target_owner FROM pg_class WHERE oid = target;
    IF target_kind <> 'r' OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = target OR inhparent = target) THEN
      RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: push_tokens must be an ordinary non-inherited table';
    END IF;
    LOCK TABLE public.push_tokens IN ACCESS EXCLUSIVE MODE;
  END IF;
  SELECT relowner INTO target_owner FROM pg_class WHERE oid = target;
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF pg_has_role(browser_role,target_owner,'MEMBER') THEN
      RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: browser role inherits table ownership';
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM (VALUES
    ('token','text'::regtype),('platform','text'::regtype),
    ('enabled','boolean'::regtype),('updated_at','timestamptz'::regtype)
  ) AS required(column_name,column_type) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = target AND attname = item.column_name AND
      attnum > 0 AND NOT attisdropped AND atttypid = item.column_type AND attgenerated = '' AND attidentity = '') THEN
      RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: incompatible push_tokens column %',item.column_name;
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = target AND attname = 'account_email' AND NOT attisdropped AND
    (atttypid <> 'text'::regtype OR attnotnull OR attgenerated <> '' OR attidentity <> '')) OR
    EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = target AND attnum > 0 AND NOT attisdropped AND
      attname NOT IN ('token','platform','enabled','updated_at','account_email') AND
      attnotnull AND NOT atthasdef AND attgenerated = '' AND attidentity = '') THEN
    RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: incompatible additional push_tokens column';
  END IF;
  SELECT attnum INTO token_attribute FROM pg_attribute WHERE attrelid = target AND attname = 'token' AND NOT attisdropped;
  IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indrelid = target AND indisunique AND indisvalid AND indisready AND
    indimmediate AND indnkeyatts = 1 AND indkey[0] = token_attribute AND indexprs IS NULL AND indpred IS NULL) THEN
    RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: token requires a plain unique conflict key';
  END IF;
  -- Unexpected callbacks/constraints could change or block later migration
  -- writes. The owner guard installed by the account migration is replay-safe.
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = target AND NOT tgisinternal AND tgenabled <> 'D' AND NOT coalesce((
      tgname = 'jagdlatein_live_owner' AND tgfoid = to_regprocedure('public.guard_live_account_owner()') AND
      tgtype = 23 AND tgargs = decode('6163636f756e745f656d61696c00','hex') AND tgqual IS NULL),false)) OR
    EXISTS (SELECT 1 FROM pg_rewrite WHERE ev_class = target) OR
    EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = target AND contype IN ('c','f','x')) THEN
    RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: unreviewed push_tokens behavior';
  END IF;
END $$;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jagdlatein_server_only ON public.push_tokens;
CREATE POLICY jagdlatein_server_only ON public.push_tokens AS RESTRICTIVE FOR ALL TO PUBLIC USING(false) WITH CHECK(false);
REVOKE ALL ON public.push_tokens FROM PUBLIC,anon,authenticated,service_role;
DO $$
DECLARE columns text; browser_role text; privilege_name text;
BEGIN
  SELECT string_agg(format('%I',attname),', ' ORDER BY attnum) INTO columns FROM pg_attribute
    WHERE attrelid = 'public.push_tokens'::regclass AND attnum > 0 AND NOT attisdropped;
  EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON public.push_tokens FROM PUBLIC,anon,authenticated,service_role',columns);
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOR privilege_name IN SELECT DISTINCT acl.privilege_type FROM pg_class rel
      CROSS JOIN LATERAL aclexplode(coalesce(rel.relacl,acldefault('r',rel.relowner))) acl
      WHERE rel.oid = 'public.push_tokens'::regclass AND acl.privilege_type NOT IN ('SELECT','INSERT','UPDATE','DELETE') LOOP
      IF has_table_privilege(browser_role,'public.push_tokens',privilege_name) THEN
        RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: inherited unsafe browser privilege';
      END IF;
    END LOOP;
    IF has_any_column_privilege(browser_role,'public.push_tokens','REFERENCES') THEN
      RAISE EXCEPTION 'JL_IOS_TEST_PUSH_SETUP: inherited unsafe browser column privilege';
    END IF;
  END LOOP;
END $$;
GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;
COMMIT;
