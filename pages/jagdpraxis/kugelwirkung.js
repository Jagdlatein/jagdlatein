import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 KUGELWIRKUNGS-SZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Kammerschuss – Weichteil – Deformationsgeschoss", text: "Sicherer Ausschuss?", correct: true },
  { id: 2, title: "Schräger Schuss von hinten – trifft Weichteil", text: "Gute Wirkung?", correct: false },
  { id: 3, title: "Herz-Lunge Bereich – gerader Winkel", text: "Zuverlässige Wirkung?", correct: true },

  { id: 4, title: "Spitzer Winkel – zu weit hinten – Bauch getroffen", text: "Tödliche Wirkung sofort?", correct: false },
  { id: 5, title: "Starkes Kaliber – breit stehend – Wirbelsäule getroffen", text: "Sofortiger Zusammenbruch?", correct: true },
  { id: 6, title: "Schuss durchs Blatt – hohe Treffpunktlage", text: "Saubere Wirkung?", correct: true },

  { id: 7, title: "Schräger Winkel – trifft nur Fleisch am Träger", text: "Gute Wirkung?", correct: false },
  { id: 8, title: "Treffer hinter dem Blatt – moderates Kaliber", text: "Gute Wildbretschonung?", correct: true },
  { id: 9, title: "Kleinkaliber – Rotwild – weiter Schuss", text: "Gute Wirkung?", correct: false },

  { id: 10, title: "Starkes Kaliber – Rehwild – Blatt getroffen", text: "Wildbretschonend?", correct: false },
  { id: 11, title: "Deformationsgeschoss – Kammertreffer – kurzer Fluchtweg", text: "Gute Jagdpraxiswirkung?", correct: true },
  { id: 12, title: "Vollmantelgeschoss – Kammerschuss", text: "Gute Wirkung?", correct: false },

  { id: 13, title: "Schuss durch beide Lungenflügel", text: "Sicher tödlich?", correct: true },
  { id: 14, title: "Schuss oberhalb der Wirbelsäule – Rückenstreifschuss", text: "Sofort tödlich?", correct: false },
  { id: 15, title: "Starkes Deformationsgeschoss – kurze Distanz – großer Ausschuss", text: "Starke Wildbretentwertung?", correct: true },

  { id: 16, title: "Schuss durch Oberarmknochen – trifft Kammer", text: "Sicher tödlich?", correct: true },
  { id: 17, title: "Leichtes Kaliber – spitzer Winkel – nur Muskeln getroffen", text: "Gute Wirkung?", correct: false },
  { id: 18, title: "Schuss von oben – trifft Lunge", text: "Sicher tödlich?", correct: true },

  { id: 19, title: "Tief angetragen – Bauchschuss", text: "Sofort tödlich?", correct: false },
  { id: 20, title: "Kammerschuss – Ausschuss vorhanden", text: "Gute Pirschzeichen?", correct: true },

  { id: 21, title: "Hoch angetragen – Wirbelsäule durchtrennt", text: "Sofortiger Zusammenbruch?", correct: true },
  { id: 22, title: "Schuss ins Blatt – trifft Gelenk", text: "Sofort tödlich?", correct: false },
  { id: 23, title: "Schuss aufs Haupt – sicherer Treffer", text: "Gute Jagdpraxis?", correct: false },

  { id: 24, title: "Schulterblatt durchschlagen – Kammer verletzt", text: "Gute Wirkung?", correct: true },
  { id: 25, title: "Sehr spitzer Winkel – trifft nicht Kammer – nur Fleisch", text: "Saubere Wirkung?", correct: false },
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
// HAUPTSIMULATOR – KUGELWIRKUNG
// ------------------------------------------------------------
export default function Kugelwirkung() {
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
          Kugelwirkung – Ergebnis
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
            <b>Sehr gut! Du kennst die Wirkung eines Schusses sicher 🎉</b>
          ) : (
            <b>Weiter üben – Geschosswirkung richtig einzuschätzen ist entscheidend.</b>
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
        Geschosswirkung / Kugelwirkung
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
