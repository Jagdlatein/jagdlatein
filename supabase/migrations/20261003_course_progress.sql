-- Apply once in the Supabase SQL editor before enabling course synchronization.
-- This app uses a server-signed cookie, not Supabase Auth user JWTs.
BEGIN;

CREATE TABLE IF NOT EXISTS public.course_progress (
  account_email text NOT NULL,
  course_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed')),
  answered_questions integer NOT NULL CHECK (answered_questions >= 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  score integer NOT NULL CHECK (score >= 0),
  best_score integer NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (account_email, course_id),
  CHECK (account_email = lower(btrim(account_email)) AND length(account_email) BETWEEN 3 AND 320),
  CHECK (length(course_id) BETWEEN 1 AND 100),
  CHECK (answered_questions <= total_questions),
  CHECK (score <= answered_questions AND best_score <= total_questions),
  CHECK (
    (status = 'completed' AND answered_questions = total_questions AND completed_at IS NOT NULL)
    OR (status = 'in_progress' AND completed_at IS NULL)
  )
);

-- ON CONFLICT UPDATE locks the existing row. This trigger merges against that
-- locked row, so simultaneous saves cannot clear a completion or a best score.
CREATE OR REPLACE FUNCTION public.merge_course_progress()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      NEW.completed_at := NEW.updated_at;
      NEW.best_score := NEW.score;
    ELSE
      NEW.completed_at := NULL;
      NEW.best_score := 0;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'completed' AND NEW.status = 'in_progress' THEN
    NEW.status := 'completed';
    NEW.answered_questions := OLD.answered_questions;
    NEW.total_questions := OLD.total_questions;
    NEW.score := OLD.score;
  END IF;

  IF NEW.status = 'completed' THEN
    NEW.completed_at := COALESCE(OLD.completed_at, NEW.updated_at);
    NEW.best_score := GREATEST(OLD.best_score, NEW.score);
  ELSE
    NEW.completed_at := NULL;
    NEW.answered_questions := GREATEST(OLD.answered_questions, NEW.answered_questions);
    NEW.score := GREATEST(OLD.score, NEW.score);
    NEW.best_score := OLD.best_score;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_progress_merge ON public.course_progress;
CREATE TRIGGER course_progress_merge
BEFORE INSERT OR UPDATE ON public.course_progress
FOR EACH ROW EXECUTE FUNCTION public.merge_course_progress();

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.course_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.course_progress TO service_role;
REVOKE ALL ON FUNCTION public.merge_course_progress() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_course_progress() TO service_role;

COMMIT;
