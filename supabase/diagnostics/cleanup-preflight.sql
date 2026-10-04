-- Read-only inventory for the Jagdlatein cleanup. Run in the Supabase SQL Editor.
-- Returns metadata only: no customer rows, secrets, function bodies or code values.
-- Estimates are not exact row counts. Empty dependency lists do not prove that
-- external workers or dynamically assembled SQL never use these tables.
WITH RECURSIVE
requested(name, purpose) AS (
  VALUES
    ('activity_results', 'active'), ('course_progress', 'active'),
    ('login_codes', 'active'), ('push_tokens', 'active'), ('userprofile', 'active'),
    ('paypal_subscriptions', 'active'), ('paypal_subscription_payments', 'active'),
    ('quiz_identities', 'active'), ('quiz_reserved_names', 'active'),
    ('ranked_quiz_rounds', 'active'), ('verified_quiz_scores', 'active'),
    ('quiz_users', 'legacy_quiz'), ('quiz_scores', 'legacy_quiz'),
    ('paymentlog', 'legacy_payment_review'), ('subscription', 'legacy_payment_review')
),
targets AS (
  SELECT r.name, r.purpose, c.oid, c.relkind, c.relowner, c.relacl,
    c.relrowsecurity, c.relforcerowsecurity, c.reltuples
  FROM requested r
  LEFT JOIN pg_class c ON c.oid = to_regclass(format('public.%I', r.name))
),
browser_roles AS (
  SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
),
dependent_views(root_oid, view_oid, path) AS (
  SELECT t.oid, v.oid, ARRAY[t.oid, v.oid]
  FROM targets t
  JOIN pg_depend d ON d.refclassid = 'pg_class'::regclass AND d.refobjid = t.oid
    AND d.classid = 'pg_rewrite'::regclass
  JOIN pg_rewrite rw ON rw.oid = d.objid
  JOIN pg_class v ON v.oid = rw.ev_class AND v.relkind IN ('v', 'm') AND v.oid <> t.oid
  UNION ALL
  SELECT dv.root_oid, v.oid, dv.path || v.oid
  FROM dependent_views dv
  JOIN pg_depend d ON d.refclassid = 'pg_class'::regclass AND d.refobjid = dv.view_oid
    AND d.classid = 'pg_rewrite'::regclass
  JOIN pg_rewrite rw ON rw.oid = d.objid
  JOIN pg_class v ON v.oid = rw.ev_class AND v.relkind IN ('v', 'm')
  WHERE NOT v.oid = ANY(dv.path)
),
function_refs AS (
  SELECT p.oid, n.nspname AS schema_name, p.proname, p.prosecdef, p.proowner,
    array_agg(DISTINCT t.name ORDER BY t.name) AS referenced_tables
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN targets t ON
    p.prosrc ~* ('(^|[^[:alnum:]_])' || t.name || '([^[:alnum:]_]|$)')
    OR EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid
        AND d.refclassid = 'pg_class'::regclass AND d.refobjid = t.oid
    )
    OR EXISTS (
      SELECT 1 FROM dependent_views dv JOIN pg_class v ON v.oid = dv.view_oid
      WHERE dv.root_oid = t.oid AND (
        p.prosrc ~* ('(^|[^[:alnum:]_])' || v.relname || '([^[:alnum:]_]|$)')
        OR EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid AND d.refclassid = 'pg_class'::regclass AND d.refobjid = v.oid)
      )
    )
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND p.prokind IN ('f', 'p')
  GROUP BY p.oid, n.nspname, p.proname, p.prosecdef, p.proowner
)
SELECT jsonb_build_object(
  'report_version', 1,
  'generated_at', current_timestamp,
  'roles', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', rolname, 'superuser', rolsuper,
      'bypass_rls', rolbypassrls, 'inherits', rolinherit) ORDER BY rolname)
    FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')
  ), '[]'::jsonb),
  'tables', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', t.name, 'purpose', t.purpose, 'exists', t.oid IS NOT NULL,
      'kind', t.relkind, 'owner', pg_get_userbyid(t.relowner),
      'rls_enabled', t.relrowsecurity, 'rls_forced', t.relforcerowsecurity,
      'estimated_rows', CASE WHEN t.reltuples >= 0 THEN t.reltuples::bigint ELSE NULL END,
      'columns', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', a.attname,
          'type', format_type(a.atttypid, a.atttypmod), 'nullable', NOT a.attnotnull,
          'identity', a.attidentity) ORDER BY a.attnum)
        FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
      ), '[]'::jsonb),
      'keys', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', co.conname, 'kind', co.contype,
          'columns', ARRAY(SELECT a.attname FROM unnest(co.conkey) WITH ORDINALITY AS k(attnum, pos)
            JOIN pg_attribute a ON a.attrelid = co.conrelid AND a.attnum = k.attnum ORDER BY k.pos))
          ORDER BY co.conname)
        FROM pg_constraint co WHERE co.conrelid = t.oid AND co.contype IN ('p', 'u')
      ), '[]'::jsonb),
      'effective_browser_privileges', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('role', r.rolname,
          'select', has_table_privilege(r.oid, t.oid, 'SELECT'),
          'insert', has_table_privilege(r.oid, t.oid, 'INSERT'),
          'update', has_table_privilege(r.oid, t.oid, 'UPDATE'),
          'delete', has_table_privilege(r.oid, t.oid, 'DELETE'),
          'truncate', has_table_privilege(r.oid, t.oid, 'TRUNCATE'),
          'references', has_table_privilege(r.oid, t.oid, 'REFERENCES'),
          'trigger', has_table_privilege(r.oid, t.oid, 'TRIGGER'),
          'column_select', has_any_column_privilege(r.oid, t.oid, 'SELECT'),
          'column_insert', has_any_column_privilege(r.oid, t.oid, 'INSERT'),
          'column_update', has_any_column_privilege(r.oid, t.oid, 'UPDATE')) ORDER BY r.rolname)
        FROM browser_roles r WHERE t.oid IS NOT NULL
      ), '[]'::jsonb),
      'grants', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('role', CASE WHEN acl.grantee = 0 THEN 'PUBLIC'
          ELSE pg_get_userbyid(acl.grantee) END, 'privilege', acl.privilege_type,
          'grantable', acl.is_grantable) ORDER BY acl.grantee, acl.privilege_type)
        FROM aclexplode(COALESCE(t.relacl, acldefault('r', t.relowner))) acl
        WHERE t.oid IS NOT NULL
      ), '[]'::jsonb),
      'column_grants', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('column', a.attname,
          'role', CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(acl.grantee) END,
          'privilege', acl.privilege_type) ORDER BY a.attnum, acl.grantee, acl.privilege_type)
        FROM pg_attribute a CROSS JOIN LATERAL aclexplode(a.attacl) acl
        WHERE a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
      ), '[]'::jsonb),
      'policies', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', p.polname, 'command', p.polcmd,
          'permissive', p.polpermissive,
          'roles', ARRAY(SELECT CASE WHEN rid = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(rid) END
            FROM unnest(p.polroles) AS rid)) ORDER BY p.polname)
        FROM pg_policy p WHERE p.polrelid = t.oid
      ), '[]'::jsonb),
      'owned_sequences', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', format('%I.%I', sn.nspname, s.relname),
          'effective_browser_privileges', (
            SELECT jsonb_agg(jsonb_build_object('role', r.rolname,
              'usage', has_sequence_privilege(r.oid, s.oid, 'USAGE'),
              'select', has_sequence_privilege(r.oid, s.oid, 'SELECT'),
              'update', has_sequence_privilege(r.oid, s.oid, 'UPDATE')) ORDER BY r.rolname)
            FROM browser_roles r
          )) ORDER BY sn.nspname, s.relname)
        FROM pg_depend d JOIN pg_class s ON s.oid = d.objid AND s.relkind = 'S'
        JOIN pg_namespace sn ON sn.oid = s.relnamespace
        WHERE d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
          AND d.refobjid = t.oid AND d.deptype IN ('a', 'i')
      ), '[]'::jsonb)
    ) ORDER BY t.name) FROM targets t
  ),
  'foreign_keys', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', co.conname,
      'from', co.conrelid::regclass::text, 'to', co.confrelid::regclass::text,
      'from_columns', ARRAY(SELECT a.attname FROM unnest(co.conkey) WITH ORDINALITY AS k(attnum, pos)
        JOIN pg_attribute a ON a.attrelid = co.conrelid AND a.attnum = k.attnum ORDER BY k.pos),
      'to_columns', ARRAY(SELECT a.attname FROM unnest(co.confkey) WITH ORDINALITY AS k(attnum, pos)
        JOIN pg_attribute a ON a.attrelid = co.confrelid AND a.attnum = k.attnum ORDER BY k.pos))
      ORDER BY co.conname, co.conrelid)
    FROM pg_constraint co WHERE co.contype = 'f' AND
      (co.conrelid IN (SELECT oid FROM targets) OR co.confrelid IN (SELECT oid FROM targets))
  ), '[]'::jsonb),
  'inheritance', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('parent', inhparent::regclass::text,
      'child', inhrelid::regclass::text) ORDER BY inhparent, inhrelid)
    FROM pg_inherits WHERE inhparent IN (SELECT oid FROM targets)
      OR inhrelid IN (SELECT oid FROM targets)
  ), '[]'::jsonb),
  'dependent_views', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('table', t.name,
      'view', v.oid::regclass::text, 'kind', v.relkind,
      'owner', pg_get_userbyid(v.relowner), 'options', COALESCE(v.reloptions, ARRAY[]::text[]),
      'browser_select', (SELECT jsonb_agg(jsonb_build_object('role', r.rolname,
        'allowed', has_table_privilege(r.oid, v.oid, 'SELECT')) ORDER BY r.rolname)
        FROM browser_roles r)) ORDER BY t.name, v.oid)
    FROM (SELECT DISTINCT root_oid, view_oid FROM dependent_views) dv
    JOIN targets t ON t.oid = dv.root_oid JOIN pg_class v ON v.oid = dv.view_oid
  ), '[]'::jsonb),
  'triggers', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('table', t.name, 'name', tr.tgname,
      'enabled', tr.tgenabled, 'function', tr.tgfoid::regprocedure::text) ORDER BY t.name, tr.tgname)
    FROM pg_trigger tr JOIN targets t ON t.oid = tr.tgrelid WHERE NOT tr.tgisinternal
  ), '[]'::jsonb),
  'referencing_functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', format('%I.%I(%s)', f.schema_name, f.proname,
      pg_get_function_identity_arguments(f.oid)), 'security_definer', f.prosecdef,
      'owner', pg_get_userbyid(f.proowner), 'tables', f.referenced_tables,
      'browser_execute', (SELECT jsonb_agg(jsonb_build_object('role', r.rolname,
        'allowed', has_function_privilege(r.oid, f.oid, 'EXECUTE')) ORDER BY r.rolname)
        FROM browser_roles r)) ORDER BY f.schema_name, f.proname, f.oid)
    FROM function_refs f
  ), '[]'::jsonb),
  'publications', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', pubname, 'all_tables', puballtables,
      'quiz_tables', ARRAY(SELECT pt.tablename FROM pg_publication_tables pt
        WHERE pt.pubname = p.pubname AND pt.schemaname = 'public'
          AND pt.tablename IN ('quiz_users', 'quiz_scores') ORDER BY pt.tablename)) ORDER BY pubname)
    FROM pg_publication p
  ), '[]'::jsonb),
  'required_rpcs', (
    SELECT jsonb_agg(jsonb_build_object('signature', signature,
      'exists', to_regprocedure(signature) IS NOT NULL) ORDER BY signature)
    FROM (VALUES
      ('public.register_ranked_quiz(text,text,text)'),
      ('public.start_ranked_quiz(text,uuid,text,text,jsonb)'),
      ('public.read_ranked_quiz(text,uuid)'),
      ('public.answer_ranked_quiz(text,uuid,text,text,uuid)'),
      ('public.advance_ranked_quiz(text,uuid,uuid)'),
      ('public.apply_paypal_subscription_snapshot(jsonb)')
    ) AS needed(signature)
  )
) AS cleanup_report;
