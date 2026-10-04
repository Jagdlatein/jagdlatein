-- TEST ONLY: create the missing historical baseline in a NEW, EMPTY Supabase
-- test project. This is not a production migration and copies no account data.
BEGIN;
SET LOCAL search_path = pg_catalog, public;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  ) THEN RAISE EXCEPTION 'SANDBOX_ONLY: public schema is not empty. No setup applied.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper))
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION 'SANDBOX_ONLY: expected Supabase roles are missing. No setup applied.';
  END IF;
END $$;

CREATE TABLE public.userprofile (
  user_id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  is_premium boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.login_codes (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  requested_at timestamptz NOT NULL
);
ALTER TABLE public.userprofile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.userprofile, public.login_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.userprofile TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_codes TO service_role;
COMMIT;
