
import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SCHUSSZEICHEN-SZENARIEN – TRUE = tödlicher Treffer, FALSE = nicht tödlich
// ------------------------------------------------------------
const scenarios = [
  // Einschuss / Ausschuss / Verhalten
  { id: 1, title: "Rehbock – Zeichnet mit starkem Zeichnen nach vorn", text: "Typisches Zeichen für Kammertreffer?", correct: true },
  { id: 2, title: "Überläufer – Flucht ohne Zeichnen – hohes Tempo", text: "Kein sichtbares Schusszeichen – Treffer fraglich?", correct: false },
  { id: 3, title: "Fuchs – schlägt mit der Hinterhand aus", text: "Zeichen für Weichschuss.", correct: false },

  // Pirschzeichen
  { id: 4, title: "Schwarzwild – kreisrunder Schweißtropfen, hellrot", text: "Hellrot = Kammer, tödlich.", correct: true },
  { id: 5, title: "Reh – dunkler Schweiß, gallertartige Stücke", text: "Weichschuss (Pansen/Magen).", correct: false },
  { id: 6, title: "Rotwild – schwerer Anschuss, Lungenschweiß mit Blasen", text: "Lungenblut mit Blasen = tödlich.", correct: true },
  { id: 7, title: "Fuchs – nur ein Haarbüschel, kein Schweiß", text: "Streifschuss sehr wahrscheinlich.", correct: false },
  { id: 8, title: "Keiler – scharfkantige Borsten, dunkler Schweiß", text: "Schulterblatt oder Weichbereich → nicht sicher tödlich.", correct: false },

  // Verhalten nach dem Treffer
  { id: 9, title: "Rehbock – geht hochblattig ab, fällt nach 40 m", text: "Typischer Hochblattschuss.", correct: true },
  { id: 10, title: "Überläufer – dreht sich im Schuss – flüchtet 200 m", text: "Zeichen für Weich oder Knochen.", correct: false },
  { id: 11, title: "Reh – schlägt einmal aus – bleibt kurz stehen – kippt", text: "Hirn / Atlas oder Kammer – tödlich.", correct: true },
  { id: 12, title: "Rotwild – rennt bergauf – keine Pirschzeichen sichtbar", text: "Treffer unsicher.", correct: false },

  // Pirschzeichen fortgeschritten
  { id: 13, title: "Reh – feinblasiger Lungenschweiß", text: "Lunger – sicher tödlich.", correct: true },
  { id: 14, title: "Sau – Panseninhalt am Anschuss", text: "Pansenschuss – nicht sofort tödlich.", correct: false },
  { id: 15, title: "Rotwild – Knochensplitter am Anschuss", text: "Kein Organ getroffen → nicht sicher tödlich.", correct: false },
  { id: 16, title: "Fuchs – heller Schweiß, feine Lufteinschlüsse", text: "Lunge → tödlich.", correct: true },

  // Sonderfälle
  { id: 17, title: "Reh – hoher Schuss, Rückenspur, Haare kurz geschnitten", text: "Streifschuss über dem Rücken.", correct: false },
  { id: 18, title: "Keiler – Kreuz im Feuer – starker Ausschlag", text: "Wirbelsäule getroffen → tödlich.", correct: true },
  { id: 19, title: "Überläufer – Bauchschweiß, dünnflüssig, grünlich", text: "Weichbereich – nicht tödlich.", correct: false },
  { id: 20, title: "Fuchs – fällt im Feuer, bleibt liegen", text: "Sofort tödlicher Treffer.", correct: true },

  // Expertenfälle
  { id: 21, title: "Rotwild – Wildbretgeruch am Anschuss, wenig Schweiß", text: "Weichschuss, nicht tödlich.", correct: false },
  { id: 22, title: "Rehbock – viel Lungenschweiß in Spritzern", text: "Lunge sicher.", correct: true },
  { id: 23, title: "Sau – Schweiß mit Schaum und dunklem Blut", text: "Mischschuss → nicht sicher tödlich.", correct: false },
  { id: 24, title: "Fuchs – dunkler Schweiß + Knochenstücke", text: "Knochen / Weichbereich.", correct: false },
  { id: 25, title: "Reh – heller Schweiß mit Haaren, aber viel Blut", text: "Hals-/Hochblattschuss → tödlich.", correct: true },
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
      {isCorrect ? "Richtig erkannt!" : "Falsch erkannt!"}
    </div>
  );
}

// ------------------------------------------------------------
// SCHUSSZEICHEN-SIMULATOR
// ------------------------------------------------------------
export default function Schusszeichen() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Schusszeichen – Ergebnis</h1>

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
            <b>Sehr gut! Du erkennst Schusszeichen sicher 🎉</b>
          ) : (
            <b>Weiter üben – Schusszeichen sind anspruchsvoll!</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Schusszeichen-Trainer</h1>

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
            text="Tödlicher Treffer"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nicht tödlich / unsicher"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
