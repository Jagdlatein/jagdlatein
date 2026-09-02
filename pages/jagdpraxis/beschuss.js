import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SICHERHEITSSZENARIEN – true = sicher, false = NICHT sicher
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehwild – 60 m – Hang dahinter steigt an", text: "Natürlicher Kugelfang vorhanden?", correct: true },
  { id: 2, title: "Reh – 90 m – freies Feld – Straße 400 m dahinter", text: "Schuss sicher?", correct: false },
  { id: 3, title: "Fuchs – 30 m – Kugelfang Wall – ruhige Lage", text: "Schuss sicher?", correct: true },

  { id: 4, title: "Sau – 80 m – hinter ihr fällt Gelände ab", text: "Gefahr einer Weitflugkugel?", correct: false },
  { id: 5, title: "Überläufer – 50 m – Waldrand – starker Wall", text: "Schuss sicher?", correct: true },
  { id: 6, title: "Reh – 120 m – hinter Hecke Häuser", text: "Sicher?", correct: false },

  { id: 7, title: "Fuchs – 40 m – Kugelfang bewaldete Böschung", text: "Sicher?", correct: true },
  { id: 8, title: "Reh – 150 m – Hügelkuppe – Hintergrund nicht erkennbar", text: "Gefährlich?", correct: false },
  { id: 9, title: "Sau – 35 m – vor steilem Erdwall", text: "Sicher?", correct: true },

  { id: 10, title: "Fuchs – 90 m – offenes Feld – keine Deckung dahinter", text: "Gefährlich?", correct: false },
  { id: 11, title: "Reh – 45 m – steil nach oben schießen", text: "Kugelfang unklar?", correct: false },
  { id: 12, title: "Rehwild – 65 m – vor dichtem Erdhang", text: "Natürlicher Kugelfang?", correct: true },

  { id: 13, title: "Rotwild – 110 m – Kuppe dahinter", text: "Gefahr einer Überschusssituation?", correct: false },
  { id: 14, title: "Überläufer – 55 m – Waldschneise – Hang steigt an", text: "Sicher?", correct: true },
  { id: 15, title: "Fuchs – 25 m – direkt unter Hochsitz", text: "Extremer Winkel: sicher?", correct: false },

  { id: 16, title: "Reh – 80 m – dahinter dichter Forst", text: "Kugelfang gegeben?", correct: true },
  { id: 17, title: "Sau – 100 m – Boden gefroren – Abprallergefahr", text: "Sicherer Schuss?", correct: false },
  { id: 18, title: "Reh – 35 m – steiler Hang als Fang", text: "Sehr sicher?", correct: true },

  { id: 19, title: "Fuchs – 140 m – dahinter Wiesenhang abfallend", text: "Hohes Risiko für Überschuss?", correct: false },
  { id: 20, title: "Reh – 60 m – Waldhang dahinter steigend", text: "Sicher?", correct: true },

  { id: 21, title: "Sau – 70 m – Hintergrund dichtes Gebüsch", text: "Gebüsch ≠ Kugelfang – sicher?", correct: false },
  { id: 22, title: "Rehbock – 50 m – Lehmhang dahinter", text: "Optimaler Kugelfang?", correct: true },
  { id: 23, title: "Fuchs – 85 m – Feldweg dahinter", text: "Feldweg = Risiko?", correct: false },
  { id: 24, title: "Reh – 100 m – Felsenwand als Hintergrund", text: "Kugelfang absolut sicher?", correct: true },

  { id: 25, title: "Überläufer – 40 m – leichter Winkel nach oben", text: "Sicher?", correct: false },
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
      {isCorrect ? "Richtige Entscheidung!" : "Falsche Entscheidung!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – SICHERHEIT
// ------------------------------------------------------------
export default function KugelfangSicherheit() {
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
    const passed = percent >= 80;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Kugelfang & Sicherheit – Ergebnis
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
            <b>Sehr gut! Du entscheidest sicher & verantwortungsvoll 🎯</b>
          ) : (
            <b>Sicherheit geht vor – weiter trainieren!</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Kugelfang & Sicherheitstrainer
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
            text="Sicher"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nicht sicher"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
