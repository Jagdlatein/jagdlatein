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

  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    if (!u) {
      router.replace("/quiz-app/username");
      return;
    }
    setUsername(u);
    loadQuestions();
  }, []);

  async function loadQuestions() {
    const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
    const data = await res.json();
    setQuestions(data.questions || []);
  }

  const q = questions[index];

  useEffect(() => {
    if (!q || finished || locked) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function handleTimeout() {
    setEffect("flash-wrong");
    vibrate(40);
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 800);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;
    setLocked(true);
    setSelected(idx);

    const isCorrect = q.correct.includes(ans.id);

    if (isCorrect) {
      setEffect("flash-correct");
      vibrate(30);
      setScore(s => s + 100 + timer * 10);
    } else {
      setEffect("flash-wrong");
      vibrate(60);
    }

    setTimeout(() => nextQuestion(), 800);
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
    setSelected(null);
    setLocked(false);
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

  if (!q && !finished) {
    return <div style={{ padding: 40, textAlign: "center" }}>Lade Quiz…</div>;
  }

  if (finished) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>🎉 Quiz abgeschlossen!</h1>
        <div style={{ fontSize: 60, fontWeight: 900, color: "#136f39" }}>
          {score}
        </div>
        <button
          onClick={() => router.push("/quiz-app/leaderboard")}
          style={{
            width: "100%",
            padding: 16,
            background: "#136f39",
            color: "#fff",
            borderRadius: 12,
            marginBottom: 12,
            fontSize: 18
          }}
        >
          🏆 Wochen-Rangliste ansehen
        </button>

        <button
          onClick={() =>
            router.push(`/quiz-app/run?country=${country}&topic=${topic}`)
          }
          style={{
            width: "100%",
            padding: 16,
            background: "#1f2b23",
            color: "#fff",
            borderRadius: 12,
            fontSize: 18
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
          style={{
            width: `${(timer / 30) * 100}%`
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>Frage {index + 1}/{questions.length}</div>
        <div style={{ fontWeight: 900 }}>{timer}s</div>
      </div>

      <div style={{ marginTop: 12 }}>Score: {score}</div>

      <div style={{ padding: 18, marginTop: 20 }}>
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
                marginBottom: 12,
                background:
                  isSelected && isCorrect
                    ? "#c6f6d5"
                    : isSelected && !isCorrect
                    ? "#fed7d7"
                    : "#fff",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
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
