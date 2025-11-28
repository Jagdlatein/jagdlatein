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

  const [askName, setAskName] = useState(true);
  const [username, setUsername] = useState("");
  const [nameInput, setNameInput] = useState("");

  // -------------------------
  // Username Erkennung
  // -------------------------
  useEffect(() => {
    const stored = localStorage.getItem("jagd_username");
    if (stored) {
      setUsername(stored);
      setAskName(false);
    }
  }, []);

  useEffect(() => {
    if (!askName) loadQuestions();
  }, [askName, country, topic]);

  // -------------------------
  // Benutzer registrieren
  // -------------------------
  async function registerUser() {
    const clean = nameInput.trim();
    if (!clean) return;

    setUsername(clean);
    localStorage.setItem("jagd_username", clean);

    await fetch("/api/quiz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean, country }),
    });

    setAskName(false);
  }

  // -------------------------
  // Fragen laden
  // -------------------------
  async function loadQuestions() {
    const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
    const data = await res.json();
    setQuestions(data.questions || []);
  }

  const q = questions[index];

  // -------------------------
  // Timer
  // -------------------------
  useEffect(() => {
    if (!q || finished || locked || askName) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished, askName]);

  // -------------------------
  // Quiz Logik
  // -------------------------
  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function handleTimeout() {
    setEffect("flash-wrong");
    vibrate(50);
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1000);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;
    setLocked(true);
    setSelected(idx);

    const isCorrect = q.correct.includes(ans.id);

    if (isCorrect) {
      setEffect("flash-correct");
      vibrate(40);
      setScore((s) => s + 100 + timer * 10);
    } else {
      setEffect("flash-wrong");
      vibrate(80);
    }

    setTimeout(() => nextQuestion(), 900);
  }

  // -------------------------
  // Nächste Frage
  // -------------------------
  function nextQuestion() {
    setEffect("");

    if (questions.length > 0 && index + 1 >= questions.length) {
      setFinished(true);
      saveScore();
      return;
    }

    setIndex((i) => i + 1);
    setTimer(30);
    setSelected(null);
    setLocked(false);
  }

  // -------------------------
  // Score speichern
  // -------------------------
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

  // -------------------------
  // Username Modal
  // -------------------------
  if (askName) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backdropFilter: "blur(5px)",
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.85)",
            padding: 30,
            borderRadius: 20,
            maxWidth: 350,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: 10, fontSize: 26 }}>
            🦌 Willkommen im Jagdquiz
          </h2>

          <p style={{ marginBottom: 20, opacity: 0.8 }}>
            Bitte Namen eingeben für die Rangliste.
          </p>

          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Dein Name"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.2)",
              fontSize: 18,
              marginBottom: 20,
            }}
          />

          <button
            onClick={registerUser}
            style={{
              width: "100%",
              padding: "14px 20px",
              fontSize: 18,
              background: "#136f39",
              color: "white",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
            }}
          >
            ▶ Quiz starten
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // Quiz fertig
  // -------------------------
  if (finished) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <h1 style={{ fontSize: 34, marginBottom: 10 }}>
          🎉 Quiz abgeschlossen!
        </h1>

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
          🏆 Rangliste ansehen
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

  // -------------------------
  // Ladebildschirm
  // -------------------------
  if (!q) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade Quiz…</h2>
      </div>
    );
  }

  // -------------------------
  // Quiz läuft
  // -------------------------
  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{
            width: `${(timer / 30) * 100}%`,
          }}
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
