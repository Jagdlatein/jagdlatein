import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 NACHTJAGD-SZENARIEN – true = Schuss möglich, false = nicht möglich
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehwild – 70 m – klare Silhouette – Mond hinter dir", text: "Sicherer Schuss möglich?", correct: true },
  { id: 2, title: "Reh – 90 m – Dämmerung fast vorbei – unscharfes Bild", text: "Sauberes Ansprechen möglich?", correct: false },
  { id: 3, title: "Überläufer – 40 m – leicht ziehend – klare Kontur", text: "Schuss verantwortbar?", correct: true },

  { id: 4, title: "Sau – 120 m – stockdunkel – Hintergrund unklar", text: "Sicherheitslage gegeben?", correct: false },
  { id: 5, title: "Fuchs – 35 m – Mondlicht perfekt – ruhiges Bild", text: "Saubere Schussabgabe?", correct: true },
  { id: 6, title: "Reh – 60 m – Nebel zieht auf – Konturen verschwimmen", text: "Sicher?", correct: false },

  { id: 7, title: "Rotwild – 80 m – im Schatten – kaum erkennbar", text: "Ansprechen möglich?", correct: false },
  { id: 8, title: "Sau – 50 m – Kugelfang klar – ruhiges Stück", text: "Möglich?", correct: true },
  { id: 9, title: "Rehbock – 30 m – direkt vor dem Kanzelfenster", text: "Wegen steilem Winkel sicher?", correct: false },

  { id: 10, title: "Überläufer – 70 m – auf Wiese – guter Kontrast", text: "Möglich?", correct: true },
  { id: 11, title: "Fuchs – 120 m – Silhouette zu klein", text: "Schuss vertretbar?", correct: false },
  { id: 12, title: "Sau – 40 m – kurz ziehend – Hintergrund Wiese", text: "Saubere Lage?", correct: true },

  { id: 13, title: "Reh – 85 m – Waldkante – fast schwarze Silhouette", text: "Ansprechen möglich?", correct: false },
  { id: 14, title: "Überläufer – 55 m – seitliches Mondlicht – ruhig", text: "Trefferzone erkennbar?", correct: true },
  { id: 15, title: "Rotwild – 100 m – bei Nebel – kaum Kontrast", text: "Sicher?", correct: false },

  { id: 16, title: "Sau – 45 m – ruhige Lage – Hang als Kugelfang", text: "Möglich?", correct: true },
  { id: 17, title: "Rehwild – 60 m – leichter Nieselregen", text: "Zu riskant?", correct: false },
  { id: 18, title: "Fuchs – 25 m – perfektes Licht – keine Bewegung", text: "Sehr sicher?", correct: true },

  { id: 19, title: "Überläufer – 110 m – schwaches Mondlicht", text: "Distanz + Sicht = riskant?", correct: false },
  { id: 20, title: "Sau – 35 m – deutliche Kontur – ruhiges Bild", text: "Schuss möglich?", correct: true },

  { id: 21, title: "Reh – 90 m – Blätter im Vordergrund verdecken Brust", text: "Unsicher?", correct: false },
  { id: 22, title: "Sau – 70 m – heller Schnee – perfekter Kontrast", text: "Sehr gutes Zielbild?", correct: true },
  { id: 23, title: "Fuchs – 50 m – dunkler Hintergrund – Silhouette klar", text: "Möglich?", correct: true },

  { id: 24, title: "Rehwild – 40 m – Hintergrund unbekannt", text: "Sicherheit gewährleistet?", correct: false },
  { id: 25, title: "Überläufer – 55 m – Kugelfang frei – leichte Bewegung", text: "Trefferzone gut sichtbar?", correct: true },
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
// NACHTJAGD SIMULATOR
// ------------------------------------------------------------
export default function Nachtjagd() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lockButtons, setLockButtons] = useState(false);

  const current = scenarios[step];

  function answer(isCorrect) {
    if (lockButtons) return;
    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) setScore((prev) => prev + 1);

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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Nachtjagd – Ergebnis</h1>

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
            <b>Sehr gut! Du triffst sichere Entscheidungen bei Nacht 🎉</b>
          ) : (
            <b>Nachtjagd erfordert Ruhe & höchste Präzision.</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Nachtjagd-Simulator</h1>

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
            text="Schuss möglich"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nicht sicher / nicht schießen"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
