"use client";

import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – Keiler richtig erkennen (true = Keiler, false = kein Keiler)
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Stück steht breit – Wamme sichtbar?", text: "Deutlich ausgeprägte Wamme, kräftiger Trägerbau.", correct: true },
  { id: 2, title: "Schwarzwild – schlanker Körper – lange Schnauze", text: "Typisch für Bache.", correct: false },
  { id: 3, title: "Starkes Haupt – Breite Stirn – Pinsel erkennbar", text: "Mehrere Keilermerkmale.", correct: true },

  { id: 4, title: "Schwarzwild 40 kg – hoher Rücken – kurze Läufe", text: "Jungbache oder Überläuferbache.", correct: false },
  { id: 5, title: "Stück mit starkem Schild – massiver Vorderkörper", text: "Das spricht klar für Keiler.", correct: true },
  { id: 6, title: "Schwarzwild – sichtbar gespannter Strich", text: "Klassisches Merkmal einer Bache.", correct: false },
  { id: 7, title: "Starkes Gebrumm – drohendes Verhalten – breiter Kopf", text: "Keiler in Aggressionsphase.", correct: true },
  { id: 8, title: "Schwarzwild – mit Frischlingen", text: "Immer Bache.", correct: false },
  { id: 9, title: "Einzelgänger – kräftige Schultern – steifer Gang", text: "Typisches Keilerverhalten.", correct: true },
  { id: 10, title: "Sau zieht mit weiterer Bache", text: "Sozialverband → keine Keiler.", correct: false },

  { id: 11, title: "Stück in Rauschzeit – verfolgt Bache", text: "Meist ein Keiler.", correct: true },
  { id: 12, title: "Langgezogener Körper – kaum Nackenmuskulatur", text: "Sicher kein Keiler.", correct: false },
  { id: 13, title: "Harter, kantiger Kopf – wenig feminin", text: "Merkmal Keiler.", correct: true },
  { id: 14, title: "Einzelgänger – 25 kg – jung", text: "Könnte Überläuferkeiler sein → ja.", correct: true },
  { id: 15, title: "Rundlicher Körper – weicher Kopf – gruppenorientiert", text: "Bache.", correct: false },

  { id: 16, title: "Sehr dunkler Keilkopf – hoher Widerrist", text: "Keilermerkmale.", correct: true },
  { id: 17, title: "Schwarzwild – langer, dünner Strich – feminin", text: "Bache.", correct: false },
  { id: 18, title: "Breiter Pinsel – großer Abstand zum Körper", text: "Keiler sich erkennbar.", correct: true },
  { id: 19, title: "Sau mit harmonischem Körperbau", text: "Bache.", correct: false },
  { id: 20, title: "Starkes Standbild – viel Vorderkörper – kaum Taille", text: "Typisch für Keiler.", correct: true },

  { id: 21, title: "Sehr große Ohren – feminine Proportionen", text: "Bache.", correct: false },
  { id: 22, title: "Stark ausgeprägtes Schild – massiver Nacken", text: "Keiler.", correct: true },
  { id: 23, title: "Schwarzwild im Trupp – wenig ausgeprägt", text: "Kein Keiler.", correct: false },
  { id: 24, title: "Einzelstück – markanter Keilkopf – drohend", text: "Keiler.", correct: true },
  { id: 25, title: "Schwarzwild – femininer Kopf – kleinere Körperform", text: "Bache.", correct: false },
];

// ------------------------------------------------------------
// SOFORT-RÜCKMELDUNG
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
      {isCorrect ? "Richtig erkannt!" : "Falsch erkannt!"}
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

  const current = scenarios[step];

  function answer(isCorrect) {
    if (lockButtons) return;

    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) setScore(score + 1);

    setTimeout(() => {
      setFeedback(null);
      setLockButtons(false);
      setStep(step + 1);
    }, 1200);
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

      <ScenarioCard title={current.title} text={current.text} />

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
          <ActionButton text="Keiler" disabled={lockButtons} onClick={() => answer(current.correct)} />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton text="Keine Keiler" disabled={lockButtons} onClick={() => answer(!current.correct)} />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
