import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 NACH-SUCHE Szenarien – true = richtige Entscheidung, false = falsch
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Reh – feine Lungenblasen am Anschuss", text: "Sofort nachgehen?", correct: false },
  { id: 2, title: "Keiler – dunkler Schweiß + Panseninhalt", text: "Wartezeit verlängern?", correct: true },
  { id: 3, title: "Reh – wenig Schweiß, aber Fährte tief eingedrückt", text: "Hund sofort ansetzen?", correct: true },

  { id: 4, title: "Rotwild – großer Lungenschweiß-Bereich", text: "Nachsuche direkt beginnen?", correct: true },
  { id: 5, title: "Überläufer – Flucht 150 m – Weichschweiß gefunden", text: "4–5 Stunden warten?", correct: true },
  { id: 6, title: "Reh – viel Knochensplitter – wenig Schweiß", text: "Hund sofort einsetzen?", correct: false },

  { id: 7, title: "Fuchs – fällt im Feuer – kein Fluchtweg sichtbar", text: "Stück aufnehmen?", correct: true },
  { id: 8, title: "Keiler – starkes Gebrumm in Dickung", text: "Jetzt hineingehen?", correct: false },
  { id: 9, title: "Rehwild – hellroter Schweiß – Spritzer – pirschbar", text: "Nachsuche sofort beginnen?", correct: true },

  { id: 10, title: "Sau – Pansenschweiß – starker Wildbretgeruch", text: "Nachsuche frühestens in 4 Stunden?", correct: true },
  { id: 11, title: "Rotwild – Hohlschuss vermutet – Flucht weit", text: "Am gleichen Abend nachgehen?", correct: false },
  { id: 12, title: "Rehbock – viel Lungenschweiß – Spur klar", text: "Hund sofort ansetzen?", correct: true },

  { id: 13, title: "Reh – nur Tropfen dunkelroten Schweißes", text: "Sofort los?", correct: false },
  { id: 14, title: "Überläufer – Strecke kurz, Hund frei verfügbar", text: "Sofort hinterher?", correct: true },
  { id: 15, title: "Rotwild – tiefschwarzer Schweiß – schwere Pirschzeichen", text: "Mindestens 5 Stunden warten?", correct: true },

  { id: 16, title: "Reh – Fährte verwischt – kein Schweiß", text: "Weiter suchen?", correct: false },
  { id: 17, title: "Sau – Schweiß mit Leberstrukturen", text: "Nachsuche nach 1–2 Stunden?", correct: true },
  { id: 18, title: "Rehwild – Fährtenschuh + reichlich Schweiß", text: "Gleich los?", correct: true },

  { id: 19, title: "Sau – Treffer im Weichbereich – Spur in Dickung", text: "Sofort rein?", correct: false },
  { id: 20, title: "Rotwild – Lungenblut + Blasen – ruhige Flucht", text: "Sofort los?", correct: true },

  { id: 21, title: "Rehbock – Knochensplitter + Stoßschweiß", text: "Sofort ran?", correct: false },
  { id: 22, title: "Sau – frische Wundbettsuche – Hund zeigt an", text: "Weiter gehen?", correct: true },
  { id: 23, title: "Reh – kaum Pirschzeichen – aber Fluchtspur markant", text: "Weiter?", correct: true },

  { id: 24, title: "Rotwild – Leberfarbener Schweiß – großer Fleck", text: "2–3 Stunden warten?", correct: true },
  { id: 25, title: "Sau – keinerlei Schweiß – unklare Situation", text: "Nachsuche abbrechen?", correct: false },
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
// NACH-SUCHE SIMULATOR
// ------------------------------------------------------------
export default function Nachsuche() {
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
        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Nachsuche – Ergebnis</h1>

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
            <b>Sehr gut! Deine Nachsuche-Entscheidungen sind stark 🎉</b>
          ) : (
            <b>Weiter trainieren – Nachsuchen erfordern Erfahrung.</b>
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
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Nachsuche-Simulator</h1>

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
            text="Richtige Entscheidung"
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
