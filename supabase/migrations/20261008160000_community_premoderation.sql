BEGIN;
SET LOCAL search_path = pg_catalog,public;

-- Append after the reviewed generation and block guards. Existing content,
-- profiles and permissions are preserved; only newly inserted rows default private.
DO $$ BEGIN
  IF to_regprocedure('public.require_current_account_read(text)') IS NULL OR
     to_regprocedure('public.community_blocked(text,text)') IS NULL OR
     to_regprocedure('public.community_write(text,text,jsonb)') IS NULL OR
     to_regprocedure('public.jagdlatein_community_read_base(text,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'JL_COMMUNITY_SETUP: generation and block migrations are required';
  END IF;
END $$;
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_status_check;
ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_status_check CHECK (status IN ('visible','pending','hidden','deleted'));
ALTER TABLE public.community_posts ALTER COLUMN status SET DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS community_posts_pending ON public.community_posts(created_at,id) WHERE status='pending';

-- Retain the actual blocking wrapper, including its sorted account locks and
-- generation checks, under a private name. Reapplying does not rename this wrapper again.
DO $$ BEGIN
  IF to_regprocedure('public.jagdlatein_community_blocking_write_base(text,text,jsonb)') IS NULL THEN
    ALTER FUNCTION public.community_write(text,text,jsonb) RENAME TO jagdlatein_community_blocking_write_base;
  END IF;
END $$;

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
    IF p_action='moderate' AND NOT EXISTS(SELECT 1 FROM public.userprofile WHERE lower(btrim(email))=p_actor_email AND is_admin IS TRUE) THEN
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
  SELECT coalesce(bool_or(profile.is_admin IS TRUE),false) INTO actor_admin FROM public.userprofile profile WHERE lower(btrim(profile.email)) = p_actor_email;
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
    RETURN jsonb_build_object('posts',entries,'total',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'blocks' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',block.id,'displayName',profile.display_name,'createdAt',block.created_at)
      ORDER BY block.created_at DESC,block.id),'[]'::jsonb) INTO entries
      FROM public.community_blocks block JOIN public.community_profiles profile ON profile.account_email=block.blocked_email
      WHERE block.blocker_email=p_actor_email;
    RETURN jsonb_build_object('blocks',entries);
  ELSIF p_mode = 'posts' THEN
    page_size := 12;
    WITH matches AS (
      SELECT post.* FROM public.community_posts post WHERE post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR (actor_admin AND post.status = 'hidden')) AND NOT public.community_blocked(p_actor_email,post.account_email)
        AND (category_filter = 'all' OR post.category = category_filter) AND (type_filter = 'all' OR post.kind = type_filter)
        AND (NOT only_unanswered OR (post.kind = 'question' AND NOT EXISTS (SELECT 1 FROM public.community_posts reply WHERE reply.parent_id = post.id AND reply.status = 'visible' AND NOT public.community_blocked(p_actor_email,reply.account_email))))
        AND NOT EXISTS (SELECT 1 FROM regexp_split_to_table(lower(query_filter),'\s+') term WHERE term <> '' AND position(term IN lower(coalesce(post.title,'') || ' ' || post.body)) = 0)
    ), paged AS (SELECT * FROM matches ORDER BY updated_at DESC,id LIMIT page_size OFFSET (page_number-1)*page_size)
    SELECT (SELECT count(*)::integer FROM matches),coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.updated_at DESC,paged.id),'[]'::jsonb) INTO total,entries FROM paged;
    RETURN jsonb_build_object('posts',entries,'total',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'thread' THEN
    page_size := 20; thread_id := (p_options->>'threadId')::uuid;
    SELECT * INTO thread FROM public.community_posts post WHERE post.id = thread_id AND post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR actor_admin OR (post.account_email=p_actor_email AND post.status IN ('pending','hidden'))) AND NOT public.community_blocked(p_actor_email,post.account_email);
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    SELECT count(*)::integer INTO total FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin OR (reply.account_email=p_actor_email AND reply.status IN ('pending','hidden'))) AND NOT public.community_blocked(p_actor_email,reply.account_email);
    SELECT coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.created_at,paged.id),'[]'::jsonb) INTO entries
      FROM (SELECT * FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin OR (reply.account_email=p_actor_email AND reply.status IN ('pending','hidden'))) AND NOT public.community_blocked(p_actor_email,reply.account_email) ORDER BY reply.created_at,reply.id LIMIT page_size OFFSET (page_number-1)*page_size) paged;
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
-- Browser roles retain no table/RPC access. Both older bases and this renamed
-- wrapper are callable only by the existing guarded SECURITY DEFINER entry point.
REVOKE ALL ON FUNCTION public.jagdlatein_community_blocking_write_base(text,text,jsonb),
  public.jagdlatein_community_write_base(text,text,jsonb),public.jagdlatein_community_read_base(text,text,jsonb)
  FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.community_write(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_write(text,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
