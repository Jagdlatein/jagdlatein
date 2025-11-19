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

  // ⭐ Fragen EINMAL generieren – verhindert Timer-Bugs
  const [questions] = useState(() =>
    filterQuestions({ country, topic, count: 10 })
  );

  // ---- QUIZ STATE ----
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  // ⭐ TIMER FIX (perfekt stabil)
  useEffect(() => {
    if (finished) return;
    if (locked) return;

    if (timer <= 0) {
      handleTimeout();
      return;
    }

    const countdown = setTimeout(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearTimeout(countdown);
  }, [timer, locked, finished, index]);

  // ---- TIMEOUT ----
  function handleTimeout() {
    setLocked(true);
    setSelected("timeout");

    setTimeout(() => nextQuestion(), 1200);
  }

  // ---- ANSWER CLICK ----
  function handleAnswer(a, i) {
    if (locked) return;

    setLocked(true);
    setSelected(i);

    if (a.correct) {
      const bonus = timer * 10;
      setScore((s) => s + 100 + bonus);
    }

    setTimeout(() => nextQuestion(), 1000);
  }

  // ---- NEXT ----
  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }

    setIndex((x) => x + 1);
    setTimer(30);
    setSelected(null);
    setLocked(false);
  }

  // ---- RESTART ----
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

      {/* MOBILE UI */}
      <style>{`
        @media (max-width:780px) {
          .quiz-wrapper { padding:14px !important; }
          .quiz-card { padding:14px !important; }
          .quiz-answer { font-size:16px !important; padding:10px !important; }
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
        {/* ---- SCORE + END ---- */}
        {finished && (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>🎉 Quiz beendet!</h1>

            <p style={{ fontSize: 20 }}>Dein Score:</p>

            <p
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "#136f39",
                marginBottom: 20,
              }}
            >
              {score}
            </p>

            <button
              onClick={restart}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "#1f2b23",
                color: "#fff",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              🔄 Nochmal spielen
            </button>
          </div>
        )}

        {/* ---- GAME VIEW ---- */}
        {!finished && (
          <>
            {/* Timer + Progress */}
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

            <div style={{ fontSize: 16, marginBottom: 16 }}>
              Score: {score}
            </div>

            {/* ⭐ FRAGE OBEN, ANTWORTEN UNTEN */}
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
              {/* FRAGE */}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                {q.question}
              </div>

              {/* ANTWORTEN */}
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
                        marginBottom: 10,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(42,35,25,0.14)",
                        background:
                          isSelected && isCorrect
                            ? "#c6f6d5"
                            : isSelected && !isCorrect
                            ? "#fed7d7"
                            : "#fff",
                        cursor: locked ? "default" : "pointer",
                        lineHeight: 1.4,
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

// ---- SSR Logincheck ----
export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import("../../lib/auth-check");

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return { props: {} };
}
