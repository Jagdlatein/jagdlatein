import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 TROPHÄEN-SZENARIEN – true = korrekt bewertet
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – starke Rosen – dicke Stangen – grobe Perlen", text: "Alter Bock richtig erkannt?", correct: true },
  { id: 2, title: "Rehbock – dünne Stangen – kleine Rosen – zarte Perlung", text: "Alter Bock?", correct: false },
  { id: 3, title: "Rehbock – Spieße 10 cm – kaum Perlung", text: "Jährlingsbock?", correct: true },

  { id: 4, title: "Hirsch – massige Stangen – dunkle Färbung – Rücksetzung sichtbar", text: "Alter Hirsch?", correct: true },
  { id: 5, title: "Hirsch – helle Stangen – feine Enden – wenig Masse", text: "Hirsch mittleren Alters?", correct: false },
  { id: 6, title: "Hirsch – Kronenbildung erkennbar", text: "Alter reifer Hirsch?", correct: true },

  { id: 7, title: "Rehbock – asymmetrisch – schwache Stange rechts", text: "Typischer alter Bock?", correct: false },
  { id: 8, title: "Rehbock – symmetrischer 6-Ender – klare Masse", text: "Gute Trophäenqualität?", correct: true },
  { id: 9, title: "Rehbock – verkrüppelte Stange – Bast bleibt", text: "Perückenbock sicher erkannt?", correct: true },

  { id: 10, title: "Hirsch – dünne Leiter – gleichmäßig – jung?", text: "Alter Hirsch?", correct: false },
  { id: 11, title: "Hirsch – deutliche Burren – starke Krone", text: "Reifer Hirsch?", correct: true },
  { id: 12, title: "Rehbock – fehlende Enden – geringe Masse", text: "Trophäenschwacher Altbock?", correct: true },

  { id: 13, title: "Rehbock – starke Perlung – dunkle Färbung", text: "Alter Bock?", correct: true },
  { id: 14, title: "Rehbock – kurze Stangen – helle Farbe", text: "Altbock?", correct: false },
  { id: 15, title: "Hirsch – unregelmäßige Krone – starke Masse", text: "Alter Hirsch?", correct: true },

  { id: 16, title: "Rehbock – langer schlanker Gehörnaufbau", text: "Junger Bock?", correct: true },
  { id: 17, title: "Hirsch – starke Abnutzung am Gehörn", text: "Alter Hirsch?", correct: true },
  { id: 18, title: "Rehbock – Bast sehr weich – Mai", text: "Älterer Bock?", correct: false },

  { id: 19, title: "Hirsch – kaum Rücksetzung – feine Enden – hell", text: "Jung?", correct: true },
  { id: 20, title: "Rehbock – kompakte Stangen – dunkler Abrieb", text: "Alter Bock?", correct: true },

  { id: 21, title: "Hirsch – vereinzelt Ausfallende – schwache Masse", text: "Reifer Hirsch?", correct: false },
  { id: 22, title: "Rehbock – dicke enden – starke Rosen", text: "Reifer Altbock?", correct: true },
  { id: 23, title: "Hirsch – Färbung dunkel – starke Krone – schwere Stangen", text: "Alter Hirsch?", correct: true },
  { id: 24, title: "Rehbock – dünne Spieße – kaum Rosen", text: "Spießer?", correct: true },

  { id: 25, title: "Hirsch – helle leiternartige Stangen – kaum Abnutzung", text: "Alter Hirsch?", correct: false },
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
      {isCorrect ? "Richtig bewertet!" : "Falsch bewertet!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – TROPHÄENBEWERTUNG
// ------------------------------------------------------------
export default function Trophaeenbewertung() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Trophäenbewertung – Ergebnis</h1>

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
            <b>Stark! Du bewertest Trophäen sicher und präzise 🎉</b>
          ) : (
            <b>Weiter üben – Trophäenansprache ist anspruchsvoll.</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Trophäenbewertung</h1>

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
          <ActionButton
            text="Richtig bewertet"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Falsch / unsicher"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
