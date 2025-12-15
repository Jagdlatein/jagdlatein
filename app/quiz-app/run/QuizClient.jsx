"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function QuizClient() {
  const router = useRouter();
  const params = useSearchParams();

  const country = (params.get("country") || "DE").toUpperCase();
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

    async function load() {
      const res = await fetch(
        `/api/questions?country=${country}&topic=${topic}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      const qs = data.questions || [];
      setQuestions(qs.sort(() => Math.random() - 0.5));
    }

    load();
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
    setLocked(true);
    setEffectState("flash-wrong");
    setSelected(-1);
    setTimeout(nextQuestion, 900);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;

    const isCorrect = q.correct.includes(ans.id);
    setLocked(true);
    setSelected(idx);

    if (isCorrect) {
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
    setTimer(30);
    setLocked(false);
    setSelected(null);
  }

  // -------------------------------
  // SCORE SPEICHERN
  // -------------------------------
  useEffect(() => {
    if (!finished) return;

    fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        points: score,
      }),
    });
  }, [finished, score, username]);

  // -------------------------------
  // QUIZ RESET
  // -------------------------------
  function restartQuiz() {
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

          <button
            onClick={() => router.push("/")}
            className="quiz-end-btn"
          >
            🏠 Zur Startseite
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
        Lade Quiz…
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
    </div>
  );
}
