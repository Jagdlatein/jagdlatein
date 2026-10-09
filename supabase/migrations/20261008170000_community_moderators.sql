BEGIN;
SET LOCAL search_path = pg_catalog,public;

-- Only a separate Community permission is added. No account is assigned a role,
-- no admin/premium flag changes, and no new FK affects reviewed account deletion.
DO $$
DECLARE required record;
BEGIN
  IF to_regprocedure('public.require_current_account_read(text)') IS NULL OR
     to_regprocedure('public.jagdlatein_community_write_base(text,text,jsonb)') IS NULL OR
     to_regprocedure('public.jagdlatein_community_blocking_write_base(text,text,jsonb)') IS NULL OR
     to_regprocedure('public.jagdlatein_community_read_base(text,text,jsonb)') IS NULL OR
     to_regprocedure('public.reserve_apple_review_login_attempt(uuid,uuid,text)') IS NULL OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role' AND (rolbypassrls OR rolsuper)) OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon' AND NOT rolbypassrls AND NOT rolsuper) OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated' AND NOT rolbypassrls AND NOT rolsuper) OR
     pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') THEN
    RAISE EXCEPTION 'JL_COMMUNITY_ROLE_SETUP: reviewed account, login and premoderation migrations required';
  END IF;
  FOR required IN SELECT * FROM (VALUES
    ('user_id','uuid'::regtype,NULL::boolean),('account_generation','uuid'::regtype,true),
    ('email','text'::regtype,NULL::boolean),('is_admin','boolean'::regtype,NULL::boolean),
    ('is_premium','boolean'::regtype,NULL::boolean)
  ) AS expected(column_name,column_type,required_not_null) LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.userprofile'::regclass
      AND attname=required.column_name AND atttypid=required.column_type AND attnum>0 AND NOT attisdropped
      AND (required.required_not_null IS NULL OR attnotnull=required.required_not_null)) THEN
      RAISE EXCEPTION 'JL_COMMUNITY_ROLE_SETUP: unexpected account schema';
    END IF;
  END LOOP;
  IF has_table_privilege('anon','public.userprofile','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('authenticated','public.userprofile','SELECT,INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'JL_COMMUNITY_ROLE_SETUP: account table must remain server-private';
  END IF;
END $$;

ALTER TABLE public.userprofile ADD COLUMN IF NOT EXISTS is_community_moderator boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.userprofile'::regclass
    AND attname='is_community_moderator' AND atttypid='boolean'::regtype AND attnotnull AND NOT attisdropped) THEN
    RAISE EXCEPTION 'JL_COMMUNITY_ROLE_SETUP: unexpected moderator flag';
  END IF;
END $$;
ALTER TABLE public.userprofile ALTER COLUMN is_community_moderator SET DEFAULT false;
REVOKE ALL PRIVILEGES(is_community_moderator) ON public.userprofile FROM PUBLIC,anon,authenticated;

-- No client/API endpoint grants this role. An operator must separately verify
-- the real account by email and approve its exact current user ID/generation.
CREATE OR REPLACE FUNCTION public.set_community_moderator(
  p_user_id uuid,p_account_generation uuid,p_enabled boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE owner_email text; account_row public.userprofile; changed integer;
BEGIN
  IF p_user_id IS NULL OR p_account_generation IS NULL OR p_enabled IS NULL THEN
    RAISE EXCEPTION 'JL_COMMUNITY_ROLE_MISSING';
  END IF;
  SELECT lower(btrim(email)) INTO owner_email FROM public.userprofile
    WHERE user_id=p_user_id AND account_generation=p_account_generation;
  IF NOT FOUND OR owner_email IS NULL THEN RAISE EXCEPTION 'JL_COMMUNITY_ROLE_MISSING'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_email,731004));
  SELECT * INTO account_row FROM public.userprofile WHERE user_id=p_user_id
    AND account_generation=p_account_generation AND lower(btrim(email))=owner_email FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_ROLE_MISSING'; END IF;
  UPDATE public.userprofile SET is_community_moderator=p_enabled
    WHERE user_id=p_user_id AND account_generation=p_account_generation;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION 'JL_COMMUNITY_ROLE_MISSING'; END IF;
  RETURN jsonb_build_object('updated',true,'enabled',p_enabled);
END $$;
REVOKE ALL ON FUNCTION public.set_community_moderator(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_community_moderator(uuid,uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.jagdlatein_community_write_base(p_actor_email text,p_action text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog,public AS $$
DECLARE
  actor_admin boolean; profile public.community_profiles; target public.community_posts; new_id uuid;
  now_at timestamptz := clock_timestamp(); name text; category_value text; kind_value text; title_value text; body_value text; reason_value text;
  recent_limit integer; daily_limit integer; recent_window interval; new_status text; report_target public.community_reports;
BEGIN
  IF p_actor_email IS NULL OR p_actor_email <> lower(btrim(p_actor_email)) OR NOT EXISTS (SELECT 1 FROM public.userprofile WHERE lower(btrim(email)) = p_actor_email) THEN RAISE EXCEPTION 'JL_COMMUNITY_AUTH'; END IF;
  SELECT coalesce(bool_or(is_admin IS TRUE OR is_community_moderator IS TRUE),false) INTO actor_admin FROM public.userprofile WHERE lower(btrim(email)) = p_actor_email;
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

CREATE OR REPLACE FUNCTION public.community_write(p_actor_email text,p_action text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; target public.community_posts; parent public.community_posts;
  target_actor text; parent_actor text; locked_email text; stored_status text; original_parent_updated timestamptz;
BEGIN
  IF p_action IN ('moderate','reply') THEN
    -- Lock the moderator, the author and (for replies) the parent author before
    -- acquiring row locks, using the same order as block/reply/delete operations.
    SELECT * INTO target FROM public.community_posts
      WHERE id=(CASE WHEN p_action='reply' THEN p_payload->>'threadId' ELSE p_payload->>'postId' END)::uuid
        AND status<>'deleted' AND account_email IS NOT NULL
        AND (p_action<>'reply' OR (parent_id IS NULL AND status='visible'));
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    target_actor := target.account_email;
    IF target.parent_id IS NOT NULL THEN
      SELECT account_email INTO parent_actor FROM public.community_posts WHERE id=target.parent_id;
    END IF;
    FOR locked_email IN SELECT DISTINCT email FROM unnest(ARRAY[p_actor_email,target_actor,parent_actor]) email
      WHERE email IS NOT NULL ORDER BY email LOOP
      PERFORM pg_advisory_xact_lock(hashtextextended(locked_email,0));
      PERFORM pg_advisory_xact_lock(hashtextextended(locked_email,731004));
    END LOOP;
    PERFORM public.require_current_account_read(p_actor_email);
    IF p_action='moderate' AND NOT EXISTS(SELECT 1 FROM public.userprofile WHERE lower(btrim(email))=p_actor_email AND (is_admin IS TRUE OR is_community_moderator IS TRUE)) THEN
      RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN';
    END IF;
    SELECT * INTO target FROM public.community_posts
      WHERE id=(CASE WHEN p_action='reply' THEN p_payload->>'threadId' ELSE p_payload->>'postId' END)::uuid
        AND status<>'deleted' AND account_email=target_actor
        AND (p_action<>'reply' OR (parent_id IS NULL AND status='visible')) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    PERFORM 1 FROM public.userprofile WHERE lower(btrim(email))=target_actor FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    IF p_action='reply' THEN
      original_parent_updated := target.updated_at;
    ELSIF p_payload->>'status'='visible' AND target.parent_id IS NOT NULL THEN
      SELECT * INTO parent FROM public.community_posts WHERE id=target.parent_id AND parent_id IS NULL
        AND status='visible' AND account_email IS NOT NULL FOR UPDATE;
      IF NOT FOUND OR parent.account_email IS DISTINCT FROM parent_actor THEN RAISE EXCEPTION 'JL_COMMUNITY_PENDING_PARENT'; END IF;
      IF public.community_blocked(target.account_email,parent.account_email) THEN RAISE EXCEPTION 'JL_COMMUNITY_BLOCKED'; END IF;
    END IF;
  END IF;
  result := public.jagdlatein_community_blocking_write_base(p_actor_email,p_action,p_payload);
  IF p_action='reply' THEN
    -- The preserved legacy writer bumps the parent immediately. Restore its
    -- locked timestamp atomically: a private submission has no public activity.
    UPDATE public.community_posts SET updated_at=original_parent_updated WHERE id=target.id;
  ELSIF p_action='moderate' AND p_payload->>'status'='visible'
      AND target.parent_id IS NOT NULL AND target.status<>'visible' THEN
    -- Public ordering changes only when an answer is actually published.
    UPDATE public.community_posts SET updated_at=greatest(updated_at,
      (SELECT published.updated_at FROM public.community_posts published WHERE published.id=target.id))
      WHERE id=target.parent_id;
  END IF;
  IF p_action IN ('post','reply','moderate') AND result->>'postId' IS NOT NULL THEN
    SELECT status INTO stored_status FROM public.community_posts WHERE id=(result->>'postId')::uuid;
    RETURN result || jsonb_build_object('status',stored_status);
  END IF;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.jagdlatein_community_read_base(p_actor_email text,p_mode text,p_options jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog,public AS $$
DECLARE
  actor_admin boolean; category_filter text := coalesce(p_options->>'category','all');
  query_filter text := btrim(coalesce(p_options->>'query','')); type_filter text := coalesce(p_options->>'type','all');
  page_number integer := coalesce((p_options->>'page')::integer,1); page_size integer; total integer; entries jsonb;
  thread public.community_posts; thread_id uuid; only_unanswered boolean := coalesce((p_options->>'unanswered')::boolean,false);
BEGIN
  SELECT coalesce(bool_or(profile.is_admin IS TRUE OR profile.is_community_moderator IS TRUE),false) INTO actor_admin FROM public.userprofile profile WHERE lower(btrim(profile.email)) = p_actor_email;
  IF NOT EXISTS (SELECT 1 FROM public.userprofile WHERE lower(btrim(email)) = p_actor_email) THEN RAISE EXCEPTION 'JL_COMMUNITY_AUTH'; END IF;
  IF p_actor_email IS NULL OR p_actor_email <> lower(btrim(p_actor_email)) OR page_number NOT BETWEEN 1 AND 9999 OR char_length(query_filter) > 160
    OR type_filter NOT IN ('all','question','discussion') OR (category_filter <> 'all' AND category_filter NOT IN ('allgemein','wildkunde','waffen-sicherheit','jagdpraxis','natur-revier','hundewesen','wildbret-gesundheit','jagdrecht','pruefung-sprache','wald-pflanzen','landwirtschaft-lebensraeume','ausruestung-technik','tierschutz-verantwortung')) THEN RAISE EXCEPTION 'JL_COMMUNITY_INVALID'; END IF;
  IF p_mode IN ('moderation','submissions') THEN
    IF p_mode='moderation' AND NOT actor_admin THEN RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN'; END IF;
    page_size := 20;
    WITH matches AS (
      SELECT post.* FROM public.community_posts post
        WHERE (p_mode='moderation' AND post.status='pending') OR
          (p_mode='submissions' AND post.account_email=p_actor_email AND post.status IN ('pending','hidden'))
    ), paged AS (SELECT * FROM matches ORDER BY created_at,id LIMIT page_size OFFSET (page_number-1)*page_size)
    SELECT (SELECT count(*)::integer FROM matches),
      coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) || jsonb_build_object('canApprove',
        paged.parent_id IS NULL OR EXISTS(SELECT 1 FROM public.community_posts parent
          WHERE parent.id=paged.parent_id AND parent.status='visible' AND parent.account_email IS NOT NULL
            AND NOT public.community_blocked(paged.account_email,parent.account_email)))
        ORDER BY paged.created_at,paged.id),'[]'::jsonb) INTO total,entries FROM paged;
    RETURN jsonb_build_object('moderationAuthorized',actor_admin,'posts',entries,'total',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'blocks' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',block.id,'displayName',profile.display_name,'createdAt',block.created_at)
      ORDER BY block.created_at DESC,block.id),'[]'::jsonb) INTO entries
      FROM public.community_blocks block JOIN public.community_profiles profile ON profile.account_email=block.blocked_email
      WHERE block.blocker_email=p_actor_email;
    RETURN jsonb_build_object('moderationAuthorized',actor_admin,'blocks',entries);
  ELSIF p_mode = 'posts' THEN
    page_size := 12;
    WITH matches AS (
      SELECT post.* FROM public.community_posts post WHERE post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR (actor_admin AND post.status = 'hidden')) AND NOT public.community_blocked(p_actor_email,post.account_email)
        AND (category_filter = 'all' OR post.category = category_filter) AND (type_filter = 'all' OR post.kind = type_filter)
        AND (NOT only_unanswered OR (post.kind = 'question' AND NOT EXISTS (SELECT 1 FROM public.community_posts reply WHERE reply.parent_id = post.id AND reply.status = 'visible' AND NOT public.community_blocked(p_actor_email,reply.account_email))))
        AND NOT EXISTS (SELECT 1 FROM regexp_split_to_table(lower(query_filter),'\s+') term WHERE term <> '' AND position(term IN lower(coalesce(post.title,'') || ' ' || post.body)) = 0)
    ), paged AS (SELECT * FROM matches ORDER BY updated_at DESC,id LIMIT page_size OFFSET (page_number-1)*page_size)
    SELECT (SELECT count(*)::integer FROM matches),coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.updated_at DESC,paged.id),'[]'::jsonb) INTO total,entries FROM paged;
    RETURN jsonb_build_object('moderationAuthorized',actor_admin,'posts',entries,'total',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'thread' THEN
    page_size := 20; thread_id := (p_options->>'threadId')::uuid;
    SELECT * INTO thread FROM public.community_posts post WHERE post.id = thread_id AND post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR actor_admin OR (post.account_email=p_actor_email AND post.status IN ('pending','hidden'))) AND NOT public.community_blocked(p_actor_email,post.account_email);
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    SELECT count(*)::integer INTO total FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin OR (reply.account_email=p_actor_email AND reply.status IN ('pending','hidden'))) AND NOT public.community_blocked(p_actor_email,reply.account_email);
    SELECT coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.created_at,paged.id),'[]'::jsonb) INTO entries
      FROM (SELECT * FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin OR (reply.account_email=p_actor_email AND reply.status IN ('pending','hidden'))) AND NOT public.community_blocked(p_actor_email,reply.account_email) ORDER BY reply.created_at,reply.id LIMIT page_size OFFSET (page_number-1)*page_size) paged;
    RETURN jsonb_build_object('moderationAuthorized',actor_admin,'thread',public.community_post_json(thread,p_actor_email),'replies',entries,'replyTotal',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'reports' THEN
    IF NOT actor_admin THEN RAISE EXCEPTION 'JL_COMMUNITY_FORBIDDEN'; END IF;
    page_size := 20;
    SELECT count(*)::integer INTO total FROM public.community_reports WHERE resolved_at IS NULL;
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',report.id,'postId',report.post_id,'reason',report.reason,'createdAt',report.created_at,'status','open',
      'reporterName',reporter.display_name,'post',public.community_post_json(post,p_actor_email)) ORDER BY report.created_at,report.id),'[]'::jsonb) INTO entries
    FROM (SELECT * FROM public.community_reports WHERE resolved_at IS NULL ORDER BY created_at,id LIMIT page_size OFFSET (page_number-1)*page_size) report
    JOIN public.community_posts post ON post.id = report.post_id JOIN public.community_profiles reporter ON reporter.account_email = report.reporter_email;
    RETURN jsonb_build_object('moderationAuthorized',actor_admin,'reports',entries,'total',total,'page',page_number,'pageSize',page_size);
  END IF;
  RAISE EXCEPTION 'JL_COMMUNITY_INVALID';
END;
$$;

-- Apple password review identities must remain entirely unprivileged.
CREATE OR REPLACE FUNCTION public.reserve_apple_review_login_attempt(
  p_account_generation uuid,p_app_account_token uuid,p_ip_bucket text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE
  owner_email text; profile_row public.userprofile;
  observed timestamptz := clock_timestamp(); window_at timestamptz;
  account_count integer; ip_count integer;
  account_bucket constant text := repeat('0',64);
BEGIN
  IF p_account_generation IS NULL OR p_app_account_token IS NULL OR p_ip_bucket IS NULL OR
    p_ip_bucket !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'JL_REVIEW_LOGIN_INVALID'; END IF;
  SELECT account_email INTO owner_email FROM public.apple_account_tokens
    WHERE app_account_token = p_app_account_token AND account_generation = p_account_generation AND deleted_at IS NULL;
  IF NOT FOUND OR owner_email IS NULL THEN RETURN jsonb_build_object('allowed',false,'identityMissing',true); END IF;
  -- Match the existing account-deletion lock order before locking either row.
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_email,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_email,731004));
  SELECT * INTO profile_row FROM public.userprofile WHERE lower(btrim(email)) = owner_email FOR UPDATE;
  IF NOT FOUND OR profile_row.account_generation IS DISTINCT FROM p_account_generation OR
    profile_row.is_admin IS DISTINCT FROM false OR profile_row.is_premium IS DISTINCT FROM false OR
    profile_row.is_community_moderator IS DISTINCT FROM false THEN
    RETURN jsonb_build_object('allowed',false,'identityMissing',true);
  END IF;
  PERFORM 1 FROM public.apple_account_tokens WHERE app_account_token = p_app_account_token AND
    account_generation = p_account_generation AND account_email = owner_email AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed',false,'identityMissing',true); END IF;
  observed := clock_timestamp();
  window_at := to_timestamp(floor(extract(epoch FROM observed) / 600) * 600);
  SELECT attempts INTO account_count FROM public.apple_review_login_limits WHERE account_generation = p_account_generation
    AND app_account_token = p_app_account_token AND bucket_kind = 'account' AND ip_bucket = account_bucket AND window_start = window_at;
  SELECT attempts INTO ip_count FROM public.apple_review_login_limits WHERE account_generation = p_account_generation
    AND app_account_token = p_app_account_token AND bucket_kind = 'ip' AND ip_bucket = p_ip_bucket AND window_start = window_at;
  IF coalesce(account_count,0) >= 30 OR coalesce(ip_count,0) >= 10 THEN
    RETURN jsonb_build_object('allowed',false,'retryAfter',greatest(1,ceil(extract(epoch FROM window_at + interval '10 minutes' - observed))::integer));
  END IF;
  INSERT INTO public.apple_review_login_limits(account_generation,app_account_token,bucket_kind,ip_bucket,window_start,expires_at,attempts)
    VALUES(p_account_generation,p_app_account_token,'account',account_bucket,window_at,window_at + interval '10 minutes',1),
          (p_account_generation,p_app_account_token,'ip',p_ip_bucket,window_at,window_at + interval '10 minutes',1)
    ON CONFLICT(account_generation,app_account_token,bucket_kind,ip_bucket,window_start)
      DO UPDATE SET attempts = public.apple_review_login_limits.attempts + 1;
  DELETE FROM public.apple_review_login_limits AS limits USING (
    SELECT account_generation,app_account_token,bucket_kind,ip_bucket,window_start FROM public.apple_review_login_limits
      WHERE expires_at <= observed ORDER BY expires_at FOR UPDATE SKIP LOCKED LIMIT 100
  ) AS expired WHERE limits.account_generation = expired.account_generation AND limits.app_account_token = expired.app_account_token
    AND limits.bucket_kind = expired.bucket_kind AND limits.ip_bucket = expired.ip_bucket AND limits.window_start = expired.window_start;
  RETURN jsonb_build_object('allowed',true);
END $$;

-- Preserve existing guarded public entry points, private bases and permissions.
REVOKE ALL ON FUNCTION public.jagdlatein_community_write_base(text,text,jsonb),
  public.jagdlatein_community_blocking_write_base(text,text,jsonb),public.jagdlatein_community_read_base(text,text,jsonb)
  FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.community_write(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_write(text,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.reserve_apple_review_login_attempt(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_apple_review_login_attempt(uuid,uuid,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
