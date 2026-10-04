"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useActivityResult from "../../../hooks/useActivityResult";
import ActivityResultNotice from "../../../components/ActivityResultNotice";

export default function QuizClient() {
  const router = useRouter();
  const params = useSearchParams();

  const requestedCountry = (params.get("country") || "DE").toUpperCase();
  const country = ["DE", "AT", "CH"].includes(requestedCountry) ? requestedCountry : "DE";
  const topic = params.get("topic") || "Alle";

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [effect, setEffectState] = useState("");
  const [username, setUsername] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timedOutAnswers, setTimedOutAnswers] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [loadStage, setLoadStage] = useState("questions");
  const [leagueState, setLeagueState] = useState({ status: "idle", renewalRequired: false });
  const startedAt = useRef(Date.now());
  const answerPending = useRef(false);
  const feedbackTimer = useRef(null);
  const feedbackGeneration = useRef(0);
  const leagueSubmittedRun = useRef(null);
  const roundMetadata = useRef({ country, topic });
  const mounted = useRef(false);
  const leaguePending = useRef(null);
  const renderedQuestion = useRef({ question: null, runKey });
  const advancePending = useRef(false);
  const resultCompleted = questions.length > 0 && (finished || (locked && index === questions.length - 1));
  const activityResult = useActivityResult({
    runKey, completed: resultCompleted, type: "quiz", country: roundMetadata.current.country, topic: roundMetadata.current.topic,
    totalQuestions: questions.length, correctAnswers, timedOutAnswers,
    points: score, startedAt: startedAt.current,
  });
  const returnUrl = `/quiz-app/run?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`;
  const setupUrl = `/quiz-app?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`;

  function clearFeedbackTimer() {
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    feedbackGeneration.current += 1;
  }

  function scheduleNextQuestion() {
    clearFeedbackTimer();
    const generation = feedbackGeneration.current;
    feedbackTimer.current = setTimeout(() => {
      if (generation !== feedbackGeneration.current) return;
      feedbackTimer.current = null;
      nextQuestion();
    }, 10000);
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearFeedbackTimer();
      answerPending.current = false;
    };
  }, []);

  // -------------------------------
  // Read the quiz name without crashing when browser storage is unavailable.
  // -------------------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jagd_username");
      setStorageError(false);
      if (!stored) {
        setUsername("");
        router.push(`/quiz-app/username?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`);
        return;
      }
      setUsername(stored);
    } catch {
      setUsername("");
      setStorageError(true);
    }
  }, [router, country, topic, reloadKey]);

  // Registration must succeed before starting a question round.
  useEffect(() => {
    if (!username) return;
    let active = true;
    const controller = new AbortController();

    async function load() {
      clearFeedbackTimer();
      answerPending.current = false;
      setLoadError(false);
      setLoadStage("registration");
      setQuestions([]);
      setFinished(false);
      setLocked(false);
      setSelected(null);
      setEffectState("");
      let leagueCountry = country;
      try { leagueCountry = localStorage.getItem("jagd_country") || country; } catch {}
      const registration = await fetch("/api/quiz/register", {
        method: "POST", credentials: "same-origin", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, country: leagueCountry }),
      });
      const registrationResult = await registration.json();
      if (!registration.ok || registrationResult.success !== true) throw new Error("Registrierung fehlgeschlagen");
      if (!active) return;
      setLoadStage("questions");
      const res = await fetch(
        `/api/questions?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`,
        { cache: "no-store", credentials: "same-origin", signal: controller.signal }
      );
      if (!res.ok) throw new Error("Fragen nicht erreichbar");
      const data = await res.json();
      const qs = Array.isArray(data.questions) ? data.questions : [];
      if (!active) return;
      if (qs.length === 0 || !qs.every(item => typeof item.q === "string" && Array.isArray(item.answers)
        && item.answers.length > 0 && item.answers.every(answer => typeof answer.id === "string" && typeof answer.text === "string")
        && Array.isArray(item.correct) && item.correct.length > 0
        && item.correct.every(id => item.answers.some(answer => answer.id === id)))) throw new Error("Keine gültigen Fragen verfügbar");
      roundMetadata.current = { country, topic };
      answerPending.current = false;
      startedAt.current = Date.now();
      setIndex(0);
      setTimer(30);
      setScore(0);
      setCorrectAnswers(0);
      setTimedOutAnswers(0);
      setLocked(false);
      setSelected(null);
      setFinished(false);
      leaguePending.current = null;
      setLeagueState({ status: "idle", renewalRequired: false });
      setRunKey(value => value + 1);
      setQuestions(qs);
    }

    load().catch(() => { if (active) setLoadError(true); });
    return () => {
      active = false;
      controller.abort();
      clearFeedbackTimer();
      answerPending.current = false;
    };
  }, [username, country, topic, reloadKey]);

  const q = questions[index];
  if (renderedQuestion.current.question !== q || renderedQuestion.current.runKey !== runKey) {
    renderedQuestion.current = { question: q, runKey };
    answerPending.current = false;
    advancePending.current = false;
  }

  // -------------------------------
  // TIMER
  // -------------------------------
  useEffect(() => {
    if (!q || locked || finished) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  function handleTimeout() {
    if (answerPending.current || locked || finished) return;
    answerPending.current = true;
    setLocked(true);
    setTimedOutAnswers(value => value + 1);
    setEffectState("flash-wrong");
    setSelected(-1);
    scheduleNextQuestion();
  }

  function handleAnswer(ans, idx) {
    if (answerPending.current || locked || finished || !q || renderedQuestion.current.question !== q || renderedQuestion.current.runKey !== runKey) return;
    answerPending.current = true;

    const isCorrect = q.correct.includes(ans.id);
    setLocked(true);
    setSelected(idx);

    if (isCorrect) {
      setCorrectAnswers(value => value + 1);
      setEffectState("flash-correct");
      setScore(s => s + 100 + timer * 10);
    } else {
      setEffectState("flash-wrong");
    }

    scheduleNextQuestion();
  }

  function nextQuestion() {
    if (!answerPending.current || advancePending.current || finished) return;
    advancePending.current = true;
    clearFeedbackTimer();
    setEffectState("");

    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }

    setIndex(i => i + 1);
    setTimer(30);
    setLocked(false);
    setSelected(null);
  }

  // -------------------------------
  // SCORE SPEICHERN
  // -------------------------------
  async function saveLeagueResult(record = leaguePending.current) {
    if (!record || record.running || record.saved) return;
    record.running = true;
    if (mounted.current && leaguePending.current === record) setLeagueState({ status: "saving", renewalRequired: false });
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record.payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        const failure = new Error("Ranglistenergebnis nicht gespeichert");
        failure.renewalRequired = response.status === 401 || response.status === 403;
        throw failure;
      }
      record.saved = true;
      if (mounted.current && leaguePending.current === record) setLeagueState({ status: "saved", renewalRequired: false });
    } catch (failure) {
      if (mounted.current && leaguePending.current === record) setLeagueState({ status: "error", renewalRequired: failure?.renewalRequired === true });
    } finally {
      record.running = false;
    }
  }

  useEffect(() => {
    if (!resultCompleted || !username || leagueSubmittedRun.current === runKey) return;
    leagueSubmittedRun.current = runKey;
    const record = { runKey, payload: { username, points: score }, running: false, saved: false };
    leaguePending.current = record;
    void saveLeagueResult(record);
  }, [resultCompleted, score, username, runKey]);

  function leagueNotice() {
    if (leagueState.status === "idle") return null;
    return <aside role={leagueState.status === "error" ? "alert" : "status"} style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: leagueState.status === "error" ? "#fff4dc" : "#eaf4e9", color: "#2e4d32", lineHeight: 1.5 }}>
      {leagueState.status === "saving" ? "Dein Ranglistenergebnis wird gespeichert …" : leagueState.status === "saved" ? "Dein Ranglistenergebnis wurde bestätigt. Die Rangliste zeigt deinen besten Durchlauf." : <>
        <p style={{ margin: "0 0 8px" }}>Dein Ergebnis für die Rangliste konnte gerade nicht gespeichert werden.</p>
        {leagueState.renewalRequired ? <Link href={`/login?reauth=1&next=${encodeURIComponent(returnUrl)}`}>Anmeldung erneuern</Link> : <button type="button" onClick={() => { void saveLeagueResult(); }}>Ranglistenergebnis erneut speichern</button>}
      </>}
    </aside>;
  }

  // -------------------------------
  // QUIZ RESET
  // -------------------------------
  function restartQuiz() {
    clearFeedbackTimer();
    answerPending.current = false;
    startedAt.current = Date.now();
    setRunKey(value => value + 1);
    setCorrectAnswers(0);
    setTimedOutAnswers(0);
    setIndex(0);
    setTimer(30);
    setScore(0);
    setLocked(false);
    setSelected(null);
    setFinished(false);
    setEffectState("");
    setQuestions([]);
    leaguePending.current = null;
    setLeagueState({ status: "idle", renewalRequired: false });
    setReloadKey(value => value + 1);
  }

  // -------------------------------
  // END-SCREEN
  // -------------------------------
  if (finished) {
    return (
      <div style={{ padding: 40 }}>
        <div className="quiz-finish-box fade-in">

          <h1 className="quiz-finish-title">🎉 Quiz abgeschlossen!</h1>

          <div className="quiz-score-badge">{score}</div>
          <p>{correctAnswers} von {questions.length} Fragen richtig</p>
          <p><Link href={setupUrl}>Land und Thema wählen</Link></p>
          <ActivityResultNotice {...activityResult} nextUrl={returnUrl} />
          {leagueNotice()}

          <button
            onClick={() => router.push("/quiz-app/leaderboard")}
            className="quiz-end-btn"
          >
            🏆 Rangliste ansehen
          </button>

          <button
            onClick={restartQuiz}
            className="quiz-end-btn"
          >
            🔄 Neues Quiz starten
          </button>

        </div>
      </div>
    );
  }

  // -------------------------------
  // LOADING
  // -------------------------------
  if (!q) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        {storageError ? <>
          <p role="alert">Dein Browser gibt den gespeicherten Quiznamen gerade nicht frei. Bitte erlaube den Browserspeicher oder versuche es erneut.</p>
          <button type="button" onClick={() => setReloadKey(value => value + 1)}>Erneut prüfen</button>
          <p><Link href={setupUrl}>Land und Thema wählen</Link></p>
        </> : loadError ? (
          <>
            <p role="alert">{loadStage === "registration" ? "Dein Quizname konnte gerade nicht bestätigt werden. Bitte versuche es erneut." : "Die Quizfragen konnten gerade nicht geladen werden."}</p>
            <button type="button" onClick={() => setReloadKey(value => value + 1)}>Erneut laden</button>
            {loadStage === "registration" && <p><Link href={`/quiz-app/username?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`}>Anderen Quiznamen wählen</Link></p>}
            <p><Link href={setupUrl}>Land und Thema wählen</Link></p>
          </>
        ) : loadStage === "registration" ? "Dein Quizname wird bestätigt …" : "Lade Quiz…"}
      </div>
    );
  }

  // -------------------------------
  // QUIZ
  // -------------------------------
  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <p style={{ margin: "0 0 18px" }}><Link href={setupUrl}>Land und Thema wählen</Link></p>

      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{ width: `${(timer / 30) * 100}%` }}
        />
      </div>

      <div
        className="fade-in"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Frage {index + 1}/{questions.length}
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: timer <= 5 ? "red" : "#136f39",
          }}
        >
          ⏱ {timer}s
        </div>
      </div>

      <div style={{ fontSize: 18, marginTop: 12, opacity: 0.7 }}>
        Score: {score}
      </div>

      <div
        className={`fade-in ${effect}`}
        style={{
          padding: 18,
          background: "rgba(255,255,255,0.75)",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.1)",
          marginTop: 20,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          {q.q}
        </div>

        {q.answers.map((ans, i) => {
          const isSelected = selected === i;
          const isCorrect = q.correct.includes(ans.id);

          return (
            <button
              type="button"
              disabled={locked}
              key={i}
              onClick={() => handleAnswer(ans, i)}
              style={{
                padding: "14px 16px",
                display: "block",
                width: "100%",
                font: "inherit",
                textAlign: "left",
                color: "inherit",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                background:
                  isSelected && isCorrect
                    ? "#c6f6d5"
                    : isSelected && !isCorrect
                    ? "#fed7d7"
                    : "#fff",
                marginBottom: 12,
                fontSize: 18,
                cursor: locked ? "default" : "pointer",
              }}
            >
              {ans.text}
            </button>
          );
        })}
      </div>
      {locked && (
        <section
          role="status"
          aria-live="polite"
          style={{
            marginTop: 18,
            padding: 18,
            borderRadius: 14,
            background: selected !== -1 && q.correct.includes(q.answers[selected]?.id) ? "#e5f6e9" : "#fff2f2",
            color: "#1f2937",
            lineHeight: 1.5,
          }}
        >
          <strong>
            {selected === -1
              ? "Zeit abgelaufen."
              : q.correct.includes(q.answers[selected]?.id) ? "Richtig!" : "Leider falsch."}
          </strong>
          <p style={{ margin: "8px 0" }}>
            <b>Richtige Antwort:</b>{" "}
            {q.answers.filter(answer => q.correct.includes(answer.id)).map(answer => answer.text).join("; ")}
          </p>
          {q.explain && <p style={{ margin: "8px 0" }}>{q.explain}</p>}
          {typeof q.source === "string" && q.source.startsWith("https://") && (
            <p style={{ margin: "8px 0" }}><a href={q.source} target="_blank" rel="noopener noreferrer">Quelle nachlesen (neuer Tab)</a></p>
          )}
          {typeof q.learningHref === "string" && q.learningHref.startsWith("/") && !q.learningHref.startsWith("//") && (
            <p style={{ margin: "8px 0" }}>
              <Link href={q.learningHref}>Im Lernwissen nachlesen</Link>
            </p>
          )}
          <button
            type="button"
            onClick={nextQuestion}
            className="quiz-end-btn"
            style={{ marginTop: 8 }}
          >
            {index === questions.length - 1 ? "Ergebnis anzeigen" : "Weiter"}
          </button>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563" }}>
            Automatisch weiter nach 10 Sekunden.
          </p>
        </section>
      )}
      <ActivityResultNotice {...activityResult} nextUrl={returnUrl} />
      {leagueNotice()}
    </div>
  );
}
