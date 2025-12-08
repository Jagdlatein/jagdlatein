import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SCHWARZWILD-ANSPRECH-SZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Einzelne Sau – schlank – langer Kopf – dünner Träger", text: "Überläufer?", correct: true },
  { id: 2, title: "Sau mit Frischlingen im Wechsel", text: "Erlegbar?", correct: false },
  { id: 3, title: "Starke Sau – breiter Kopf – gut ausgebildete Waffen", text: "Keiler?", correct: true },

  { id: 4, title: "Sau – kurzer Kopf – kompakte Form – kleine Ohren", text: "Bache?", correct: true },
  { id: 5, title: "Einzelne Sau – stark schmal – leichte Kruppe – helles Gesicht", text: "Überläuferbache?", correct: true },
  { id: 6, title: "Rotte – mehrere kleine gestreifte Frischlinge", text: "Führende Bache erlegbar?", correct: false },

  { id: 7, title: "Keiler – breite Stirn – massiger Träger – langer Pinsel", text: "Richtig erkannt?", correct: true },
  { id: 8, title: "Sau – sehr kurze Läufe – Bauch tief", text: "Frischlingsbache?", correct: true },
  { id: 9, title: "Überläufer – zieht mit starker Rotte", text: "Einzeln ansprechen sicher?", correct: false },

  { id: 10, title: "Sau – Pfeffer-/Salz-Färbung – massive Waffen", text: "Alter Keiler?", correct: true },
  { id: 11, title: "Sau – schmaler Fang – lange Läufe – dünner Spiegel", text: "Keiler?", correct: false },
  { id: 12, title: "Bache – Frischlinge eng hinter ihr", text: "Erlegbar?", correct: false },

  { id: 13, title: "Überläufer – rundlich – sommerleicht", text: "Überläufer korrekt erkannt?", correct: true },
  { id: 14, title: "Sau – steiler Rücken – kurzer Träger", text: "Bache?", correct: true },
  { id: 15, title: "Keiler – weite Waffen – langer Fang", text: "Richtig erkannt?", correct: true },

  { id: 16, title: "Rotte – 6 Stück – mittlere Größe – kein klares Führungsstück erkennbar", text: "Schussabgabe sicher?", correct: false },
  { id: 17, title: "Einzelner starker Keiler – tiefe Brust – massiger Körper", text: "Keiler?", correct: true },
  { id: 18, title: "Sau – steiler Stich – kurzer Fang – kleine Ohren", text: "Bache?", correct: true },

  { id: 19, title: "Frischling – im Oktober – schmal – langer Kopf", text: "Noch Frischling?", correct: false },
  { id: 20, title: "Überläufer – dunkle Decke – kompakte Form", text: "Richtig erkannt?", correct: true },

  { id: 21, title: "Keiler – langer Pinsel – muskulöse Schultern", text: "Richtig angesprochen?", correct: true },
  { id: 22, title: "Sau – Kümmerer – extrem mager – mit Rotte", text: "Bache?", correct: false },
  { id: 23, title: "Frischlinge – keine Leitbache sichtbar – Sommer", text: "Führungsstück könnte versteckt sein?", correct: true },
  { id: 24, title: "Keiler – helles Gesicht – schmaler Körper", text: "Alter Keiler?", correct: false },

  { id: 25, title: "Sau – kugelig – kurze Läufe – breite Stirn", text: "Bache?", correct: true },
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
      {isCorrect ? "Richtig angesprochen!" : "Falsch angesprochen!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – SCHWARZWILD ANSPRECHEN
// ------------------------------------------------------------
export default function AnspracheSchwarzwild() {
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
  // ENDANZEIGE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Schwarzwild-Ansprechen – Ergebnis
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
            <b>Klasse! Du erkennst Schwarzwild sicher 🎉</b>
          ) : (
            <b>Schwarzwild richtig anzusprechen braucht Erfahrung – weiter trainieren!</b>
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
  // SIMULATORANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Schwarzwild sicher ansprechen
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
            text="Richtig angesprochen"
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
