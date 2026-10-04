BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- New community tables only. Existing accounts, quiz and payments stay intact.
DO $$
DECLARE browser_role text;
BEGIN
  IF to_regclass('public.userprofile') IS NULL THEN RAISE EXCEPTION 'JL_COMMUNITY_SETUP: userprofile is missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) THEN
    RAISE EXCEPTION 'JL_COMMUNITY_SETUP: service_role must already bypass RLS';
  END IF;
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN RAISE EXCEPTION 'JL_COMMUNITY_SETUP: role % missing', browser_role; END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role AND (rolbypassrls OR rolsuper)) OR pg_has_role(browser_role, 'service_role', 'MEMBER') THEN
      RAISE EXCEPTION 'JL_COMMUNITY_SETUP: browser role % must not bypass RLS or inherit service_role', browser_role;
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.community_profiles (
  account_email text PRIMARY KEY CHECK (account_email = lower(btrim(account_email))),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 3 AND 30 AND display_name = btrim(display_name)),
  rules_version text NOT NULL,
  rules_accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS community_profiles_name_unique ON public.community_profiles(lower(display_name));

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.community_posts(id),
  account_email text NOT NULL REFERENCES public.community_profiles(account_email),
  category text NOT NULL CHECK (category IN ('allgemein','wildkunde','waffen-sicherheit','jagdpraxis','natur-revier','hundewesen','wildbret-gesundheit','jagdrecht','pruefung-sprache','wald-pflanzen','landwirtschaft-lebensraeume','ausruestung-technik','tierschutz-verantwortung')),
  kind text NOT NULL CHECK (kind IN ('question','discussion','reply')),
  title text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','deleted')),
  solved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  moderated_by text,
  moderated_at timestamptz,
  CHECK ((parent_id IS NULL AND kind IN ('question','discussion') AND char_length(title) BETWEEN 8 AND 140 AND char_length(body) BETWEEN 10 AND 6000)
    OR (parent_id IS NOT NULL AND kind = 'reply' AND title IS NULL AND char_length(body) BETWEEN 2 AND 4000)),
  CHECK (kind = 'question' OR NOT solved)
);
CREATE INDEX IF NOT EXISTS community_posts_feed ON public.community_posts(status,updated_at DESC) WHERE parent_id IS NULL;
CREATE INDEX IF NOT EXISTS community_posts_replies ON public.community_posts(parent_id,created_at) WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id),
  reporter_email text NOT NULL REFERENCES public.community_profiles(account_email),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  UNIQUE (post_id,reporter_email)
);
CREATE INDEX IF NOT EXISTS community_reports_open ON public.community_reports(created_at) WHERE resolved_at IS NULL;
CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email text NOT NULL REFERENCES public.community_profiles(account_email),
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_events_limits ON public.community_events(account_email,action,created_at DESC);

ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.community_profiles,public.community_posts,public.community_reports,public.community_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public.community_profiles TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.community_posts,public.community_reports TO service_role;
GRANT SELECT,INSERT,DELETE ON TABLE public.community_events TO service_role;

CREATE OR REPLACE FUNCTION public.community_post_json(p_post public.community_posts,p_actor_email text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog,public AS $$
  SELECT jsonb_build_object('id',p_post.id,'threadId',p_post.parent_id,'category',p_post.category,'type',p_post.kind,
    'title',p_post.title,'body',p_post.body,'displayName',profile.display_name,'createdAt',p_post.created_at,'updatedAt',p_post.updated_at,
    'owned',p_post.account_email = p_actor_email,'status',p_post.status,'solved',p_post.solved,
    'replyCount',(SELECT count(*)::integer FROM public.community_posts reply WHERE reply.parent_id = p_post.id AND reply.status = 'visible'))
  FROM public.community_profiles profile WHERE profile.account_email = p_post.account_email;
$$;

CREATE OR REPLACE FUNCTION public.community_read(p_actor_email text,p_mode text,p_options jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog,public AS $$
DECLARE
  actor_admin boolean; category_filter text := coalesce(p_options->>'category','all');
  query_filter text := btrim(coalesce(p_options->>'query','')); type_filter text := coalesce(p_options->>'type','all');
  page_number integer := coalesce((p_options->>'page')::integer,1); page_size integer; total integer; entries jsonb;
  thread public.community_posts; thread_id uuid; only_unanswered boolean := coalesce((p_options->>'unanswered')::boolean,false);
BEGIN
  SELECT coalesce(bool_or(profile.is_admin IS TRUE),false) INTO actor_admin FROM public.userprofile profile WHERE lower(btrim(profile.email)) = p_actor_email;
  IF NOT EXISTS (SELECT 1 FROM public.userprofile WHERE lower(btrim(email)) = p_actor_email) THEN RAISE EXCEPTION 'JL_COMMUNITY_AUTH'; END IF;
  IF p_actor_email IS NULL OR p_actor_email <> lower(btrim(p_actor_email)) OR page_number NOT BETWEEN 1 AND 9999 OR char_length(query_filter) > 160
    OR type_filter NOT IN ('all','question','discussion') OR (category_filter <> 'all' AND category_filter NOT IN ('allgemein','wildkunde','waffen-sicherheit','jagdpraxis','natur-revier','hundewesen','wildbret-gesundheit','jagdrecht','pruefung-sprache','wald-pflanzen','landwirtschaft-lebensraeume','ausruestung-technik','tierschutz-verantwortung')) THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
  IF p_mode = 'posts' THEN
    page_size := 12;
    WITH matches AS (
      SELECT post.* FROM public.community_posts post WHERE post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR actor_admin)
        AND (category_filter = 'all' OR post.category = category_filter) AND (type_filter = 'all' OR post.kind = type_filter)
        AND (NOT only_unanswered OR (post.kind = 'question' AND NOT EXISTS (SELECT 1 FROM public.community_posts reply WHERE reply.parent_id = post.id AND reply.status = 'visible')))
        AND NOT EXISTS (SELECT 1 FROM regexp_split_to_table(lower(query_filter),'\s+') term WHERE term <> '' AND position(term IN lower(coalesce(post.title,'') || ' ' || post.body)) = 0)
    ), paged AS (SELECT * FROM matches ORDER BY updated_at DESC,id LIMIT page_size OFFSET (page_number-1)*page_size)
    SELECT (SELECT count(*)::integer FROM matches),coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.updated_at DESC,paged.id),'[]'::jsonb) INTO total,entries FROM paged;
    RETURN jsonb_build_object('posts',entries,'total',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'thread' THEN
    page_size := 20; thread_id := (p_options->>'threadId')::uuid;
    SELECT * INTO thread FROM public.community_posts post WHERE post.id = thread_id AND post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR actor_admin);
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    SELECT count(*)::integer INTO total FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin);
    SELECT coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.created_at,paged.id),'[]'::jsonb) INTO entries
      FROM (SELECT * FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin) ORDER BY reply.created_at,reply.id LIMIT page_size OFFSET (page_number-1)*page_size) paged;
    RETURN jsonb_build_object('thread',public.community_post_json(thread,p_actor_email),'replies',entries,'replyTotal',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'reports' THEN
    IF NOT actor_admin THEN RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN'; END IF;
    page_size := 20;
    SELECT count(*)::integer INTO total FROM public.community_reports WHERE resolved_at IS NULL;
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',report.id,'postId',report.post_id,'reason',report.reason,'createdAt',report.created_at,'status','open',
      'reporterName',reporter.display_name,'post',public.community_post_json(post,p_actor_email)) ORDER BY report.created_at,report.id),'[]'::jsonb) INTO entries
    FROM (SELECT * FROM public.community_reports WHERE resolved_at IS NULL ORDER BY created_at,id LIMIT page_size OFFSET (page_number-1)*page_size) report
    JOIN public.community_posts post ON post.id = report.post_id JOIN public.community_profiles reporter ON reporter.account_email = report.reporter_email;
    RETURN jsonb_build_object('reports',entries,'total',total,'page',page_number,'pageSize',page_size);
  END IF;
  RAISE EXCEPTION 'JL_COMMUNITY_INVALID';
END;
$$;

CREATE OR REPLACE FUNCTION public.community_write(p_actor_email text,p_action text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog,public AS $$
DECLARE
  actor_admin boolean; profile public.community_profiles; target public.community_posts; new_id uuid;
  now_at timestamptz := clock_timestamp(); name text; category_value text; kind_value text; title_value text; body_value text; reason_value text;
  recent_limit integer; daily_limit integer; recent_window interval; new_status text; report_target public.community_reports;
BEGIN
  IF p_actor_email IS NULL OR p_actor_email <> lower(btrim(p_actor_email)) OR NOT EXISTS (SELECT 1 FROM public.userprofile WHERE lower(btrim(email)) = p_actor_email) THEN RAISE EXCEPTION 'JL_COMMUNITY_AUTH'; END IF;
  SELECT coalesce(bool_or(is_admin IS TRUE),false) INTO actor_admin FROM public.userprofile WHERE lower(btrim(email)) = p_actor_email;
  -- Every account mutation shares one transaction lock: parallel requests cannot
  -- race around counts, immutable names, report uniqueness or ownership checks.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_actor_email,731004));
  SELECT * INTO profile FROM public.community_profiles WHERE account_email = p_actor_email;
  IF p_action = 'profile' THEN
    name := regexp_replace(btrim(p_payload->>'displayName'),'\s+',' ','g');
    IF p_payload->'acceptedRules' IS DISTINCT FROM 'true'::jsonb OR p_payload->>'rulesVersion' IS DISTINCT FROM '2026-10-04'
      OR name IS NULL OR char_length(name) NOT BETWEEN 3 AND 30 OR name !~ '^[[:alnum:]][[:alnum:] ._-]{2,29}$' OR lower(name) ~ '^(admin|moderator|jagdlatein|support)(\y|[_-])' THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
    IF profile.account_email IS NOT NULL THEN
      IF profile.display_name = name THEN RETURN jsonb_build_object('success',true); END IF;
      RAISE EXCEPTION 'JL_COMMUNITY_IMMUTABLE';
    END IF;
    BEGIN
      INSERT INTO public.community_profiles(account_email,display_name,rules_version,rules_accepted_at) VALUES(p_actor_email,name,'2026-10-04',now_at);
    EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'JL_COMMUNITY_NAME'; END;
    RETURN jsonb_build_object('success',true);
  END IF;
  IF profile.account_email IS NULL THEN RAISE EXCEPTION 'JL_COMMUNITY_PROFILE'; END IF;
  IF p_action NOT IN ('post','reply','report','delete','moderate','resolve-report','mark-solved') THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
  IF p_action IN ('moderate','resolve-report') AND NOT actor_admin THEN RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN'; END IF;
  IF p_action IN ('post','reply') AND p_payload->'acceptedRules' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
  recent_window := interval '10 minutes'; recent_limit := 10; daily_limit := 80;
  IF p_action = 'post' THEN recent_limit := 3; daily_limit := 30;
  ELSIF p_action = 'report' THEN recent_window := interval '1 hour'; recent_limit := 6; daily_limit := 20;
  ELSIF p_action IN ('moderate','resolve-report') THEN recent_limit := 100; daily_limit := 1000;
  ELSIF p_action IN ('delete','mark-solved') THEN recent_limit := 30; daily_limit := 150; END IF;
  IF (SELECT count(*) FROM public.community_events WHERE account_email = p_actor_email AND action = p_action AND created_at > now_at-recent_window) >= recent_limit
    OR (SELECT count(*) FROM public.community_events WHERE account_email = p_actor_email AND action = p_action AND created_at > now_at-interval '1 day') >= daily_limit THEN RAISE EXCEPTION 'JL_COMMUNITY_LIMIT'; END IF;
  IF p_action = 'post' THEN
    category_value := p_payload->>'category'; kind_value := p_payload->>'type'; title_value := btrim(p_payload->>'title'); body_value := btrim(p_payload->>'body');
    IF category_value IS NULL OR category_value NOT IN ('allgemein','wildkunde','waffen-sicherheit','jagdpraxis','natur-revier','hundewesen','wildbret-gesundheit','jagdrecht','pruefung-sprache','wald-pflanzen','landwirtschaft-lebensraeume','ausruestung-technik','tierschutz-verantwortung') OR kind_value IS NULL OR kind_value NOT IN ('question','discussion')
      OR title_value IS NULL OR char_length(title_value) NOT BETWEEN 8 AND 140 OR body_value IS NULL OR char_length(body_value) NOT BETWEEN 10 AND 6000 THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
    INSERT INTO public.community_posts(account_email,category,kind,title,body,created_at,updated_at) VALUES(p_actor_email,category_value,kind_value,title_value,body_value,now_at,now_at) RETURNING id INTO new_id;
  ELSIF p_action = 'reply' THEN
    SELECT * INTO target FROM public.community_posts WHERE id = (p_payload->>'threadId')::uuid AND parent_id IS NULL AND status = 'visible' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    body_value := btrim(p_payload->>'body');
    IF body_value IS NULL OR char_length(body_value) NOT BETWEEN 2 AND 4000 THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
    INSERT INTO public.community_posts(parent_id,account_email,category,kind,body,created_at,updated_at) VALUES(target.id,p_actor_email,target.category,'reply',body_value,now_at,now_at) RETURNING id INTO new_id;
    UPDATE public.community_posts SET updated_at = now_at WHERE id = target.id;
  ELSIF p_action = 'resolve-report' THEN
    SELECT * INTO report_target FROM public.community_reports WHERE id = (p_payload->>'reportId')::uuid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    UPDATE public.community_reports SET resolved_at = now_at,resolved_by = p_actor_email WHERE id = report_target.id;
  ELSE
    SELECT * INTO target FROM public.community_posts WHERE id = (p_payload->>'postId')::uuid AND status <> 'deleted' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    new_id := target.id;
    IF p_action = 'report' THEN
      IF target.status <> 'visible' AND NOT actor_admin THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
      reason_value := btrim(p_payload->>'reason');
      IF reason_value IS NULL OR char_length(reason_value) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
      BEGIN INSERT INTO public.community_reports(post_id,reporter_email,reason,created_at) VALUES(target.id,p_actor_email,reason_value,now_at);
      EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'JL_COMMUNITY_REPORT'; END;
    ELSIF p_action = 'delete' THEN
      IF target.account_email <> p_actor_email THEN RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN'; END IF;
      UPDATE public.community_posts SET status = 'deleted',updated_at = now_at WHERE id = target.id;
    ELSIF p_action = 'moderate' THEN
      new_status := p_payload->>'status';
      IF new_status IS NULL OR new_status NOT IN ('visible','hidden') THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
      UPDATE public.community_posts SET status = new_status,updated_at = now_at,moderated_by = p_actor_email,moderated_at = now_at WHERE id = target.id;
    ELSIF p_action = 'mark-solved' THEN
      IF target.parent_id IS NOT NULL OR target.kind <> 'question' OR jsonb_typeof(p_payload->'solved') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
      IF target.account_email <> p_actor_email AND NOT actor_admin THEN RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN'; END IF;
      UPDATE public.community_posts SET solved = (p_payload->>'solved')::boolean,updated_at = now_at WHERE id = target.id;
    END IF;
  END IF;
  DELETE FROM public.community_events WHERE account_email = p_actor_email AND created_at < now_at-interval '7 days';
  INSERT INTO public.community_events(account_email,action,created_at) VALUES(p_actor_email,p_action,now_at);
  RETURN jsonb_build_object('success',true,'postId',new_id);
END;
$$;

REVOKE ALL ON FUNCTION public.community_post_json(public.community_posts,text),public.community_read(text,text,jsonb),public.community_write(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_post_json(public.community_posts,text),public.community_read(text,text,jsonb),public.community_write(text,text,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
