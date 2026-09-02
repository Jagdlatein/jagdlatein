import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 WILDKUNDE-SZENARIEN – true = korrekt angesprochen, false = falsch
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehwild – kleiner Kopf – runder Spiegel – kurzer Träger", text: "Ist es ein Kitz?", correct: true },
  { id: 2, title: "Rehbock – Perückenbildung – Bast im Sommer", text: "Kann man ihn jetzt sicher ansprechen?", correct: true },
  { id: 3, title: "Stück Schwarzwild – 25 kg – langer Strich – feminine Form", text: "Handelt es sich um einen Überläuferkeiler?", correct: false },

  { id: 4, title: "Rotwild – großes Tier – deutlich sichtbare Rosenstöcke", text: "Ist es ein Hirsch?", correct: true },
  { id: 5, title: "Stück Schwarzwild – mit Frischlingen – defensive Haltung", text: "Ist es eine Bache?", correct: true },
  { id: 6, title: "Rehwild – kein Kopfschmuck – schlank – große Lauscher", text: "Handelt es sich um einen Bock?", correct: false },

  { id: 7, title: "Rotwild – kurzer Träger – kompakt – läuft eng hinter Alttier", text: "Ist es ein Kalb?", correct: true },
  { id: 8, title: "Rehwild – langer Träger – markante Stirn – kräftige Läufe", text: "Jährlingsbock?", correct: true },
  { id: 9, title: "Schwarzwild – massiver Schädel – Schild sichtbar", text: "Bache?", correct: false },

  { id: 10, title: "Rehwild – Geweih im Bast – spitze Enden", text: "Ist es ein alter Bock?", correct: false },
  { id: 11, title: "Rotwild – Tier zieht allein – wirkt unsicher – klein", text: "Alttier?", correct: false },
  { id: 12, title: "Fuchs – langer schlanker Körper – helle Brust – buschiger Schweif", text: "Ist es ein Jungfuchs?", correct: true },

  { id: 13, title: "Rehwild – schmal – leichte Färbung – wirkt ‚kindlich’", text: "Kitz?", correct: true },
  { id: 14, title: "Schwarzwild – Keilkopf – breite Brust – Pinsel sichtbar", text: "Keiler?", correct: true },
  { id: 15, title: "Rotwild – breiter Schädel – dunkler Spiegel – große Masse", text: "Kalb?", correct: false },

  { id: 16, title: "Rehwild – kurzer Träger – weicher Kopf – kein Bast", text: "Schmalreh?", correct: true },
  { id: 17, title: "Schwarzwild – Tiere laufen eng als Trupp", text: "Sind Keiler in Rotten?", correct: false },
  { id: 18, title: "Rotwild – Alttier zieht mit Kalb – Kalb wirkt schwach", text: "Kalb?", correct: true },

  { id: 19, title: "Rehwild – dünner Körper – lange Läufe – Stirn kaum ausgeprägt", text: "Alter Bock?", correct: false },
  { id: 20, title: "Fuchs – kurzer Körper – runder Kopf – unruhiges Verhalten", text: "Jungtier?", correct: true },

  { id: 21, title: "Rotwild – viel Brust – starke Stangen – dunkle Färbung", text: "Alter Hirsch?", correct: true },
  { id: 22, title: "Schwarzwild – kleiner Kopf – dünne Läufe – lange Schnauze", text: "Frischling?", correct: true },
  { id: 23, title: "Rehwild – stärkerer Körper – dunkler Aalstrich im Sommer", text: "Rehbock?", correct: true },
  { id: 24, title: "Rotwild – helles Spiegelmuster – zierlich – nah beim Alttier", text: "Schmalspießer?", correct: false },

  { id: 25, title: "Schwarzwild – kurze, kompakte Form – schneller Bewegungsstil", text: "Überläufer?", correct: true },
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
// WILDKUNDE-SIMULATOR
// ------------------------------------------------------------
export default function Wildkunde() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Wildkunde – Ergebnis</h1>

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
            <b>Sehr gut! Deine Wildansprache ist präzise 🎉</b>
          ) : (
            <b>Weiter üben – Wildansprache braucht Erfahrung!</b>
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
  // SIMULATOR
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Wildkunde – Trainer</h1>

      <ScenarioCard
  title={current.title}
  text={feedback === true ? current.text : null}
/>
      {/* Antwort-Buttons */}
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
