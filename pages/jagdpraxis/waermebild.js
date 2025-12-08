import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 WÄRMEBILD-SZENARIEN – true = korrekt angesprochen
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Kleine kompakte Wärmequelle – kurzer Träger – schnelle Bewegungen", text: "Handelt es sich um einen Fuchs?", correct: true },
  { id: 2, title: "Sehr kleine Quelle – runder Körper – hüpfende Bewegung", text: "Rehwild?", correct: false },
  { id: 3, title: "Langes Wärmebild – deutlicher Spiegelbereich – ruhiges Äsen", text: "Rehwild sicher erkannt?", correct: true },

  { id: 4, title: "Massive Wärmequelle – breiter Vorderkörper – niedrig", text: "Schwarzwild?", correct: true },
  { id: 5, title: "Lange Läufe – hoher Träger – schlanker Körper", text: "Schwarzwild?", correct: false },
  { id: 6, title: "Große Wärmequelle – Kopf kaum erkennbar – langsam ziehend", text: "Rotwild sicher?", correct: true },

  { id: 7, title: "Zwei kleine Wärmequellen eng hintereinander", text: "Bache mit Frischlingen?", correct: true },
  { id: 8, title: "Einzelne kleine Quelle – extrem schnelle Bewegungen", text: "Rotwildkalb?", correct: false },
  { id: 9, title: "Recht große Wärmequelle – schlank – lange Läufe", text: "Rotwild?", correct: true },

  { id: 10, title: "Kompakte Wärmeform – kurze Läufe – keilförmig", text: "Keiler?", correct: true },
  { id: 11, title: "Wärmequelle sehr hell, aber winzig – hektisch", text: "Rehwild?", correct: false },
  { id: 12, title: "Deutliches Wärmebild von zwei gleich großen Stücken", text: "Rotwildkuh + Kalb?", correct: false },

  { id: 13, title: "Warmes, breites Stück – tiefer Schwerpunkt", text: "Schwarzwild?", correct: true },
  { id: 14, title: "Großes Wärmebild – sehr lange Läufe – Kopf klar erkennbar", text: "Fuchs?", correct: false },
  { id: 15, title: "Sehr helles kompaktes Wärmebild – wühlende Bewegung", text: "Sau?", correct: true },

  { id: 16, title: "Wärmequelle klein, rund, kaum Hals erkennbar", text: "Rehgeiß?", correct: false },
  { id: 17, title: "Langgezogene Quelle – hoher Halsansatz – ruhige Schritte", text: "Rehwild?", correct: true },
  { id: 18, title: "Drei Wärmequellen in Linie – unterschiedliche Größe", text: "Rotwildfamilie?", correct: true },

  { id: 19, title: "Sehr breite Front – deutliche Hitze am Kopf – wenig Kontrast am Hinterkörper", text: "Keiler?", correct: true },
  { id: 20, title: "Winzige Quelle – sehr helle Hitze – buschige Form", text: "Fuchs?", correct: true },

  { id: 21, title: "Langgestreckte Kontur – hoher Träger – Hirsche typisch?", text: "Rotwild?", correct: true },
  { id: 22, title: "Schnelle kleine Quelle – extrem agile Bewegungen", text: "Rehwild?", correct: false },
  { id: 23, title: "Komplexes Wärmebild – Gruppenbewegung – verschiedene Höhen", text: "Schwarzwildrotte?", correct: true },
  { id: 24, title: "Wärmequelle sehr schmal – lange Läufe – hoppelnde Bewegung", text: "Feldhase?", correct: true },

  { id: 25, title: "Hitzequelle groß – aber unregelmäßig – kaum Kontur", text: "Rehwild?", correct: false },
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
// HAUPTSIMULATOR – WÄRMEBILD
// ------------------------------------------------------------
export default function Waermebild() {
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
          Wärmebild-Ansprechen – Ergebnis
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
            <b>Sehr gut! Du kannst Wärmebildsignaturen sicher deuten 🎉</b>
          ) : (
            <b>Weiter trainieren – Wärmebild erfordert Übung!</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Wärmebild-Ansprechen</h1>

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
