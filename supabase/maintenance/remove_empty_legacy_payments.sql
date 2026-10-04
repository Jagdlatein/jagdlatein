-- MANUAL MAINTENANCE ONLY. Never add this file to automatic migrations.
-- The inspected public.paymentlog and public.subscription each contained zero
-- rows. Recheck their exact known layout, dependencies and emptiness under locks.
-- Run the whole file after a restorable backup. Any error rolls everything back.
-- Current userprofile and PayPal ledger rows, grants, flags and functions survive.
BEGIN;
SET LOCAL search_path = pg_catalog, public;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Do not mistake rows hidden by RLS for an empty table: fail if filtering applies.
SET LOCAL row_security = off;

DO $maintenance$
DECLARE
  item record;
  relation_oid oid;
  old_oids oid[] := ARRAY[]::oid[];
  old_names text[] := ARRAY[]::text[];
  actual_columns text[];
  expected_columns text[];
  exact_count bigint;
  table_reference_pattern constant text := $pattern$(\m(?:FROM|JOIN|UPDATE|INTO|TRUNCATE(?:[[:space:]]+TABLE)?|TABLE)[[:space:]]+(?:ONLY[[:space:]]+)?(?:(?:public|"public")[[:space:]]*\.[[:space:]]*)?(?:"paymentlog"|"subscription"|paymentlog\M|subscription\M)|(?:public\M|"public")[[:space:]]*\.[[:space:]]*(?:"paymentlog"|"subscription"|paymentlog\M|subscription\M))$pattern$;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('JL_REMOVE_EMPTY_LEGACY_PAYMENTS', 0));
  IF to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_SETUP: service_role is missing; nothing removed.';
  END IF;
  -- These are existence/read-access prerequisites, not assumptions about their
  -- defaults, premium flags, current payment status or a provider configuration.
  FOR item IN SELECT * FROM (VALUES
    ('userprofile'), ('paypal_subscriptions'), ('paypal_subscription_payments')
  ) AS active(table_name) LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    IF relation_oid IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_class WHERE oid = relation_oid AND relkind = 'r' AND NOT relispartition
    ) THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_SETUP: active table missing or unfamiliar: %', item.table_name;
    END IF;
    EXECUTE format('LOCK TABLE ONLY public.%I IN ACCESS SHARE MODE', item.table_name);
    IF NOT has_table_privilege('service_role', relation_oid, 'SELECT') THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_SETUP: service_role cannot read active table: %', item.table_name;
    END IF;
  END LOOP;

  -- Lock BOTH old tables before counting or removing either. A concurrent
  -- writer cannot add a row between this review and the final empty-table guard.
  FOR item IN SELECT * FROM (VALUES ('paymentlog'), ('subscription')) AS old(table_name) LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    IF relation_oid IS NULL THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = relation_oid AND relkind = 'r' AND NOT relispartition)
      OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhparent = relation_oid OR inhrelid = relation_oid) THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: unfamiliar legacy relation: %', item.table_name;
    END IF;
    EXECUTE format('LOCK TABLE ONLY public.%I IN ACCESS EXCLUSIVE MODE', item.table_name);
    old_oids := array_append(old_oids, relation_oid);
    old_names := array_append(old_names, item.table_name);
  END LOOP;
  IF cardinality(old_oids) = 0 THEN
    RAISE NOTICE 'JL_EMPTY_PAYMENTS_DONE: both empty legacy payment tables are already absent; active setup checked.';
    RETURN;
  END IF;

  FOR item IN SELECT unnest(old_names) AS table_name LOOP
    relation_oid := to_regclass(format('public.%I', item.table_name));
    expected_columns := CASE item.table_name WHEN 'paymentlog' THEN ARRAY[
      'created_at:timestamp with time zone:false', 'email:text:false', 'id:uuid:true',
      'provider:text:false', 'raw:jsonb:false', 'status:text:false'
    ] ELSE ARRAY[
      'id:uuid:true', 'next_billing_time:timestamp with time zone:false',
      'paypal_subscription_id:text:false', 'status:text:false',
      'updated_at:timestamp with time zone:false', 'user_id:uuid:false'
    ] END;
    SELECT array_agg(a.attname::text || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull::text ORDER BY a.attname)
      INTO actual_columns FROM pg_attribute a
      WHERE a.attrelid = relation_oid AND a.attnum > 0 AND NOT a.attisdropped;
    IF actual_columns IS DISTINCT FROM expected_columns OR EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid = relation_oid AND a.attnum > 0
        AND NOT a.attisdropped AND (a.attidentity <> '' OR a.attgenerated <> '')
    ) THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: unfamiliar legacy columns/types: %', item.table_name;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c WHERE c.conrelid = relation_oid AND c.contype = 'p'
        AND c.conname = item.table_name || '_pkey' AND c.convalidated
        AND ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(attnum,position)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY k.position) = ARRAY['id']::text[]
    ) OR EXISTS (
      SELECT 1 FROM pg_constraint c WHERE c.conrelid = relation_oid AND c.contype NOT IN ('p','f')
    ) THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: unfamiliar legacy constraints: %', item.table_name;
    END IF;
  END LOOP;

  -- The one inspected outgoing FK is removed with subscription, never with its
  -- active parent. Reject every other incoming/outgoing FK, including renamed
  -- or unvalidated lookalikes. No CASCADE is used.
  IF EXISTS (
    SELECT 1 FROM pg_constraint c WHERE c.contype = 'f'
      AND (c.conrelid = ANY(old_oids) OR c.confrelid = ANY(old_oids))
      AND NOT coalesce(
        c.conname = 'subscription_user_id_fkey'
        AND c.conrelid = to_regclass('public.subscription')
        AND c.confrelid = 'public.userprofile'::regclass AND c.convalidated
        AND ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(attnum,position)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum ORDER BY k.position) = ARRAY['user_id']::text[]
        AND ARRAY(SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY k(attnum,position)
          JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum ORDER BY k.position) = ARRAY['user_id']::text[], false)
  ) THEN
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: unfamiliar legacy foreign-key dependency; nothing removed.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ANY(old_oids) AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: legacy trigger dependency; nothing removed.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_depend d JOIN pg_rewrite r ON d.classid = 'pg_rewrite'::regclass AND d.objid = r.oid
    JOIN pg_class v ON v.oid = r.ev_class
    WHERE d.refclassid = 'pg_class'::regclass AND d.refobjid = ANY(old_oids) AND v.relkind IN ('v','m')
  ) THEN
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: legacy view dependency; nothing removed.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_depend WHERE classid = 'pg_class'::regclass AND objid = ANY(old_oids)
      AND refclassid = 'pg_extension'::regclass AND deptype = 'e'
  ) OR EXISTS (
    SELECT 1 FROM pg_depend d JOIN pg_class seq ON d.classid = 'pg_class'::regclass AND d.objid = seq.oid
    WHERE d.refclassid = 'pg_class'::regclass AND d.refobjid = ANY(old_oids)
      AND seq.relkind = 'S' AND d.deptype IN ('a','i')
  ) THEN
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: extension membership or unexpected owned sequence; nothing removed.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass AND (
      (d.refclassid = 'pg_class'::regclass AND d.refobjid = ANY(old_oids)) OR
      (d.refclassid = 'pg_type'::regclass AND d.refobjid IN (SELECT reltype FROM pg_class WHERE oid = ANY(old_oids)))
    )
  ) OR EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind IN ('f','p') AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
      AND CASE WHEN p.prokind IN ('f','p') THEN pg_get_functiondef(p.oid) END ~* table_reference_pattern
  ) THEN
    -- Match recognizable operations or explicit public table/type references,
    -- not messages such as 'Invalid subscription snapshot'. realtime.subscription
    -- is a separate system table and cannot match the old public table pattern.
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: legacy function reference; nothing removed (definitions withheld).';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE puballtables)
    OR EXISTS (SELECT 1 FROM pg_publication_namespace WHERE pnnspid = 'public'::regnamespace)
    OR EXISTS (SELECT 1 FROM pg_publication_rel WHERE prrelid = ANY(old_oids)) THEN
    RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_REVIEW: legacy publication membership; review it separately, nothing removed.';
  END IF;

  FOR item IN SELECT unnest(old_names) AS table_name LOOP
    EXECUTE format('SELECT count(*) FROM ONLY public.%I', item.table_name) INTO exact_count;
    IF exact_count <> 0 THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_NOT_EMPTY: public.% has rows; nothing removed.', item.table_name;
    END IF;
  END LOOP;

  -- Recheck under the same exclusive locks immediately before each DROP.
  FOR item IN SELECT unnest(old_names) AS table_name LOOP
    EXECUTE format('SELECT count(*) FROM ONLY public.%I', item.table_name) INTO exact_count;
    IF exact_count <> 0 THEN
      RAISE EXCEPTION 'JL_EMPTY_PAYMENTS_NOT_EMPTY: public.% changed during review; nothing removed.', item.table_name;
    END IF;
    EXECUTE format('DROP TABLE public.%I RESTRICT', item.table_name);
  END LOOP;
  RAISE NOTICE 'JL_EMPTY_PAYMENTS_DONE: the two verified empty legacy payment tables were removed; active account/PayPal data untouched.';
END;
$maintenance$;

COMMIT;
