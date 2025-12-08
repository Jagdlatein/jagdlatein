import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 MONDPHASEN-SZENARIEN – true = richtig beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Vollmond – klare Nacht – Rotwild zieht spät", text: "Hohe Sichtbarkeit → Aktivität im Freien?", correct: true },
  { id: 2, title: "Neumond – stockdunkel – Rehwild verlagert Aktivität", text: "Mehr Bewegung am frühen Morgen?", correct: true },
  { id: 3, title: "Zunehmender Mond – helle Nacht – Sauen meiden offene Flächen", text: "Typisches Verhalten?", correct: true },

  { id: 4, title: "Vollmond – offenes Feld – Sauen kommen früh raus", text: "Realistisch?", correct: false },
  { id: 5, title: "Halbmond – leichte Bewölkung – Aktivität gedämpft", text: "Weniger Bewegung?", correct: true },
  { id: 6, title: "Neumond – Schwarzwild auf Wiesen – gute Sichtbarkeit", text: "Realistisch?", correct: false },

  { id: 7, title: "Zunehmender Mond – Sauen wechseln zwischen Maisschlägen", text: "Bewegungsintensiv?", correct: true },
  { id: 8, title: "Vollmond – Rehwild äst früh und spät", text: "Typisches Verhalten?", correct: true },
  { id: 9, title: "Neumond – Rotwild zeigt sich offen", text: "Wahrscheinlich?", correct: false },

  { id: 10, title: "Vollmond – starke Bewölkung – kaum Licht", text: "Hohe Aktivität im Freien?", correct: false },
  { id: 11, title: "Mondlos – leichte Thermik – Sauen fühlen sich sicherer", text: "Mehr Aktivität?", correct: true },
  { id: 12, title: "Halbmond – sehr hell – Rehwild verlagert Äsen in die Deckung", text: "Korrekt?", correct: true },

  { id: 13, title: "Zunehmender Mond – ruhige Bedingungen – Fuchs stark aktiv", text: "Richtig?", correct: true },
  { id: 14, title: "Vollmond – harte Schatten – Wild erscheint früher", text: "Realistisch?", correct: false },
  { id: 15, title: "Mondlos – starke Dunkelheit – Rehwild bleibt lange verborgen", text: "Typisch?", correct: true },

  { id: 16, title: "Zunehmender Mond – helle Nacht – Rotwild bleibt im Bestand", text: "Wahrscheinlich?", correct: false },
  { id: 17, title: "Neumond – leichte Bewölkung – Fuchs jagt Maus aktiv", text: "Typisches Verhalten?", correct: true },
  { id: 18, title: "Vollmond – Rehwild reagiert empfindlicher auf Geräusche", text: "Richtig?", correct: true },

  { id: 19, title: "Mondaufgang spät – Nacht beginnt dunkel – Sauen kommen früher", text: "Realistisch?", correct: true },
  { id: 20, title: "Monduntergang früh – Restnacht hell – Sauen erst spät aktiv", text: "Korrekt?", correct: false },

  { id: 21, title: "Zunehmender Mond – helle erste Nachthälfte – Rehwild spät aktiv", text: "Richtig?", correct: true },
  { id: 22, title: "Neumond – völlige Dunkelheit – Rotwild zieht offen über Wiesen", text: "Wahrscheinlich?", correct: false },
  { id: 23, title: "Halbmond – schwacher Schatten – Sauen kommen normal", text: "Richtig?", correct: true },
  { id: 24, title: "Vollmond – Sauen ruhen viel, bewegen sich spät", text: "Typisches Verhalten?", correct: true },

  { id: 25, title: "Mondlos – leichter Schneefall – gute Sichtbarkeit", text: "Realistisch?", correct: false },
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
// HAUPTSIMULATOR – MONDPHASEN
// ------------------------------------------------------------
export default function Mondphasen() {
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
  // ENDANZEIGE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Mondphasen – Ergebnis
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
            <b>Sehr gut! Du verstehst die Aktivität des Wildes nach Mondphasen 🎉</b>
          ) : (
            <b>Weiter üben – Mondverhalten richtig einzuschätzen ist wichtig.</b>
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
  // SIMULATORANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Mondphasen & Revieraktivität
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
