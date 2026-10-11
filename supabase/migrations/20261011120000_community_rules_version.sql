BEGIN;
SET LOCAL search_path = pg_catalog,public;

-- The application records explicit acceptance of the rules published on
-- 2026-10-09. Change only the matching validation and insertion literals in
-- the existing writer; historical consent and all wrapper/permission logic
-- remain untouched. Abort if the expected writer has been customized.
DO $migration$
DECLARE
  writer oid := to_regprocedure('public.jagdlatein_community_write_base(text,text,jsonb)');
  original pg_proc;
  replaced pg_proc;
  definition text;
  body_hash text;
  old_check text := $literal$p_payload->>'rulesVersion' IS DISTINCT FROM '2026-10-04'$literal$;
  new_check text := $literal$p_payload->>'rulesVersion' IS DISTINCT FROM '2026-10-09'$literal$;
  old_insert text := $literal$VALUES(p_actor_email,name,'2026-10-04',now_at)$literal$;
  new_insert text := $literal$VALUES(p_actor_email,name,'2026-10-09',now_at)$literal$;
BEGIN
  IF writer IS NULL OR
     to_regprocedure('public.community_write(text,text,jsonb)') IS NULL OR
     to_regprocedure('public.jagdlatein_community_blocking_write_base(text,text,jsonb)') IS NULL OR
     to_regprocedure('public.require_current_account_read(text)') IS NULL THEN
    RAISE EXCEPTION 'JL_COMMUNITY_RULES_SETUP: current guarded Community writer required';
  END IF;
  SELECT * INTO original FROM pg_proc WHERE oid=writer;
  IF original.prosecdef OR original.prolang <> (SELECT oid FROM pg_language WHERE lanname='plpgsql') THEN
    RAISE EXCEPTION 'JL_COMMUNITY_RULES_SETUP: unexpected Community writer security';
  END IF;
  -- These are the complete reviewed bodies from 20261008170000, before/after
  -- the two substitutions below. Ignore only line-ending and outer whitespace
  -- differences, never an unknown change to names, moderation or safeguards.
  body_hash := md5(btrim(replace(original.prosrc,E'\r\n',E'\n'),E' \t\n\r'));
  IF body_hash NOT IN ('9274c8438971eb9c8bd9a229d917ac75','ca1ec33ea629c3f46526d3a366081b9f') THEN
    RAISE EXCEPTION 'JL_COMMUNITY_RULES_SETUP: unexpected Community writer definition';
  END IF;
  definition := pg_get_functiondef(writer);
  IF cardinality(string_to_array(definition,old_check))=2 AND
     cardinality(string_to_array(definition,old_insert))=2 AND
     strpos(definition,new_check)=0 AND strpos(definition,new_insert)=0 THEN
    EXECUTE replace(replace(definition,old_check,new_check),old_insert,new_insert);
  ELSIF cardinality(string_to_array(definition,new_check))=2 AND
        cardinality(string_to_array(definition,new_insert))=2 AND
        strpos(definition,old_check)=0 AND strpos(definition,old_insert)=0 THEN
    -- Safe to run again: neither existing profiles nor their acceptance dates
    -- are updated, and no role is assigned.
    NULL;
  ELSE
    RAISE EXCEPTION 'JL_COMMUNITY_RULES_SETUP: unexpected Community rules definition';
  END IF;
  SELECT * INTO replaced FROM pg_proc WHERE oid=writer;
  IF NOT FOUND OR replaced.proowner IS DISTINCT FROM original.proowner OR
     replaced.proacl IS DISTINCT FROM original.proacl OR
     replaced.prosecdef IS DISTINCT FROM original.prosecdef OR
     replaced.proconfig IS DISTINCT FROM original.proconfig OR
     replaced.prolang IS DISTINCT FROM original.prolang OR
     replaced.provolatile IS DISTINCT FROM original.provolatile THEN
    RAISE EXCEPTION 'JL_COMMUNITY_RULES_SETUP: Community writer permissions changed';
  END IF;
END $migration$;

COMMIT;
