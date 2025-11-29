"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [effect, setEffectState] = useState("");

  const [username, setUsername] = useState("");

  // Username laden
  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    if (!u) {
      router.push("/quiz-app/username");
      return;
    }
    setUsername(u);
  }, [router]);

  // User registrieren falls nicht vorhanden
  useEffect(() => {
    if (!username) return;

    fetch("/api/quiz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, country }),
    });
  }, [username, country]);

  // Fragen laden
  useEffect(() => {
    if (!username) return;

    async function load() {
      const res = await fetch(
        `/api/questions?country=${country}&topic=${topic}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setQuestions(data.questions || []);
    }

    load();
  }, [username, country, topic]);

  const q = questions[index];

  // Timer
  useEffect(() => {
    if (!q || locked || finished) return;
    if (timer <= 0) return handleTimeout();

    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, q, locked, finished]);

  function handleTimeout() {
    setLocked(true);
    setEffectState("flash-wrong");
    setSelected("timeout");
    setTimeout(nextQuestion, 900);
  }

  function handleAnswer(ans, idx) {
    if (locked) return;

    const isCorrect = q.correct.includes(ans.id);
    setLocked(true);
    setSelected(idx);

    if (isCorrect) {
      setEffectState("flash-correct");
      setScore(s => s + 100 + timer * 10);
    } else {
      setEffectState("flash-wrong");
    }

    setTimeout(nextQuestion, 900);
  }

  function nextQuestion() {
    setEffectState("");

    if (index + 1 >= questions.length) {
      setFinished(true);
      return; // ❗ KEIN saveScore() hier!
    }

    setIndex(i => i + 1);
    setTimer(30);
    setLocked(false);
    setSelected(null);
  }

  // Variante B → Score speichern NACH React-Update
  useEffect(() => {
    if (finished) {
      saveScore();
    }
  }, [finished]);

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

  if (!q && !finished) {
    return (
