// pages/quiz/run.js

import RequireAccess from "../../components/RequireAccess";
import Seo from "../../components/Seo";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { filterQuestions } from "../../data/questions-full";

export default function QuizRun() {
  const router = useRouter();

  const country = (router.query.country || "DE").toString().toUpperCase();
  const topic = (router.query.topic || "Alle").toString();

  // ⭐ Fragen EINMAL generieren
  const [questions] = useState(() =>
    filterQuestions({ country, topic, count: 10 })
  );

  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  // ⭐ Stabiler Timer
  useEffect(() => {
    if (finished) return;
    if (locked) return;

    if (timer <= 0) {
      handleTimeout();
      return;
    }

    const t = setTimeout(() => {
      setTimer((x) => x - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [timer, locked, finished, index]);

  function handleTimeout() {
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1200);
  }

  // ⭐ Antwort auswählen
  function handleAnswer(ans, idx) {
    if (locked) return;

    setLocked(true);
    setSelected(idx);

    const correctIds = q.correct; // Beispiel: ['a']
    const isRight = correctIds.includes(ans.id);

    if (isRight) {
      setScore((s) => s + 100 + timer * 10);
    }

    setTimeout(() => nextQuestion(), 1000);
  }

  // ⭐ Nächste Frage
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

  // ⭐ Neu starten
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

  return (
    <>
      <Seo title="Quiz Spielmodus" />
      <RequireAccess />

      <main
        style={{
          maxWidth: 650,
          margin: "40px auto",
          padding: 24,
          background: "rgba(255,255,255,0.55)",
          borderRadius: 14,
          border: "1px solid rgba(42,35,25,0.14)",
        }}
      >
        {/* FERTIG */}
        {finished && (
          <div style={{ textAlign: "center" }}>
            <h1>🎉 Quiz beendet!</h1>
            <p style={{ fontSize: 20 }}>Score:</p>
            <p style={{ fontSize: 48, color: "#136f39" }}>{score}</p>
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
              }}
            >
              🔄 Nochmal spielen
            </button>
          </div>
        )}

        {/* SPIEL */}
        {!finished && (
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
              <span>Frage {index + 1} / {questions.length}</span>
              <span style={{ color: timer <= 5 ? "red" : "#136f39" }}>
                ⏱ {timer}s
              </span>
            </div>

            <div style={{ marginBottom: 16, fontSize: 16 }}>
              Score: {score}
            </div>

            {/* ⭐ FRAGE */}
            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.45)",
                borderRadius: 12,
                border: "1px solid rgba(42,35,25,0.14)",
                marginBottom: 20,
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

              {/* ⭐ ANTWORTEN */}
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
                        borderRadius: 10,
                        marginBottom: 10,
                        border: "1px solid rgba(42,35,25,0.14)",
                        cursor: locked ? "default" : "pointer",
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

// SSR Login Check
export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import("../../lib/auth-check");

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return { props: {} };
}
