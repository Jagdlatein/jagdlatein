BEGIN;

CREATE TABLE IF NOT EXISTS public.activity_results (
  account_email text NOT NULL CHECK (account_email = lower(btrim(account_email)) AND length(account_email) BETWEEN 3 AND 320),
  event_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('quiz', 'ansitz')),
  country text,
  topic text NOT NULL CHECK (length(btrim(topic)) BETWEEN 1 AND 120),
  total_questions integer NOT NULL CHECK (total_questions BETWEEN 1 AND 10000),
  correct_answers integer NOT NULL CHECK (correct_answers BETWEEN 0 AND total_questions),
  timed_out_answers integer NOT NULL CHECK (timed_out_answers BETWEEN 0 AND total_questions - correct_answers),
  points integer NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 0 AND 86400),
  finished_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (account_email, event_id),
  CHECK (
    (type = 'quiz' AND country IS NOT NULL AND country IN ('DE', 'AT', 'CH') AND points BETWEEN correct_answers * 100 AND correct_answers * 400 AND points % 10 = 0)
    OR (type = 'ansitz' AND country IS NULL AND topic = 'Ansitzsimulator' AND total_questions = 25 AND timed_out_answers = 0 AND points = correct_answers)
  )
);

CREATE INDEX IF NOT EXISTS activity_results_account_finished
ON public.activity_results (account_email, finished_at DESC);

ALTER TABLE public.activity_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.activity_results FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.activity_results TO service_role;

-- Aggregate inside PostgreSQL so totals are not limited by the REST row limit.
CREATE OR REPLACE FUNCTION public.get_activity_statistics(p_account_email text)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  WITH entries AS (
    SELECT * FROM public.activity_results WHERE account_email = p_account_email
  ), summary AS (
    SELECT type, count(*) AS rounds, sum(total_questions) AS total_questions,
      sum(correct_answers) AS correct_answers, sum(timed_out_answers) AS timed_out_answers,
      sum(points) AS total_points, round(avg(points), 1) AS average_points,
      round(100.0 * sum(correct_answers) / sum(total_questions), 1) AS hit_rate,
      round(max(100.0 * correct_answers / total_questions), 1) AS best_hit_rate
    FROM entries GROUP BY type
  ), topic_summary AS (
    SELECT topic, country, count(*) AS rounds, sum(total_questions) AS total_questions,
      sum(correct_answers) AS correct_answers,
      round(100.0 * sum(correct_answers) / sum(total_questions), 1) AS hit_rate
    FROM entries WHERE type = 'quiz' GROUP BY topic, country
  ), recent AS (
    SELECT * FROM entries ORDER BY finished_at DESC, event_id LIMIT 20
  )
  SELECT jsonb_build_object(
    'quiz', coalesce((SELECT jsonb_build_object(
      'rounds', rounds, 'totalQuestions', total_questions, 'correctAnswers', correct_answers,
      'timedOutAnswers', timed_out_answers, 'totalPoints', total_points,
      'averagePoints', average_points, 'hitRate', hit_rate, 'bestHitRate', best_hit_rate
    ) FROM summary WHERE type = 'quiz'), jsonb_build_object(
      'rounds', 0, 'totalQuestions', 0, 'correctAnswers', 0, 'timedOutAnswers', 0,
      'totalPoints', 0, 'averagePoints', null, 'hitRate', null, 'bestHitRate', null
    )),
    'ansitz', coalesce((SELECT jsonb_build_object(
      'rounds', rounds, 'totalQuestions', total_questions, 'correctAnswers', correct_answers,
      'hitRate', hit_rate, 'bestHitRate', best_hit_rate
    ) FROM summary WHERE type = 'ansitz'), jsonb_build_object(
      'rounds', 0, 'totalQuestions', 0, 'correctAnswers', 0, 'hitRate', null, 'bestHitRate', null
    )),
    'topics', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'topic', topic, 'country', country, 'rounds', rounds,
      'totalQuestions', total_questions, 'correctAnswers', correct_answers, 'hitRate', hit_rate
    ) ORDER BY topic, country) FROM topic_summary), '[]'::jsonb),
    'history', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'eventId', event_id, 'type', type, 'country', country, 'topic', topic,
      'totalQuestions', total_questions, 'correctAnswers', correct_answers,
      'timedOutAnswers', timed_out_answers, 'points', points,
      'durationSeconds', duration_seconds, 'finishedAt', finished_at
    ) ORDER BY finished_at DESC, event_id) FROM recent), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_activity_statistics(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_statistics(text) TO service_role;

COMMIT;
