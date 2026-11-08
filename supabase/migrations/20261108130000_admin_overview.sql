BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Read-only aggregates only. No customer rows, provider refresh, mail, quotas,
-- new telemetry, account flags or billing records are changed by this migration.
CREATE OR REPLACE FUNCTION public.get_admin_overview(
  p_email text, p_account_generation uuid, p_from date, p_to date,
  p_environment text, p_paypal_environment text
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  observed timestamptz := statement_timestamp();
  start_at timestamptz;
  end_at timestamptz;
  sections jsonb := '{}'::jsonb;
  item jsonb;
BEGIN
  -- The generic actor guard deliberately permits provider clients with no
  -- actor headers. This admin RPC instead requires BOTH exact signed actors.
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR p_account_generation IS NULL
      OR headers->>'x-jagdlatein-account-email' IS DISTINCT FROM p_email
      OR headers->>'x-jagdlatein-account-generation' IS DISTINCT FROM p_account_generation::text
      OR NOT EXISTS (SELECT 1 FROM public.userprofile p WHERE lower(btrim(p.email)) = p_email
        AND p.account_generation = p_account_generation AND p.is_admin IS TRUE) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'JL_ADMIN_OVERVIEW_FORBIDDEN';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR NOT isfinite(p_from) OR NOT isfinite(p_to)
      OR p_from > p_to OR p_to - p_from >= 366
      OR p_from < DATE '2000-01-01' OR p_to > DATE '2100-12-31'
      OR p_to > (observed AT TIME ZONE 'Europe/Zurich')::date
      OR p_environment IS NULL OR p_environment NOT IN ('Production', 'Sandbox')
      OR p_paypal_environment IS NULL OR p_paypal_environment NOT IN ('Production', 'Sandbox') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'JL_ADMIN_OVERVIEW_PERIOD';
  END IF;
  start_at := p_from::timestamp AT TIME ZONE 'Europe/Zurich';
  end_at := (p_to + 1)::timestamp AT TIME ZONE 'Europe/Zurich';

  BEGIN
    SELECT jsonb_build_object('status','ready','metrics',jsonb_build_object(
      'current',count(*),'admins',count(*) FILTER (WHERE is_admin IS TRUE),
      'legacy',count(*) FILTER (WHERE is_premium IS TRUE),
      'examSelected',count(*) FILTER (WHERE exam_country IS NOT NULL AND exam_region IS NOT NULL),
      'examMissing',count(*) FILTER (WHERE exam_country IS NULL OR exam_region IS NULL)),
      'rows',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.accounts DESC,r.country,r.region),'[]'::jsonb)
        FROM (SELECT exam_country AS country,exam_region AS region,count(*) AS accounts FROM public.userprofile
          GROUP BY exam_country,exam_region ORDER BY count(*) DESC,exam_country,exam_region LIMIT 30) r))
      INTO item FROM public.userprofile;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('accounts',item);

  BEGIN
    WITH entries AS (
      SELECT a.* FROM public.activity_results a JOIN public.userprofile p ON lower(btrim(p.email))=a.account_email
      WHERE a.finished_at >= start_at AND a.finished_at < end_at AND a.finished_at<=observed
    ), totals AS (
      SELECT count(*) AS rounds,count(DISTINCT account_email) AS learners,
        count(*) FILTER (WHERE type='quiz' AND verification='server_verified') AS verified,
        count(*) FILTER (WHERE verification='self_reported') AS self_reported,
        coalesce(sum(total_questions),0) AS questions,coalesce(sum(correct_answers),0) AS correct,
        coalesce(sum(duration_seconds),0) AS seconds FROM entries
    ), daily AS (
      SELECT (finished_at AT TIME ZONE 'Europe/Zurich')::date AS day,count(*) AS value FROM entries GROUP BY 1
    ) SELECT jsonb_build_object('status','ready','metrics',jsonb_build_object(
      'rounds',rounds,'learners',learners,'verified',verified,'selfReported',self_reported,
      'questions',questions,'correct',correct,'seconds',seconds,
      'accuracy',CASE WHEN questions>0 THEN round(100.0*correct/questions,1) ELSE NULL END),
      'rows',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.type,r.country),'[]'::jsonb) FROM (
        SELECT type,country,count(*) AS rounds,round(100.0*sum(correct_answers)/nullif(sum(total_questions),0),1) AS accuracy
        FROM entries GROUP BY type,country ORDER BY type,country LIMIT 30) r),
      'series',(SELECT coalesce(jsonb_agg(jsonb_build_object('date',d.day::date::text,'value',coalesce(daily.value,0)) ORDER BY d.day),'[]'::jsonb)
        FROM generate_series(p_from::timestamp,p_to::timestamp,interval '1 day') d(day) LEFT JOIN daily ON daily.day=d.day::date)) INTO item FROM totals;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('learning',item);

  BEGIN
    WITH entries AS (SELECT c.* FROM public.course_progress c JOIN public.userprofile p ON lower(btrim(p.email))=c.account_email)
    SELECT jsonb_build_object('status','ready','metrics',jsonb_build_object(
      'pairs',count(*),'completed',count(*) FILTER (WHERE status='completed'),
      'learners',count(DISTINCT account_email),'firstCompletions',count(*) FILTER (WHERE completed_at>=start_at AND completed_at<end_at AND completed_at<=observed)),
      'rows',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.learners DESC,r.course_id),'[]'::jsonb) FROM (
        SELECT course_id,count(DISTINCT account_email) AS learners,count(*) FILTER (WHERE status='completed') AS completed,
          max(updated_at) AS last_updated FROM entries GROUP BY course_id ORDER BY count(DISTINCT account_email) DESC,course_id LIMIT 20) r))
      INTO item FROM entries;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('courses',item);

  BEGIN
    WITH paypal AS (
      SELECT s.account_generation,'paypal'::text AS provider,
        (s.review_reason IS NOT NULL OR NOT isfinite(s.verified_at) OR s.verified_at>observed+interval '5 minutes'
          OR s.paid_until>observed AND NOT EXISTS (
            SELECT 1 FROM public.paypal_subscription_payments pay WHERE pay.subscription_id=s.subscription_id
              AND pay.status IN ('COMPLETED','PARTIALLY_REFUNDED') AND pay.period_until>=s.paid_until AND pay.paid_at<=observed
              AND CASE WHEN pay.amount ~ '^\d{1,12}([.]\d{1,3})?$' THEN pay.amount::numeric>0 ELSE false END)) AS needs_review,
        CASE WHEN s.paid_until>observed AND isfinite(s.paid_until) THEN 'paid'
          WHEN NOT isfinite(s.verified_at) OR s.verified_at>observed+interval '5 minutes' OR s.review_reason IS NOT NULL THEN 'review'
          WHEN s.paid_until>observed THEN 'review'
          WHEN s.status='ACTIVE' AND s.trial_started_at<=observed AND s.trial_until>observed
            AND isfinite(s.trial_started_at) AND isfinite(s.trial_until) AND s.trial_until>s.trial_started_at
            AND s.trial_until<=s.trial_started_at+interval '72 hours' THEN 'trial'
          WHEN s.status='ACTIVE' AND s.trial_until>observed THEN 'review' ELSE 'ended' END AS state
      FROM public.paypal_subscriptions s JOIN public.userprofile p ON p.account_generation=s.account_generation
        AND lower(btrim(p.email))=s.account_email
      WHERE s.account_deleted_at IS NULL AND p_environment=p_paypal_environment
    ), apple AS (
      SELECT owner.account_generation,'apple'::text AS provider,
        (NOT isfinite(s.verified_at) OR s.verified_at>observed+interval '5 minutes'
          OR s.status IN (1,4) AND s.access_until>observed AND (t.transaction_id IS NULL OR t.revoked_at IS NOT NULL
            OR t.is_upgraded OR t.is_trial IS DISTINCT FROM s.is_trial OR t.purchased_at>observed
            OR NOT isfinite(t.purchased_at) OR NOT isfinite(t.expires_at) OR t.expires_at<=t.purchased_at
            OR s.status=1 AND s.access_until>t.expires_at
            OR s.status=4 AND (s.grace_until IS NULL OR NOT isfinite(s.grace_until) OR s.grace_until<s.access_until))) AS needs_review,
        CASE WHEN s.status=4 AND s.access_until>observed AND isfinite(s.access_until) THEN 'grace'
          WHEN s.status=1 AND s.access_until>observed AND isfinite(s.access_until) THEN CASE WHEN s.is_trial THEN 'trial' ELSE 'paid' END
          WHEN NOT isfinite(s.verified_at) OR s.verified_at>observed+interval '5 minutes' THEN 'review'
          WHEN s.status IN (1,4) AND s.access_until>observed THEN 'review' ELSE 'ended' END AS state
      FROM public.apple_subscriptions s JOIN public.apple_account_tokens owner ON owner.app_account_token=s.app_account_token
      JOIN public.userprofile p ON p.account_generation=owner.account_generation AND lower(btrim(p.email))=owner.account_email
      LEFT JOIN public.apple_subscription_transactions t ON t.environment=s.environment AND t.transaction_id=s.latest_transaction_id
        AND t.original_transaction_id=s.original_transaction_id AND t.app_account_token=s.app_account_token
      WHERE s.environment=p_environment AND owner.deleted_at IS NULL
    ), contracts AS (SELECT * FROM paypal UNION ALL SELECT * FROM apple)
    SELECT jsonb_build_object('status','ready','paypal_applicable',p_environment=p_paypal_environment,'metrics',jsonb_build_object(
      'contracts',count(*),'paid',count(*) FILTER (WHERE state='paid'),'trial',count(*) FILTER (WHERE state='trial'),
      'grace',count(*) FILTER (WHERE state='grace'),'ended',count(*) FILTER (WHERE state='ended'),'review',count(*) FILTER (WHERE state='review' OR needs_review),
      'coveredAccounts',count(DISTINCT account_generation) FILTER (WHERE state IN ('paid','trial','grace')),
      'courtesy',(SELECT count(*) FROM public.account_access_grants g JOIN public.userprofile p ON p.account_generation=g.account_generation
        WHERE g.starts_at<=observed AND g.expires_at>observed AND isfinite(g.starts_at) AND isfinite(g.expires_at)),
      'legacy',(SELECT count(*) FROM public.userprofile WHERE is_premium IS TRUE),'admins',(SELECT count(*) FROM public.userprofile WHERE is_admin IS TRUE)),
      'rows',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.provider,r.state),'[]'::jsonb) FROM (
        SELECT provider,state,count(*) AS contracts,count(DISTINCT account_generation) AS accounts FROM contracts GROUP BY provider,state ORDER BY provider,state LIMIT 30) r))
      INTO item FROM contracts;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('subscriptions',item);

  BEGIN
    WITH payments AS (
      SELECT pay.*,CASE WHEN pay.currency ~ '^[A-Z]{3}$' AND pay.amount ~ '^\d{1,12}([.]\d{1,3})?$'
        THEN pay.amount::numeric ELSE NULL END AS gross
      FROM public.paypal_subscription_payments pay JOIN public.paypal_subscriptions s ON s.subscription_id=pay.subscription_id
      JOIN public.userprofile p ON p.account_generation=s.account_generation AND lower(btrim(p.email))=s.account_email
      WHERE p_environment=p_paypal_environment AND s.account_deleted_at IS NULL AND pay.paid_at>=start_at AND pay.paid_at<end_at AND pay.paid_at<=observed
        AND pay.status IN ('COMPLETED','PARTIALLY_REFUNDED')
    ) SELECT jsonb_build_object('status','ready','paypal_applicable',p_environment=p_paypal_environment,'metrics',jsonb_build_object(
      'paypalCompleted',CASE WHEN p_environment=p_paypal_environment THEN count(*) FILTER (WHERE status='COMPLETED') ELSE NULL END,
      'paypalPartial',CASE WHEN p_environment=p_paypal_environment THEN count(*) FILTER (WHERE status='PARTIALLY_REFUNDED') ELSE NULL END,
      'paypalReview',CASE WHEN p_environment=p_paypal_environment THEN count(*) FILTER (WHERE gross IS NULL OR gross<=0) ELSE NULL END,
      'appleTransactions',(SELECT count(*) FROM public.apple_subscription_transactions t
        JOIN public.apple_account_tokens owner ON owner.app_account_token=t.app_account_token
        JOIN public.userprofile p ON p.account_generation=owner.account_generation AND lower(btrim(p.email))=owner.account_email
        WHERE t.environment=p_environment AND owner.deleted_at IS NULL AND t.purchased_at>=start_at AND t.purchased_at<end_at AND t.purchased_at<=observed)),
      'rows',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.currency,r.state),'[]'::jsonb) FROM (
        SELECT currency,status AS state,count(*) AS payments,sum(gross)::text AS amount FROM payments
        WHERE gross>0 GROUP BY currency,status ORDER BY currency,status LIMIT 30) r)) INTO item FROM payments;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('payments',item);

  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.usage_collection_settings WHERE singleton IS TRUE AND started_at<=observed AND started_at<end_at
      AND p_to>=greatest((started_at AT TIME ZONE 'Europe/Zurich')::date,(observed AT TIME ZONE 'Europe/Zurich')::date-399)) THEN
      item := '{"status":"not_recorded"}';
    ELSE
      WITH entries AS (SELECT * FROM public.usage_daily_counts WHERE day>=p_from AND day<=p_to
        AND day>=(SELECT greatest((started_at AT TIME ZONE 'Europe/Zurich')::date,(observed AT TIME ZONE 'Europe/Zurich')::date-399)
          FROM public.usage_collection_settings WHERE singleton IS TRUE)
        AND event_kind IN ('page_view','navigation','action','expand','video_play')),
      daily AS (SELECT day,coalesce(sum(events) FILTER (WHERE event_kind IN ('navigation','action','expand')),0) AS value FROM entries GROUP BY day)
      SELECT jsonb_build_object('status','ready','started_at',(SELECT started_at FROM public.usage_collection_settings WHERE singleton IS TRUE),
        'metrics',jsonb_build_object('pageViews',coalesce(sum(events) FILTER (WHERE event_kind='page_view'),0),
          'clicks',coalesce(sum(events) FILTER (WHERE event_kind IN ('navigation','action','expand')),0),
          'videoPlays',coalesce(sum(events) FILTER (WHERE event_kind='video_play'),0)),
        'rows',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.clicks DESC,r.page_key),'[]'::jsonb) FROM (
          SELECT page_key,coalesce(sum(events) FILTER (WHERE event_kind='page_view'),0) AS page_views,
            coalesce(sum(events) FILTER (WHERE event_kind IN ('navigation','action','expand')),0) AS clicks,
            coalesce(sum(events) FILTER (WHERE event_kind='video_play'),0) AS video_plays
          FROM entries GROUP BY page_key ORDER BY coalesce(sum(events) FILTER (WHERE event_kind IN ('navigation','action','expand')),0) DESC,page_key LIMIT 30) r),
        'series',(SELECT coalesce(jsonb_agg(jsonb_build_object('date',d.day::date::text,'value',
          CASE WHEN d.day::date<(SELECT greatest((started_at AT TIME ZONE 'Europe/Zurich')::date,(observed AT TIME ZONE 'Europe/Zurich')::date-399)
            FROM public.usage_collection_settings WHERE singleton IS TRUE) THEN NULL
          ELSE coalesce(daily.value,0) END) ORDER BY d.day),'[]'::jsonb)
          FROM generate_series(p_from::timestamp,p_to::timestamp,interval '1 day') d(day) LEFT JOIN daily ON daily.day=d.day::date)) INTO item FROM entries;
    END IF;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('usage',item);

  BEGIN
    WITH entries AS (SELECT posts.* FROM public.community_posts posts JOIN public.userprofile p ON lower(btrim(p.email))=posts.account_email
      WHERE posts.created_at>=start_at AND posts.created_at<end_at AND posts.created_at<=observed)
    SELECT jsonb_build_object('status','ready','metrics',jsonb_build_object(
      'posts',count(*) FILTER (WHERE parent_id IS NULL),'replies',count(*) FILTER (WHERE parent_id IS NOT NULL),
      'authors',count(DISTINCT account_email),'openReports',(SELECT count(*) FROM public.community_reports WHERE resolved_at IS NULL)),
      'rows','[]'::jsonb) INTO item FROM entries;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('community',item);

  BEGIN
    SELECT jsonb_build_object('status','ready','metrics',jsonb_build_object(
      'photoRetained',(SELECT count(*) FROM public.photo_recognition_requests),
      'photoCurrentMonth',coalesce((SELECT attempts FROM public.photo_recognition_months WHERE month_start=date_trunc('month',observed AT TIME ZONE 'UTC')::date),0),
      'mailPending',(SELECT count(*) FROM public.operator_trial_notification_outbox WHERE state IN ('queued','sending','retry')),
      'mailSent',(SELECT count(*) FROM public.operator_trial_notification_outbox WHERE state='sent')),'rows','[]'::jsonb) INTO item;
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN item := '{"status":"not_configured"}';
    WHEN OTHERS THEN item := '{"status":"unavailable"}'; END;
  sections := sections || jsonb_build_object('system',item);
  RETURN jsonb_build_object('as_of',observed,'sections',sections);
END $$;

REVOKE ALL ON FUNCTION public.get_admin_overview(text,uuid,date,date,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_overview(text,uuid,date,date,text,text) TO service_role;
COMMIT;
