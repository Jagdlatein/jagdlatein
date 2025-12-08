import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 ROTWILD-ANSPRECH-SZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Hirsch – schwaches Geweih – dünner Träger – kurze Stangen", text: "Junger Hirsch?", correct: true },
  { id: 2, title: "Kuh – Kalb eng bei ihr", text: "Erlegbar?", correct: false },
  { id: 3, title: "Spießer – sehr schmale Stangen – wenig Masse", text: "Junger Spießer?", correct: true },

  { id: 4, title: "Hirsch – starke Stangen – dunkles Geweih – breite Brust", text: "Alter Hirsch?", correct: true },
  { id: 5, title: "Rotkahl – ohne Kalb – Oktober", text: "Erlegbar?", correct: true },
  { id: 6, title: "Kuh – wirkt schlank – aber Kalb läuft verdeckt", text: "Sicher erlegbar?", correct: false },

  { id: 7, title: "Hirsch – Geweih asymmetrisch – Körper kräftig", text: "Trotz Asymmetrie ein Hirsch?", correct: true },
  { id: 8, title: "Kälber laufen hinter Kuh – Sommer", text: "Kuh erlegbar?", correct: false },
  { id: 9, title: "Hirsch – kurze Stangen – dünner Fang", text: "Alter Hirsch?", correct: false },

  { id: 10, title: "Kalb allein – ruft suchend – August", text: "Verwaist?", correct: false },
  { id: 11, title: "Hirsch – helle Stangen – feines Geweih – schlanker Körper", text: "Junger Hirsch?", correct: true },
  { id: 12, title: "Kuh – sehr massig – kein Kalb sichtbar – November", text: "Erlegbar?", correct: true },

  { id: 13, title: "Spießer – deutlicher Stangenansatz – wenig Masse", text: "Richtig erkannt?", correct: true },
  { id: 14, title: "Rotkahl – tief hängender Bauch – breiter Rücken", text: "Kalbführend?", correct: true },
  { id: 15, title: "Hirsch – dunkle Stangen – starke Rose", text: "Alter Hirsch?", correct: true },

  { id: 16, title: "Kuh – Kalb weit vor ihr – unruhig", text: "Erlegbar?", correct: false },
  { id: 17, title: "Hirsch – dünner Träger – kaum Brusttiefe", text: "Alter Hirsch?", correct: false },
  { id: 18, title: "Hirsch – deutliche Masse – dicke Stangen – starker Fang", text: "Alter Hirsch?", correct: true },

  { id: 19, title: "Kuh – kein Kalb – Winter", text: "Höchstwahrscheinlich führungslos?", correct: true },
  { id: 20, title: "Kalb – sehr klein – läuft normal bei der Kuh", text: "Erlegbar?", correct: false },

  { id: 21, title: "Hirsch – Stangen stark perlverziert – dunkle Masse", text: "Alter Hirsch?", correct: true },
  { id: 22, title: "Kuh – auffällige Gesäuge – Sommer", text: "Kalb führend?", correct: true },
  { id: 23, title: "Hirsch – kurze Aug- & Mittelsprossen – schwaches Geweih", text: "Junger Hirsch?", correct: true },
  { id: 24, title: "Spießer – starke Läufe – breiter Fang", text: "Althirsch?", correct: false },

  { id: 25, title: "Kahlwild – tiefes Blatten – keine Kälber", text: "Erlegbar?", correct: true },
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
// HAUPTSIMULATOR – ROTWILD ANSPRECHEN
// ------------------------------------------------------------
export default function AnspracheRotwild() {
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
          Rotwild-Ansprechen – Ergebnis
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
            <b>Sehr gut! Du kannst Rotwild sicher ansprechen 🎉</b>
          ) : (
            <b>Weiter üben – Rotwild richtig anzusprechen ist anspruchsvoll.</b>
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
        Rotwild sicher ansprechen
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
