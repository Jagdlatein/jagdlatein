import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – Wild richtig ansprechen (true = korrekt, false = falsch)
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehwild – zierlicher Körper – großer Kopf – kurze Läufe", text: "Kitz richtig angesprochen?", correct: true },
  { id: 2, title: "Rehbock – schwache Stangen – dünner Träger – feine Rosen", text: "Alter Bock?", correct: false },
  { id: 3, title: "Rehbock – starke Stangen – dicke Rosen – Muskelpaket", text: "Mittlerer bis alter Bock?", correct: true },

  { id: 4, title: "Rehgeiß – ohne Kitz – zierlicher Körper – kurze Tritte", text: "Ist es eine Schmalgeiß?", correct: true },
  { id: 5, title: "Schwarzwild – 30 kg – langer Strich – feminine Linien", text: "Überläuferkeiler?", correct: false },
  { id: 6, title: "Schwarzwild – massiver Vorderkörper – Schild sichtbar", text: "Keiler?", correct: true },

  { id: 7, title: "Rotwild – großer Körper – druckvolle Haltung – doch kein Geweih", text: "Hirsch?", correct: false },
  { id: 8, title: "Rotwild – schmales Tier – zieht eng hinter anderem Tier", text: "Kalb?", correct: true },
  { id: 9, title: "Rehwild – Bastgeweih im Januar", text: "Bock richtig angesprochen?", correct: true },

  { id: 10, title: "Rehbock – abgekaute, kurze Stangen – abgenutzt", text: "Alter Bock?", correct: true },
  { id: 11, title: "Reh – keine Stangen – schlanker Körper – spitzer Kopf", text: "Geiß?", correct: true },
  { id: 12, title: "Rotwild – kurzer Träger – lange dünne Läufe", text: "Alttier?", correct: false },

  { id: 13, title: "Schwarzwild – runder Kopf – sehr kurze Schnauze", text: "Frischling richtig erkannt?", correct: true },
  { id: 14, title: "Schwarzwild – Keilkopf – wuchtige Schultern – Einzelgänger", text: "Keiler?", correct: true },
  { id: 15, title: "Rotwild – feine Linien – zierlich – unsicher", text: "Schmalspießer?", correct: false },

  { id: 16, title: "Rehwild – langer Körper – feine Statur – keine Stangen", text: "Schmalreh?", correct: true },
  { id: 17, title: "Rehbock – Spieße dünn und sehr kurz", text: "Jährlingsbock?", correct: true },
  { id: 18, title: "Schwarzwild – 50 kg – Sozialverhalten im Trupp", text: "Keiler?", correct: false },

  { id: 19, title: "Rotwild – kurze Stangen – Häkchen – kleiner Körper", text: "Spießer?", correct: true },
  { id: 20, title: "Rotwild – massig – dunkler Spiegel – dicke Stangen", text: "Hirsch mittleren Alters?", correct: true },

  { id: 21, title: "Rehwild – Träger sehr kurz – schmale Brust – keine Stangen", text: "Kitz?", correct: true },
  { id: 22, title: "Schwarzwild – femininer Kopf – keine sichtbare Wamme", text: "Keiler?", correct: false },
  { id: 23, title: "Rehbock – dicke Stangen – deutliche Perlenbildung", text: "Alter Bock?", correct: true },
  { id: 24, title: "Rotwild – groß – ohne Kalb – weit hinter Rudel", text: "Alttier?", correct: false },

  { id: 25, title: "Schwarzwild – kompakter Körper – kräftiges Haupt – Einzelgänger", text: "Keiler?", correct: true },
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
// HAUPTSIMULATOR – Wildansprache
// ------------------------------------------------------------
export default function Wildansprache() {
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
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />
        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Wildansprache – Ergebnis</h1>

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
            <b>Sehr gut! Du beherrschst die Wildansprache 🎉</b>
          ) : (
            <b>Weiter üben – Details sind entscheidend!</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Wildansprache-Trainer</h1>

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
