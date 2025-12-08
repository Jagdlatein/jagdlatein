import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – true = Einschätzung richtig
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehgeiß mit zwei Kitzen – Kitze sind eng bei ihr", text: "Typisches Familienverband-Verhalten?", correct: true },
  { id: 2, title: "Einzelnes Kitz – ohne Geiß – tagsüber ruhend", text: "Verwaist?", correct: false },
  { id: 3, title: "Bache mit Frischlingen – Frischlinge eng auf Linie", text: "Normales Sozialverhalten?", correct: true },

  { id: 4, title: "Rotwildkuh zieht alleine – keine Kälber sichtbar – August", text: "Ist sie ohne Kalb?", correct: false },
  { id: 5, title: "Führende Bache – Frischlinge weit verstreut", text: "Normales Verhalten?", correct: false },
  { id: 6, title: "Geiß mit nur einem Kitz – eng anliegend", text: "Korrektes Verhalten?", correct: true },

  { id: 7, title: "Rudel Rotwild – Leitkuh an der Spitze – klare Ordnung", text: "Typische Sozialstruktur?", correct: true },
  { id: 8, title: "Überläufer keiler – läuft in Rotwildrudel mit", text: "Normales Verhalten?", correct: false },
  { id: 9, title: "Bache + mehrere Überläufer + Frischlinge", text: "Mehrgenerationenrotte?", correct: true },

  { id: 10, title: "Rehbock führt Kitz", text: "Realistisch?", correct: false },
  { id: 11, title: "Rotwildkalb läuft dicht bei der Kuh", text: "Normales Verhalten?", correct: true },
  { id: 12, title: "Fuchs – zwei Jungfüchse folgen", text: "Typisches Familienbild?", correct: true },

  { id: 13, title: "Sau – Überläufer ohne Frischlinge – einzelne Sau", text: "Bache mit Frischlingen?", correct: false },
  { id: 14, title: "Rotwild – mehrere Spießer und Hirsche im Sommer in kleiner Gruppe", text: "Hirschtrupp?", correct: true },
  { id: 15, title: "Rehwild – Geiß vertreibt ihr Kitz im Juni", text: "Normales Verhalten?", correct: false },

  { id: 16, title: "Bache – führt Frischlinge eng – hohe Aufmerksamkeit", text: "Erkennbares Führungsstück?", correct: true },
  { id: 17, title: "Zwei Rehkitze – ohne Geiß – morgens ruhend", text: "Waisen?", correct: false },
  { id: 18, title: "Rotwild – Kälber laufen weit voraus", text: "Normale Sozialstruktur?", correct: false },

  { id: 19, title: "Mehrere Überläufer zusammen – keine Frischlinge", text: "Junggesellengruppe Schwarzwild?", correct: true },
  { id: 20, title: "Rotwild – Kuh läuft hinter Kalb", text: "Normales Schutzverhalten?", correct: true },

  { id: 21, title: "Rehbock – läuft mit Geiß + Kitz", text: "Sozialverband des Rehwilds?", correct: false },
  { id: 22, title: "Fuchs – Jungfuchs spielt – Altfuchs beobachtet", text: "Typisches Familienverhalten?", correct: true },
  { id: 23, title: "Bache – alleine – keine Frischlinge", text: "Führende Bache?", correct: false },
  { id: 24, title: "Rotwild – Rudel mit mehreren Kälbern – Kuh vorneweg", text: "Normale Führung?", correct: true },

  { id: 25, title: "Rehgeiß – entfernt sich weit von frisch gesetzten Kitzen", text: "Normales Verhalten?", correct: true },
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
      {isCorrect ? "Richtig beurteilt!" : "Falsch beurteilt!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – FAMILIENVERBÄNDE
// ------------------------------------------------------------
export default function Familienverbaende() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Wildfamilien – Ergebnis</h1>

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
            <b>Sehr gut! Du erkennst Sozialstrukturen sicher 🎉</b>
          ) : (
            <b>Weiter üben – Sozialstrukturen richtig zu lesen ist wichtig.</b>
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
        Wildfamilien & Sozialstrukturen
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
