-- Add seven fixed counter names only. No client result, URL, seed or PII column.
-- Apply before explicitly enabling REVIERDUELL_ANALYTICS_ENABLED.
BEGIN;
SET LOCAL search_path = pg_catalog, public;
DO $$ BEGIN
  IF to_regclass('public.usage_daily_counts') IS NULL OR to_regprocedure('public.record_usage_events(text,uuid,uuid,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'JL_REVIERDUELL_USAGE_SETUP';
  END IF;
END $$;
ALTER TABLE public.usage_daily_counts DROP CONSTRAINT usage_daily_counts_event_kind_check;
ALTER TABLE public.usage_daily_counts ADD CONSTRAINT usage_daily_counts_event_kind_check
  CHECK(event_kind IN ('page_view','navigation','action','expand','video_play','revierduell_view','revierduell_start','revierduell_question_view','revierduell_answer','revierduell_complete','revierduell_share','revierduell_copy'));

CREATE OR REPLACE FUNCTION public.record_usage_events(p_email text,p_account_generation uuid,p_batch_id uuid,p_events jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE h jsonb:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb; opted boolean;
  item jsonb; seen text[]:='{}'; pair text; counter integer; n integer; now_at timestamptz:=clock_timestamp();
  today date:=(clock_timestamp() AT TIME ZONE 'Europe/Zurich')::date; current_minute timestamptz:=date_trunc('minute',clock_timestamp());
BEGIN
  IF p_email IS NULL OR p_email<>lower(btrim(p_email)) OR p_account_generation IS NULL OR p_batch_id IS NULL OR
    NOT(h ? 'x-jagdlatein-account-email') OR NOT(h ? 'x-jagdlatein-account-generation') OR
    h->>'x-jagdlatein-account-email' IS DISTINCT FROM p_email OR h->>'x-jagdlatein-account-generation' IS DISTINCT FROM p_account_generation::text
    THEN RAISE EXCEPTION 'JL_USAGE_IDENTITY'; END IF;
  PERFORM public.require_current_request_actor();
  SELECT usage_analytics_opt_in INTO opted FROM public.userprofile
    WHERE lower(btrim(email))=p_email AND account_generation=p_account_generation FOR NO KEY UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_USAGE_IDENTITY'; END IF;
  IF NOT opted THEN RETURN jsonb_build_object('recorded',false); END IF;
  IF jsonb_typeof(p_events) IS DISTINCT FROM 'array' OR jsonb_array_length(p_events) NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'JL_USAGE_BATCH'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_events) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'JL_USAGE_BATCH'; END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(item))<>3 OR NOT(item ?& ARRAY['page','event','count']) OR
      jsonb_typeof(item->'page') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'event') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'count') IS DISTINCT FROM 'number' OR
      item->>'page' NOT IN ('lernen','wildkunde','wildjahr','kurse','quiz','lernkarten','videos','werkzeuge','jagdrecht','community','fotohelfer','online_kurse') OR
      item->>'event' NOT IN ('page_view','navigation','action','expand','video_play','revierduell_view','revierduell_start','revierduell_question_view','revierduell_answer','revierduell_complete','revierduell_share','revierduell_copy') OR item->>'count' !~ '^(1[0-9]|20|[1-9])$'
      THEN RAISE EXCEPTION 'JL_USAGE_BATCH'; END IF;
    pair:=(item->>'page')||':'||(item->>'event');
    IF pair=ANY(seen) THEN RAISE EXCEPTION 'JL_USAGE_BATCH'; END IF;
    seen:=array_append(seen,pair);
  END LOOP;
  -- One global lock covers deduplication and both global request ceilings.
  PERFORM pg_advisory_xact_lock(81120026);
  DELETE FROM public.usage_ingested_batches WHERE created_at<now_at-interval '48 hours';
  DELETE FROM public.usage_ingestion_limits WHERE minute<now_at-interval '2 days';
  DELETE FROM public.usage_daily_counts WHERE day<today-399;
  IF EXISTS(SELECT 1 FROM public.usage_ingested_batches WHERE batch_id=p_batch_id) THEN RETURN jsonb_build_object('recorded',false); END IF;
  SELECT requests INTO counter FROM public.usage_ingestion_limits WHERE minute=current_minute;
  IF coalesce(counter,0)>=2000 OR (SELECT coalesce(sum(requests),0) FROM public.usage_ingestion_limits WHERE minute>=(today::timestamp AT TIME ZONE 'Europe/Zurich'))>=50000
    THEN RETURN jsonb_build_object('recorded',false); END IF;
  INSERT INTO public.usage_ingestion_limits VALUES(current_minute,1) ON CONFLICT(minute) DO UPDATE SET requests=usage_ingestion_limits.requests+1;
  INSERT INTO public.usage_ingested_batches VALUES(p_batch_id,now_at);
  FOR item IN SELECT value FROM jsonb_array_elements(p_events) LOOP
    n:=(item->>'count')::integer;
    INSERT INTO public.usage_daily_counts VALUES(today,item->>'page',item->>'event',n,now_at)
      ON CONFLICT(day,page_key,event_kind) DO UPDATE SET events=LEAST(2147483647,usage_daily_counts.events+excluded.events),last_at=excluded.last_at;
  END LOOP;
  UPDATE public.usage_collection_settings SET started_at=coalesce(started_at,now_at) WHERE singleton;
  RETURN jsonb_build_object('recorded',true);
END $$;
-- CREATE OR REPLACE preserves the existing function ownership and ACL.
-- No grants, policies, role rights or identity/consent/rate rules are altered.
COMMIT;
