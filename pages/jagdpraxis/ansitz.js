import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// ERWEITERTE SZENARIEN (mit Risiko-Analyse + Lerntext)
// ------------------------------------------------------------
const scenarios = [
  {
    id: 1,
    title: "Rehbock – 70m – Breit stehend",
    text: "Saubere Sicht, Kugelfang vorhanden, ruhig stehend.",
    analysis: {
      licht: "Gut",
      wind: "Neutral",
      kugelfang: "Vorhanden",
      bewegung: "Steht ruhig",
      risiko: "Sehr gering",
      treffer: "Hoch"
    },
    correct: "shoot",
    learn: "Ein breit stehender Bock mit sicherem Kugelfang ist eine ideale Ansitzsituation."
  },

  {
    id: 2,
    title: "Überläufer – 120m – Hinter Bewuchs",
    text: "Nur Teile des Körpers sichtbar. Wind steht zum Wild.",
    analysis: {
      licht: "Ausreichend",
      wind: "Zum Wild – Gefahr des Witterungsbruchs",
      kugelfang: "Unsicher",
      bewegung: "Teilweise verdeckt",
      risiko: "Sehr hoch",
      treffer: "Niedrig"
    },
    correct: "no",
    learn: "Schießen bei verdecktem Wild und unsicherem Kugelfang ist absolut tabu."
  },

  {
    id: 3,
    title: "Fuchs – 40m – Schräg ziehend",
    text: "Der Fuchs zieht langsam vorbei, gute Sicht.",
    analysis: {
      licht: "Sehr gut",
      wind: "Günstig",
      kugelfang: "Vorhanden",
      bewegung: "Langsam ziehend",
      risiko: "Mittel",
      treffer: "Hoch"
    },
    correct: "shoot",
    learn: "Bei klarer Sicht und kurzer Distanz ist ein sauberer Schuss möglich."
  },

  {
    id: 4,
    title: "Reh – 90m – Kitz dahinter",
    text: "Ricke steht gut, aber ein Kitz befindet sich dahinter.",
    analysis: {
      licht: "Gut",
      wind: "Neutral",
      kugelfang: "Nicht vorhanden wegen Kitz",
      bewegung: "Stehend",
      risiko: "Extrem hoch",
      treffer: "Hoch"
    },
    correct: "no",
    learn: "Gefährdung anderer Tiere: Schuss absolut verboten."
  },

  {
    id: 5,
    title: "Rotwild-Kalb – 110m – Leicht ziehend",
    text: "Führende Kuh steht 20m seitlich versetzt.",
    analysis: {
      licht: "Dämmerung",
      wind: "Seitlich",
      kugelfang: "Vorhanden",
      bewegung: "Leicht ziehend",
      risiko: "Mittel",
      treffer: "Mittel"
    },
    correct: "wait",
    learn: "Abwarten bis Ziehen ruhiger und gleichmäßiger wird."
  }
];

// ------------------------------------------------------------
// RISIKO-ANALYSE BOX
// ------------------------------------------------------------
function AnalysisBox({ data }) {
  return (
    <div
      style={{
        background: "#fff8e1",
        padding: 20,
        borderRadius: 12,
        marginTop: 25,
        borderLeft: "6px solid #caa53b"
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 12 }}>Risiko-Analyse</h3>

      <p><b>Licht:</b> {data.licht}</p>
      <p><b>Wind:</b> {data.wind}</p>
      <p><b>Kugelfang:</b> {data.kugelfang}</p>
      <p><b>Bewegung:</b> {data.bewegung}</p>
      <p><b>Gesamtrisiko:</b> {data.risiko}</p>
      <p><b>Trefferwahrscheinlichkeit:</b> {data.treffer}</p>
    </div>
  );
}

// ------------------------------------------------------------
// ENTSCHEIDUNGS-ERGEBNIS
// ------------------------------------------------------------
function DecisionResult({ correct, learn }) {
  return (
    <ResultBox>
      <h2
        style={{
          fontSize: 30,
          marginBottom: 10,
          color:
            correct === "shoot"
              ? "green"
              : correct === "wait"
              ? "#caa53b"
              : "red"
        }}
      >
        {correct === "shoot"
          ? "Schuss wäre vertretbar."
          : correct === "wait"
          ? "Besser abwarten."
          : "Nicht schießen!"}
      </h2>

      <p style={{ fontSize: 18, lineHeight: 1.6 }}>{learn}</p>
    </ResultBox>
  );
}

// ------------------------------------------------------------
// HAUPT-SIMULATOR-KOMPONENTE
// ------------------------------------------------------------
export default function Ansitz() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  const current = scenarios[step];

  function answer(decision) {
    setResult({
      user: decision,
      learn: current.learn
    });
  }

  function next() {
    setResult(null);
    setStep(step + 1);
  }

  // ENDE DES SIMULATORS
  if (step >= scenarios.length) {
    return (
      <main style={{ maxWidth: 1100, padding: 50, margin: "0 auto" }}>
        <HomeButton />

        <h1 style={{ fontSize: 48 }}>Ansitz – Endergebnis</h1>

        <ScoreBox score={step} max={scenarios.length} />

        <NavigationButton
          text="Zurück zur Übersicht"
          onClick={() => (window.location.href = "/jagdpraxis")}
        />
      </main>
    );
  }

  // SIMULATION
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "50px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 40
      }}
    >
      <HomeButton />

      <h1 style={{ fontSize: 42, marginBottom: 10 }}>
        Ansitz – Schussentscheidung
      </h1>

      {/* Szenario */}
      <ScenarioCard title={current.title} text={current.text} />

      {/* Risikoanalyse */}
      <AnalysisBox data={current.analysis} />

      {/* ENTSCHEIDUNGS-BUTTONS */}
      {!result && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginTop: 10
          }}
        >
          <ActionButton
            text="Schuss antragen"
            style={{ padding: "18px 16px", fontSize: 20 }}
            onClick={() => answer("shoot")}
          />

          <ActionButton
            text="Abwarten"
            style={{ padding: "18px 16px", fontSize: 20 }}
            onClick={() => answer("wait")}
          />

          <ActionButton
            text="Nicht schießen"
            style={{ padding: "18px 16px", fontSize: 20 }}
            onClick={() => answer("no")}
          />
        </div>
      )}

      {/* ERGEBNIS */}
      {result && (
        <div>
          <DecisionResult correct={current.correct} learn={result.learn} />

          <NavigationButton
            text="Weiter"
            style={{ marginTop: 24, padding: "18px 16px", fontSize: 20 }}
            onClick={next}
          />
        </div>
      )}
    </main>
  );
}
