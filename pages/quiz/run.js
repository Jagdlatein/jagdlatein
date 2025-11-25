// pages/quiz/run.js

import Seo from "../../components/Seo";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { filterQuestions } from "../../data/questions-full";

// NEU: Persönlicher Rangzustand
export default function QuizRun() {
  const router = useRouter();

  const country = (router.query.country || "DE").toString().toUpperCase();
  const topic = (router.query.topic || "Alle").toString();

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  // NEU: persönlicher Rang
  const [personalRank, setPersonalRank] = useState(null);
  const [monthlyRank, setMonthlyRank] = useState(null);

  useEffect(() => {
    const qset = filterQuestions({ country, topic, count: 10 });

    setQuestions(qset);
    setIndex(0);
    setTimer(30);
    setScore(0);
    setSelected(null);
    setLocked(false);
    setFinished(false);
    setSaved(false);
    setPersonalRank(null);
    setMonthlyRank(null);
  }, [router.query.rnd]);

  const q = questions[index];

  // Timer
  useEffect(() => {
    if (!q) return;
    if (finished) return;
    if (locked) return;

    if (timer <= 0) {
      handleTimeout();
      return;
    }

    const t = setTimeout(() => setTimer((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, locked, finished, index, q]);

  function handleTimeout() {
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1200);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;

    setLocked(true);
    setSelected(idx);

    const isCorrect = q.correct.includes(ans.id);

    if (isCorrect) {
      setScore((s) => s + 100 + timer * 10);
    }

    setTimeout(() => nextQuestion(), 1000);
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

  function restart() {
    router.push({
      pathname: "/quiz/run",
      query: {
        country,
        topic,
        rnd: Math.random().toString(36).substring(2),
      },
    });
  }

  // 👉 Score speichern
  async function saveScoreToSupabase() {
    if (saved) return;
    setSaved(true);

    try {
      const username =
        localStorage.getItem("jagd_username") || "Gastjäger";

      const body = {
        userId: username,
        username,
        points: score,
      };

      await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Nach dem Speichern Rang abrufen
      fetchRanks(username);

    } catch (err) {
      console.error("Score speichern fehlgeschlagen:", err);
    }
  }

  // 👉 Persönlicher Rang abrufen
  async function fetchRanks(username) {
    try {
      // Gesamt-Rangliste laden
      const res1 = await fetch("/api/quiz/leaderboard");
      const data1 = await res1.json();
      const list1 = data1.data || [];
      const rank1 = list1.findIndex((x) => x.username === username);
      setPersonalRank(rank1 >= 0 ? rank1 + 1 : null);

      // Monats-Rangliste laden
      const res2 = await fetch("/api/quiz/leaderboard-month");
      const data2 = await res2.json();
      const list2 = data2.data || [];
      const rank2 = list2.findIndex((x) => x.username === username);
      setMonthlyRank(rank2 >= 0 ? rank2 + 1 : null);
    } catch (err) {
      console.error("Fehler beim Rang abrufen:", err);
    }
  }

  // Speichern sobald fertig
  useEffect(() => {
    if (finished) {
      saveScoreToSupabase();
    }
  }, [finished]);

  if (!q) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade Quiz…</h2>
      </main>
    );
  }

  return (
    <>
      <Seo title="Quiz Spielmodus" />

      <main
        className="quiz-wrapper"
        style={{
          maxWidth: 650,
          margin: "40px auto",
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(42,35,25,0.14)",
          borderRadius: 14,
          padding: 24,
        }}
      >
        {finished ? (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>🎉 Quiz beendet!</h1>

            <p style={{ fontSize: 20 }}>Dein Score:</p>

            <p
              style={{
                fontSize: 48,
                color: "#136f39",
                fontWeight: 900,
                marginBottom: 20,
              }}
            >
              {score}
            </p>

            {/* Persönlicher Platz - Gesamt */}
            {personalRank && (
              <p style={{ fontSize: 20, marginBottom: 10 }}>
                🥇 Dein Platz gesamt: <b>{personalRank}</b>
              </p>
            )}

            {/* Persönlicher Platz - Monat */}
            {monthlyRank && (
              <p style={{ fontSize: 20, marginBottom: 20 }}>
                📅 Dein Platz (dieser Monat): <b>{monthlyRank}</b>
              </p>
            )}

            {/* Rangliste ansehen */}
            <button
              onClick={() => router.push("/quiz/leaderboard")}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "#136f39",
                color: "white",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                marginBottom: 16,
                display: "block",
                width: "100%",
              }}
            >
              🏆 Rangliste ansehen
            </button>

            {/* Nochmal spielen */}
            <button
              onClick={restart}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "#1f2b23",
                color: "white",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                width: "100%",
              }}
            >
              🔄 Nochmal spielen
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              <span>
                Frage {index + 1} / {questions.length}
              </span>
              <span style={{ color: timer <= 5 ? "red" : "#136f39" }}>
                ⏱ {timer}s
              </span>
            </div>

            <div style={{ marginBottom: 16, fontSize: 16 }}>
              Score: {score}
            </div>

            <div
              className="quiz-card"
              style={{
                padding: 16,
                marginBottom: 20,
                background: "rgba(255,255,255,0.45)",
                borderRadius: 12,
                border: "1px solid rgba(42,35,25,0.14)",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                {q.q}
              </div>

              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {q.answers.map((ans, i) => {
                  const isCorrect = q.correct.includes(ans.id);
                  const isSelected = selected === i;

                  return (
                    <li
                      key={i}
                      onClick={() => handleAnswer(ans, i)}
                      style={{
                        padding: "12px 14px",
                        marginBottom: 10,
                        borderRadius: 10,
                        cursor: locked ? "default" : "pointer",
                        border: "1px solid rgba(42,35,25,0.14)",
                        background:
                          isSelected && isCorrect
                            ? "#c6f6d5"
                            : isSelected && !isCorrect
                            ? "#fed7d7"
                            : "#fff",
                      }}
                    >
                      {ans.text}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </main>
    </>
  );
}
