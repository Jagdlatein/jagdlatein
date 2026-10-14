BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Notification infrastructure only. No provider request, purchase, price,
-- premium flag, role or existing subscription is changed by this migration.
DO $$
BEGIN
  IF to_regclass('public.paypal_subscriptions') IS NULL OR
      to_regclass('public.apple_subscriptions') IS NULL OR
      to_regclass('public.apple_subscription_transactions') IS NULL OR
      to_regclass('public.apple_account_tokens') IS NULL OR
      to_regprocedure('public.require_complete_account_deletion_dependencies()') IS NULL THEN
    RAISE EXCEPTION 'JL_OPERATOR_TRIAL_SETUP: verified ledgers and complete account deletion are required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i WHERE i.indrelid='public.userprofile'::regclass
      AND i.indisunique AND i.indisvalid AND i.indisready AND i.indimmediate
      AND i.indpred IS NULL AND i.indexprs IS NULL AND i.indnkeyatts=1
      AND i.indkey[0]=(SELECT attnum FROM pg_attribute WHERE attrelid='public.userprofile'::regclass
        AND attname='account_generation' AND NOT attisdropped)
  ) THEN RAISE EXCEPTION 'JL_OPERATOR_TRIAL_SETUP: unique account generation is required'; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.operator_trial_notification_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled_since timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(enabled_since))
);
-- Pin once, including when the migration is deliberately rerun. Historical
-- restorations must never become a wave of "new customer" email notifications.
INSERT INTO public.operator_trial_notification_settings(singleton) VALUES(true) ON CONFLICT DO NOTHING;

-- Trial dates can already be present on APPROVAL_PENDING contracts. Retain a
-- separate first ACTIVE observation, so a later cancellation or paid renewal
-- cannot hide a confirmed start when post-response queuing was interrupted.
ALTER TABLE public.paypal_subscriptions ADD COLUMN IF NOT EXISTS trial_activated_at timestamptz;
CREATE OR REPLACE FUNCTION public.remember_paypal_trial_activation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  NEW.trial_activated_at:=CASE WHEN TG_OP='UPDATE' THEN OLD.trial_activated_at ELSE NULL END;
  IF NEW.trial_activated_at IS NULL AND NEW.status='ACTIVE' AND NEW.review_reason IS NULL AND
      NEW.account_deleted_at IS NULL AND NEW.account_generation IS NOT NULL AND
      NEW.trial_started_at IS NOT NULL AND NEW.trial_until IS NOT NULL AND
      isfinite(NEW.trial_started_at) AND isfinite(NEW.trial_until) AND isfinite(NEW.verified_at) AND
      NEW.trial_started_at <= NEW.verified_at AND NEW.verified_at <= clock_timestamp()+interval'5 minutes' AND
      NEW.trial_until > NEW.trial_started_at AND NEW.trial_until <= NEW.trial_started_at+interval'72 hours' AND
      EXISTS(SELECT 1 FROM public.userprofile p WHERE p.account_generation=NEW.account_generation
        AND lower(btrim(p.email))=NEW.account_email) THEN
    NEW.trial_activated_at:=clock_timestamp();
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Optional metadata never invalidates a successful payment snapshot. The
  -- next verified ACTIVE refresh can retry recording the first observation.
  NEW.trial_activated_at:=CASE WHEN TG_OP='UPDATE' THEN OLD.trial_activated_at ELSE NULL END;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.remember_paypal_trial_activation() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS paypal_trial_activation_notice_proof ON public.paypal_subscriptions;
CREATE TRIGGER paypal_trial_activation_notice_proof BEFORE INSERT OR UPDATE ON public.paypal_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.remember_paypal_trial_activation();

CREATE TABLE IF NOT EXISTS public.operator_trial_notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('paypal','apple')),
  environment text NOT NULL CHECK (environment = 'Production'),
  contract_id text NOT NULL CHECK (
    (provider='paypal' AND contract_id ~ '^I-[A-Za-z0-9]{6,64}$') OR
    (provider='apple' AND contract_id ~ '^[0-9]{1,30}$')),
  account_generation uuid NOT NULL REFERENCES public.userprofile(account_generation) ON DELETE CASCADE,
  trial_started_at timestamptz NOT NULL,
  trial_until timestamptz NOT NULL,
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','sending','sent','retry','suppressed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  lease_token uuid,
  lease_until timestamptz,
  sent_at timestamptz,
  diagnostic text CHECK (diagnostic IS NULL OR diagnostic ~ '^[a-z_]+:[a-z_]+(:[1-5][0-9]{2})?$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(provider,environment,contract_id,account_generation),
  CHECK (isfinite(trial_started_at) AND isfinite(trial_until) AND trial_until > trial_started_at),
  CHECK (provider <> 'paypal' OR trial_until <= trial_started_at + interval '72 hours'),
  CHECK ((state='sending') = (lease_token IS NOT NULL AND lease_until IS NOT NULL)),
  CHECK ((state='sent') = (sent_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS operator_trial_notification_due
  ON public.operator_trial_notification_outbox(state,next_attempt_at,created_at);
ALTER TABLE public.operator_trial_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_trial_notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operator_trial_notification_settings,public.operator_trial_notification_outbox
  FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.operator_trial_notification_settings,public.operator_trial_notification_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.queue_operator_trial_notification(p_provider text,p_environment text,p_contract_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE generation uuid; started timestamptz; ending timestamptz; enabled timestamptz; inserted uuid;
BEGIN
  SELECT enabled_since INTO enabled FROM public.operator_trial_notification_settings WHERE singleton;
  IF enabled IS NULL OR p_environment IS DISTINCT FROM 'Production' OR p_provider NOT IN ('paypal','apple') THEN
    RETURN jsonb_build_object('queued',false,'suppressed',true);
  END IF;
  IF p_provider='paypal' AND p_contract_id ~ '^I-[A-Za-z0-9]{6,64}$' THEN
    SELECT p.account_generation,s.trial_started_at,s.trial_until INTO generation,started,ending
      FROM public.paypal_subscriptions s JOIN public.userprofile p ON p.account_generation=s.account_generation
      WHERE s.subscription_id=p_contract_id AND s.account_deleted_at IS NULL AND
        s.account_email=lower(btrim(p.email)) AND s.trial_activated_at IS NOT NULL AND
        isfinite(s.trial_activated_at) AND s.trial_activated_at >= s.trial_started_at AND
        isfinite(s.verified_at) AND s.verified_at >= s.trial_started_at AND s.verified_at <= clock_timestamp()+interval'5 minutes' AND
        s.trial_started_at >= enabled AND s.trial_started_at <= clock_timestamp() AND
        s.trial_until > s.trial_started_at AND s.trial_until <= s.trial_started_at + interval '72 hours'
      FOR KEY SHARE OF p;
  ELSIF p_provider='apple' AND p_contract_id ~ '^[0-9]{1,30}$' THEN
    SELECT p.account_generation,t.purchased_at,t.expires_at INTO generation,started,ending
      FROM public.apple_subscriptions s
      JOIN public.apple_subscription_transactions t ON t.environment=s.environment
        AND t.original_transaction_id=s.original_transaction_id AND t.app_account_token=s.app_account_token
      JOIN public.apple_account_tokens o ON o.app_account_token=s.app_account_token
      JOIN public.userprofile p ON p.account_generation=o.account_generation
      WHERE s.environment='Production' AND s.original_transaction_id=p_contract_id
        AND o.deleted_at IS NULL AND o.account_email=lower(btrim(p.email))
        AND t.is_trial AND t.revoked_at IS NULL AND NOT t.is_upgraded
        AND t.purchased_at >= enabled AND t.purchased_at <= clock_timestamp()
        AND isfinite(s.verified_at) AND s.verified_at >= t.purchased_at AND s.verified_at <= clock_timestamp()+interval'5 minutes'
        AND isfinite(t.purchased_at) AND isfinite(t.expires_at)
        AND t.expires_at > t.purchased_at AND t.expires_at <= t.purchased_at+interval'400 days'
      ORDER BY t.purchased_at,t.transaction_id LIMIT 1
      FOR KEY SHARE OF p;
  END IF;
  IF generation IS NULL OR started IS NULL OR ending IS NULL THEN
    RETURN jsonb_build_object('queued',false,'suppressed',true);
  END IF;
  INSERT INTO public.operator_trial_notification_outbox(provider,environment,contract_id,account_generation,trial_started_at,trial_until)
    VALUES(p_provider,'Production',p_contract_id,generation,started,ending)
    ON CONFLICT(provider,environment,contract_id,account_generation) DO NOTHING RETURNING id INTO inserted;
  RETURN jsonb_build_object('queued',inserted IS NOT NULL,'suppressed',false);
END $$;

CREATE OR REPLACE FUNCTION public.reconcile_operator_trial_notifications(p_limit integer DEFAULT 100)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record; queued integer:=0; result jsonb;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN RAISE EXCEPTION 'JL_OPERATOR_TRIAL_LIMIT'; END IF;
  FOR candidate IN
    SELECT * FROM (
      SELECT 'paypal'::text AS provider,s.subscription_id AS contract_id,s.trial_started_at AS started
        FROM public.paypal_subscriptions s JOIN public.operator_trial_notification_settings cfg ON cfg.singleton
        JOIN public.userprofile p ON p.account_generation=s.account_generation AND lower(btrim(p.email))=s.account_email
        WHERE s.account_deleted_at IS NULL AND s.trial_activated_at IS NOT NULL AND
          isfinite(s.trial_activated_at) AND s.trial_activated_at >= s.trial_started_at AND
          isfinite(s.verified_at) AND s.verified_at >= s.trial_started_at AND s.verified_at <= clock_timestamp()+interval'5 minutes' AND
          s.trial_started_at >= cfg.enabled_since AND s.trial_started_at <= clock_timestamp() AND
          s.trial_until > s.trial_started_at AND s.trial_until <= s.trial_started_at + interval '72 hours' AND
          NOT EXISTS (SELECT 1 FROM public.operator_trial_notification_outbox n WHERE n.provider='paypal'
            AND n.environment='Production' AND n.contract_id=s.subscription_id AND n.account_generation=s.account_generation)
      UNION ALL
      SELECT 'apple'::text,s.original_transaction_id,t.purchased_at
        FROM public.apple_subscriptions s JOIN public.operator_trial_notification_settings cfg ON cfg.singleton
        JOIN LATERAL (SELECT history.purchased_at FROM public.apple_subscription_transactions history
          WHERE history.environment=s.environment AND history.original_transaction_id=s.original_transaction_id
            AND history.app_account_token=s.app_account_token AND history.is_trial AND history.revoked_at IS NULL
            AND NOT history.is_upgraded AND history.purchased_at >= cfg.enabled_since
            AND history.purchased_at <= clock_timestamp() AND isfinite(history.purchased_at) AND isfinite(history.expires_at)
            AND history.expires_at > history.purchased_at AND history.expires_at <= history.purchased_at+interval'400 days'
          ORDER BY history.purchased_at,history.transaction_id LIMIT 1) t ON true
        JOIN public.apple_account_tokens o ON o.app_account_token=s.app_account_token
        JOIN public.userprofile p ON p.account_generation=o.account_generation AND lower(btrim(p.email))=o.account_email
        WHERE s.environment='Production' AND o.deleted_at IS NULL AND isfinite(s.verified_at)
          AND s.verified_at <= clock_timestamp()+interval'5 minutes'
          AND s.verified_at >= t.purchased_at AND
          NOT EXISTS (SELECT 1 FROM public.operator_trial_notification_outbox n WHERE n.provider='apple'
            AND n.environment='Production' AND n.contract_id=s.original_transaction_id AND n.account_generation=o.account_generation)
    ) candidates ORDER BY started,provider,contract_id LIMIT p_limit
  LOOP
    result:=public.queue_operator_trial_notification(candidate.provider,'Production',candidate.contract_id);
    IF (result->>'queued')::boolean THEN queued:=queued+1; END IF;
  END LOOP;
  RETURN queued;
END $$;

CREATE OR REPLACE FUNCTION public.operator_trial_notification_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT jsonb_build_object('enabled_since',cfg.enabled_since,
    'pending_count',(SELECT count(*) FROM public.operator_trial_notification_outbox WHERE state IN ('queued','retry','sending')),
    'sent_count',(SELECT count(*) FROM public.operator_trial_notification_outbox WHERE state='sent'))
  FROM public.operator_trial_notification_settings cfg WHERE cfg.singleton;
$$;

CREATE OR REPLACE FUNCTION public.claim_operator_trial_notification()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE notice public.operator_trial_notification_outbox; email text;
BEGIN
  SELECT * INTO notice FROM public.operator_trial_notification_outbox
    WHERE ((state IN ('queued','retry') AND next_attempt_at <= clock_timestamp()) OR
      (state='sending' AND lease_until < clock_timestamp()))
    ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT lower(btrim(p.email)) INTO email FROM public.userprofile p WHERE p.account_generation=notice.account_generation;
  IF email IS NULL THEN RETURN NULL; END IF;
  UPDATE public.operator_trial_notification_outbox SET state='sending',lease_token=gen_random_uuid(),
    lease_until=clock_timestamp()+interval '2 minutes',attempt_count=attempt_count+1,diagnostic=NULL
    WHERE id=notice.id RETURNING * INTO notice;
  RETURN to_jsonb(notice)||jsonb_build_object('account_email',email);
END $$;

CREATE OR REPLACE FUNCTION public.operator_trial_notification_claim_current(p_id uuid,p_lease_token uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT EXISTS(SELECT 1 FROM public.operator_trial_notification_outbox n
    JOIN public.userprofile p ON p.account_generation=n.account_generation
    WHERE n.id=p_id AND n.state='sending' AND n.lease_token=p_lease_token AND n.lease_until > clock_timestamp());
$$;

CREATE OR REPLACE FUNCTION public.finish_operator_trial_notification(p_id uuid,p_lease_token uuid,p_state text,p_diagnostic text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF p_state IS NULL OR p_state NOT IN ('sent','retry','suppressed') OR
      (p_diagnostic IS NOT NULL AND p_diagnostic !~ '^[a-z_]+:[a-z_]+(:[1-5][0-9]{2})?$') THEN
    RAISE EXCEPTION 'JL_OPERATOR_TRIAL_FINISH';
  END IF;
  UPDATE public.operator_trial_notification_outbox SET state=p_state,
    sent_at=CASE WHEN p_state='sent' THEN clock_timestamp() ELSE NULL END,
    next_attempt_at=CASE WHEN p_state='retry' THEN clock_timestamp()+
      make_interval(secs=>least(21600,60*power(2,least(attempt_count,9)))::integer) ELSE next_attempt_at END,
    diagnostic=CASE WHEN p_state='retry' THEN p_diagnostic ELSE NULL END,lease_token=NULL,lease_until=NULL
    WHERE id=p_id AND state='sending' AND lease_token=p_lease_token AND lease_until > clock_timestamp();
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.queue_operator_trial_notification(text,text,text),public.reconcile_operator_trial_notifications(integer),
  public.operator_trial_notification_status(),public.claim_operator_trial_notification(),
  public.operator_trial_notification_claim_current(uuid,uuid),public.finish_operator_trial_notification(uuid,uuid,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_operator_trial_notification(text,text,text),public.reconcile_operator_trial_notifications(integer),
  public.operator_trial_notification_status(),public.claim_operator_trial_notification(),
  public.operator_trial_notification_claim_current(uuid,uuid),public.finish_operator_trial_notification(uuid,uuid,text,text) TO service_role;

-- Extend the existing reviewed dependency list by this one cascade dependency.
-- All previous checks remain exact; arbitrary new FKs still block deletion.
CREATE OR REPLACE FUNCTION public.require_complete_account_deletion_dependencies()
RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint fk WHERE fk.contype='f' AND fk.confrelid IN (
      to_regclass('public.userprofile'),to_regclass('public.login_codes'),to_regclass('public.push_tokens'),
      to_regclass('public.course_progress'),to_regclass('public.activity_results'),
      to_regclass('public.ranked_quiz_rounds'),to_regclass('public.verified_quiz_scores'),
      to_regclass('public.quiz_identities'),to_regclass('public.community_profiles'),
      to_regclass('public.community_reports'),to_regclass('public.community_events'),to_regclass('public.community_blocks'),
      to_regclass('public.account_registration_codes'),to_regclass('public.paypal_subscriptions'),
      to_regclass('public.paypal_subscription_payments'),to_regclass('public.paypal_checkout_requests'),
      to_regclass('public.apple_account_tokens'),to_regclass('public.apple_subscriptions'),
      to_regclass('public.apple_subscription_transactions'),to_regclass('public.apple_subscription_notifications'),
      to_regclass('public.apple_review_login_limits'),to_regclass('public.operator_trial_notification_outbox')
    ) AND NOT EXISTS (
      SELECT 1 FROM (VALUES
        ('quiz_identities','ranked_quiz_rounds',ARRAY['account_email'],ARRAY['account_email']),
        ('quiz_identities','verified_quiz_scores',ARRAY['account_email'],ARRAY['account_email']),
        ('community_profiles','community_posts',ARRAY['account_email'],ARRAY['account_email']),
        ('community_profiles','community_reports',ARRAY['account_email'],ARRAY['reporter_email']),
        ('community_profiles','community_events',ARRAY['account_email'],ARRAY['account_email']),
        ('userprofile','paypal_subscriptions',ARRAY['account_generation'],ARRAY['account_generation']),
        ('userprofile','paypal_checkout_requests',ARRAY['account_generation'],ARRAY['account_generation']),
        ('userprofile','operator_trial_notification_outbox',ARRAY['account_generation'],ARRAY['account_generation']),
        ('paypal_subscriptions','paypal_subscription_payments',ARRAY['subscription_id'],ARRAY['subscription_id']),
        ('apple_account_tokens','apple_subscriptions',ARRAY['app_account_token'],ARRAY['app_account_token']),
        ('apple_account_tokens','apple_subscription_transactions',ARRAY['app_account_token'],ARRAY['app_account_token']),
        ('apple_subscriptions','apple_subscription_transactions',ARRAY['environment','original_transaction_id'],ARRAY['environment','original_transaction_id']),
        ('apple_subscriptions','apple_subscription_notifications',ARRAY['environment','original_transaction_id'],ARRAY['environment','original_transaction_id'])
      ) AS known(parent_table,child_table,parent_columns,child_columns)
      WHERE fk.confrelid=to_regclass(format('public.%I',known.parent_table))
        AND fk.conrelid=to_regclass(format('public.%I',known.child_table))
        AND fk.conkey=ARRAY(SELECT attribute.attnum FROM unnest(known.child_columns) WITH ORDINALITY AS column_name(name,ordinal)
          JOIN pg_attribute attribute ON attribute.attrelid=fk.conrelid AND attribute.attname=column_name.name
            AND NOT attribute.attisdropped ORDER BY column_name.ordinal)
        AND fk.confkey=ARRAY(SELECT attribute.attnum FROM unnest(known.parent_columns) WITH ORDINALITY AS column_name(name,ordinal)
          JOIN pg_attribute attribute ON attribute.attrelid=fk.confrelid AND attribute.attname=column_name.name
            AND NOT attribute.attisdropped ORDER BY column_name.ordinal)
    )
  ) THEN RAISE EXCEPTION 'JL_DELETE_SETUP: unreviewed account dependency'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.require_complete_account_deletion_dependencies() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
