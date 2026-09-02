import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 VERHALTENS-SZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehgeiß äst ruhig – Ohren locker – wiederkäuend", text: "Ist das Stück entspannt?", correct: true },
  { id: 2, title: "Rehbock schlägt mit dem Vorderlauf – wirkt unruhig", text: "Normales entspanntes Verhalten?", correct: false },
  { id: 3, title: "Fuchs springt spielend – Stopps und lauscht kurz", text: "Unauffälliges Verhalten?", correct: true },

  { id: 4, title: "Reh starrt lange in eine Richtung – äst nicht mehr", text: "Warnverhalten?", correct: true },
  { id: 5, title: "Rotwild zieht breitlinie – Kopf unten – ruhig", text: "Fluchtverhalten?", correct: false },
  { id: 6, title: "Sau kreist – nimmt Witterung – hebt den Teller", text: "Unsicherheit erkannt?", correct: true },

  { id: 7, title: "Rehwild – stark wechselnde Bewegungen – nervös", text: "Unauffällig?", correct: false },
  { id: 8, title: "Fuchs trottet gleichmäßig – regelmäßige Pausen", text: "Ruhiges Sichern?", correct: true },
  { id: 9, title: "Rotwild – Kuh treibt Kalb ständig vor sich", text: "Normales Verhalten?", correct: false },

  { id: 10, title: "Reh – tiefes Wedeln des Spiegels – entspannt", text: "Fluchtanzeichen?", correct: false },
  { id: 11, title: "Rehbock – starker Platzgeruch – markiert – schreckt", text: "Brunftverhalten?", correct: true },
  { id: 12, title: "Sau – Frischlinge spielen – Bache entspannt", text: "Normale Situation?", correct: true },

  { id: 13, title: "Reh – Kopf hoch – Lauscher rotieren hektisch", text: "Aufmerksam / Gefahr erkannt?", correct: true },
  { id: 14, title: "Fuchs – geduckter Gang – schneller Blickwechsel", text: "Beunruhigt?", correct: true },
  { id: 15, title: "Rotwild – Hirsch äst tiefenentspannt", text: "Warnsignal?", correct: false },

  { id: 16, title: "Sau – plötzlicher Sprung – sofortiges Verharren", text: "Gefahr wahrgenommen?", correct: true },
  { id: 17, title: "Rehwild – ruhiges Kauen – Seitenlage entspannt", text: "Normales Ruheverhalten?", correct: true },
  { id: 18, title: "Rotwild – Kuh setzt zum leisen Hüpfen an", text: "Fluchtverhalten?", correct: true },

  { id: 19, title: "Fuchs – tritt auf gleiche Stelle – springt vor", text: "Mausen → normales Verhalten?", correct: true },
  { id: 20, title: "Rehbock – zieht buckelig – Haupt gesenkt", text: "Auffällig und unnatürlich?", correct: true },

  { id: 21, title: "Reh – Kitz hüpft – Geiß entspannt", text: "Normale Familiensituation?", correct: true },
  { id: 22, title: "Rotwild – Kälber laufen weit voraus", text: "Unauffällig?", correct: false },
  { id: 23, title: "Sau – mehrfaches tiefes Knurren – steht breit", text: "Warnverhalten?", correct: true },
  { id: 24, title: "Rotwild – Hirsch wirft kurz den Kopf hoch, äst weiter", text: "Alarm?", correct: false },

  { id: 25, title: "Rehgeiß – abruptes Abbrechen des Äsens – starrt lange", text: "Auffällig?", correct: true },
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
// HAUPTSIMULATOR – WILDVERHALTEN
// ------------------------------------------------------------
export default function Wildverhalten() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Wildverhalten – Ergebnis
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
            <b>Sehr gut! Du liest Wildverhalten präzise 🎉</b>
          ) : (
            <b>Weiter üben – Verhalten richtig zu deuten ist entscheidend.</b>
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
  // SIMULATOR ANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Wildverhalten beurteilen</h1>

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
