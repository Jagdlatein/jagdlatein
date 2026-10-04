BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Keep all existing rows, policies and server-role rights. The application uses
-- its own signed sessions and service-role API; browser database access is not
-- required for these tables. Supabase service_role must bypass RLS already.
DO $$
DECLARE
  required_role text;
  server_bypasses_rls boolean;
  target_table record;
  target_oid oid;
  target_kind "char";
  target_owner oid;
  browser_bypasses_rls boolean;
  column_list text;
  server_privilege_list text;
  server_column_grant record;
  unguarded_privilege text;
  owned_sequence record;
  browser_role text;
  existing_comment text;
  legacy_marker constant text := 'Jagdlatein Altbestand (server-only): Daten erhalten; vor Loeschung Abhaengigkeiten und Zuordnung gesondert pruefen.';
BEGIN
  FOREACH required_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = required_role) THEN
      RAISE EXCEPTION 'Required database role % is missing; no security changes applied.', required_role;
    END IF;
  END LOOP;
  SELECT rolbypassrls OR rolsuper INTO server_bypasses_rls
    FROM pg_catalog.pg_roles WHERE rolname = 'service_role';
  IF NOT server_bypasses_rls THEN
    RAISE EXCEPTION 'service_role must already have BYPASSRLS or superuser; no security changes applied.';
  END IF;
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    SELECT rolbypassrls OR rolsuper INTO browser_bypasses_rls
      FROM pg_catalog.pg_roles WHERE rolname = browser_role;
    IF browser_bypasses_rls OR pg_has_role(browser_role, 'service_role', 'MEMBER') THEN
      RAISE EXCEPTION 'Browser role % must not bypass RLS or inherit service_role; no security changes applied.', browser_role;
    END IF;
  END LOOP;

  FOR target_table IN
    SELECT * FROM (VALUES
      ('userprofile', 'SELECT, INSERT', false),
      ('login_codes', 'SELECT, INSERT, UPDATE, DELETE', false),
      ('push_tokens', 'SELECT, INSERT, UPDATE', false),
      ('paymentlog', NULL, true),
      ('subscription', NULL, true),
      ('quiz_users', NULL, true),
      ('quiz_scores', NULL, true)
    ) AS targets(table_name, server_privileges, is_legacy)
  LOOP
    target_oid := to_regclass(format('public.%I', target_table.table_name));
    IF target_oid IS NULL THEN CONTINUE; END IF;
    SELECT relkind, relowner INTO target_kind, target_owner FROM pg_catalog.pg_class WHERE oid = target_oid;
    IF target_kind NOT IN ('r', 'p') THEN
      RAISE EXCEPTION 'public.% must be an ordinary or partitioned table; no security changes applied.', target_table.table_name;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_inherits WHERE inhparent = target_oid OR inhrelid = target_oid) THEN
      RAISE EXCEPTION 'public.% has partition or inheritance relatives; review them before applying security changes.', target_table.table_name;
    END IF;
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF pg_has_role(browser_role, target_owner, 'MEMBER') THEN
        RAISE EXCEPTION 'Browser role % owns or inherits ownership of public.%; no security changes applied.', browser_role, target_table.table_name;
      END IF;
    END LOOP;

    -- Preserve effective server privileges, including rights previously inherited
    -- through PUBLIC. Revoking PUBLIC must not interrupt unknown server jobs.
    SELECT string_agg(DISTINCT acl.privilege_type, ', ' ORDER BY acl.privilege_type) INTO server_privilege_list
      FROM pg_catalog.pg_class rel
      CROSS JOIN LATERAL aclexplode(coalesce(rel.relacl, acldefault('r', rel.relowner))) acl
      WHERE rel.oid = target_oid AND has_table_privilege('service_role', target_oid, acl.privilege_type);
    IF server_privilege_list IS NOT NULL THEN
      EXECUTE format('GRANT %s ON TABLE public.%I TO service_role', server_privilege_list, target_table.table_name);
    END IF;
    FOR server_column_grant IN
      SELECT DISTINCT att.attname, acl.privilege_type FROM pg_catalog.pg_attribute att
      CROSS JOIN LATERAL aclexplode(att.attacl) acl
      WHERE att.attrelid = target_oid AND att.attnum > 0 AND NOT att.attisdropped
        AND has_column_privilege('service_role', target_oid, att.attnum, acl.privilege_type)
    LOOP
      EXECUTE format('GRANT %s (%I) ON TABLE public.%I TO service_role', server_column_grant.privilege_type, server_column_grant.attname, target_table.table_name);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table.table_name);
    -- Restrictive false also closes broad existing policies and inherited DML
    -- grants. Drop only our own named policy so the migration is repeatable.
    EXECUTE format('DROP POLICY IF EXISTS jagdlatein_server_only ON public.%I', target_table.table_name);
    EXECUTE format('CREATE POLICY jagdlatein_server_only ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false)', target_table.table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', target_table.table_name);
    SELECT string_agg(format('%I', attname), ', ' ORDER BY attnum) INTO column_list
      FROM pg_catalog.pg_attribute WHERE attrelid = target_oid AND attnum > 0 AND NOT attisdropped;
    IF column_list IS NOT NULL THEN
      EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated', column_list, target_table.table_name);
    END IF;
    IF target_table.server_privileges IS NOT NULL THEN
      EXECUTE format('GRANT %s ON TABLE public.%I TO service_role', target_table.server_privileges, target_table.table_name);
    END IF;

    -- Catalog-derived non-DML privileges include MAINTAIN on PG17+, without
    -- assuming that every supported server version recognizes that privilege.
    -- Do not retain inherited rights that RLS cannot constrain.
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOR unguarded_privilege IN
        SELECT DISTINCT acl.privilege_type FROM pg_catalog.pg_class rel
        CROSS JOIN LATERAL aclexplode(coalesce(rel.relacl, acldefault('r', rel.relowner))) acl
        WHERE rel.oid = target_oid AND acl.privilege_type NOT IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      LOOP
        IF has_table_privilege(browser_role, target_oid, unguarded_privilege) THEN
          RAISE EXCEPTION 'Inherited % privilege remains for % on public.%; review role grants before retrying.', unguarded_privilege, browser_role, target_table.table_name;
        END IF;
      END LOOP;
      FOR unguarded_privilege IN
        SELECT DISTINCT acl.privilege_type FROM pg_catalog.pg_attribute att
        CROSS JOIN LATERAL aclexplode(att.attacl) acl
        WHERE att.attrelid = target_oid AND att.attnum > 0 AND NOT att.attisdropped
          AND acl.privilege_type NOT IN ('SELECT', 'INSERT', 'UPDATE')
      LOOP
        IF has_any_column_privilege(browser_role, target_oid, unguarded_privilege) THEN
          RAISE EXCEPTION 'Inherited column % privilege remains for % on public.%; review role grants before retrying.', unguarded_privilege, browser_role, target_table.table_name;
        END IF;
      END LOOP;
    END LOOP;

    FOR owned_sequence IN
      SELECT DISTINCT seq.oid, ns.nspname AS schema_name, seq.relname AS sequence_name
      FROM pg_catalog.pg_class seq
      JOIN pg_catalog.pg_namespace ns ON ns.oid = seq.relnamespace
      JOIN pg_catalog.pg_depend dep ON dep.classid = 'pg_catalog.pg_class'::regclass
        AND dep.objid = seq.oid AND dep.refclassid = 'pg_catalog.pg_class'::regclass
        AND dep.refobjid = target_oid AND dep.refobjsubid > 0 AND dep.deptype IN ('a', 'i')
      WHERE seq.relkind = 'S'
    LOOP
      SELECT string_agg(DISTINCT acl.privilege_type, ', ' ORDER BY acl.privilege_type) INTO server_privilege_list
        FROM pg_catalog.pg_class rel
        CROSS JOIN LATERAL aclexplode(coalesce(rel.relacl, acldefault('S', rel.relowner))) acl
        WHERE rel.oid = owned_sequence.oid AND has_sequence_privilege('service_role', owned_sequence.oid, acl.privilege_type);
      IF server_privilege_list IS NOT NULL THEN
        EXECUTE format('GRANT %s ON SEQUENCE %I.%I TO service_role', server_privilege_list, owned_sequence.schema_name, owned_sequence.sequence_name);
      END IF;
      EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM PUBLIC, anon, authenticated', owned_sequence.schema_name, owned_sequence.sequence_name);
      IF target_table.server_privileges IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I.%I TO service_role', owned_sequence.schema_name, owned_sequence.sequence_name);
      END IF;
      FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF has_sequence_privilege(browser_role, owned_sequence.oid, 'USAGE, SELECT, UPDATE') THEN
          RAISE EXCEPTION 'Inherited sequence privilege remains for % on %.%; review role grants before retrying.', browser_role, owned_sequence.schema_name, owned_sequence.sequence_name;
        END IF;
      END LOOP;
    END LOOP;

    IF target_table.is_legacy THEN
      existing_comment := obj_description(target_oid, 'pg_class');
      IF strpos(coalesce(existing_comment, ''), legacy_marker) = 0 THEN
        EXECUTE format('COMMENT ON TABLE public.%I IS %L', target_table.table_name,
          concat_ws(E'\n', nullif(existing_comment, ''), legacy_marker));
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMIT;
