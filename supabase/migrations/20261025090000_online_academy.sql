BEGIN;
SET LOCAL search_path=pg_catalog,public;

-- Course-provider and timetable metadata only: no enrollments, payments, account
-- role grants, participant lists, recordings or student-progress duplication.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role' AND (rolbypassrls OR rolsuper)) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon' AND NOT rolbypassrls AND NOT rolsuper) OR
    NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated' AND NOT rolbypassrls AND NOT rolsuper) OR
    pg_has_role('anon','service_role','MEMBER') OR pg_has_role('authenticated','service_role','MEMBER') THEN
    RAISE EXCEPTION 'JL_ACADEMY_SETUP: invalid service roles';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.online_academy_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 2000),
  website text NOT NULL DEFAULT '' CHECK (website='' OR (website LIKE 'https://%' AND length(website)<=500)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(created_at)),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(updated_at))
);
CREATE TABLE IF NOT EXISTS public.online_academy_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.online_academy_schools(id),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 160),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 2000),
  category_slug text NOT NULL CHECK (length(category_slug) BETWEEN 2 AND 80),
  module_ids text[] NOT NULL CHECK (cardinality(module_ids) BETWEEN 1 AND 32 AND array_position(module_ids,NULL) IS NULL),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','published')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(created_at)),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(updated_at))
);
CREATE TABLE IF NOT EXISTS public.online_academy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.online_academy_offers(id),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 160),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  room_name text NOT NULL UNIQUE CHECK (room_name ~ '^jagdlatein-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(created_at)),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK (isfinite(updated_at)),
  CHECK (isfinite(starts_at) AND isfinite(ends_at) AND ends_at>starts_at AND ends_at-starts_at<=interval '8 hours')
);

-- Refuse an incompatible pre-existing object rather than granting service
-- writes to a table whose schema may have a different purpose.
DO $$
DECLARE entry record;
BEGIN
  FOR entry IN SELECT * FROM (VALUES
    ('online_academy_schools','id','uuid'::regtype),('online_academy_schools','name','text'::regtype),
    ('online_academy_schools','description','text'::regtype),('online_academy_schools','website','text'::regtype),
    ('online_academy_schools','status','text'::regtype),('online_academy_schools','created_at','timestamptz'::regtype),('online_academy_schools','updated_at','timestamptz'::regtype),
    ('online_academy_offers','id','uuid'::regtype),('online_academy_offers','school_id','uuid'::regtype),
    ('online_academy_offers','title','text'::regtype),('online_academy_offers','description','text'::regtype),
    ('online_academy_offers','category_slug','text'::regtype),('online_academy_offers','module_ids','text[]'::regtype),
    ('online_academy_offers','status','text'::regtype),('online_academy_offers','created_at','timestamptz'::regtype),('online_academy_offers','updated_at','timestamptz'::regtype),
    ('online_academy_sessions','id','uuid'::regtype),('online_academy_sessions','offer_id','uuid'::regtype),
    ('online_academy_sessions','title','text'::regtype),('online_academy_sessions','starts_at','timestamptz'::regtype),('online_academy_sessions','ends_at','timestamptz'::regtype),
    ('online_academy_sessions','room_name','text'::regtype),('online_academy_sessions','status','text'::regtype),
    ('online_academy_sessions','created_at','timestamptz'::regtype),('online_academy_sessions','updated_at','timestamptz'::regtype)
  ) AS expected(table_name,column_name,kind) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_attribute a JOIN pg_class t ON t.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname=entry.table_name AND t.relkind='r'
      AND a.attname=entry.column_name AND a.atttypid=entry.kind AND a.attnotnull AND NOT a.attisdropped) THEN
      RAISE EXCEPTION 'JL_ACADEMY_SETUP: incompatible table';
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.online_academy_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_academy_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_academy_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.online_academy_schools,public.online_academy_offers,public.online_academy_sessions FROM PUBLIC,anon,authenticated,service_role;
DO $$
DECLARE table_name text; column_name text; role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['online_academy_schools','online_academy_offers','online_academy_sessions'] LOOP
    FOR column_name IN SELECT attname FROM pg_attribute WHERE attrelid=to_regclass(format('public.%I',table_name)) AND attnum>0 AND NOT attisdropped LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM PUBLIC,anon,authenticated,service_role',column_name,table_name);
    END LOOP;
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
      IF has_table_privilege(role_name,format('public.%I',table_name),'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
        has_any_column_privilege(role_name,format('public.%I',table_name),'INSERT,UPDATE,REFERENCES') OR
        (role_name<>'service_role' AND (has_table_privilege(role_name,format('public.%I',table_name),'SELECT') OR
          has_any_column_privilege(role_name,format('public.%I',table_name),'SELECT'))) THEN
        RAISE EXCEPTION 'JL_ACADEMY_SETUP: inherited table privilege';
      END IF;
    END LOOP;
  END LOOP;
END $$;
GRANT SELECT,INSERT,UPDATE ON TABLE public.online_academy_schools,public.online_academy_offers,public.online_academy_sessions TO service_role;
CREATE INDEX IF NOT EXISTS online_academy_offers_school_status ON public.online_academy_offers(school_id,status);
CREATE INDEX IF NOT EXISTS online_academy_sessions_offer_time ON public.online_academy_sessions(offer_id,starts_at);

-- Actual operator profile, with no fabricated course, teacher or timetable.
INSERT INTO public.online_academy_schools(id,name,description,website,status)
VALUES ('9d82b7cf-a2c6-4ad2-95fb-814c3c450d5e','Jagdlatein','Lernangebote auf Jagdlatein.','https://jagdlatein.de/','approved')
ON CONFLICT (id) DO NOTHING;
NOTIFY pgrst,'reload schema';
COMMIT;
