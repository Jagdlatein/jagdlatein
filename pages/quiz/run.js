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

  const questions = filterQuestions({ country, topic, count: 10 });

  // ---- Quiz State ----
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(10);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  // ---- Countdown ----
  useEffect(() => {
    if (finished || locked) return;
    if (timer <= 0) {
      handleTimeUp();
      return;
    }
    const int = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(int);
  }, [timer, locked, finished]);

  function handleTimeUp() {
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1200);
  }

  // ---- Antwort klicken ----
  function handleAnswer(a, idx) {
    if (locked) return;

    setLocked(true);
    setSelected(idx);

    if (a.correct) {
      // BONUS: je schneller, desto mehr Punkte
      const bonus = timer * 10;
      setScore((s) => s + 100 + bonus);
    }

    setTimeout(() => nextQuestion(), 1000);
  }

  // ---- Weiter ----
  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setTimer(10);
    setSelected(null);
    setLocked(false);
  }

  // ---- Erneut spielen ----
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

      {/* MOBILE VERBESSERUNG */}
      <style>{`
        @media (max-width:780px) {
          .quiz-wrapper {
            max-width:100%;
            margin:10px auto !important;
            padding:14px !important;
          }
          .quiz-card {
            padding:14px !important;
          }
          .quiz-answer {
            padding:10px !important;
            font-size:16px !important;
          }
        }
      `}</style>

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
        {/* GAME FINISHED */}
        {finished && (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>🎉 Quiz fertig!</h1>
            <p style={{ fontSize: 20, marginBottom: 8 }}>
              Dein Score:
            </p>
            <p style={{ fontSize: 48, fontWeight: 900, color: "#136f39" }}>
              {score}
            </p>

            <button
              onClick={restart}
              style={{
                marginTop: 25,
                padding: "12px 20px",
                borderRadius: 12,
                fontSize: 18,
                background: "#1f2b23",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              🔄 Nochmal spielen
            </button>
          </div>
        )}

        {/* GAME VIEW */}
        {!finished && (
          <>
            {/* Fortschritt + Timer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <span>Frage {index + 1} / {questions.length}</span>
              <span style={{ color: timer <= 3 ? "red" : "#136f39" }}>
                ⏱ {timer}s
              </span>
            </div>

            {/* SCORE */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#444",
                marginBottom: 16,
              }}
            >
              Score: {score}
            </div>

            {/* Frage */}
            <div
              className="quiz-card"
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.35)",
                borderRadius: 12,
                border: "1px solid rgba(42,35,25,0.14)",
                marginBottom: 20,
              }}
            >
              <h2 style={{ marginBottom: 12 }}>{q.question}</h2>

              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {q.answers.map((a, i) => {
                  const isCorrect = a.correct;
                  const isSelected = selected === i;

                  return (
                    <li
                      key={i}
                      className="quiz-answer"
                      onClick={() => handleAnswer(a, i)}
                      style={{
                        marginBottom: 8,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(42,35,25,0.14)",
                        background: isSelected
                          ? isCorrect
                            ? "#c6f6d5"
                            : "#fed7d7"
                          : "#fff8",
                        cursor: locked ? "default" : "pointer",
                      }}
                    >
                      {a.text}
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

// SSR – Login prüfen via Cookie
export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import("../../lib/auth-check");

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return { props: {} };
}
