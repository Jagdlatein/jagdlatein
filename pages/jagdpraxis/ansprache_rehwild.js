import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 REHWILD-ANSPRECH-SZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Reh – langer Träger – dünner Körper – feiner Kopf", text: "Ist das eine Geiß?", correct: true },
  { id: 2, title: "Reh – kräftiger Träger – deutlicher Pinsel", text: "Geiß?", correct: false },
  { id: 3, title: "Bock – kleiner Pinsel – Spießer – kurzer Träger", text: "Ist es ein Jahrling?", correct: true },

  { id: 4, title: "Reh – hochtragend – mit Kitzbürzel", text: "Bock?", correct: false },
  { id: 5, title: "Bock – kurze, dünne Stangen – schmale Rose", text: "Jahrling oder Knopfler?", correct: true },
  { id: 6, title: "Reh – Spiegel herzförmig – kein Pinsel sichtbar", text: "Geiß?", correct: true },

  { id: 7, title: "Bock – starke Stangen – lange Stangenlänge", text: "Alterer Bock?", correct: true },
  { id: 8, title: "Reh – sommerkahl – zierlicher Körper – kleiner Kopf", text: "Bock?", correct: false },
  { id: 9, title: "Rehbock – Gehörn wirkt asymmetrisch", text: "Trotzdem Bock?", correct: true },

  { id: 10, title: "Reh – Träger wirkt kurz – Körper wirkt massig", text: "Junge Geiß?", correct: false },
  { id: 11, title: "Bock – Knopfbock – kaum sichtbare Stangen", text: "Jahrling?", correct: false },
  { id: 12, title: "Reh – Kitz eng bei ihr – Führungsgeiß", text: "Erlegbar?", correct: false },

  { id: 13, title: "Bock – Spießer – langer Träger – schmale Brust", text: "Jahrling?", correct: true },
  { id: 14, title: "Geiß – schlanker Körper – kein Pinsel", text: "Geiß korrekt erkannt?", correct: true },
  { id: 15, title: "Reh – kein Kitz – aber Sommer – guter Körperbau", text: "Kann Geiß sein?", correct: true },

  { id: 16, title: "Bock – Stangen in Bast – April", text: "Bock korrekt erkannt?", correct: true },
  { id: 17, title: "Reh – Bauch schwingt stark – schwere Hinterhand", text: "Geiß?", correct: true },
  { id: 18, title: "Bock – sehr kleiner Pinsel – kaum sichtbar", text: "Könnte dennoch Bock sein?", correct: true },

  { id: 19, title: "Rehbock – deutliche Rosen – starke Stangen", text: "Älterer Bock?", correct: true },
  { id: 20, title: "Reh – hochflüchtig – kleiner Körper – Träger kurz", text: "Geiß?", correct: false },

  { id: 21, title: "Reh – Spiegel rundlich – dreckiger Bürzel – Winterdecke", text: "Geiß korrekt erkannt?", correct: true },
  { id: 22, title: "Reh – Pinsel kaum sichtbar – Beine dünn", text: "Geiß?", correct: true },
  { id: 23, title: "Bock – Stangen extrem kurz – Kopf wirkt lang", text: "Sicher Bock?", correct: false },
  { id: 24, title: "Rehbock – deutlicher Pinsel – markanter Hals", text: "Bock richtig erkannt?", correct: true },

  { id: 25, title: "Reh – kein Pinsel – Träger lang – schlank", text: "Geiß?", correct: true },
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
      {isCorrect ? "Richtig angesprochen!" : "Falsch angesprochen!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – REHWILD ANSPRECHEN
// ------------------------------------------------------------
export default function AnspracheRehwild() {
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
          Rehwild-Ansprechen – Ergebnis
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
            <b>Sehr gut! Du kannst Rehwild sicher ansprechen 🎉</b>
          ) : (
            <b>Weiter trainieren – Rehwildansprache erfordert Erfahrung.</b>
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
        Rehwild sicher ansprechen
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
            text="Richtig angesprochen"
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
