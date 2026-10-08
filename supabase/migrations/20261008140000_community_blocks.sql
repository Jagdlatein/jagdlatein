BEGIN;
SET LOCAL search_path = pg_catalog,public;

-- Apply after the generation/deletion migration. No existing posts are removed.
DO $$ BEGIN
  IF to_regprocedure('public.require_current_account_read(text)') IS NULL OR
     to_regprocedure('public.jagdlatein_community_read_base(text,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'JL_COMMUNITY_SETUP: account generation migration is required';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.community_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_email text NOT NULL CHECK (blocker_email = lower(btrim(blocker_email))),
  blocked_email text NOT NULL CHECK (blocked_email = lower(btrim(blocked_email))),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (blocker_email <> blocked_email),
  UNIQUE(blocker_email,blocked_email)
);
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.community_blocks FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON TABLE public.community_blocks TO service_role;
CREATE INDEX IF NOT EXISTS community_blocks_target ON public.community_blocks(blocked_email);

CREATE OR REPLACE FUNCTION public.community_blocked(p_actor text,p_author text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
  SELECT EXISTS(SELECT 1 FROM public.community_blocks
    WHERE (blocker_email=p_actor AND blocked_email=p_author)
       OR (blocked_email=p_actor AND blocker_email=p_author));
$$;

-- No new FK into account deletion's reviewed dependency set. This transactional
-- cleanup removes both sides before the same address can register a new profile.
CREATE OR REPLACE FUNCTION public.cleanup_community_blocks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  DELETE FROM public.community_blocks WHERE blocker_email=OLD.account_email OR blocked_email=OLD.account_email;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS community_blocks_cleanup ON public.community_profiles;
CREATE TRIGGER community_blocks_cleanup AFTER DELETE ON public.community_profiles
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_community_blocks();
DROP TRIGGER IF EXISTS jagdlatein_live_owner ON public.community_blocks;
CREATE TRIGGER jagdlatein_live_owner BEFORE INSERT OR UPDATE ON public.community_blocks
  FOR EACH ROW EXECUTE FUNCTION public.guard_live_account_owner('blocker_email');

DO $$ BEGIN
  IF to_regprocedure('public.jagdlatein_community_write_base(text,text,jsonb)') IS NULL THEN
    ALTER FUNCTION public.community_write(text,text,jsonb) RENAME TO jagdlatein_community_write_base;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.community_write(p_actor_email text,p_action text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.community_posts; owned_block public.community_blocks; other_actor text; locked_email text;
BEGIN
  -- All two-person interactions take the same sorted account locks. These are
  -- also the locks used by deletion, so a block cannot race a later reply and
  -- the wrapper never holds KEY SHARE while waiting for a deleting actor.
  IF p_action IN ('block','reply') THEN
    SELECT * INTO target FROM public.community_posts
      WHERE id=(CASE WHEN p_action='block' THEN p_payload->>'postId' ELSE p_payload->>'threadId' END)::uuid
        AND status='visible' AND account_email IS NOT NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    other_actor := target.account_email;
  END IF;
  FOR locked_email IN SELECT DISTINCT email FROM unnest(ARRAY[p_actor_email,other_actor]) email
      WHERE email IS NOT NULL ORDER BY email LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(locked_email,0));
    PERFORM pg_advisory_xact_lock(hashtextextended(locked_email,731004));
  END LOOP;
  PERFORM public.require_current_account_read(p_actor_email);
  IF p_action NOT IN ('block','unblock','reply') THEN
    RETURN public.jagdlatein_community_write_base(p_actor_email,p_action,p_payload);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.community_profiles WHERE account_email=p_actor_email) THEN
    RAISE EXCEPTION 'JL_COMMUNITY_PROFILE';
  END IF;
  IF p_action='unblock' THEN
    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR
       p_payload - 'blockId' <> '{}'::jsonb OR p_payload->>'blockId' IS NULL THEN
      RAISE EXCEPTION 'JL_COMMUNITY_INVALID';
    END IF;
    SELECT * INTO owned_block FROM public.community_blocks
      WHERE id=(p_payload->>'blockId')::uuid AND blocker_email=p_actor_email FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    DELETE FROM public.community_blocks WHERE id=owned_block.id AND blocker_email=p_actor_email;
    RETURN jsonb_build_object('success',true);
  END IF;
  SELECT * INTO target FROM public.community_posts
    WHERE id=(CASE WHEN p_action='block' THEN p_payload->>'postId' ELSE p_payload->>'threadId' END)::uuid
      AND status='visible' AND account_email IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
  IF target.account_email IS DISTINCT FROM other_actor THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email))=other_actor FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
  IF p_action='reply' THEN
    IF public.community_blocked(p_actor_email,target.account_email) THEN RAISE EXCEPTION 'JL_COMMUNITY_BLOCKED'; END IF;
    RETURN public.jagdlatein_community_write_base(p_actor_email,p_action,p_payload);
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR
     p_payload - 'postId' <> '{}'::jsonb OR target.account_email=p_actor_email THEN
    RAISE EXCEPTION 'JL_COMMUNITY_INVALID';
  END IF;
  PERFORM 1 FROM public.community_profiles WHERE account_email=target.account_email FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
  IF EXISTS(SELECT 1 FROM public.community_blocks WHERE blocker_email=p_actor_email AND blocked_email=target.account_email) THEN
    RETURN jsonb_build_object('success',true);
  END IF;
  IF (SELECT count(*) FROM public.community_blocks WHERE blocker_email=p_actor_email)>=1000 OR
     (SELECT count(*) FROM public.community_events WHERE account_email=p_actor_email AND action='block'
       AND created_at>clock_timestamp()-interval '10 minutes')>=30 THEN RAISE EXCEPTION 'JL_COMMUNITY_LIMIT'; END IF;
  INSERT INTO public.community_blocks(blocker_email,blocked_email) VALUES(p_actor_email,target.account_email);
  INSERT INTO public.community_events(account_email,action) VALUES(p_actor_email,'block');
  RETURN jsonb_build_object('success',true);
END $$;

REVOKE ALL ON FUNCTION public.jagdlatein_community_write_base(text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.community_blocked(text,text),public.cleanup_community_blocks(),public.community_write(text,text,jsonb)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_blocked(text,text),public.community_write(text,text,jsonb) TO service_role;

-- The read function is replaced below before this transaction is committed.

CREATE OR REPLACE FUNCTION public.community_post_json(p_post public.community_posts,p_actor_email text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog,public AS $$
  SELECT jsonb_build_object('id',p_post.id,'threadId',p_post.parent_id,'category',p_post.category,'type',p_post.kind,
    'title',p_post.title,'body',p_post.body,'displayName',profile.display_name,'createdAt',p_post.created_at,'updatedAt',p_post.updated_at,
    'owned',p_post.account_email = p_actor_email,'status',p_post.status,'solved',p_post.solved,
    'replyCount',(SELECT count(*)::integer FROM public.community_posts reply WHERE reply.parent_id = p_post.id AND reply.status = 'visible' AND NOT public.community_blocked(p_actor_email,reply.account_email)))
  FROM public.community_profiles profile WHERE profile.account_email = p_post.account_email;
$$;


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
  IF p_mode = 'blocks' THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',block.id,'displayName',profile.display_name,'createdAt',block.created_at)
      ORDER BY block.created_at DESC,block.id),'[]'::jsonb) INTO entries
      FROM public.community_blocks block JOIN public.community_profiles profile ON profile.account_email=block.blocked_email
      WHERE block.blocker_email=p_actor_email;
    RETURN jsonb_build_object('blocks',entries);
  ELSIF p_mode = 'posts' THEN
    page_size := 12;
    WITH matches AS (
      SELECT post.* FROM public.community_posts post WHERE post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR actor_admin) AND NOT public.community_blocked(p_actor_email,post.account_email)
        AND (category_filter = 'all' OR post.category = category_filter) AND (type_filter = 'all' OR post.kind = type_filter)
        AND (NOT only_unanswered OR (post.kind = 'question' AND NOT EXISTS (SELECT 1 FROM public.community_posts reply WHERE reply.parent_id = post.id AND reply.status = 'visible' AND NOT public.community_blocked(p_actor_email,reply.account_email))))
        AND NOT EXISTS (SELECT 1 FROM regexp_split_to_table(lower(query_filter),'\s+') term WHERE term <> '' AND position(term IN lower(coalesce(post.title,'') || ' ' || post.body)) = 0)
    ), paged AS (SELECT * FROM matches ORDER BY updated_at DESC,id LIMIT page_size OFFSET (page_number-1)*page_size)
    SELECT (SELECT count(*)::integer FROM matches),coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.updated_at DESC,paged.id),'[]'::jsonb) INTO total,entries FROM paged;
    RETURN jsonb_build_object('posts',entries,'total',total,'page',page_number,'pageSize',page_size);
  ELSIF p_mode = 'thread' THEN
    page_size := 20; thread_id := (p_options->>'threadId')::uuid;
    SELECT * INTO thread FROM public.community_posts post WHERE post.id = thread_id AND post.parent_id IS NULL AND post.status <> 'deleted' AND (post.status = 'visible' OR actor_admin) AND NOT public.community_blocked(p_actor_email,post.account_email);
    IF NOT FOUND THEN RAISE EXCEPTION 'JL_COMMUNITY_MISSING'; END IF;
    SELECT count(*)::integer INTO total FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin) AND NOT public.community_blocked(p_actor_email,reply.account_email);
    SELECT coalesce(jsonb_agg(public.community_post_json(paged,p_actor_email) ORDER BY paged.created_at,paged.id),'[]'::jsonb) INTO entries
      FROM (SELECT * FROM public.community_posts reply WHERE reply.parent_id = thread_id AND reply.status <> 'deleted' AND (reply.status = 'visible' OR actor_admin) AND NOT public.community_blocked(p_actor_email,reply.account_email) ORDER BY reply.created_at,reply.id LIMIT page_size OFFSET (page_number-1)*page_size) paged;
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


REVOKE ALL ON FUNCTION public.jagdlatein_community_read_base(text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
