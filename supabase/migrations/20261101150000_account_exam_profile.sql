BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Add a learning preference to the existing OTP account. No Supabase Auth
-- account, entitlement, existing profile value or table privilege is changed.
DO $$
BEGIN
  IF to_regclass('public.userprofile') IS NULL OR NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.userprofile'::regclass
      AND attname = 'account_generation' AND atttypid = 'uuid'::regtype
      AND attnotnull AND NOT attisdropped
  ) OR to_regprocedure('public.require_current_request_actor()') IS NULL THEN
    RAISE EXCEPTION 'JL_EXAM_PROFILE_SETUP: generation-aware accounts are required';
  END IF;
END $$;

ALTER TABLE public.userprofile ADD COLUMN IF NOT EXISTS exam_country text;
ALTER TABLE public.userprofile ADD COLUMN IF NOT EXISTS exam_region text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.userprofile'::regclass
      AND attname IN ('exam_country', 'exam_region') AND NOT attisdropped
      AND (atttypid <> 'text'::regtype OR attnotnull OR attgenerated <> '' OR attidentity <> '')
  ) THEN RAISE EXCEPTION 'JL_EXAM_PROFILE_SETUP: unexpected preference columns'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.userprofile'::regclass
      AND conname = 'userprofile_exam_profile_valid'
  ) THEN
    ALTER TABLE public.userprofile ADD CONSTRAINT userprofile_exam_profile_valid CHECK (
      (exam_country IS NULL AND exam_region IS NULL)
      OR (exam_country IS NOT NULL AND exam_region IS NOT NULL AND (
        (exam_country = 'CH' AND exam_region IN ('ZH','BE','LU','UR','SZ','OW','NW','GL','ZG','FR','SO','BS','BL','SH','AR','AI','SG','GR','AG','TG','TI','VD','VS','NE','GE','JU'))
        OR (exam_country = 'AT' AND exam_region IN ('B','K','NOE','OOE','S','ST','T','V','W'))
        OR (exam_country = 'DE' AND exam_region IN ('BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH'))
      ))
    );
  END IF;
END $$;

-- A restricted RPC avoids granting UPDATE on the account table. The update
-- and generation condition are one database statement, so deletion/recreation
-- of the same email cannot move this preference into the replacement account.
CREATE OR REPLACE FUNCTION public.set_account_exam_profile(
  p_email text, p_account_generation uuid, p_country text, p_region text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE
  result jsonb;
  request_headers jsonb := coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR p_account_generation IS NULL
      OR p_country IS NULL OR p_region IS NULL THEN
    RAISE EXCEPTION 'JL_EXAM_PROFILE_IDENTITY';
  END IF;
  PERFORM public.require_current_request_actor();
  IF request_headers ? 'x-jagdlatein-account-email' AND (
    request_headers->>'x-jagdlatein-account-email' IS DISTINCT FROM p_email OR
    request_headers->>'x-jagdlatein-account-generation' IS DISTINCT FROM p_account_generation::text
  ) THEN RAISE EXCEPTION 'JL_EXAM_PROFILE_IDENTITY'; END IF;
  UPDATE public.userprofile
    SET exam_country = p_country, exam_region = p_region
    WHERE lower(btrim(email)) = p_email AND account_generation = p_account_generation
    RETURNING jsonb_build_object('country',exam_country,'region',exam_region) INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_EXAM_PROFILE_IDENTITY'; END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.set_account_exam_profile(text,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_account_exam_profile(text,uuid,text,text) TO service_role;

COMMIT;
