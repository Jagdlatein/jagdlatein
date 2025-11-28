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

  // --------------------------------
  // LOAD USER + REGISTER + QUESTIONS
  // --------------------------------
  useEffect(() => {
    async function init() {
      const u = localStorage.getItem("jagd_username");
      if (!u) {
        router.replace("/quiz-app/username");
        return;
      }

      setUsername(u);

      // 1) USER REGISTRIEREN
      await fetch("/api/quiz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, country })
      });

      // 2) FRAGEN LADEN
      const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    }

    init();
  }, [router, country, topic]);

  const q = questions[index];

  // -------------------------
  // Timer
  // -------------------------
  useEffect(() => {
    if (!q || locked || finished) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer(t => t - 1), 1000);
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
      setScore(s => s + 100 + timer * 10);
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

    setIndex(i => i + 1);
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
        points: score,
      }),
    });
  }

  if (!q && !finished) {
    return <div style={{ padding: 40, textAlign: "center" }}>Lade Quiz…</div>;
  }

  if (finished) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 34, marginBottom: 10 }}>🎉 Quiz abgeschlossen!</h1>

        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: "#136f39",
            marginBottom: 20,
          }}
        >
          {score}
        </div>

        <button
          onClick={() => router.push("/quiz-app/leaderboard")}
          style={{
            padding: 14,
            width: "100%",
            background: "#136f39",
            borderRadius: 12,
            marginBottom: 12,
            color: "#fff",
            fontSize: 18,
            border: 0,
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
            border: 0,
          }}
        >
          🔄 Neues Quiz starten
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{ width: `${(timer / 30) * 100}%` }}
        />
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Frage {index + 1}/{questions.length}
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: timer <= 5 ? "red" : "#136f39"
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
              className="answer-btn fade-in"
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
                cursor: locked ? "default" : "pointer"
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
