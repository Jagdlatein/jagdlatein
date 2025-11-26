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

  const [saved, setSaved] = useState(false);
  const [personalRank, setPersonalRank] = useState(null);
  const [monthlyRank, setMonthlyRank] = useState(null);

  // Fragen laden
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    }
    load();
  }, [country, topic]);

  const q = questions[index];

  // Timer
  useEffect(() => {
    if (!q || finished || locked) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  function handleTimeout() {
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1400);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;
    setLocked(true);
    setSelected(idx);

    const isCorrect = q.correct.includes(ans.id);
    if (isCorrect) setScore((s) => s + 100 + timer * 10);

    setTimeout(() => nextQuestion(), 900);
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }

    setIndex((i) => i + 1);
    setTimer(30);
    setSelected(null);
    setLocked(false);
  }

  // Score speichern
  useEffect(() => {
    if (!finished || saved) return;
    saveScore();
  }, [finished]);

  async function saveScore() {
    setSaved(true);
    const username = localStorage.getItem("jagd_username") || "Gastjäger";

    await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: username,
        username,
        points: score,
      }),
    });

    fetchRanks(username);
  }

  async function fetchRanks(username) {
    const all = await fetch("/api/quiz/leaderboard").then((r) => r.json());
    const list1 = all.data ?? [];
    const rank1 = list1.findIndex((x) => x.username === username);
    setPersonalRank(rank1 >= 0 ? rank1 + 1 : null);

    const mon = await fetch("/api/quiz/leaderboard-month").then((r) => r.json());
    const list2 = mon.data ?? [];
    const rank2 = list2.findIndex((x) => x.username === username);
    setMonthlyRank(rank2 >= 0 ? rank2 + 1 : null);
  }

  function restart() {
    router.push(`/quiz/run?country=${country}&topic=${topic}&rnd=${Math.random()}`);
  }

  return (
    <div
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      {/* Fertig-Screen */}
      {finished && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.4s" }}>
          <h1 style={{ fontSize: 36, marginBottom: 12 }}>🎉 Jagdquiz beendet!</h1>

          <p style={{ fontSize: 20, opacity: 0.8 }}>Dein Score</p>
          <div
            style={{
              fontSize: 60,
              color: "#136f39",
              fontWeight: 900,
              margin: "10px 0 20px",
            }}
          >
            {score}
          </div>

          {personalRank && (
            <p style={{ fontSize: 20 }}>
              🥇 Gesamt: Platz <b>{personalRank}</b>
            </p>
          )}

          {monthlyRank && (
            <p style={{ fontSize: 20 }}>
              📅 Monat: Platz <b>{monthlyRank}</b>
            </p>
          )}

          <button
            onClick={() => router.push("/quiz/leaderboard")}
            style={{
              width: "100%",
              background: "#136f39",
              color: "white",
              padding: "15px",
              borderRadius: 12,
              marginTop: 20,
              fontSize: 18,
              border: 0,
            }}
          >
            🏆 Rangliste ansehen
          </button>

          <button
            onClick={restart}
            style={{
              width: "100%",
              background: "#1f2b23",
              color: "white",
              padding: "15px",
              borderRadius: 12,
              marginTop: 14,
              fontSize: 18,
              border: 0,
            }}
          >
            🔄 Nochmal spielen
          </button>
        </div>
      )}

      {/* Quiz-Screen */}
      {!finished && q && (
        <>
          {/* Fortschritt */}
          <div
            style={{
              height: 6,
              background: "#ddd",
              borderRadius: 10,
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((index + 1) / questions.length) * 100}%`,
                background: "#136f39",
                transition: "0.3s width",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span>
              Frage {index + 1}/{questions.length}
            </span>
            <span style={{ color: timer <= 5 ? "red" : "#136f39" }}>
              ⏱ {timer}s
            </span>
          </div>

          <div
            style={{
              fontSize: 16,
              marginBottom: 20,
              opacity: 0.7,
            }}
          >
            🦌 Punkte: {score}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              borderRadius: 16,
              padding: 18,
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              marginBottom: 20,
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 16,
                lineHeight: 1.4,
              }}
            >
              {q.q}
            </div>

            {q.answers.map((ans, i) => {
              const isCorrect = q.correct.includes(ans.id);
              const isSelected = selected === i;

              return (
                <div
                  key={i}
                  onClick={() => handleAnswer(ans, i)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background:
                      isSelected && isCorrect
                        ? "#c6f6d5"
                        : isSelected && !isCorrect
                        ? "#fed7d7"
                        : "#fff",
                    border: "1px solid rgba(0,0,0,0.1)",
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
        </>
      )}
    </div>
  );
}
