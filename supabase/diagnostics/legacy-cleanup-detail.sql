-- Read-only follow-up for the confirmed live legacy schema.
-- Exact counts, mapping coverage and only the old quiz function's definition.
-- No customer rows, emails, payment payloads or login codes are returned.
WITH old_function AS (
  SELECT p.*, n.nspname, l.lanname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE p.oid = to_regprocedure('public.get_week_scores()')
)
SELECT jsonb_build_object(
  'legacy_rows', jsonb_build_object(
    'paymentlog', (SELECT count(*) FROM public.paymentlog),
    'subscription', (SELECT count(*) FROM public.subscription),
    'quiz_users', (SELECT count(*) FROM public.quiz_users),
    'quiz_scores', (SELECT count(*) FROM public.quiz_scores)
  ),
  'subscription_coverage', (
    SELECT jsonb_build_object(
      'with_paypal_id', count(*) FILTER (
        WHERE s.paypal_subscription_id IS NOT NULL AND btrim(s.paypal_subscription_id) <> ''),
      'without_paypal_id', count(*) FILTER (
        WHERE s.paypal_subscription_id IS NULL OR btrim(s.paypal_subscription_id) = ''),
      'mapped_to_new_ledger', count(*) FILTER (
        WHERE EXISTS (SELECT 1 FROM public.paypal_subscriptions current_subscription
          WHERE current_subscription.subscription_id = s.paypal_subscription_id)),
      'mapped_to_same_email', count(*) FILTER (
        WHERE EXISTS (SELECT 1 FROM public.paypal_subscriptions current_subscription
          WHERE current_subscription.subscription_id = s.paypal_subscription_id
            AND current_subscription.account_email = lower(btrim(profile.email))))
    )
    FROM public.subscription s LEFT JOIN public.userprofile profile ON profile.user_id = s.user_id
  ),
  'week_scores_function', COALESCE((
    SELECT jsonb_build_object(
      'name', f.oid::regprocedure::text,
      'owner', pg_get_userbyid(f.proowner),
      'language', f.lanname,
      'result', pg_get_function_result(f.oid),
      'security_definer', f.prosecdef,
      'settings', f.proconfig,
      'definition', pg_get_functiondef(f.oid),
      'definition_hash', md5(pg_get_functiondef(f.oid)),
      'dependencies', COALESCE((
        SELECT jsonb_agg(pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid)
          ORDER BY d.refclassid, d.refobjid, d.refobjsubid)
        FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass AND d.objid = f.oid
      ), '[]'::jsonb),
      'dependents', COALESCE((
        SELECT jsonb_agg(pg_describe_object(d.classid, d.objid, d.objsubid)
          ORDER BY d.classid, d.objid, d.objsubid)
        FROM pg_depend d WHERE d.refclassid = 'pg_proc'::regclass AND d.refobjid = f.oid
      ), '[]'::jsonb)
    ) FROM old_function f
  ), 'null'::jsonb),
  'functions_mentioning_week_scores', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', p.oid::regprocedure::text, 'security_definer', p.prosecdef) ORDER BY p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind IN ('f', 'p') AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND p.oid IS DISTINCT FROM to_regprocedure('public.get_week_scores()')
      AND p.prosrc ~* '(^|[^[:alnum:]_])get_week_scores([^[:alnum:]_]|$)'
  ), '[]'::jsonb)
) AS legacy_detail_report;
