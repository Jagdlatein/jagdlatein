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

  // --------------------------------
  // LOAD USER + REGISTER + QUESTIONS
  // --------------------------------
  useEffect(() => {
    async function init() {
      const u = localStorage.getItem("jagd_username");
      if (!u) {
        router.replace("/quiz-app/username");
        return;
      }

      setUsername(u);

      // User registrieren
      await fetch("/api/quiz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, country })
      });

      // Fragen laden
      const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    }

    init();
  }, [router, country, topic]);

  const q = questions[index];

  // -------------------------
  // Timer
  // -------------------------
  useEffect(() => {
    if (!q || locked || finished) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  function handleTimeout() {
    setLocked(true);
    setEffect("flash-wrong");
    setSelected("timeout");
    setTimeout(() => nextQuestion(), 900);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;

    const isCorrect = q.correct.includes(ans.id);
    setLocked(true);
    setSelected(idx);

    if (isCorrect) {
      setEffect("flash-correct");
      setScore(s => s + 100 + timer * 10);
    } else {
      setEffect("flash-wrong");
    }

    setTimeout(() => nextQuestion(), 900);
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
    setLocked(false);
    setSelected(null);
  }

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
  // Loading
  // -------------------------
  if (!q && !finished) {
    return (
      <div className="text-center p-10">
        <h2>Lade Quiz…</h2>
      </div>
    );
  }

  // -------------------------
  // Fertig-Screen
  // -------------------------
  if (finished) {
    return (
      <div className="text-center p-10">
        <h1 className="text-[34px] mb-3">🎉 Quiz abgeschlossen!</h1>

        <div className="text-[60px] font-extrabold text-[#d4af37] mb-5 score-pop">
          {score}
        </div>

        <button
          onClick={() => router.push("/quiz-app/leaderboard")}
          className="w-full p-4 bg-[#d4af37] text-white rounded-xl mb-4 text-[18px]"
        >
          🏆 Wochen-Rangliste ansehen
        </button>

        <button
          onClick={() =>
            router.push(`/quiz-app/run?country=${country}&topic=${topic}`)
          }
          className="w-full p-4 bg-[#1f2b23] text-white rounded-xl text-[18px]"
        >
          🔄 Neues Quiz starten
        </button>
      </div>
    );
  }

  // -------------------------
  // QUIZ
  // -------------------------
  return (
    <div className="max-w-[650px] mx-auto p-5">
      {/* GOLD TIMER BAR */}
      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{ width: `${(timer / 30) * 100}%` }}
        />
      </div>

      {/* HEADER */}
      <div className="fade-in flex justify-between">
        <div className="text-[20px] font-bold">
          Frage {index + 1}/{questions.length}
        </div>
        <div
          className="text-[22px] font-extrabold"
          style={{ color: timer <= 5 ? "red" : "#d4af37" }}
        >
          ⏱ {timer}s
        </div>
      </div>

      <div className="text-[18px] mt-3 opacity-70">
        Score: {score}
      </div>

      {/* GOLD QUESTION CARD */}
      <div className={`quiz-card fade-in ${effect}`}>
        <div className="quiz-question">
          {q.q}
        </div>

        {/* ANSWERS */}
        {q.answers.map((ans, i) => {
          const isSelected = selected === i;
          const isCorrect = q.correct.includes(ans.id);

          return (
            <div
              key={i}
              onClick={() => handleAnswer(ans, i)}
              className={`quiz-answer fade-in ${
                isSelected
                  ? isCorrect
                    ? "quiz-answer-correct"
                    : "quiz-answer-wrong"
                  : ""
              }`}
              style={{ cursor: locked ? "default" : "pointer" }}
            >
              {ans.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
