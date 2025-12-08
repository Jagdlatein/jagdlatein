import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 WIND-SZENARIEN – true = richtige Pirschrichtung
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Wind kommt von vorn – Wild steht vor dir", text: "Pirsch ansetzen?", correct: true },
  { id: 2, title: "Wind im Rücken – Wild vor dir äsend", text: "Gute Pirschrichtung?", correct: false },
  { id: 3, title: "Seitenwind – leichter Hangwind – Wild seitlich", text: "Pirsch möglich?", correct: true },

  { id: 4, title: "Thermik steigt – Morgen – Hang unter dir", text: "Wind steigt zu dir → Pirsch von oben sinnvoll?", correct: false },
  { id: 5, title: "Abfallende Thermik – Abend – Wind fällt abwärts", text: "Pirsch von oben möglich?", correct: true },
  { id: 6, title: "Wind dreht alle 10 Sekunden", text: "Pirsch empfehlenswert?", correct: false },

  { id: 7, title: "Konstanter Rückenwind – offenes Feld", text: "Angehen?", correct: false },
  { id: 8, title: "Wind leicht von links – Deckung links", text: "Linke Pirschseite richtig?", correct: true },
  { id: 9, title: "Thermik neutral – leichter Seitenwind – Waldkante", text: "Pirsch möglich?", correct: true },

  { id: 10, title: "Starker Wind – Wild sichert kaum", text: "Pirsch trotz Geräuschkulisse sinnvoll?", correct: true },
  { id: 11, title: "Windstill – aber Hanglage – Thermik steigt leicht", text: "Pirsch von unten?", correct: false },
  { id: 12, title: "Windstill – Deckung vorhanden – Wild entspannt", text: "Pirsch möglich?", correct: true },

  { id: 13, title: "Regen setzt ein – Wind drückt stark", text: "Wild wird unruhig → Pirsch gut möglich?", correct: false },
  { id: 14, title: "Gegenwind + dichter Bewuchs", text: "Ideale Pirschbedingungen?", correct: true },
  { id: 15, title: "Wind von rechts – du willst von rechts pirschen", text: "Richtig?", correct: false },

  { id: 16, title: "Wind von vorn – Wild auf Kuppe", text: "Pirsch bergauf?", correct: false },
  { id: 17, title: "Leichter Rückenwind – große Distanz – wechselhafte Thermik", text: "Pirsch ratsam?", correct: false },
  { id: 18, title: "Wind von links – Wild etwas rechts versetzt", text: "Pirsch sinnvoll?", correct: true },

  { id: 19, title: "Böiger Wind – aber klar einseitig", text: "Pirsch möglich?", correct: true },
  { id: 20, title: "Wind fällt am Abend ins Tal – du stehst oben", text: "Pirsch von oben?", correct: true },

  { id: 21, title: "Wind steht Richtung Wild – du stehst leicht versetzt", text: "Sicher?", correct: false },
  { id: 22, title: "Thermik steigt nach Sonnenaufgang", text: "Pirsch von oben?", correct: false },
  { id: 23, title: "Wind neutral – Wild direkt vor dir – keine Thermik", text: "Pirsch gut machbar?", correct: true },
  { id: 24, title: "Seitenwind – Wild steht im Windschatten", text: "Pirsch sinnvoll?", correct: false },

  { id: 25, title: "Leichter Wind von vorn – guter Bewuchs – Hanglage", text: "Optimale Pirschbedingungen?", correct: true },
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
      {isCorrect ? "Richtige Einschätzung!" : "Falsche Einschätzung!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – WIND & PIRSCH
// ------------------------------------------------------------
export default function WindPirsch() {
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
  // ENDANSICHT
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Wind & Pirschrichtung – Ergebnis
        </h1>

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
            <b>Sehr gut! Du setzt Pirschen und Windverhältnisse richtig ein 🎉</b>
          ) : (
            <b>Weiter üben – Wind zu lesen ist entscheidend für den Jagderfolg.</b>
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
  // SIMULATOR – ANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Wind & Pirschrichtung
      </h1>

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
            text="Richtig beurteilt"
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
