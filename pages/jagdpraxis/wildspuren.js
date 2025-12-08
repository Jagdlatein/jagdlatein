import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SPURENSZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Schmaler, länglicher Abdruck – klauen eng – Herzform", text: "Rehwild?", correct: true },
  { id: 2, title: "Sehr großer Abdruck – rundlich – stark gespreizt", text: "Rotwild?", correct: true },
  { id: 3, title: "Kleiner Abdruck – rund – 4 Zehen sichtbar – Krallen klar erkennbar", text: "Fuchs?", correct: true },

  { id: 4, title: "Breiter Abdruck – gespreizt – Schalen weit auseinander", text: "Schwarzwild?", correct: true },
  { id: 5, title: "Abdruck länglich – klein – ohne Krallen sichtbar", text: "Dachs?", correct: false },
  { id: 6, title: "Losung wurstartig – dunkle Farbe – spitze Enden", text: "Rehwildlosung?", correct: true },

  { id: 7, title: "Losung stark segmentiert – 3–6 cm lang – oft in Haufen", text: "Rotwild?", correct: true },
  { id: 8, title: "Losung sehr weich – breiig – nach Maisfraß", text: "Schwarzwild?", correct: true },
  { id: 9, title: "Fuchslosung – dünn, schnurartig – mit Haaren", text: "Richtig erkannt?", correct: true },

  { id: 10, title: "Schalenabdruck tief – Boden aufgewühlt – Trittsiegel breit", text: "Keiler?", correct: true },
  { id: 11, title: "Abdruck klein – eng – kaum gespreizt – zierlich", text: "Reh oder Kitz?", correct: true },
  { id: 12, title: "Losung pelletartig – sehr groß – glänzend", text: "Rehwild?", correct: false },

  { id: 13, title: "Fährtenbild: diagonaler Trab – gleichmäßiger Abstand", text: "Fuchs?", correct: true },
  { id: 14, title: "Fährtenbild: Gruppierung von 4 Abdrucken – Sprungfolge", text: "Hase?", correct: true },
  { id: 15, title: "Fährtenbild: paralleler Gang – schwere Schalen – Spuren tief", text: "Rotwild?", correct: true },

  { id: 16, title: "Schwarzwildfährte – Schalen weit gespreizt – tiefe Fährte", text: "Richtig erkannt?", correct: true },
  { id: 17, title: "Fährte mit Krallenabdrücken – Tapsen rundlich", text: "Katzenart?", correct: false },
  { id: 18, title: "Fraßspur: Entrindung an jungen Bäumen", text: "Rehwildfraß?", correct: false },

  { id: 19, title: "Fraßspur: Gras sauber abgerissen – kurze Halme", text: "Rehwild?", correct: true },
  { id: 20, title: "Fraßspur: Boden stark umgewühlt – Maisreste sichtbar", text: "Schwarzwild?", correct: true },

  { id: 21, title: "Fährtenbild: große Sprünge – tiefe Druckpunkte vorne", text: "Hirsch im schnellen Gang?", correct: true },
  { id: 22, title: "Fährtenbild: Zickzack – unregelmäßig – Schalen eng", text: "Rehwild?", correct: true },
  { id: 23, title: "Schalenabdruck klein – rund – kaum sichtbar", text: "Rotwild?", correct: false },
  { id: 24, title: "Losung: kleine Pellets – sehr helle Farbe", text: "Rehwild?", correct: true },

  { id: 25, title: "Fährtenbild: ruhiger Trollgang – breite Schritte – tiefer Abdruck", text: "Keiler?", correct: true },
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
// HAUPTSIMULATOR – SPURENKUNDE
// ------------------------------------------------------------
export default function Wildspuren() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Fährten- & Spurenkunde – Ergebnis
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
            <b>Top! Du erkennst Wildspuren sicher 🎉</b>
          ) : (
            <b>Weiter üben – Fährtenlesen ist eine Kernkompetenz des Jägers.</b>
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
        Fährten- & Spurenkunde
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
            text="Richtig erkannt"
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
