BEGIN;
SET LOCAL search_path = pg_catalog,public;

-- Request accounting only: no photograph, prompt, response, email or IP address.
-- Limits apply to attempts, including upstream failure; these are not currency
-- or token spending limits. Enabling the feature separately is required.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role' AND (rolbypassrls OR rolsuper)) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon' AND NOT rolbypassrls AND NOT rolsuper) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated' AND NOT rolbypassrls AND NOT rolsuper) OR
    pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') OR
    NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.userprofile') AND
      attname='account_generation' AND atttypid='uuid'::regtype AND attnum>0 AND NOT attisdropped) THEN
    RAISE EXCEPTION 'JL_PHOTO_QUOTA_SETUP';
  END IF;
END $$;

-- Deliberately no account foreign key: these short-lived pseudonymous request
-- reservations neither recreate an account nor interfere with its deletion.
CREATE TABLE IF NOT EXISTS public.photo_recognition_requests (
  account_generation uuid NOT NULL,
  request_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(created_at)),
  PRIMARY KEY(account_generation,request_id)
);
CREATE INDEX IF NOT EXISTS photo_recognition_requests_created ON public.photo_recognition_requests(created_at);
CREATE INDEX IF NOT EXISTS photo_recognition_requests_account_created ON public.photo_recognition_requests(account_generation,created_at);

-- This identity-free aggregate survives short request-row cleanup; otherwise a
-- 48-hour cleanup could accidentally reopen the monthly provider-call limit.
CREATE TABLE IF NOT EXISTS public.photo_recognition_months (
  month_start date PRIMARY KEY CHECK (extract(day FROM month_start)=1 AND isfinite(month_start)),
  attempts integer NOT NULL CHECK (attempts BETWEEN 0 AND 100)
);
ALTER TABLE public.photo_recognition_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_recognition_months ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.photo_recognition_requests,public.photo_recognition_months FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.photo_recognition_quota_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE observed timestamptz:=clock_timestamp(); current_month date;
BEGIN
  current_month:=date_trunc('month',observed AT TIME ZONE 'UTC')::date;
  -- Request-driven cleanup, not a claim of deletion exactly 48 hours later.
  DELETE FROM public.photo_recognition_requests WHERE created_at < observed-interval '48 hours';
  DELETE FROM public.photo_recognition_months WHERE month_start < (current_month-interval '2 months')::date;
  RETURN jsonb_build_object('schemaVersion',1,'available',true,'dailyLimit',5,'globalDailyLimit',50,'globalMonthlyLimit',100);
END $$;

CREATE OR REPLACE FUNCTION public.reserve_photo_recognition(
  p_account_generation uuid,p_request_id uuid,p_account_limit integer,p_global_daily_limit integer,p_global_monthly_limit integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  observed timestamptz; day_start timestamptz; month_at date;
  account_count integer; global_count integer; monthly_count integer; retry_after integer;
BEGIN
  IF p_account_generation IS NULL OR p_request_id IS NULL OR p_account_limit IS DISTINCT FROM 5 OR
    p_global_daily_limit IS DISTINCT FROM 50 OR p_global_monthly_limit IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION 'JL_PHOTO_QUOTA_INVALID';
  END IF;
  -- One global transaction lock serializes all counter checks and reservations
  -- across server instances, accounts and retries. No in-memory fallback.
  PERFORM pg_advisory_xact_lock(731023,190000);
  observed:=clock_timestamp();
  day_start:=date_trunc('day',observed AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  month_at:=date_trunc('month',observed AT TIME ZONE 'UTC')::date;
  retry_after:=greatest(1,least(86400,ceil(extract(epoch FROM day_start+interval '1 day'-observed))::integer));
  DELETE FROM public.photo_recognition_requests WHERE created_at < observed-interval '48 hours';
  DELETE FROM public.photo_recognition_months m WHERE m.month_start < (month_at-interval '2 months')::date;
  IF NOT EXISTS (SELECT 1 FROM public.userprofile WHERE account_generation=p_account_generation) THEN
    RETURN jsonb_build_object('schemaVersion',1,'allowed',false,'reason','identity_missing');
  END IF;
  IF EXISTS (SELECT 1 FROM public.photo_recognition_requests WHERE account_generation=p_account_generation AND request_id=p_request_id) THEN
    RETURN jsonb_build_object('schemaVersion',1,'allowed',false,'reason','duplicate');
  END IF;
  SELECT count(*)::integer INTO account_count FROM public.photo_recognition_requests
    WHERE account_generation=p_account_generation AND created_at >= day_start;
  IF account_count >= p_account_limit THEN
    RETURN jsonb_build_object('schemaVersion',1,'allowed',false,'reason','account_limit','retryAfter',retry_after);
  END IF;
  SELECT count(*)::integer INTO global_count FROM public.photo_recognition_requests WHERE created_at >= day_start;
  IF global_count >= p_global_daily_limit THEN
    RETURN jsonb_build_object('schemaVersion',1,'allowed',false,'reason','global_limit','retryAfter',retry_after);
  END IF;
  SELECT m.attempts INTO monthly_count FROM public.photo_recognition_months m WHERE m.month_start=month_at;
  IF coalesce(monthly_count,0) >= p_global_monthly_limit THEN
    RETURN jsonb_build_object('schemaVersion',1,'allowed',false,'reason','monthly_limit');
  END IF;
  INSERT INTO public.photo_recognition_requests(account_generation,request_id,created_at)
    VALUES(p_account_generation,p_request_id,observed);
  INSERT INTO public.photo_recognition_months(month_start,attempts) VALUES(month_at,1)
    ON CONFLICT ON CONSTRAINT photo_recognition_months_pkey DO UPDATE SET attempts=public.photo_recognition_months.attempts+1;
  RETURN jsonb_build_object('schemaVersion',1,'allowed',true,'reason','reserved');
END $$;

REVOKE ALL ON FUNCTION public.photo_recognition_quota_status() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.reserve_photo_recognition(uuid,uuid,integer,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.photo_recognition_quota_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_photo_recognition(uuid,uuid,integer,integer,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
