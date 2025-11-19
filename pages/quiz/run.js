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

  // ⭐ FIX: Fragen EINMAL erzeugen
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

  // ⭐ TIMER FIX
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

  function handleTimeout() {
    setLocked(true);
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 1200);
  }

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

      <main style={{ maxWidth: 650, margin: "40px auto", padding: 24 }}>
        {finished ? (
          <div style={{ textAlign: "center" }}>
            <h1>🎉 Quiz fertig!</h1>
            <p>Score: {score}</p>
            <button onClick={restart}>🔄 Nochmal spielen</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Frage {index + 1} / {questions.length}</span>
              <span>⏱ {timer}s</span>
            </div>

            <h2>{q.question}</h2>

            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {q.answers.map((a, i) => (
                <li
                  key={i}
                  onClick={() => handleAnswer(a, i)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    background:
                      selected === i
                        ? a.correct
                          ? "#c6f6d5"
                          : "#fed7d7"
                        : "#fff",
                    borderRadius: 8,
                    cursor: locked ? "default" : "pointer",
                  }}
                >
                  {a.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

// SSR – Premium-Check
export async function getServerSideProps({ req }) {
  const { hasPaidAccessFromCookies } = await import("../../lib/auth-check");

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return { props: {} };
}
