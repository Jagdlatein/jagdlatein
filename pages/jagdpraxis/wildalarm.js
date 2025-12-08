import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 WILDALARM-SZENARIEN – true = richtige Entscheidung
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Reh verhofft kurz – blickt zu dir – 60 m", text: "Warten statt sofort schießen?", correct: true },
  { id: 2, title: "Sau bricht aus der Dickung – sehr schnell – 40 m", text: "Schuss abgeben?", correct: false },
  { id: 3, title: "Hirsch zieht misstrauisch – langsame Bewegung – freies Feld", text: "Warten auf besseren Moment?", correct: true },

  { id: 4, title: "Reh springt flüchtig – keine klare Fläche", text: "Schießen?", correct: false },
  { id: 5, title: "Fuchs verhofft kurz breit – 35 m", text: "Chance nutzen?", correct: true },
  { id: 6, title: "Sau reagiert auf Wind – hebt Wurf – unsicherer Kugelfang", text: "Schuss abgeben?", correct: false },

  { id: 7, title: "Reh tuten – Geiß warnt – Kitz möglicherweise da", text: "Schussabgabe vermeiden?", correct: true },
  { id: 8, title: "Fuchs hört dich – dreht sich aber breit hin", text: "Schuss möglich?", correct: true },
  { id: 9, title: "Rotwild wird unruhig – Rudel eng beieinander", text: "Schießen?", correct: false },

  { id: 10, title: "Reh verhofft breit und ruhig – 80 m", text: "Schuss antragen?", correct: true },
  { id: 11, title: "Sau zeichnet – offensichtlich krank – bleibt kurz stehen", text: "Schussabgabe sinnvoll?", correct: true },
  { id: 12, title: "Fuchs zieht hektisch – stark wechselnd", text: "Schießen?", correct: false },

  { id: 13, title: "Reh äugt in deine Richtung – aber ruhig – gute Deckung", text: "Warten?", correct: true },
  { id: 14, title: "Sau verfängt Witterung – beschleunigt – zieht spitz", text: "Schießen?", correct: false },
  { id: 15, title: "Hirsch verhofft – breit – gutes Licht", text: "Chance nutzen?", correct: true },

  { id: 16, title: "Geiß springt auf – Kitz möglicherweise verborgen", text: "Schuss?", correct: false },
  { id: 17, title: "Überläufer bleibt kurz stehen – gutes Zielbild", text: "Schuss antragen?", correct: true },
  { id: 18, title: "Reh flüchtig – in dichtem Bewuchs", text: "Schießen?", correct: false },

  { id: 19, title: "Fuchs sitzt – schaut – perfekter Kugelfang", text: "Schuss?", correct: true },
  { id: 20, title: "Sau bricht frontal heraus – keine klare Trefferfläche", text: "Schuss?", correct: false },

  { id: 21, title: "Rotwild zieht langsam – Hirsch sauber breit", text: "Schießen?", correct: true },
  { id: 22, title: "Reh dreht spitz ab – Schulter verdeckt", text: "Schuss?", correct: false },
  { id: 23, title: "Sau flüchtig – seitlich – kurze Distanz", text: "Sicher zu treffen?", correct: false },
  { id: 24, title: "Fuchs verhofft – leicht ziehend – 50 m", text: "Schussabgabe möglich?", correct: true },

  { id: 25, title: "Rehbock springt weg – kurzer Moment breit – Umgebung unsicher", text: "Lieber nicht schießen?", correct: true }
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
      {isCorrect ? "Richtig reagiert!" : "Falsch reagiert!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – WILDALARM
// ------------------------------------------------------------
export default function Wildalarm() {
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
  // ERGEBNISSE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Wild reagiert – Ergebnis
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
            <b>Sehr gut! Du reagierst sicher auf Wildverhalten 🎉</b>
          ) : (
            <b>Weiter üben – situatives Verhalten ist entscheidend.</b>
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
        Wild reagiert – was nun?
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
            text="Richtig reagiert"
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
