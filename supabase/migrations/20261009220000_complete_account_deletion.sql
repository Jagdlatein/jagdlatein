BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Apply after the generation-bound PayPal migration. This migration removes
-- only explicitly deleted legacy provider records; active account deletion
-- remains an authenticated, generation-checked service RPC.
DO $$
DECLARE item record; target oid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) THEN
    RAISE EXCEPTION 'JL_DELETE_SETUP: service_role must bypass RLS';
  END IF;
  FOR item IN SELECT * FROM (VALUES
    ('userprofile','account_generation','uuid'::regtype),
    ('paypal_subscriptions','account_generation','uuid'::regtype),
    ('paypal_subscriptions','account_deleted_at','timestamptz'::regtype),
    ('paypal_subscription_payments','subscription_id','text'::regtype),
    ('paypal_checkout_requests','account_generation','uuid'::regtype),
    ('apple_account_tokens','app_account_token','uuid'::regtype),
    ('apple_account_tokens','account_generation','uuid'::regtype),
    ('apple_account_tokens','deleted_at','timestamptz'::regtype),
    ('apple_subscriptions','app_account_token','uuid'::regtype),
    ('apple_subscription_transactions','app_account_token','uuid'::regtype),
    ('apple_subscription_notifications','original_transaction_id','text'::regtype)
  ) AS required(table_name,column_name,column_type) LOOP
    target := to_regclass(format('public.%I',item.table_name));
    IF target IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_attribute WHERE attrelid = target AND attname = item.column_name
        AND attnum > 0 AND NOT attisdropped AND atttypid = item.column_type
    ) THEN RAISE EXCEPTION 'JL_DELETE_SETUP: unexpected provider deletion schema'; END IF;
  END LOOP;
END $$;

-- The same dependency check protects both the one-time legacy cleanup and each
-- account deletion. No unknown cascading dependency may erase unrelated data.
CREATE OR REPLACE FUNCTION public.require_complete_account_deletion_dependencies()
RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog,public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint fk WHERE fk.contype = 'f' AND fk.confrelid IN (
      to_regclass('public.userprofile'),to_regclass('public.login_codes'),to_regclass('public.push_tokens'),
      to_regclass('public.course_progress'),to_regclass('public.activity_results'),
      to_regclass('public.ranked_quiz_rounds'),to_regclass('public.verified_quiz_scores'),
      to_regclass('public.quiz_identities'),to_regclass('public.community_profiles'),
      to_regclass('public.community_reports'),to_regclass('public.community_events'),to_regclass('public.community_blocks'),
      to_regclass('public.account_registration_codes'),to_regclass('public.paypal_subscriptions'),
      to_regclass('public.paypal_subscription_payments'),to_regclass('public.paypal_checkout_requests'),
      to_regclass('public.apple_account_tokens'),
      to_regclass('public.apple_subscriptions'),to_regclass('public.apple_subscription_transactions'),
      to_regclass('public.apple_subscription_notifications'),to_regclass('public.apple_review_login_limits')
    ) AND NOT EXISTS (
      SELECT 1 FROM (VALUES
        ('quiz_identities','ranked_quiz_rounds',ARRAY['account_email'],ARRAY['account_email']),
        ('quiz_identities','verified_quiz_scores',ARRAY['account_email'],ARRAY['account_email']),
        ('community_profiles','community_posts',ARRAY['account_email'],ARRAY['account_email']),
        ('community_profiles','community_reports',ARRAY['account_email'],ARRAY['reporter_email']),
        ('community_profiles','community_events',ARRAY['account_email'],ARRAY['account_email']),
        ('userprofile','paypal_subscriptions',ARRAY['account_generation'],ARRAY['account_generation']),
        ('userprofile','paypal_checkout_requests',ARRAY['account_generation'],ARRAY['account_generation']),
        ('paypal_subscriptions','paypal_subscription_payments',ARRAY['subscription_id'],ARRAY['subscription_id']),
        ('apple_account_tokens','apple_subscriptions',ARRAY['app_account_token'],ARRAY['app_account_token']),
        ('apple_account_tokens','apple_subscription_transactions',ARRAY['app_account_token'],ARRAY['app_account_token']),
        ('apple_subscriptions','apple_subscription_transactions',ARRAY['environment','original_transaction_id'],ARRAY['environment','original_transaction_id']),
        ('apple_subscriptions','apple_subscription_notifications',ARRAY['environment','original_transaction_id'],ARRAY['environment','original_transaction_id'])
      ) AS known(parent_table,child_table,parent_columns,child_columns)
      WHERE fk.confrelid = to_regclass(format('public.%I',known.parent_table))
        AND fk.conrelid = to_regclass(format('public.%I',known.child_table))
        AND fk.conkey = ARRAY(
          SELECT attribute.attnum FROM unnest(known.child_columns) WITH ORDINALITY AS column_name(name,ordinal)
          JOIN pg_attribute attribute ON attribute.attrelid = fk.conrelid AND attribute.attname = column_name.name
            AND NOT attribute.attisdropped ORDER BY column_name.ordinal
        )
        AND fk.confkey = ARRAY(
          SELECT attribute.attnum FROM unnest(known.parent_columns) WITH ORDINALITY AS column_name(name,ordinal)
          JOIN pg_attribute attribute ON attribute.attrelid = fk.confrelid AND attribute.attname = column_name.name
            AND NOT attribute.attisdropped ORDER BY column_name.ordinal
        )
    )
  ) THEN RAISE EXCEPTION 'JL_DELETE_SETUP: unreviewed account dependency'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.require_complete_account_deletion_dependencies() FROM PUBLIC,anon,authenticated,service_role;

DO $$
DECLARE deleted_paypal integer; deleted_apple integer; removed integer;
BEGIN
  PERFORM public.require_complete_account_deletion_dependencies();
  PERFORM 1 FROM public.paypal_subscriptions WHERE account_deleted_at IS NOT NULL FOR UPDATE;
  GET DIAGNOSTICS deleted_paypal = ROW_COUNT;
  PERFORM 1 FROM public.apple_account_tokens WHERE deleted_at IS NOT NULL FOR UPDATE;
  GET DIAGNOSTICS deleted_apple = ROW_COUNT;

  DELETE FROM public.paypal_subscription_payments AS payment USING public.paypal_subscriptions AS subscription
    WHERE payment.subscription_id = subscription.subscription_id AND subscription.account_deleted_at IS NOT NULL;
  DELETE FROM public.paypal_subscriptions WHERE account_deleted_at IS NOT NULL;
  GET DIAGNOSTICS removed = ROW_COUNT;
  IF removed <> deleted_paypal THEN RAISE EXCEPTION 'JL_DELETE_SETUP: legacy PayPal deletion changed'; END IF;

  DELETE FROM public.apple_subscription_notifications AS notification
    USING public.apple_subscriptions AS subscription,public.apple_account_tokens AS owner
    WHERE notification.environment = subscription.environment
      AND notification.original_transaction_id = subscription.original_transaction_id
      AND subscription.app_account_token = owner.app_account_token AND owner.deleted_at IS NOT NULL;
  DELETE FROM public.apple_subscription_transactions AS transaction USING public.apple_account_tokens AS owner
    WHERE transaction.app_account_token = owner.app_account_token AND owner.deleted_at IS NOT NULL;
  DELETE FROM public.apple_subscriptions AS subscription USING public.apple_account_tokens AS owner
    WHERE subscription.app_account_token = owner.app_account_token AND owner.deleted_at IS NOT NULL;
  IF to_regclass('public.apple_review_login_limits') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.apple_review_login_limits AS limits USING public.apple_account_tokens AS owner
      WHERE limits.account_generation = owner.account_generation AND limits.app_account_token = owner.app_account_token
        AND owner.deleted_at IS NOT NULL';
  END IF;
  DELETE FROM public.apple_account_tokens WHERE deleted_at IS NOT NULL;
  GET DIAGNOSTICS removed = ROW_COUNT;
  IF removed <> deleted_apple THEN RAISE EXCEPTION 'JL_DELETE_SETUP: legacy Apple deletion changed'; END IF;
  RAISE NOTICE 'Removed explicitly deleted legacy provider records: PayPal contracts %, Apple tokens %',deleted_paypal,deleted_apple;
END $$;
ALTER TABLE public.paypal_subscriptions ALTER COLUMN account_generation SET NOT NULL;

-- Preserve the current refund/replay ordering body; only strengthen the live
-- account guard and lock order before any provider ledger INSERT.
CREATE OR REPLACE FUNCTION public.apply_apple_subscription_snapshot(p_snapshot jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  owner public.apple_account_tokens%ROWTYPE;
  expected_email text := p_snapshot->>'account_email';
  expected_generation uuid := (p_snapshot->>'account_generation')::uuid;
  existing_subscription public.apple_subscriptions%ROWTYPE;
  existing_transaction public.apple_subscription_transactions%ROWTYPE;
  latest_transaction public.apple_subscription_transactions%ROWTYPE;
  notice_transaction public.apple_subscription_transactions%ROWTYPE;
  incoming jsonb;
  incoming_order bigint;
  original_id text := p_snapshot->>'original_transaction_id';
  token uuid := (p_snapshot->>'app_account_token')::uuid;
  provider_environment text := p_snapshot->>'environment';
  observed timestamptz := (p_snapshot->>'observed_at')::timestamptz;
  incoming_signed timestamptz;
  incoming_revoked timestamptz;
  selected_latest text := p_snapshot->'transactions'->0->>'transaction_id';
  result_access_until timestamptz;
  notification_uuid uuid := (p_snapshot->>'notification_id')::uuid;
  reserved_notification uuid;
  duplicate_original_id text;
  notice jsonb := p_snapshot->'revocation_notification';
  notice_type text;
  notice_id text;
  notice_signed timestamptz;
  notice_transaction_signed timestamptz;
  notice_revoked timestamptz;
  notice_is_new boolean;
  accept_revocation boolean;
BEGIN
  IF observed IS NULL OR observed > clock_timestamp() + interval '5 minutes' OR
      p_snapshot->>'account_generation' IS NULL OR
      jsonb_typeof(p_snapshot->'transactions') IS DISTINCT FROM 'array' OR
      jsonb_array_length(p_snapshot->'transactions') NOT BETWEEN 1 AND 2 OR
      (p_snapshot->>'status')::integer NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
  -- Match deletion's email/profile-first order. A callback that verified an old
  -- token before deletion cannot create ledger rows after that generation ends.
  IF expected_email IS NULL OR expected_email <> lower(btrim(expected_email)) OR expected_generation IS NULL THEN
    RAISE EXCEPTION 'JL_APPLE_ACCOUNT';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(expected_email,0));
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = expected_email
    AND account_generation = expected_generation FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
  SELECT * INTO owner FROM public.apple_account_tokens WHERE app_account_token = token FOR UPDATE;
  IF NOT FOUND OR owner.account_generation <> expected_generation OR owner.account_email IS DISTINCT FROM expected_email
      OR owner.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;

  INSERT INTO public.apple_subscriptions(environment, original_transaction_id, app_account_token, latest_transaction_id,
      status, auto_renew, verified_at)
    VALUES(provider_environment, original_id, token, selected_latest, (p_snapshot->>'status')::integer,
      (p_snapshot->>'auto_renew')::boolean, observed) ON CONFLICT (environment, original_transaction_id) DO NOTHING;
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id FOR UPDATE;
  IF existing_subscription.app_account_token <> token THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;

  -- Reserve under the existing account/subscription locks, before changing any
  -- transaction or existing subscription state. The unique index also serializes
  -- competing UUIDs for different accounts/contracts; a failed RPC rolls back
  -- the reservation. The placeholder above is necessary for the existing FK.
  IF notification_uuid IS NOT NULL THEN
    INSERT INTO public.apple_subscription_notifications(environment, notification_id, original_transaction_id)
      VALUES(provider_environment, notification_uuid, original_id)
      ON CONFLICT (environment, notification_id) DO NOTHING
      RETURNING notification_id INTO reserved_notification;
    IF reserved_notification IS NULL THEN
      SELECT original_transaction_id INTO STRICT duplicate_original_id
        FROM public.apple_subscription_notifications
        WHERE environment = provider_environment AND notification_id = notification_uuid;
      IF duplicate_original_id IS DISTINCT FROM original_id THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
      RETURN to_jsonb(existing_subscription);
    END IF;
  END IF;

  IF notice IS NOT NULL THEN
    IF jsonb_typeof(notice) IS DISTINCT FROM 'object' OR notification_uuid IS NULL OR
        jsonb_array_length(p_snapshot->'transactions') <> 2 THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
    notice_type := notice->>'notification_type';
    notice_id := notice->>'transaction_id';
    notice_signed := (notice->>'notification_signed_at')::timestamptz;
    notice_transaction_signed := (notice->>'transaction_signed_at')::timestamptz;
    notice_revoked := (notice->>'revoked_at')::timestamptz;
    IF notice_type NOT IN ('REFUND','REFUND_REVERSED') OR notice_type IS NULL OR
        notice_id IS NULL OR notice_signed IS NULL OR notice_transaction_signed IS NULL OR
        notice_signed > clock_timestamp() + interval '5 minutes' OR
        notice_transaction_signed > clock_timestamp() + interval '5 minutes' OR
        notice_id IS DISTINCT FROM p_snapshot->'transactions'->1->>'transaction_id' OR
        notice_transaction_signed IS DISTINCT FROM (p_snapshot->'transactions'->1->>'signed_at')::timestamptz OR
        notice_revoked IS DISTINCT FROM (p_snapshot->'transactions'->1->>'revoked_at')::timestamptz OR
        (notice_type = 'REFUND' AND (notice_revoked IS NULL OR notice_revoked > notice_signed)) OR
        (notice_type = 'REFUND_REVERSED' AND notice_revoked IS NOT NULL) THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
  END IF;

  FOR incoming, incoming_order IN
    SELECT value, ordinality FROM jsonb_array_elements(p_snapshot->'transactions') WITH ORDINALITY ORDER BY ordinality
  LOOP
    IF incoming->>'environment' IS DISTINCT FROM provider_environment OR
      incoming->>'original_transaction_id' IS DISTINCT FROM original_id OR
      (incoming->>'app_account_token')::uuid IS DISTINCT FROM token THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
    incoming_signed := (incoming->>'signed_at')::timestamptz;
    incoming_revoked := (incoming->>'revoked_at')::timestamptz;
    IF incoming_signed IS NULL OR incoming_signed > clock_timestamp() + interval '5 minutes' OR
        incoming_revoked > clock_timestamp() + interval '5 minutes' THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
    SELECT * INTO existing_transaction FROM public.apple_subscription_transactions
      WHERE environment = provider_environment AND transaction_id = incoming->>'transaction_id' FOR UPDATE;
    IF FOUND THEN
      IF existing_transaction.original_transaction_id <> original_id OR existing_transaction.app_account_token <> token OR
        existing_transaction.product_id <> incoming->>'product_id' OR
        existing_transaction.purchased_at <> (incoming->>'purchased_at')::timestamptz THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
      accept_revocation := incoming_revoked IS NOT NULL;
      IF accept_revocation THEN
        IF incoming_order = 2 AND notice_type = 'REFUND' THEN
          -- Only the original notification time orders notification evidence.
          -- Its transaction JWS or the API may have been signed at another time.
          IF notice_signed <= existing_transaction.revocation_notification_signed_at THEN accept_revocation := false; END IF;
        ELSIF existing_transaction.revoked_at IS NULL THEN
          -- A re-signed API/device copy of a refund already reversed cannot
          -- create a new refund event. The actual revocation date must be later.
          IF incoming_revoked <= existing_transaction.revocation_notification_signed_at THEN accept_revocation := false; END IF;
        END IF;
      END IF;
      UPDATE public.apple_subscription_transactions SET
        revoked_at = CASE WHEN accept_revocation THEN greatest(revoked_at, incoming_revoked) ELSE revoked_at END,
        revocation_event_at = greatest(revocation_event_at, incoming_revoked),
        is_upgraded = is_upgraded OR (incoming->>'is_upgraded')::boolean,
        expires_at = CASE WHEN incoming_signed > signed_at THEN (incoming->>'expires_at')::timestamptz ELSE expires_at END,
        signed_at = greatest(signed_at, incoming_signed)
        WHERE environment = provider_environment AND transaction_id = existing_transaction.transaction_id;
    ELSE
      INSERT INTO public.apple_subscription_transactions(environment, transaction_id, original_transaction_id, app_account_token,
          product_id, purchased_at, expires_at, signed_at, revoked_at, revocation_event_at, is_upgraded, is_trial)
        VALUES(provider_environment, incoming->>'transaction_id', original_id, token, incoming->>'product_id',
          (incoming->>'purchased_at')::timestamptz, (incoming->>'expires_at')::timestamptz, incoming_signed, incoming_revoked,
          incoming_revoked, (incoming->>'is_upgraded')::boolean, (incoming->>'is_trial')::boolean);
    END IF;
  END LOOP;

  IF notice IS NOT NULL THEN
    SELECT * INTO STRICT notice_transaction FROM public.apple_subscription_transactions
      WHERE environment = provider_environment AND transaction_id = notice_id FOR UPDATE;
    notice_is_new := notice_transaction.revocation_notification_signed_at IS NULL OR
      notice_signed > notice_transaction.revocation_notification_signed_at;
    -- The legacy reversal field is preserved as history only. Without an
    -- original notification time, negative evidence must fail closed rather
    -- than be suppressed by the old API signing time. A new verified reversal
    -- supplies the missing, actual notification proof.
    IF notice_is_new THEN
      IF notice_type = 'REFUND_REVERSED' AND
          (p_snapshot->>'status')::integer IN (1,2,3,4) AND selected_latest = notice_id AND
          (p_snapshot->'transactions'->0->>'revoked_at')::timestamptz IS NULL AND
          (notice_transaction.revocation_event_at IS NULL OR notice_signed > notice_transaction.revocation_event_at) THEN
        -- The original, verified REFUND_REVERSED notification is the proof.
        -- A boolean from an older deployment or an API record alone cannot
        -- clear a refund. Expired/billing-retry records can clear the marker
        -- without gaining access; only status 1/4 and a real deadline grant it.
        -- API JWS signing times never order refunds.
        UPDATE public.apple_subscription_transactions SET revoked_at = NULL,
          revocation_reversed_at = greatest(revocation_reversed_at, notice_signed)
          WHERE environment = provider_environment AND transaction_id = notice_id;
      END IF;
      UPDATE public.apple_subscription_transactions SET revocation_notification_signed_at = notice_signed
        WHERE environment = provider_environment AND transaction_id = notice_id;
    END IF;
  END IF;

  IF observed >= existing_subscription.verified_at THEN
    UPDATE public.apple_subscriptions SET status = (p_snapshot->>'status')::integer,
      latest_transaction_id = selected_latest, auto_renew = (p_snapshot->>'auto_renew')::boolean,
      grace_until = CASE WHEN (p_snapshot->>'status')::integer = 4 THEN (p_snapshot->>'grace_until')::timestamptz ELSE NULL END,
      verified_at = observed WHERE environment = provider_environment AND original_transaction_id = original_id;
  END IF;
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  SELECT * INTO STRICT latest_transaction FROM public.apple_subscription_transactions
    WHERE environment = provider_environment AND transaction_id = existing_subscription.latest_transaction_id;
  IF latest_transaction.revoked_at IS NOT NULL AND existing_subscription.status IN (1,4) THEN
    UPDATE public.apple_subscriptions SET status = 5
      WHERE environment = provider_environment AND original_transaction_id = original_id;
    existing_subscription.status := 5;
  END IF;
  result_access_until := NULL;
  IF existing_subscription.status IN (1,4) AND latest_transaction.revoked_at IS NULL AND NOT latest_transaction.is_upgraded THEN
    result_access_until := latest_transaction.expires_at;
    IF existing_subscription.status = 4 AND existing_subscription.grace_until > result_access_until THEN
      result_access_until := existing_subscription.grace_until;
    END IF;
  END IF;
  UPDATE public.apple_subscriptions SET access_until = result_access_until, is_trial = latest_transaction.is_trial
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  RETURN to_jsonb(existing_subscription);
END $$;
REVOKE ALL ON FUNCTION public.apply_apple_subscription_snapshot(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_apple_subscription_snapshot(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_jagdlatein_account(p_email text,p_account_generation uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE account_row public.userprofile; removed_at timestamptz := clock_timestamp();
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320 OR
    p_account_generation IS NULL THEN RAISE EXCEPTION 'JL_DELETE_ACCOUNT_MISSING'; END IF;
  PERFORM public.require_complete_account_deletion_dependencies();
  -- Match the profile-first lock order of purchase reservation, registration,
  -- and other generation-aware account writes.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,731004));
  SELECT * INTO account_row FROM public.userprofile WHERE lower(btrim(email)) = p_email FOR UPDATE;
  IF NOT FOUND OR account_row.account_generation IS DISTINCT FROM p_account_generation THEN
    RAISE EXCEPTION 'JL_DELETE_ACCOUNT_MISSING';
  END IF;
  PERFORM 1 FROM public.paypal_subscriptions
    WHERE account_generation = p_account_generation AND account_email = p_email FOR UPDATE;
  PERFORM 1 FROM public.apple_account_tokens
    WHERE account_generation = p_account_generation AND account_email = p_email FOR UPDATE;

  -- Provider records are removed in FK order. Old callbacks must still pass the
  -- live-generation/token checks; no historical provider-ID binding survives.
  DELETE FROM public.paypal_subscription_payments AS payment USING public.paypal_subscriptions AS subscription
    WHERE payment.subscription_id = subscription.subscription_id
      AND subscription.account_generation = p_account_generation AND subscription.account_email = p_email;
  DELETE FROM public.paypal_subscriptions
    WHERE account_generation = p_account_generation AND account_email = p_email;
  DELETE FROM public.apple_subscription_notifications AS notification
    USING public.apple_subscriptions AS subscription,public.apple_account_tokens AS owner
    WHERE notification.environment = subscription.environment
      AND notification.original_transaction_id = subscription.original_transaction_id
      AND subscription.app_account_token = owner.app_account_token
      AND owner.account_generation = p_account_generation AND owner.account_email = p_email;
  DELETE FROM public.apple_subscription_transactions AS transaction USING public.apple_account_tokens AS owner
    WHERE transaction.app_account_token = owner.app_account_token
      AND owner.account_generation = p_account_generation AND owner.account_email = p_email;
  DELETE FROM public.apple_subscriptions AS subscription USING public.apple_account_tokens AS owner
    WHERE subscription.app_account_token = owner.app_account_token
      AND owner.account_generation = p_account_generation AND owner.account_email = p_email;
  IF to_regclass('public.apple_review_login_limits') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.apple_review_login_limits WHERE account_generation = $1' USING p_account_generation;
  END IF;
  DELETE FROM public.apple_account_tokens
    WHERE account_generation = p_account_generation AND account_email = p_email;
  DELETE FROM public.paypal_checkout_requests WHERE account_generation = p_account_generation;

  DELETE FROM public.login_codes WHERE lower(btrim(email)) = p_email;
  IF to_regclass('public.account_registration_codes') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.account_registration_codes'::regclass
      AND attname = 'email' AND atttypid = 'text'::regtype AND NOT attisdropped) THEN
      RAISE EXCEPTION 'JL_DELETE_SETUP: unexpected registration code schema';
    END IF;
    EXECUTE 'DELETE FROM public.account_registration_codes WHERE lower(btrim(email)) = $1' USING p_email;
  END IF;
  DELETE FROM public.push_tokens WHERE account_email = p_email;
  DELETE FROM public.course_progress WHERE account_email = p_email;
  DELETE FROM public.activity_results WHERE account_email = p_email;
  DELETE FROM public.ranked_quiz_rounds WHERE account_email = p_email;
  DELETE FROM public.verified_quiz_scores WHERE account_email = p_email;
  DELETE FROM public.quiz_identities WHERE account_email = p_email;
  DELETE FROM public.community_reports WHERE reporter_email = p_email OR
    post_id IN (SELECT id FROM public.community_posts WHERE account_email = p_email);
  UPDATE public.community_reports SET resolved_by = NULL WHERE resolved_by = p_email;
  UPDATE public.community_posts SET moderated_by = NULL WHERE moderated_by = p_email;
  UPDATE public.community_posts SET account_email = NULL,status = 'deleted',solved = false,
    title = CASE WHEN parent_id IS NULL THEN 'Gelöschter Beitrag' ELSE NULL END,
    body = 'Inhalt entfernt.',updated_at = removed_at,moderated_by = NULL,moderated_at = NULL
    WHERE account_email = p_email;
  DELETE FROM public.community_events WHERE account_email = p_email;
  DELETE FROM public.community_profiles WHERE account_email = p_email;
  DELETE FROM public.userprofile WHERE account_generation = p_account_generation;
  RETURN jsonb_build_object('deleted',true);
END $$;
REVOKE ALL ON FUNCTION public.delete_jagdlatein_account(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delete_jagdlatein_account(text,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
