import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – TRUE = schießen, FALSE = nicht schießen
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – 70 Meter – Breit stehend", text: "Ein sauberer Bock steht breit, Kugelfang ist vorhanden, Licht gut. Schuss angetragen?", correct: true },
  { id: 2, title: "Überläufer – 120 Meter – Hinter Bewuchs", text: "Du siehst nur Teile des Wildkörpers. Bist du sicher genug?", correct: false },
  { id: 3, title: "Fuchs – 40 Meter – Schräg ziehend", text: "Kleine Fläche, Bewegung, aber nah. Schuss?", correct: true },

  { id: 4, title: "Rehbock – 140 m – Im hohen Getreide", text: "Nur Haupt und Brust erkennbar, Kugelfang unklar.", correct: false },
  { id: 5, title: "Überläufer – 60 m – Breit stehend", text: "Klarer Kugelfang, gutes Licht. Saubere Lage.", correct: true },
  { id: 6, title: "Fuchs – 110 m – Schnell ziehend", text: "Hohe Geschwindigkeit, kleine Trefferfläche.", correct: false },
  { id: 7, title: "Rehgeiß – 80 m – Kitz in der Nähe", text: "Kitz könnte gefährdet werden.", correct: false },
  { id: 8, title: "Jährlingsbock – 45 m – Schräg stehend", text: "Gute Lage, Kugelfang sicher.", correct: true },
  { id: 9, title: "Krank wirkender Fuchs – 25 m – Sitzt", text: "Räudig, klarer Kugelfang.", correct: true },
  { id: 10, title: "Sau – 95 m – Hinter dünnem Gestrüpp", text: "Körper teils verdeckt.", correct: false },
  { id: 11, title: "Rehbock – 55 m – Schulter teilweise verdeckt", text: "Keine klare Fläche sichtbar.", correct: false },
  { id: 12, title: "Reh – 150 m – Breit stehend", text: "Sehr weit, Unsicherheit steigt.", correct: false },
  { id: 13, title: "Überläufer – 35 m – Perfekt breit", text: "Ruhiges Stück, idealer Schusswinkel.", correct: true },
  { id: 14, title: "Fuchs – 80 m – Sitzend", text: "Ruhige Situation, Kugelfang sicher.", correct: true },
  { id: 15, title: "Rotwildkahl – 120 m – Rudel in Bewegung", text: "Viele Stücke gefährdet.", correct: false },
  { id: 16, title: "Rehbock – 30 m – Direkt unter dem Hochsitz", text: "Extrem steiler Winkel.", correct: false },
  { id: 17, title: "Fasan – 40 m – Ruhig sitzend", text: "Kleines Ziel, aber klar sichtbar.", correct: true },
  { id: 18, title: "Fuchs – 20 m – Direkt unter der Kanzel", text: "Kein sicherer Kugelfang.", correct: false },
  { id: 19, title: "Rehbock – 100 m – Dämmerung", text: "Zielbild wird unscharf.", correct: false },
  { id: 20, title: "Überläufer – 70 m – Rückenwind", text: "Könnte dich gleich wittern, aber gutes Zielbild.", correct: true },
  { id: 21, title: "Reh – 45 m – Spitz von hinten", text: "Kein ethisch vertretbarer Winkel.", correct: false },
  { id: 22, title: "Fuchs – 90 m – Breit stehend", text: "Gute Trefferfläche, stabil stehend.", correct: true },
  { id: 23, title: "Rehbock – 65 m – Leicht ziehend", text: "Sehr leichte Bewegung, gutes Licht.", correct: true },
  { id: 24, title: "Rotspießer – 130 m – Steht hinter Kuh", text: "Gefahr einer Fehlkugel.", correct: false },
  { id: 25, title: "Reh – 50 m – Breit stehend – Kugelfang perfekt", text: "Sicheres Bild, ruhige Lage.", correct: true }
];

// ------------------------------------------------------------
// SOFORT-RÜCKMELDUNG (grün/rot)
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
        transition: "opacity 0.3s ease",
        textAlign: "center",
      }}
    >
      {isCorrect ? "Richtige Entscheidung!" : "Falsche Entscheidung!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – PREMIUM VERSION
// ------------------------------------------------------------
export default function Ansitz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lockButtons, setLockButtons] = useState(false);

  const current = scenarios[step];

  function answer(isCorrect) {
    if (lockButtons) return;

    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setFeedback(null);
      setLockButtons(false);
      setStep((prev) => prev + 1);
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
        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Ansitz – Ergebnis</h1>

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
          {passed ? <b>Sehr gut! Du hast bestanden 🎉</b> : <b>Weiter üben! Einige Entscheidungen waren kritisch.</b>}
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
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Ansitz-Simulator</h1>

      <ScenarioCard title={current.title} text={current.text} />

      {/* BUTTONS ZENTRIERT */}
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
            text="Schuss antragen"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nicht schießen"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
