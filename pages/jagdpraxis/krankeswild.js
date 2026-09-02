import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – true = Wild zeigt Krankheitsanzeichen
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Reh – stark hängender Haupt – langsame Bewegungen", text: "Zeigt das Stück Krankheit?", correct: true },
  { id: 2, title: "Rehbock – äst normal – glänzendes Fell", text: "Krank?", correct: false },
  { id: 3, title: "Fuchs – faltiges Fell – schütter – stakst langsam", text: "Räude?", correct: true },

  { id: 4, title: "Sau – zieht sicher – glänzende Decke – normale Bewegung", text: "Krank?", correct: false },
  { id: 5, title: "Reh – wiederholtes Kopfschütteln – taumelnder Gang", text: "Krank?", correct: true },
  { id: 6, title: "Fuchs – schneller Gang – normales Verhalten", text: "Krank?", correct: false },

  { id: 7, title: "Reh – dünner Rücken – eingefallen – stumpfes Fell", text: "Krank?", correct: true },
  { id: 8, title: "Rotwild – ruhiges Äsen – glänzende Decke", text: "Krank?", correct: false },
  { id: 9, title: "Sau – starkes Lahmen hinten – hinterherhängende Keule", text: "Krank?", correct: true },

  { id: 10, title: "Rehbock – ruhiges Verhalten – leichte Verschnaufpause", text: "Krank?", correct: false },
  { id: 11, title: "Reh – Kreisbewegungen – Orientierungslos", text: "Schwer krank?", correct: true },
  { id: 12, title: "Fuchs – kurze Rast – Fell normal", text: "Krank?", correct: false },

  { id: 13, title: "Reh – schmaler Wildkörper – struppige Decke – schwankt", text: "Krank?", correct: true },
  { id: 14, title: "Rotwild – zügiger Schritt – normales Verhalten", text: "Krank?", correct: false },
  { id: 15, title: "Sau – Fieberanzeichen unbekannt – aber extreme Trägheit", text: "Auffällig?", correct: true },

  { id: 16, title: "Reh – strammer Schritt – reagiert gut", text: "Krank?", correct: false },
  { id: 17, title: "Fuchs – kaum Fell am Schweif – starke Unruhe", text: "Räudeanzeichen?", correct: true },
  { id: 18, title: "Reh – mühsames Steigen – Haupt hängt", text: "Krank?", correct: true },

  { id: 19, title: "Sau – sauberer Gang – ruhige Bewegung", text: "Krank?", correct: false },
  { id: 20, title: "Reh – leichte Lahmheit – aber sonst fit", text: "Schwer krank?", correct: false },

  { id: 21, title: "Reh – wirkt apathisch – reagiert verzögert", text: "Krank?", correct: true },
  { id: 22, title: "Rotwild – Fell glatt – Lauf stark belastet", text: "Lahmheit → krank?", correct: true },
  { id: 23, title: "Rehbock – frisst ruhig – dicker Pinsel – klare Augen", text: "Krank?", correct: false },
  { id: 24, title: "Fuchs – torkelt – bleibt immer wieder stehen", text: "Krank?", correct: true },

  { id: 25, title: "Sau – normaler Körperbau – normales Verhalten", text: "Krank?", correct: false },
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
      {isCorrect ? "Richtig erkannt!" : "Falsch eingeschätzt!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – KRANKES WILD ERKENNEN
// ------------------------------------------------------------
export default function KrankesWildErkennen() {
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
  // ENDANZEIGE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Krankes Wild – Ergebnis</h1>

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
            <b>Sehr gut! Du erkennst krankes Wild sicher 🎉</b>
          ) : (
            <b>Krankes Wild zu erkennen braucht Erfahrung – weiter üben!</b>
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
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Krankes Wild erkennen</h1>

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
            text="Krank"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nicht krank / unauffällig"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
