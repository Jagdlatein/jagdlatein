BEGIN;

CREATE TABLE IF NOT EXISTS public.quiz_identities (
  account_email text PRIMARY KEY CHECK (account_email = lower(btrim(account_email)) AND length(account_email) BETWEEN 3 AND 320),
  username text UNIQUE NOT NULL CHECK (username = lower(btrim(username)) AND length(username) BETWEEN 1 AND 40),
  country text NOT NULL CHECK (country IN ('DE','AT','CH','FR','IT','ES','PT','NL','BE','LU','DK','NO','SE','FI','PL','CZ','SK','HU','SI','HR','RO','BG','GR','IE','UK')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS public.quiz_reserved_names (username text PRIMARY KEY);
-- Old names have no provable account owner. Keep their history and reserve them
-- until an administrator can verify and migrate the owner explicitly.
DO $$ BEGIN
  IF to_regclass('public.quiz_users') IS NOT NULL THEN
    EXECUTE 'INSERT INTO public.quiz_reserved_names SELECT DISTINCT lower(btrim(username)) FROM public.quiz_users WHERE username IS NOT NULL ON CONFLICT DO NOTHING';
  END IF;
  IF to_regclass('public.quiz_scores') IS NOT NULL THEN
    EXECUTE 'INSERT INTO public.quiz_reserved_names SELECT DISTINCT lower(btrim(username)) FROM public.quiz_scores WHERE username IS NOT NULL ON CONFLICT DO NOTHING';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ranked_quiz_rounds (
  round_id uuid PRIMARY KEY,
  account_email text NOT NULL REFERENCES public.quiz_identities(account_email),
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS ranked_quiz_rounds_account_created ON public.ranked_quiz_rounds(account_email, created_at DESC);
CREATE TABLE IF NOT EXISTS public.verified_quiz_scores (
  account_email text PRIMARY KEY REFERENCES public.quiz_identities(account_email),
  username text UNIQUE NOT NULL,
  country text NOT NULL,
  total_points integer NOT NULL CHECK (total_points BETWEEN 0 AND 4000),
  rounds integer NOT NULL CHECK (rounds > 0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.activity_results ADD COLUMN IF NOT EXISTS verification text NOT NULL DEFAULT 'self_reported'
  CHECK (verification IN ('self_reported', 'server_verified'));

ALTER TABLE public.quiz_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_reserved_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_quiz_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_quiz_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quiz_identities, public.quiz_reserved_names, public.ranked_quiz_rounds, public.verified_quiz_scores FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.quiz_identities, public.verified_quiz_scores TO service_role;

CREATE OR REPLACE FUNCTION public.register_ranked_quiz(p_email text, p_username text, p_country text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE identity public.quiz_identities;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR length(p_email) NOT BETWEEN 3 AND 320
    OR p_username IS NULL OR p_username <> lower(btrim(p_username)) OR length(p_username) NOT BETWEEN 1 AND 40
    OR p_username ~ '[[:cntrl:]]'
    OR p_country IS NULL OR p_country NOT IN ('DE','AT','CH','FR','IT','ES','PT','NL','BE','LU','DK','NO','SE','FI','PL','CZ','SK','HU','SI','HR','RO','BG','GR','IE','UK') THEN
    RAISE EXCEPTION 'JL_QUIZ_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email, 0));
  SELECT * INTO identity FROM public.quiz_identities WHERE account_email = p_email;
  IF FOUND THEN RETURN jsonb_build_object('username',identity.username,'country',identity.country); END IF;
  IF EXISTS (SELECT 1 FROM public.quiz_reserved_names WHERE username = p_username) THEN RAISE EXCEPTION 'JL_QUIZ_NAME'; END IF;
  BEGIN
    INSERT INTO public.quiz_identities(account_email,username,country) VALUES (p_email,p_username,p_country) RETURNING * INTO identity;
  EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'JL_QUIZ_NAME'; END;
  RETURN jsonb_build_object('username',identity.username,'country',identity.country);
END $$;

CREATE OR REPLACE FUNCTION public.start_ranked_quiz(p_email text, p_round_id uuid, p_country text, p_topic text, p_questions jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE identity public.quiz_identities; stored public.ranked_quiz_rounds; now_at timestamptz; state jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email, 0));
  SELECT * INTO identity FROM public.quiz_identities WHERE account_email = p_email;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_QUIZ_IDENTITY'; END IF;
  SELECT * INTO stored FROM public.ranked_quiz_rounds WHERE round_id = p_round_id;
  IF FOUND THEN
    IF stored.account_email <> p_email THEN RAISE EXCEPTION 'JL_QUIZ_MISSING'; END IF;
    IF stored.state->>'country' <> p_country OR stored.state->>'topic' <> p_topic THEN RAISE EXCEPTION 'JL_QUIZ_CONFLICT'; END IF;
    RETURN public.read_ranked_quiz(p_email,p_round_id);
  END IF;
  IF p_round_id IS NULL OR p_country IS NULL OR p_country NOT IN ('DE','AT','CH')
    OR p_topic IS NULL OR length(btrim(p_topic)) NOT BETWEEN 1 AND 120
    OR jsonb_typeof(p_questions) IS DISTINCT FROM 'array' OR jsonb_array_length(p_questions) NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'JL_QUIZ_INVALID'; END IF;
  -- Limit abandoned starts without affecting a replay of an existing request.
  IF (SELECT count(*) FROM public.ranked_quiz_rounds WHERE account_email = p_email AND created_at > clock_timestamp() - interval '1 hour') >= 60 THEN
    RAISE EXCEPTION 'JL_QUIZ_CONFLICT';
  END IF;
  now_at := clock_timestamp();
  state := jsonb_build_object('roundId',p_round_id,'username',identity.username,'leagueCountry',identity.country,
    'country',p_country,'topic',p_topic,'questions',p_questions,'index',0,'phase','asking',
    'points',0,'correctAnswers',0,'timedOutAnswers',0,'answers','[]'::jsonb,
    'createdAt',now_at,'expiresAt',now_at + interval '24 hours','deadlineAt',now_at + interval '30 seconds',
    'eventId',gen_random_uuid(),'nextRequests','[]'::jsonb);
  BEGIN
    INSERT INTO public.ranked_quiz_rounds(round_id,account_email,state,created_at) VALUES (p_round_id,p_email,state,now_at);
  EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'JL_QUIZ_MISSING'; END;
  RETURN state || jsonb_build_object('serverNow',now_at);
END $$;

CREATE OR REPLACE FUNCTION public.read_ranked_quiz(p_email text, p_round_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE state jsonb; now_at timestamptz := clock_timestamp();
BEGIN
  SELECT r.state INTO state FROM public.ranked_quiz_rounds r WHERE round_id = p_round_id AND account_email = p_email;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_QUIZ_MISSING'; END IF;
  IF state->>'finishedAt' IS NULL AND (state->>'expiresAt')::timestamptz <= now_at THEN RAISE EXCEPTION 'JL_QUIZ_EXPIRED'; END IF;
  RETURN state || jsonb_build_object('serverNow',now_at);
END $$;

CREATE OR REPLACE FUNCTION public.answer_ranked_quiz(p_email text, p_round_id uuid, p_question_id text, p_answer_id text, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
<<answer_state>>
DECLARE state jsonb; question jsonb; previous jsonb; feedback jsonb; now_at timestamptz;
  timed_out boolean; is_correct boolean; earned integer; remaining integer; current_index integer;
BEGIN
  SELECT r.state INTO state FROM public.ranked_quiz_rounds r WHERE round_id = p_round_id AND account_email = p_email FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_QUIZ_MISSING'; END IF;
  now_at := clock_timestamp();
  IF p_request_id IS NULL OR p_question_id IS NULL THEN RAISE EXCEPTION 'JL_QUIZ_INVALID'; END IF;
  SELECT value INTO previous FROM jsonb_array_elements(state->'answers') WHERE value->>'requestId' = p_request_id::text;
  IF FOUND THEN
    IF previous->>'questionId' <> p_question_id OR (previous->>'selectedAnswerId') IS DISTINCT FROM p_answer_id THEN RAISE EXCEPTION 'JL_QUIZ_CONFLICT'; END IF;
    RETURN state || jsonb_build_object('serverNow',now_at);
  END IF;
  IF state->>'finishedAt' IS NULL AND (state->>'expiresAt')::timestamptz <= now_at THEN RAISE EXCEPTION 'JL_QUIZ_EXPIRED'; END IF;
  current_index := (state->>'index')::integer;
  question := state->'questions'->current_index;
  IF state->>'phase' <> 'asking' OR question->>'id' <> p_question_id THEN RAISE EXCEPTION 'JL_QUIZ_CONFLICT'; END IF;
  IF p_answer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(question->'answers') a WHERE a->>'id' = p_answer_id) THEN RAISE EXCEPTION 'JL_QUIZ_INVALID'; END IF;
  timed_out := p_answer_id IS NULL OR now_at >= (state->>'deadlineAt')::timestamptz;
  is_correct := NOT timed_out AND question->'correct' ? p_answer_id;
  remaining := greatest(0,least(30,ceil(extract(epoch FROM (state->>'deadlineAt')::timestamptz - now_at))::integer));
  earned := CASE WHEN is_correct THEN 100 + remaining * 10 ELSE 0 END;
  feedback := jsonb_build_object('questionId',p_question_id,'requestId',p_request_id,
    'selectedAnswerId',p_answer_id,'correct',is_correct,'timedOut',timed_out,
    'correctAnswerIds',question->'correct','explain',question->>'explain','source',question->'source',
    'earnedPoints',earned,'answeredAt',now_at);
  state := state || jsonb_build_object('phase','feedback','feedback',feedback,'answers',(state->'answers') || jsonb_build_array(feedback),
    'points',(state->>'points')::integer + earned,
    'correctAnswers',(state->>'correctAnswers')::integer + CASE WHEN is_correct THEN 1 ELSE 0 END,
    'timedOutAnswers',(state->>'timedOutAnswers')::integer + CASE WHEN timed_out THEN 1 ELSE 0 END);
  IF current_index = jsonb_array_length(state->'questions') - 1 THEN
    -- Round, ranking and personal result are committed together. A failed write
    -- rolls back the answer so its identical retry can safely finish the round.
    INSERT INTO public.verified_quiz_scores(account_email,username,country,total_points,rounds,updated_at)
      VALUES(p_email,state->>'username',state->>'leagueCountry',(state->>'points')::integer,1,now_at)
    ON CONFLICT(account_email) DO UPDATE SET
      total_points = greatest(public.verified_quiz_scores.total_points,excluded.total_points),
      rounds = public.verified_quiz_scores.rounds + 1, updated_at = excluded.updated_at;
    INSERT INTO public.activity_results(account_email,event_id,type,country,topic,total_questions,correct_answers,timed_out_answers,points,duration_seconds,finished_at,verification)
      VALUES(p_email,(state->>'eventId')::uuid,'quiz',state->>'country',state->>'topic',jsonb_array_length(state->'questions'),
        (state->>'correctAnswers')::integer,(state->>'timedOutAnswers')::integer,(state->>'points')::integer,
        greatest(0,least(86400,floor(extract(epoch FROM now_at - (state->>'createdAt')::timestamptz))::integer)),now_at,'server_verified');
    state := state || jsonb_build_object('finishedAt',now_at);
  END IF;
  UPDATE public.ranked_quiz_rounds r SET state = answer_state.state WHERE round_id = p_round_id;
  RETURN state || jsonb_build_object('serverNow',now_at);
END $$;

CREATE OR REPLACE FUNCTION public.advance_ranked_quiz(p_email text, p_round_id uuid, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
<<next_state>>
DECLARE state jsonb; now_at timestamptz;
BEGIN
  SELECT r.state INTO state FROM public.ranked_quiz_rounds r WHERE round_id = p_round_id AND account_email = p_email FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_QUIZ_MISSING'; END IF;
  now_at := clock_timestamp();
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'JL_QUIZ_INVALID'; END IF;
  IF state->'nextRequests' ? p_request_id::text THEN RETURN state || jsonb_build_object('serverNow',now_at); END IF;
  IF state->>'finishedAt' IS NULL AND (state->>'expiresAt')::timestamptz <= now_at THEN RAISE EXCEPTION 'JL_QUIZ_EXPIRED'; END IF;
  IF state->>'phase' <> 'feedback' THEN RAISE EXCEPTION 'JL_QUIZ_CONFLICT'; END IF;
  state := state || jsonb_build_object('nextRequests',(state->'nextRequests') || jsonb_build_array(p_request_id::text));
  IF state->>'finishedAt' IS NOT NULL THEN state := state || jsonb_build_object('phase','complete');
  ELSE state := state || jsonb_build_object('phase','asking','index',(state->>'index')::integer + 1,'deadlineAt',now_at + interval '30 seconds'); END IF;
  UPDATE public.ranked_quiz_rounds r SET state = next_state.state WHERE round_id = p_round_id;
  RETURN state || jsonb_build_object('serverNow',now_at);
END $$;

REVOKE ALL ON FUNCTION public.register_ranked_quiz(text,text,text), public.start_ranked_quiz(text,uuid,text,text,jsonb),
  public.read_ranked_quiz(text,uuid), public.answer_ranked_quiz(text,uuid,text,text,uuid), public.advance_ranked_quiz(text,uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_ranked_quiz(text,text,text), public.start_ranked_quiz(text,uuid,text,text,jsonb),
  public.read_ranked_quiz(text,uuid), public.answer_ranked_quiz(text,uuid,text,text,uuid), public.advance_ranked_quiz(text,uuid,uuid) TO service_role;

COMMIT;
