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

  // ⭐ Fragen müssen dynamisch nachgeladen werden (Restart FIX)
  const [questions, setQuestions] = useState([]);

  // ⭐ Quiz State
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  // ⭐ Lade Fragen und reset bei Start + Restart
  useEffect(() => {
    const qset = filterQuestions({ country, topic, count: 10 });

    setQuestions(qset);
    setIndex(0);
    setTimer(30);
    setScore(0);
    setSelected(null);
    setLocked(false);
    setFinished(false);
  }, [router.query.rnd]);

  const q = questions[index];

  // ⭐ Perfekt stabiler Timer
  useEffect(() => {
    if (!q) return; // Warten bis Fragen geladen sind
    if (finished) return;
    if (locked) return;

    if (timer <= 0) {
      handleTimeout();
      return;
    }

    const t = setTimeout(() => setTimer((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, locked, finished, index, q]);

  // ⭐ Timeout
  function handleTimeout() {
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1200);
  }

  // ⭐ Antwort
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

  // ⭐ Weiter
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

  // ⭐ Restart
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

  // ⭐ Warten bis Fragen generiert sind
  if (!q) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade Quiz…</h2>
      </main>
    );
  }

  // ⭐ MOBILE-Styles
  const mobileStyle = {
    padding: 14,
  };

  return (
    <>
      <Seo title="Quiz Spielmodus" />
      <RequireAccess />

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
        {/* ⭐ QUIZ FERTIG */}
        {finished && (
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

        {/* ⭐ QUIZ LAUFEND */}
        {!finished && (
          <>
            {/* Fortschritt & Timer */}
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

            {/* Score */}
            <div style={{ marginBottom: 16, fontSize: 16 }}>
              Score: {score}
            </div>

            {/* ⭐ FRAGE */}
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

export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import("../../lib/auth-check");

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return { props: {} };
}
