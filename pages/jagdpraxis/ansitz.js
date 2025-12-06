import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// SZENARIEN (INHALT UNVERÄNDERT)
// ------------------------------------------------------------
const scenarios = [
  {
    id: 1,
    title: "Rehbock – 70m – Breit stehend",
    text: "Saubere Sicht, Kugelfang vorhanden, ruhig stehend.",
    correct: "shoot",
    learn: "Ein breit stehender Bock mit sicherem Kugelfang ist eine ideale Ansitzsituation."
  },
  {
    id: 2,
    title: "Überläufer – 120m – Hinter Bewuchs",
    text: "Nur Teile des Körpers sichtbar. Wind steht zum Wild.",
    correct: "no",
    learn: "Schießen bei verdecktem Wild und unsicherem Kugelfang ist absolut tabu."
  },
  {
    id: 3,
    title: "Fuchs – 40m – Schräg ziehend",
    text: "Der Fuchs zieht langsam vorbei, gute Sicht.",
    correct: "shoot",
    learn: "Bei klarer Sicht und kurzer Distanz ist ein sauberer Schuss möglich."
  },
  {
    id: 4,
    title: "Reh – 90m – Kitz dahinter",
    text: "Ricke steht gut, aber ein Kitz befindet sich dahinter.",
    correct: "no",
    learn: "Gefährdung anderer Tiere: Schuss absolut verboten."
  },
  {
    id: 5,
    title: "Rotwild-Kalb – 110m – Leicht ziehend",
    text: "Führende Kuh steht 20m seitlich versetzt.",
    correct: "wait",
    learn: "Abwarten bis Ziehen ruhiger und gleichmäßiger wird."
  }
];

// ------------------------------------------------------------
// ERGEBNIS-KOMPONENTE
// ------------------------------------------------------------
function DecisionResult({ isCorrect, learn }) {
  return (
    <ResultBox>
      <h2
        style={{
          fontSize: 24,
          marginBottom: 8,
          color: isCorrect ? "green" : "red"
        }}
      >
        {isCorrect ? "Richtige Entscheidung!" : "Falsche Entscheidung!"}
      </h2>
      <p style={{ fontSize: 17, lineHeight: 1.5 }}>{learn}</p>
    </ResultBox>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR
// ------------------------------------------------------------
export default function Ansitz() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);

  const current = scenarios[step];

  function answer(decision) {
    const isCorrect = decision === current.correct;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setResult({
      isCorrect,
      learn: current.learn
    });
  }

  function nextStep() {
    setResult(null);
    setStep(step + 1);
  }

  // -------------------------------
  // END-SEITE
  // -------------------------------
  if (step >= scenarios.length) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <HomeButton />
        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Ansitz – Ergebnis</h1>

        <ScoreBox score={score} max={scenarios.length} />

        <NavigationButton
          text="Zurück zur Übersicht"
          onClick={() => (window.location.href = "/jagdpraxis")}
        />
      </main>
    );
  }

  // -------------------------------
  // SIMULATIONS-ANSICHT
  // -------------------------------
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 28
      }}
    >
      <HomeButton />

      <h1
        style={{
          fontSize: 34,
          marginTop: 5,
          marginBottom: 10,
          lineHeight: 1.2
        }}
      >
        Ansitz-Simulator
      </h1>

      {/* Szenariokarte */}
      <ScenarioCard title={current.title} text={current.text} />

      {/* BUTTONS – PERFEKT ZENTRIERT */}
      {!result && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            marginTop: 20
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            <ActionButton
              text="Schuss antragen"
              onClick={() => answer("shoot")}
            />
          </div>

          <div style={{ width: "100%", maxWidth: 420 }}>
            <ActionButton
              text="Abwarten"
              onClick={() => answer("wait")}
            />
          </div>

          <div style={{ width: "100%", maxWidth: 420 }}>
            <ActionButton
              text="Nicht schießen"
              onClick={() => answer("no")}
            />
          </div>
        </div>
      )}

      {/* ERGEBNIS */}
      {result && (
        <>
          <DecisionResult
            isCorrect={result.isCorrect}
            learn={result.learn}
          />

          <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
            <NavigationButton text="Weiter" onClick={nextStep} />
          </div>
        </>
      )}
    </main>
  );
}
