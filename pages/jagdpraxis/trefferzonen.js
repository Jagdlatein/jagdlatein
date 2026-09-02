

import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – Trefferzone tödlich erreichbar? true = ja, false = nein
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – Breit stehend – 60 m", text: "Kammer frei, Schulter frei, idealer Winkel.", correct: true },
  { id: 2, title: "Reh – Stark schräg von hinten – 80 m", text: "Keine ethisch vertretbare Trefferzone.", correct: false },
  { id: 3, title: "Keiler – Breit – 50 m – Schild stark ausgeprägt", text: "Kammer erreichbar, aber hoher Widerstand.", correct: true },

  { id: 4, title: "Rotwild – 140 m – Halbdeckung hinter Baum", text: "Trefferfläche teilweise verdeckt.", correct: false },
  { id: 5, title: "Überläufer – 45 m – Breit – leicht ziehend", text: "Kammer gut erreichbar.", correct: true },
  { id: 6, title: "Reh – 150 m – Breit", text: "Distanz zu weit → unethisch.", correct: false },
  { id: 7, title: "Fuchs – Sitzend – 35 m", text: "Kleine, aber klare Kammerfläche.", correct: true },
  { id: 8, title: "Keiler – Frontal – 30 m", text: "Stark gefährlicher Winkel, keine Kammer erreichbar.", correct: false },

  { id: 9, title: "Rotwild – Breit – 90 m – ruhige Lage", text: "Saubere Trefferzone gut sichtbar.", correct: true },
  { id: 10, title: "Reh – Spitz von vorn – 40 m", text: "Nur Weichbereich → kein Schuss.", correct: false },
  { id: 11, title: "Überläufer – Schräg stehend – 55 m", text: "Kammer erreichbar, aber Seitenwinkel beachten.", correct: true },
  { id: 12, title: "Fuchs – Schnell ziehend – 75 m", text: "Zu klein + zu schnell = Risiko.", correct: false },

  { id: 13, title: "Rehbock – Breit – 25 m", text: "Perfekte Lage, kurze Distanz.", correct: true },
  { id: 14, title: "Sau – Hinter dünnem Gestrüpp – 60 m", text: "Trefferzone unsichtbar.", correct: false },
  { id: 15, title: "Rotwild – Schräg stehend – 110 m", text: "Kammer erreichbar, aber anspruchsvoll.", correct: true },

  { id: 16, title: "Reh – Rückenlinie nur sichtbar – hohes Gras", text: "Keine Trefferzone sichtbar.", correct: false },
  { id: 17, title: "Fuchs – Breit – 40 m – ruhiges Bild", text: "Trefferzone klar.", correct: true },
  { id: 18, title: "Keiler – Spitz von hinten – 80 m", text: "Keine ethisch vertretbare Kammer.", correct: false },
  { id: 19, title: "Überläufer – Breit – 30 m", text: "Sehr gute Trefferzone.", correct: true },
  { id: 20, title: "Rehbock – Stark ziehend – 70 m", text: "Bewegungsunschärfe → kein sicherer Treffer.", correct: false },

  { id: 21, title: "Rotwild – Breit – 55 m – leichter Hang", text: "Trefferzone stabil erreichbar.", correct: true },
  { id: 22, title: "Sau – Kopf sichtbar, Körper im Bewuchs", text: "Keine Kammer sichtbar → kein Schuss.", correct: false },
  { id: 23, title: "Reh – Breit – 45 m", text: "Ideale Trefferfläche.", correct: true },
  { id: 24, title: "Fuchs – Schräg ziehend – 95 m", text: "Kammer nicht präzise zu treffen.", correct: false },
  { id: 25, title: "Überläufer – Halbprofil – 65 m – ruhiges Wild", text: "Kammer gut erreichbar.", correct: true },
];

// ------------------------------------------------------------
// FEEDBACK
// ------------------------------------------------------------
function InstantFeedback({ isCorrect }) {
  return (
    <div
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
      {isCorrect ? "Richtig!" : "Falsch!"}
    </div>
  );
}

// ------------------------------------------------------------
// TREFFERZONEN-SIMULATOR
// ------------------------------------------------------------
export default function Trefferzonen() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lockButtons, setLockButtons] = useState(false);

  const current = scenarios[step];

  function answer(isCorrect) {
    if (lockButtons) return;

    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) setScore(score + 1);

setTimeout(() => {
  setFeedback(null);
  setLockButtons(false);
  setStep((prev) => prev + 1);
}, isCorrect ? 3500 : 1200);
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
        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Trefferzonen – Ergebnis</h1>

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
          {passed ? (
            <b>Sehr gut! Du beurteilst Trefferzonen sicher 🎉</b>
          ) : (
            <b>Weiter üben – Trefferzonen müssen sitzen!</b>
          )}
        </div>

        <div style={{ marginTop: 30, maxWidth: 420 }}>
          <NavigationButton
            text="Zur Jagdpraxis-Übersicht"
            onClick={() => (window.location.href = "/jagdpraxis")}
          />
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
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Trefferzonen-Trainer</h1>

      <ScenarioCard
  title={current.title}
  text={feedback === true ? current.text : null}
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
          <ActionButton
            text="Trefferzone erreichbar"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Keine sichere Trefferzone"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
