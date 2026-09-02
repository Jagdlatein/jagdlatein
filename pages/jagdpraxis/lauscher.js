import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 ZEICHENDEUTUNGS-SZENARIEN – true = richtig gedeutet
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Reh – Lauscher locker zur Seite – entspanntes Äsen", text: "Entspanntes Stück?", correct: true },
  { id: 2, title: "Reh – Lauscher nach vorne fixiert – Körper steif", text: "Entspannt?", correct: false },
  { id: 3, title: "Rehbock – Spiegel leicht bewegt – tiefes Wedeln", text: "Warnung?", correct: false },

  { id: 4, title: "Reh – Spiegel schnell hin und her – abruptes Stehen", text: "Alarm?", correct: true },
  { id: 5, title: "Fuchs – Ohren nach vorne – ruhiges Sichern", text: "Beunruhigt?", correct: true },
  { id: 6, title: "Sau – Teller nach hinten – ruhig ziehend", text: "Beunruhigt?", correct: false },

  { id: 7, title: "Rotwild – Ohren drehen ständig – Kopf oben", text: "Gefahr wahrgenommen?", correct: true },
  { id: 8, title: "Rotwild – Kopf unten – Ohren locker", text: "Warnsignal?", correct: false },
  { id: 9, title: "Reh – Spiegel weit gestellt – wildes Wedeln", text: "Aufgeregt / unsicher?", correct: true },

  { id: 10, title: "Sau – Teller steil nach oben – abruptes Stoppen", text: "Alarmstück?", correct: true },
  { id: 11, title: "Fuchs – leichte Ohrenbewegung – normaler Schritt", text: "Auffällig?", correct: false },
  { id: 12, title: "Rehbock – Stirnt sich – Ohren nach innen gedreht", text: "Aggressionsanzeichen?", correct: true },

  { id: 13, title: "Reh – Spiegel kaum sichtbar – entspanntes Rudern", text: "Fluchtanzeichen?", correct: false },
  { id: 14, title: "Rotwild – Schweif hebt kurz – sofortiges Sichern", text: "Warnzeichen?", correct: true },
  { id: 15, title: "Reh – Lauscher liegen flach an – Kopf tief", text: "Angst / Flucht?", correct: true },

  { id: 16, title: "Sau – ruhiges Zucken des Schwanzes – normaler Gang", text: "Warnung?", correct: false },
  { id: 17, title: "Reh – Spiegel hoch gestellt – kurzes Schnalzen", text: "Alarm?", correct: true },
  { id: 18, title: "Rotwild – Ohren locker, seitlich", text: "Stress?", correct: false },

  { id: 19, title: "Fuchs – Ohren kurz steil gestellt – sofortige Flucht", text: "Reaktion auf Gefahr?", correct: true },
  { id: 20, title: "Reh – Spiegel kaum bewegt – entspannte Schritte", text: "Nervosität?", correct: false },

  { id: 21, title: "Rotwild – Schweif leicht angehoben – Körper angespannt", text: "Alarm?", correct: true },
  { id: 22, title: "Reh – Ohren rotieren – aber Äsen geht weiter", text: "Hochgradige Gefahr?", correct: false },
  { id: 23, title: "Sau – Teller nach vorne – schneller Schritt", text: "Unsicher?", correct: true },
  { id: 24, title: "Reh – plötzliches Spiegelschlagen – dann ruhig", text: "Akute Gefahr?", correct: false },

  { id: 25, title: "Rotwild – Ohren steil nach vorne – Nüstern weit geöffnet", text: "Starke Alarmbereitschaft?", correct: true },
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
      {isCorrect ? "Richtig gedeutet!" : "Falsch gedeutet!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – ZEICHENDEUTUNG
// ------------------------------------------------------------
export default function LauscherZeichen() {
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
          Lauscher- & Zeichendeutung – Ergebnis
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
            <b>Sehr gut! Du erkennst die Körpersprache des Wildes 🎉</b>
          ) : (
            <b>Zeichen zu deuten braucht Übung – weiter trainieren!</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Lauscher- & Zeichendeutung
      </h1>

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
            text="Richtig gedeutet"
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
