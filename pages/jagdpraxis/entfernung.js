import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 ENTFERNUNGS-SZENARIEN – true = korrekt eingeschätzt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – wirkt groß – Hanglage bergauf", text: "Wirkt näher als er ist (≈100 m). Schätzt du die Distanz korrekt?", correct: true },
  { id: 2, title: "Reh – in Senke stehend – kleiner wirkend", text: "Wirkt weiter weg – echte Entfernung aber 50 m. Schätzt du korrekt?", correct: false },
  { id: 3, title: "Fuchs – 35 m – zieht quer – klare Sicht", text: "Einfache Schätzung? (≈30–40 m)", correct: true },

  { id: 4, title: "Überläufer – 120 m – flache Wiese – kein Größenvergleich", text: "Leicht zu unterschätzen?", correct: false },
  { id: 5, title: "Rehwild – 70 m – hinter Hecke auftauchend", text: "Wird oft als zu weit eingeschätzt?", correct: true },
  { id: 6, title: "Rotwild – 150 m – große Tiere wirken nah", text: "Tatsächliche Entfernung größer als geschätzt?", correct: true },

  { id: 7, title: "Keiler – 40 m – Abendlicht – hoher Kontrast", text: "Einfache korrekte Schätzung möglich?", correct: true },
  { id: 8, title: "Reh – 90 m – Nebel leicht – geringe Kontraste", text: "Distanz leicht überschätzt?", correct: false },
  { id: 9, title: "Fuchs – 80 m – wirkt winzig – offenes Feld", text: "Tatsächliche Entfernung wird oft unterschätzt.", correct: false },

  { id: 10, title: "Reh – 45 m – leicht im Schatten", text: "Wirkt weiter – obwohl nah. Schätzt du richtig?", correct: true },
  { id: 11, title: "Rotwild – 200 m – Hangabwärts", text: "Wirkt dichter – tatsächliche Entfernung größer?", correct: true },
  { id: 12, title: "Sau – 30 m – plötzlich auftauchend", text: "Schwer zu überschätzen – sehr nah.", correct: true },

  { id: 13, title: "Überläufer – 70 m – im hohen Bewuchs", text: "Entfernung schwer einzuschätzen – viele schätzen falsch.", correct: false },
  { id: 14, title: "Reh – 110 m – im leichten Gegenlicht", text: "Wirkt weiter weg → falsche Schätzung?", correct: false },
  { id: 15, title: "Rotwild – 120 m – ruhige Lage – klare Sicht", text: "Einfache Distanzschätzung?", correct: true },

  { id: 16, title: "Fuchs – 100 m – Hintergrund dunkler Wald", text: "Fuchs wirkt oft näher → Schätzung korrekt?", correct: false },
  { id: 17, title: "Reh – 60 m – auf freier Wiese", text: "Sehr leicht richtig einzuschätzen?", correct: true },
  { id: 18, title: "Keiler – 90 m – im Gegenhang", text: "Wirkt näher durch große Silhouette?", correct: false },

  { id: 19, title: "Reh – 130 m – Abenddämmerung", text: "Distanz schwer – häufig unterschätzt?", correct: false },
  { id: 20, title: "Rotwild – 80 m – Hang seitlich", text: "Tatsächliche Entfernung gut erkennbar?", correct: true },

  { id: 21, title: "Fuchs – 60 m – springt kurz – steht dann wieder", text: "Korrekte Einschätzung möglich?", correct: true },
  { id: 22, title: "Rehwild – 100 m – über Kuppenlinie", text: "Höhenlage erschwert Einschätzung → viele schätzen falsch.", correct: false },
  { id: 23, title: "Sau – 50 m – Hangabwärts – große Silhouette", text: "Wirkt näher als sie ist?", correct: false },
  { id: 24, title: "Reh – 40 m – dichte Hecke dahinter", text: "Wirkt weiter, als es ist?", correct: true },

  { id: 25, title: "Überläufer – 140 m – völlig offen", text: "Gute Schätzbarkeit? (≈140 m)", correct: true },
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
      {isCorrect ? "Richtig eingeschätzt!" : "Falsch eingeschätzt!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – ENTFERNUNG
// ------------------------------------------------------------
export default function Entfernungsschaetzung() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Entfernungsschätzung – Ergebnis</h1>

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
            <b>Stark! Deine Entfernungsschätzung ist präzise 🎉</b>
          ) : (
            <b>Weiter üben – Entfernungsschätzung ist schwierig.</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Entfernungsschätzung</h1>

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
            text="Richtig eingeschätzt"
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
