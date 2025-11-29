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

  useEffect(() => {
    async function init() {
      const u = localStorage.getItem("jagd_username");
      if (!u) {
        router.replace("/quiz-app/username");
        return;
      }

      setUsername(u);

      await fetch("/api/quiz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, country })
      });

      const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    }

    init();
  }, [router, country, topic]);

  const q = questions[index];

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
    setTimeout(() => nextQuestion(), 800);
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

    setTimeout(() => nextQuestion(), 800);
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
      body: JSON.stringify({ username, points: score })
    });
  }

  if (!q && !finished) {
    return <div className="text-center p-10">Lade Quiz…</div>;
  }

  if (finished) {
    return (
      <div className="text-center p-10">
        <h1 className="text-4xl font-bold mb-4">🎉 Quiz abgeschlossen!</h1>

        <div className="text-6xl font-extrabold text-[#d4af37] mb-6">
          {score}
        </div>

        <button
          onClick={() => router.push("/quiz-app/leaderboard")}
          className="w-full p-4 bg-[#d4af37] text-white text-xl rounded-xl mb-4"
        >
          🏆 Wochen-Rangliste
        </button>

        <button
          onClick={() => router.push(`/quiz-app/run?country=${country}&topic=${topic}`)}
          className="w-full p-4 bg-[#1f2b23] text-white text-xl rounded-xl"
        >
          🔄 Neues Quiz starten
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="progressbar">
        <div className="progressbar-fill" style={{ width: `${(timer / 30) * 100}%` }} />
      </div>

      <div className="fade-in flex justify-between mb-2">
        <div className="text-xl font-bold">
          Frage {index + 1}/{questions.length}
        </div>

        <div
          className="text-2xl font-extrabold"
          style={{ color: timer <= 5 ? "red" : "#d4af37" }}
        >
          ⏱ {timer}s
        </div>
      </div>

      <div className="opacity-70 mb-4 text-lg">Score: {score}</div>

      <div className={`quiz-card fade-in ${effect}`}>
        <div className="quiz-question">{q.q}</div>

        {q.answers.map((ans, i) => {
          const isSelected = selected === i;
          const isCorrect = q.correct.includes(ans.id);

          return (
            <div
              key={i}
              className={`quiz-answer ${
                isSelected ? (isCorrect ? "quiz-answer-correct" : "quiz-answer-wrong") : ""
              }`}
              onClick={() => handleAnswer(ans, i)}
            >
              {ans.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
