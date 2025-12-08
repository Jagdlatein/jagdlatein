import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – Schussfeld sicher? true = sicher, false = nicht sicher
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – Breit stehend – Hang dahinter", text: "Kugelfang sicher vorhanden?", correct: true },
  { id: 2, title: "Reh – nur Rücken sichtbar – hohes Gras", text: "Kugelfang & Trefferzone unklar.", correct: false },
  { id: 3, title: "Überläufer – 60 m – hinter dünnem Gestrüpp", text: "Deckung könnte Geschoss ablenken.", correct: false },

  { id: 4, title: "Fuchs – 40 m – vor steiler Erdwand", text: "Idealstes Schussfeld.", correct: true },
  { id: 5, title: "Rehwild – 120 m – über Kuppenlinie", text: "Kugelfang nicht einsehbar.", correct: false },
  { id: 6, title: "Rotwild – 75 m – klar im Talboden", text: "Kugelfang durch Boden sicher.", correct: true },

  { id: 7, title: "Keiler – 90 m – vor Waldkante", text: "Bäume könnten Geschoss ablenken.", correct: false },
  { id: 8, title: "Fuchs – 20 m – im offenen Feld", text: "Sicheres Schussfeld.", correct: true },
  { id: 9, title: "Rehbock – 50 m – Straße 300 m dahinter", text: "Straße in Schussrichtung → verboten.", correct: false },

  { id: 10, title: "Sau – 45 m – steht breit – Kugelfang Hang", text: "Sauberes Bild.", correct: true },
  { id: 11, title: "Reh – 35 m – hinter Weidezaun", text: "Zaun könnte Geschoss ablenken.", correct: false },
  { id: 12, title: "Fuchs – 55 m – vor dichter Hecke", text: "Hecke als Kugelfang ungeeignet.", correct: false },

  { id: 13, title: "Rotwild – 120 m – fester Boden dahinter", text: "Sicherer Kugelfang.", correct: true },
  { id: 14, title: "Rehbock – zieht quer – Bewuchs vor Brust", text: "Schussfeld blockiert.", correct: false },
  { id: 15, title: "Überläufer – 25 m – perfekte Sicht", text: "Schussfeld sicher.", correct: true },

  { id: 16, title: "Sau – 60 m – hinter Baumgruppe", text: "Gefahr eines Abprallers.", correct: false },
  { id: 17, title: "Reh – 70 m – offene Wiese – leichter Hang", text: "Kugelfang vorhanden.", correct: true },
  { id: 18, title: "Keiler – 40 m – Wasser hinter dem Stück", text: "Geschoss könnte weit fehlgehen.", correct: false },

  { id: 19, title: "Fuchs – 30 m – Erdwall perfekt dahinter", text: "Bestes Schussfeld.", correct: true },
  { id: 20, title: "Rotwild – 65 m – hinterer Bereich unübersichtlich", text: "Keine Sicht in Hintergrund.", correct: false },

  { id: 21, title: "Reh – 55 m – leichter Nebel", text: "Sicht & Hintergrund unsicher.", correct: false },
  { id: 22, title: "Überläufer – 80 m – freies Feld – Hang dahinter", text: "Sicherer Kugelfang.", correct: true },
  { id: 23, title: "Fuchs – 50 m – hinter Holzzaun", text: "Holzzaun kann Geschosse ablenken.", correct: false },
  { id: 24, title: "Rehbock – 40 m – hinter ihm dichter Wald", text: "Kein sicherer Kugelfang.", correct: false },

  { id: 25, title: "Sau – 70 m – vor Erdhang – ruhige Lage", text: "Sicheres Schussfeld.", correct: true },
];

// ------------------------------------------------------------
// FEEDBACK BOX
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
      {isCorrect ? "Sicheres Schussfeld!" : "Nicht sicher – richtige Entscheidung!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – SCHUSSFELD
// ------------------------------------------------------------
export default function SchussfeldBeurteilung() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Schussfeld – Ergebnis</h1>

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
            <b>Sehr gut! Deine Schussfeld-Beurteilung ist sicher 🎉</b>
          ) : (
            <b>Weiter üben – Sicherheit geht vor!</b>
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
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Schussfeld-Beurteilung</h1>

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
            text="Sicheres Schussfeld"
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
