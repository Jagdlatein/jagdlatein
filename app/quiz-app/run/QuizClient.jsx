"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function QuizClient() {
  const router = useRouter();
  const params = useSearchParams();

  const country = (params.get("country") || localStorage.getItem("jagd_country") || "DE").toUpperCase();
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

  // -----------------------------------------------
  // USERNAME & COUNTRY LADEN
  // -----------------------------------------------
  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    const c = localStorage.getItem("jagd_country");

    if (!u) {
      router.replace("/quiz-app/username");
      return;
    }

    setUsername(u);

    if (!c) localStorage.setItem("jagd_country", "DE");
  }, [router]);

  // -----------------------------------------------
  // FRAGEN LADEN
  // -----------------------------------------------
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    }
    load();
  }, [country, topic]);

  const q = questions[index];

  // -----------------------------------------------
  // TIMER
  // -----------------------------------------------
  useEffect(() => {
    if (!q || finished || locked) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  // -----------------------------------------------
  // Vibration Helper
  // -----------------------------------------------
  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  // -----------------------------------------------
  // Timeout
  // -----------------------------------------------
  function handleTimeout() {
    setEffect("flash-wrong");
    vibrate(60);
    setLocked(true);
    setSelected("timeout");

    setTimeout(() => nextQuestion(), 1000);
  }

  // -----------------------------------------------
  // Antwortcheck
  // -----------------------------------------------
  function handleAnswer(ans, idx) {
    if (locked) return;

    setLocked(true);
    setSelected(idx);

    const isCorrect = q.correct.includes(ans.id);

    if (isCorrect) {
      setEffect("flash-correct");
      vibrate(40);
      setScore((s) => s + 100 + timer * 15);
    } else {
      setEffect("flash-wrong");
      vibrate(80);
    }

    setTimeout(() => nextQuestion(), 900);
  }

  // -----------------------------------------------
  // Nächste Frage
  // -----------------------------------------------
  function nextQuestion() {
    setEffect("");

    if (index + 1 >= questions.length) {
      setFinished(true);
      saveScore();
      return;
    }

    setIndex((i) => i + 1);
    setTimer(30);
    setSelected(null);
    setLocked(false);
  }

  // -----------------------------------------------
  // Score speichern (Supabase)
  // -----------------------------------------------
  async function saveScore() {
    await fetch("/api/quiz/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        points: score
      })
    });
  }

  // -----------------------------------------------
  // Ladebildschirm
  // -----------------------------------------------
  if (!q && !finished) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade Quiz…</h2>
      </div>
    );
  }
  // -----------------------------------------------
  // QUIZ IST FERTIG
  // -----------------------------------------------
  if (finished) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10 }}>
          🎉 Quiz abgeschlossen!
        </h1>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#136f39",
            marginBottom: 25,
          }}
        >
          {score}
        </div>

        <button
          onClick={() => router.push("/quiz-app/leaderboard")}
          style={{
            padding: 16,
            width: "100%",
            background: "#136f39",
            borderRadius: 12,
            marginBottom: 12,
            color: "#fff",
            fontSize: 20,
            border: 0,
          }}
        >
          🏆 Wochenrangliste ansehen
        </button>

        <button
          onClick={() =>
            router.push(`/quiz-app/run?country=${country}&topic=${topic}`)
          }
          style={{
            padding: 16,
            width: "100%",
            background: "#1f2b23",
            borderRadius: 12,
            color: "#fff",
            fontSize: 20,
            border: 0,
          }}
        >
          🔄 Neues Quiz starten
        </button>
      </div>
    );
  }

  // -----------------------------------------------
  // QUIZ LÄUFT
  // -----------------------------------------------
  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      {/* TIMER-BALKEN */}
      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{
            width: `${(timer / 30) * 100}%`,
            transition: "width 0.2s linear",
          }}
        />
      </div>

      {/* Header: Frage + Timer */}
      <div
        className="fade-in"
        style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Frage {index + 1}/{questions.length}
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: timer <= 5 ? "red" : "#136f39",
          }}
        >
          ⏱ {timer}s
        </div>
      </div>

      {/* Score Anzeige */}
      <div style={{ fontSize: 20, marginTop: 8, opacity: 0.7 }}>
        Score: {score}
      </div>

      {/* Frage + Antworten */}
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
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          {q.q}
        </div>

        {q.answers.map((ans, i) => {
          const isSelected = selected === i;
          const isCorrect = q.correct.includes(ans.id);

          return (
            <div
              key={i}
              onClick={() => handleAnswer(ans, i)}
              className="answer-btn fade-in"
              style={{
                padding: "16px 18px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                background:
                  isSelected && isCorrect
                    ? "#c6f6d5" // Grün
                    : isSelected && !isCorrect
                    ? "#fed7d7" // Rot
                    : "#fff",
                marginBottom: 12,
                fontSize: 18,
                cursor: locked ? "default" : "pointer",
                transition: "0.15s",
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
