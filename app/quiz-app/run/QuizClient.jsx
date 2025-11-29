"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [effect, setEffect] = useState("");
  const [username, setUsername] = useState("");

  // -----------------------------
  // LOAD USER + REGISTER + QUESTIONS
  // -----------------------------
  useEffect(() => {
    async function init() {
      const u = localStorage.getItem("jagd_username");
      if (!u) {
        router.replace("/quiz-app/username");
        return;
      }

      setUsername(u);

      // 1️⃣ USER REGISTRIEREN
      await fetch("/api/quiz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, country })
      });

      // 2️⃣ FRAGEN LADEN
      const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    }

    init();
  }, [router, country, topic]);

  const q = questions[index];

  // -----------------------------
  // TIMER
  // -----------------------------
  useEffect(() => {
    if (!q || locked || finished) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  function handleTimeout() {
    setLocked(true);
    setEffect("flash-wrong");
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 900);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;

    const isCorrect = q.correct.includes(ans.id);
    setLocked(true);
    setSelected(idx);

    if (isCorrect) {
      setEffect("flash-correct");
      setScore((s) => s + 100 + timer * 10);
    } else {
      setEffect("flash-wrong");
    }

    setTimeout(() => nextQuestion(), 900);
  }

  function nextQuestion() {
    setEffect("");

    if (index + 1 >= questions.length) {
      setFinished(true);
      saveScore();
      return;
    }

    setIndex((i) => i + 1);
    setTimer(30);
    setLocked(false);
    setSelected(null);
  }

  async function saveScore() {
    await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        points: score
      })
    });
  }

  // -----------------------------
  // LOADING
  // -----------------------------
  if (!q && !finished) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontSize: 22 }}>
        Lade Quiz…
      </div>
    );
  }

  // -----------------------------
  // FINISHED SCREEN
  // -----------------------------
  if (finished) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 34, marginBottom: 10 }}>🎉 Quiz abgeschlossen!</h1>

        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: "#d4af37",
            marginBottom: 20,
            textShadow: "0 0 6px rgba(0,0,0,0.2)"
          }}
        >
          {score}
        </div>

        <button
          onClick={() => router.push("/quiz-app/leaderboard")}
          style={{
            padding: 14,
            width: "100%",
            background: "#d4af37",
            borderRadius: 12,
            marginBottom: 12,
            color: "#fff",
            fontSize: 18,
            border: 0
          }}
        >
          🏆 Wochen-Rangliste ansehen
        </button>

        <button
          onClick={() =>
            router.push(`/quiz-app/run?country=${country}&topic=${topic}`)
          }
          style={{
            padding: 14,
            width: "100%",
            background: "#1f2b23",
            borderRadius: 12,
            color: "#fff",
            fontSize: 18,
            border: 0
          }}
        >
          🔄 Neues Quiz starten
        </button>
      </div>
    );
  }

  // -----------------------------
  // QUIZ RUNNING — GOLD UI
  // -----------------------------
  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      {/* PROGRESSBAR */}
      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{ width: `${(timer / 30) * 100}%` }}
        />
      </div>

      {/* INFO HEADER */}
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
            color: timer <= 5 ? "red" : "#d4af37"
          }}
        >
          ⏱ {timer}s
        </div>
      </div>

      {/* SCORE */}
      <div style={{ fontSize: 18, marginTop: 12, opacity: 0.7 }}>
        Score: {score}
      </div>

      {/* QUIZ CARD */}
      <div className={`quiz-card fade-in ${effect}`}>
        <div className="quiz-question">{q.q}</div>

        {q.answers.map((ans, i) => {
          const isSelected = selected === i;
          const isCorrect = q.correct.includes(ans.id);

          return (
            <div
              key={i}
              className={
                "quiz-answer fade-in " +
                (isSelected
                  ? isCorrect
                    ? "quiz-answer-correct"
                    : "quiz-answer-wrong"
                  : "")
              }
              onClick={() => handleAnswer(ans, i)}
            >
              {ans.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
