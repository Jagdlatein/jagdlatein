"use client";

import { getPracticeScenarios } from "../../lib/practice-scenarios";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – Keiler richtig erkennen (true = Keiler, false = kein Keiler)
// ------------------------------------------------------------
const scenarios = getPracticeScenarios("keiler");

// ------------------------------------------------------------
// SOFORT-RÜCKMELDUNG
// ------------------------------------------------------------
function InstantFeedback({ isCorrect , scenario }) {
  return (
    <div role="status" aria-live="polite"
      style={{
        marginTop: 20,
        padding: "14px 20px",
        borderRadius: 12,
        fontSize: 18,
        fontWeight: "600",
        color: "white",
        background: isCorrect ? "#2e7d32" : "#c62828",
        textAlign: "center",
      }}
    >
      {isCorrect ? "Richtig erkannt!" : "Falsch erkannt!"}
    {scenario?.explanation && <p style={{ fontWeight: 400, lineHeight: 1.6, marginBottom: 0 }}>{scenario.explanation}</p>}
      {typeof scenario?.source === "string" && scenario.source.startsWith("https://") && <p><a href={scenario.source} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Quelle nachlesen (neuer Tab)</a></p>}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR
// ------------------------------------------------------------
export default function KeilerErkennung() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lockButtons, setLockButtons] = useState(false);

  const answerGuard = usePracticeAnswer(step, step >= scenarios.length);
  const current = scenarios[step];

  function answer(isCorrect) {
    if (!answerGuard.accept()) return;

    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) setScore(score + 1);

   answerGuard.schedule(() => {
  setFeedback(null);
  setLockButtons(false);
  setStep((prev) => prev + 1);
}, 10000);
}

  // ------------------------------------------------------------
  // ENDSEITE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Keiler-Erkennung – Ergebnis</h1>

        <ScoreBox score={score} max={scenarios.length} />

        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: passed ? "#e8f5e9" : "#ffebee",
            borderRadius: 12,
            borderLeft: passed ? "6px solid #2e7d32" : "6px solid #c62828",
            fontSize: 18,
          }}
        >
          {passed ? <b>Sehr gut! Du erkennst Keiler sicher 🎉</b> : <b>Weiter üben! Keilererkennung ist anspruchsvoll.</b>}
        </div>

        <div style={{ marginTop: 30, maxWidth: 420 }}>
          <NavigationButton text="Zur Jagdpraxis-Übersicht" onClick={() => (window.location.href = "/jagdpraxis")} />
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // SIMULATOR-ANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Keiler-Erkennung</h1>

    <p>Wissensübung: Prüfe die Aussage zur Frage. Länderbezug: {current.countryLabel}. Thema: {current.moduleTitle}.</p>
      <ScenarioCard
  title={current.title}
  text={current.text}
/>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton text="Aussage stimmt" disabled={lockButtons} onClick={() => answer(current.correct)} />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton text="Aussage stimmt nicht" disabled={lockButtons} onClick={() => answer(!current.correct)} />
        </div>
      </div>

      {feedback !== null && <InstantFeedback scenario={current} isCorrect={feedback} />}
    </main>
  );
}
