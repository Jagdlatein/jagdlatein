"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const [loadError, setLoadError] = useState(false);
  const startedAt = useRef(Date.now());
  const answerPending = useRef(false);
  const roundMetadata = useRef({ country, topic });
  const resultCompleted = questions.length > 0 && (finished || (locked && index === questions.length - 1));
  const activityResult = useActivityResult({
    runKey, completed: resultCompleted, type: "quiz", country: roundMetadata.current.country, topic: roundMetadata.current.topic,
    totalQuestions: questions.length, correctAnswers, timedOutAnswers,
    points: score, startedAt: startedAt.current,
  });
  const returnUrl = `/quiz-app/run?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`;

  // -------------------------------
  // USERNAME LADEN
  // -------------------------------
  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    if (!u) {
      router.push("/quiz-app/username");
      return;
    }
    setUsername(u);
  }, [router]);

  // -------------------------------
  // USER REGISTRIEREN
  // -------------------------------
  useEffect(() => {
    if (!username) return;

    fetch("/api/quiz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, country }),
    });
  }, [username, country]);

  // -------------------------------
  // FRAGEN LADEN
  // -------------------------------
  useEffect(() => {
    if (!username) return;
    let active = true;

    async function load() {
      setLoadError(false);
      const res = await fetch(
        `/api/questions?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Fragen nicht erreichbar");
      const data = await res.json();
      const qs = Array.isArray(data.questions) ? data.questions : [];
      if (!active) return;
      if (qs.length === 0) throw new Error("Keine Fragen verfügbar");
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
      setRunKey(value => value + 1);
      setQuestions(qs.sort(() => Math.random() - 0.5));
    }

    load().catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [username, country, topic]);

  const q = questions[index];

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
    setTimeout(nextQuestion, 900);
  }

  function handleAnswer(ans, idx) {
    if (answerPending.current || locked || finished) return;
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

    setTimeout(nextQuestion, 900);
  }

  function nextQuestion() {
    setEffectState("");

    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }

    setIndex(i => i + 1);
    answerPending.current = false;
    setTimer(30);
    setLocked(false);
    setSelected(null);
  }

  // -------------------------------
  // SCORE SPEICHERN
  // -------------------------------
  useEffect(() => {
    if (!resultCompleted) return;

    fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        points: score,
      }),
    });
  }, [resultCompleted, score, username]);

  // -------------------------------
  // QUIZ RESET
  // -------------------------------
  function restartQuiz() {
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
    setQuestions(qs => [...qs].sort(() => Math.random() - 0.5));
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
          <ActivityResultNotice {...activityResult} nextUrl={returnUrl} />

          <button
            onClick={() => router.push("/quiz-app/leaderboard")}
            className="quiz-end-btn"
          >
            🏆 Wochen-Rangliste ansehen
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
        {loadError ? (
          <>
            <p>Die Quizfragen konnten gerade nicht geladen werden.</p>
            <button type="button" onClick={() => window.location.reload()}>Erneut laden</button>
          </>
        ) : "Lade Quiz…"}
      </div>
    );
  }

  // -------------------------------
  // QUIZ
  // -------------------------------
  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>

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
            <div
              key={i}
              onClick={() => handleAnswer(ans, i)}
              style={{
                padding: "14px 16px",
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
            </div>
          );
        })}
      </div>
      <ActivityResultNotice {...activityResult} nextUrl={returnUrl} />
    </div>
  );
}
