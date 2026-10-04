-- MANUAL MAINTENANCE ONLY. Never add this file to automatic migrations.
-- First review the live catalog, take a restorable backup and deploy the app
-- that uses server-owned ranked rounds. This removes only the two old tables
-- and the exact obsolete get_week_scores() function inspected by the user.
-- Any error aborts the transaction; do not run just a selected part of the file.
BEGIN;
SET LOCAL search_path = pg_catalog, public;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $maintenance$
DECLARE
  item record;
  relation_oid oid;
  old_oids oid[] := ARRAY[]::oid[];
  old_names text[] := ARRAY[]::text[];
  function_oid oid;
  legacy_function_oid oid;
  legacy_function_md5 constant text := '925e4a7640fe38f3de04b78fc0b39e7c';
  legacy_function_result constant text := 'TABLE(username text, country text, total_points integer, rounds integer, updated_at timestamp with time zone)';
  expected_columns text[];
  actual_columns text[];
  missing_names boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('JL_REMOVE_LEGACY_QUIZ', 0));

  IF to_regrole('anon') IS NULL OR to_regrole('authenticated') IS NULL OR to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: required Supabase roles are missing.';
  END IF;

  -- Require the real ranked schema, including the final result dependency.
  FOR item IN SELECT * FROM (VALUES
    ('quiz_identities'), ('quiz_reserved_names'), ('ranked_quiz_rounds'),
    ('verified_quiz_scores'), ('activity_results')
  ) AS required(table_name) LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    IF relation_oid IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_class WHERE oid = relation_oid AND relkind = 'r' AND relrowsecurity
    ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: ranked migration missing or unsafe table: %', item.table_name;
    END IF;
    EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE', item.table_name);
    IF has_table_privilege('anon', relation_oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR has_table_privilege('authenticated', relation_oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR has_any_column_privilege('anon', relation_oid, 'SELECT,INSERT,UPDATE,REFERENCES')
      OR has_any_column_privilege('authenticated', relation_oid, 'SELECT,INSERT,UPDATE,REFERENCES') THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: client grants remain on ranked table: %', item.table_name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('quiz_reserved_names'), ('ranked_quiz_rounds')) AS private_table(table_name) LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    IF has_table_privilege('service_role', relation_oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR has_any_column_privilege('service_role', relation_oid, 'SELECT,INSERT,UPDATE,REFERENCES') THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: unexpected direct service grant on private ranked table: %', item.table_name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('quiz_identities'), ('verified_quiz_scores')) AS ranked_table(table_name) LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    IF has_table_privilege('service_role', relation_oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR has_any_column_privilege('service_role', relation_oid, 'INSERT,UPDATE,REFERENCES') THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: unexpected direct service write grant on ranked table: %', item.table_name;
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM (VALUES
    ('quiz_identities','account_email','text',true), ('quiz_identities','username','text',true),
    ('quiz_identities','country','text',true), ('quiz_identities','created_at','timestamp with time zone',true),
    ('quiz_reserved_names','username','text',true),
    ('ranked_quiz_rounds','round_id','uuid',true), ('ranked_quiz_rounds','account_email','text',true),
    ('ranked_quiz_rounds','state','jsonb',true), ('ranked_quiz_rounds','created_at','timestamp with time zone',true),
    ('verified_quiz_scores','account_email','text',true), ('verified_quiz_scores','username','text',true),
    ('verified_quiz_scores','country','text',true), ('verified_quiz_scores','total_points','integer',true),
    ('verified_quiz_scores','rounds','integer',true), ('verified_quiz_scores','updated_at','timestamp with time zone',true),
    ('activity_results','account_email','text',true), ('activity_results','event_id','uuid',true),
    ('activity_results','type','text',true), ('activity_results','country','text',false),
    ('activity_results','topic','text',true), ('activity_results','total_questions','integer',true),
    ('activity_results','correct_answers','integer',true), ('activity_results','timed_out_answers','integer',true),
    ('activity_results','points','integer',true), ('activity_results','duration_seconds','integer',true),
    ('activity_results','finished_at','timestamp with time zone',true), ('activity_results','verification','text',true)
  ) AS required(table_name,column_name,type_name,required_not_null) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = to_regclass(format('public.%I', item.table_name))
        AND a.attname = item.column_name AND a.attnum > 0 AND NOT a.attisdropped
        AND format_type(a.atttypid, NULL) = item.type_name
        AND (NOT item.required_not_null OR a.attnotnull)
    ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: ranked column missing or changed: %.%', item.table_name, item.column_name;
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM (VALUES
    ('quiz_identities', ARRAY['account_email']::text[]),
    ('quiz_reserved_names', ARRAY['username']::text[]),
    ('ranked_quiz_rounds', ARRAY['round_id']::text[]),
    ('verified_quiz_scores', ARRAY['account_email']::text[]),
    ('activity_results', ARRAY['account_email','event_id']::text[])
  ) AS required(table_name,column_names) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid = to_regclass(format('public.%I', item.table_name)) AND c.contype = 'p'
        AND ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(attnum,position)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY k.position) = item.column_names
    ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: ranked primary key missing or changed: %', item.table_name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('quiz_identities'), ('verified_quiz_scores')) AS required(table_name) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE c.conrelid = to_regclass(format('public.%I', item.table_name))
        AND c.contype = 'u' AND cardinality(c.conkey) = 1 AND a.attname = 'username'
    ) OR NOT has_table_privilege('service_role', format('public.%I', item.table_name), 'SELECT') THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: ranked username constraint or service read grant missing: %', item.table_name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('ranked_quiz_rounds'), ('verified_quiz_scores')) AS required(table_name) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute local_column ON local_column.attrelid = c.conrelid AND local_column.attnum = c.conkey[1]
      JOIN pg_attribute remote_column ON remote_column.attrelid = c.confrelid AND remote_column.attnum = c.confkey[1]
      WHERE c.conrelid = to_regclass(format('public.%I', item.table_name)) AND c.contype = 'f'
        AND c.confrelid = 'public.quiz_identities'::regclass AND cardinality(c.conkey) = 1
        AND local_column.attname = 'account_email' AND remote_column.attname = 'account_email'
        AND c.convalidated
    ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: ranked identity foreign key missing or changed: %', item.table_name;
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM (VALUES
    ('public.register_ranked_quiz(text,text,text)'),
    ('public.start_ranked_quiz(text,uuid,text,text,jsonb)'),
    ('public.read_ranked_quiz(text,uuid)'),
    ('public.answer_ranked_quiz(text,uuid,text,text,uuid)'),
    ('public.advance_ranked_quiz(text,uuid,uuid)')
  ) AS required(signature) LOOP
    function_oid := to_regprocedure(item.signature);
    IF function_oid IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
      WHERE p.oid = function_oid AND p.prokind = 'f' AND p.prosecdef
        AND p.prorettype = 'jsonb'::regtype AND l.lanname = 'plpgsql'
        AND p.proconfig @> ARRAY['search_path=pg_catalog, public']::text[]
    ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: ranked RPC missing or changed: %', item.signature;
    END IF;
    IF has_function_privilege('anon', function_oid, 'EXECUTE')
      OR has_function_privilege('authenticated', function_oid, 'EXECUTE')
      OR NOT has_function_privilege('service_role', function_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_SETUP: unsafe ranked RPC grants: %', item.signature;
    END IF;
  END LOOP;

  -- Historical API columns only; optional IDs/timestamps are recognized. An
  -- unfamiliar extra column may contain data that needs its own migration.
  -- Scores must be removed first: the verified live legacy layout has a
  -- username FK from quiz_scores to quiz_users. No external FK is allowed.
  FOR item IN SELECT * FROM (VALUES ('quiz_scores'), ('quiz_users')) AS legacy(table_name) LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    IF relation_oid IS NULL THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = relation_oid AND relkind = 'r' AND NOT relispartition)
      OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = relation_oid OR inhparent = relation_oid) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: unfamiliar legacy relation: %', item.table_name;
    END IF;
    EXECUTE format('LOCK TABLE ONLY public.%I IN ACCESS EXCLUSIVE MODE', item.table_name);
    expected_columns := ARRAY['username','country','total_points','rounds'];
    IF item.table_name = 'quiz_scores' THEN expected_columns := expected_columns || ARRAY['updated_at']; END IF;
    SELECT array_agg(a.attname::text) INTO actual_columns FROM pg_attribute a
      WHERE a.attrelid = relation_oid AND a.attnum > 0 AND NOT a.attisdropped;
    IF actual_columns IS NULL OR NOT actual_columns @> expected_columns
      OR EXISTS (
        SELECT 1 FROM pg_attribute a WHERE a.attrelid = relation_oid AND a.attnum > 0 AND NOT a.attisdropped
          AND NOT (
            (a.attname IN ('username','country') AND a.atttypid IN ('text'::regtype,'varchar'::regtype))
            OR (a.attname IN ('total_points','rounds') AND a.atttypid IN ('int2'::regtype,'int4'::regtype,'int8'::regtype,'numeric'::regtype))
            OR (a.attname = 'id' AND a.atttypid IN ('uuid'::regtype,'int2'::regtype,'int4'::regtype,'int8'::regtype))
            OR (a.attname IN ('created_at','updated_at') AND a.atttypid IN ('timestamp'::regtype,'timestamptz'::regtype))
          )
      ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: unfamiliar legacy columns/types: %', item.table_name;
    END IF;
    old_oids := array_append(old_oids, relation_oid);
    old_names := array_append(old_names, item.table_name);
  END LOOP;

  -- The live definition was inspected separately. Its full PostgreSQL-generated
  -- definition hash is authoritative; never normalize whitespace or accept a
  -- lookalike body. Definitions and their contents are not printed.
  legacy_function_oid := to_regprocedure('public.get_week_scores()');
  IF legacy_function_oid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
      WHERE p.oid = legacy_function_oid AND p.prokind = 'f'
        AND pg_get_userbyid(p.proowner) = 'postgres' AND l.lanname = 'sql'
        AND NOT p.prosecdef AND p.proconfig IS NULL
        AND pg_get_function_result(p.oid) = legacy_function_result
        AND md5(pg_get_functiondef(p.oid)) = legacy_function_md5
    ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_FUNCTION: get_week_scores definition or metadata differs from the inspected version; nothing removed.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_depend WHERE refclassid = 'pg_proc'::regclass AND refobjid = legacy_function_oid)
      OR EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.oid <> legacy_function_oid AND p.prokind IN ('f','p')
          AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
          AND p.prosrc ~* '\mget_week_scores\M'
      ) THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_FUNCTION: get_week_scores still has callers or database dependents; review before removal.';
    END IF;
  END IF;

  IF cardinality(old_oids) = 0 AND legacy_function_oid IS NULL THEN
    RAISE NOTICE 'JL_LEGACY_QUIZ_DONE: both old tables are already absent; ranked setup checked.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.contype = 'f' AND (c.conrelid = ANY(old_oids) OR c.confrelid = ANY(old_oids))
      AND NOT coalesce(
        c.conname = 'quiz_scores_username_fkey'
        AND c.conrelid = to_regclass('public.quiz_scores')
        AND c.confrelid = to_regclass('public.quiz_users') AND c.convalidated
        AND ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(attnum,position)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY k.position) = ARRAY['username']::text[]
        AND ARRAY(SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY k(attnum,position)
          JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum ORDER BY k.position) = ARRAY['username']::text[],
        false)
  ) THEN
    RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: legacy foreign-key dependency; review before removal.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ANY(old_oids) AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: legacy trigger dependency; review before removal.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_depend d JOIN pg_rewrite r ON d.classid = 'pg_rewrite'::regclass AND d.objid = r.oid
    JOIN pg_class v ON v.oid = r.ev_class
    WHERE d.refclassid = 'pg_class'::regclass AND d.refobjid = ANY(old_oids) AND v.relkind IN ('v','m')
  ) THEN
    RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: legacy view dependency; review before removal.';
  END IF;
  -- Scan bodies internally, never return or print function definitions. Plain
  -- PL/pgSQL text references are not necessarily represented in pg_depend.
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind IN ('f','p') AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
      AND (legacy_function_oid IS NULL OR p.oid <> legacy_function_oid)
      AND CASE WHEN p.prokind IN ('f','p') THEN pg_get_functiondef(p.oid) END ~* '\mquiz_(users|scores)\M'
  ) THEN
    RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: legacy function reference; review before removal (definitions withheld).';
  END IF;

  -- Names are the only transferred data. Old client-supplied points are never
  -- copied to verified_quiz_scores or activity_results.
  FOR item IN SELECT unnest(old_names) AS table_name LOOP
    EXECUTE format('INSERT INTO public.quiz_reserved_names(username) SELECT DISTINCT lower(btrim(username)) FROM public.%I WHERE username IS NOT NULL ON CONFLICT (username) DO NOTHING', item.table_name);
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I legacy WHERE legacy.username IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.quiz_reserved_names reserved WHERE reserved.username = lower(btrim(legacy.username))))', item.table_name) INTO missing_names;
    IF missing_names THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_RESERVATION: incomplete name reservation: %', item.table_name;
    END IF;
  END LOOP;

  -- Only the inspected zero-argument function is eligible, after complete name
  -- reservation. RESTRICT also catches a dependency introduced since preflight.
  IF legacy_function_oid IS NOT NULL THEN
    DROP FUNCTION public.get_week_scores() RESTRICT;
  END IF;
  IF cardinality(old_oids) = 0 THEN
    RAISE NOTICE 'JL_LEGACY_QUIZ_DONE: old tables already absent; inspected obsolete function removed.';
    RETURN;
  END IF;

  -- Never replace a publication or remove unrelated members. Broad publication
  -- configurations require their own explicit review instead of a blanket SET.
  IF EXISTS (SELECT 1 FROM pg_publication WHERE puballtables)
    OR EXISTS (SELECT 1 FROM pg_publication_namespace WHERE pnnspid = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: broad publication includes legacy tables; review publication separately.';
  END IF;
  FOR item IN
    SELECT p.pubname, c.relname FROM pg_publication_rel membership
    JOIN pg_publication p ON p.oid = membership.prpubid
    JOIN pg_class c ON c.oid = membership.prrelid WHERE membership.prrelid = ANY(old_oids)
    ORDER BY p.pubname, c.relname
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION %I DROP TABLE ONLY public.%I', item.pubname, item.relname);
    EXCEPTION WHEN feature_not_supported THEN
      RAISE EXCEPTION 'JL_LEGACY_QUIZ_REVIEW: individual publication removal is unsupported; no data removed.';
    END;
  END LOOP;

  FOR item IN SELECT unnest(old_names) AS table_name LOOP
    EXECUTE format('DROP TABLE public.%I RESTRICT', item.table_name);
  END LOOP;
  RAISE NOTICE 'JL_LEGACY_QUIZ_DONE: legacy quiz tables removed; names reserved; ranked points unchanged.';
END;
$maintenance$;

COMMIT;
