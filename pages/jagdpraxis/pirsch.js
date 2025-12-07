import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 PIRSCH-SZENARIEN — TRUE = Schuss, FALSE = kein Schuss
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – 60 m – Halbdeckung", text: "Der Bock steht teilweise hinter einem Baum. Keine klare Trefferfläche.", correct: false },
  { id: 2, title: "Überläufer – 35 m – Breit stehend", text: "Freies Feld, sicherer Kugelfang.", correct: true },
  { id: 3, title: "Reh – 80 m – Leicht ziehend", text: "Bewegung gering, gutes Licht.", correct: true },

  { id: 4, title: "Rotwild – 120 m – Im Hang", text: "Schusswinkel schwierig, Kugelfang unsicher.", correct: false },
  { id: 5, title: "Rehgeiß – 40 m – Kitz sichtbar", text: "Ethik: Kein Schuss auf führende Geiß.", correct: false },
  { id: 6, title: "Keiler – 65 m – Breit stehend", text: "Gutes Zielbild, Bewegungsfrei.", correct: true },
  { id: 7, title: "Fuchs – 25 m – Sitzend", text: "Nah, ruhig, sicherer Kugelfang.", correct: true },
  { id: 8, title: "Überläufer – 100 m – Dämmerung", text: "Ziel unscharf – Risiko hoch.", correct: false },
  { id: 9, title: "Rehbock – 30 m – Durch Bewuchs", text: "Gestrüpp verdeckt lebenswichtige Zonen.", correct: false },
  { id: 10, title: "Rotwildspießer – 70 m – Breit", text: "Sichere Lage, klare Fläche.", correct: true },

  { id: 11, title: "Überläufer – 45 m – Kommt ziehend", text: "Langsame Bewegung, gutes Licht.", correct: true },
  { id: 12, title: "Reh – 55 m – Spitz von vorn", text: "Unethischer Winkel.", correct: false },
  { id: 13, title: "Fuchs – 90 m – Ruhig ziehend", text: "Weit + klein = Risiko.", correct: false },
  { id: 14, title: "Keiler – 20 m – Direkt frontal", text: "Gefährliche Situation, schlechter Winkel.", correct: false },
  { id: 15, title: "Rehbock – 40 m – Perfekt breit", text: "Ideales Bild, ruhiges Stück.", correct: true },

  { id: 16, title: "Sau – 75 m – Hinter dünnem Bewuchs", text: "Teilweise verdeckt.", correct: false },
  { id: 17, title: "Reh – 25 m – Breit stehend", text: "Sicherer Umfeld, guter Kugelfang.", correct: true },
  { id: 18, title: "Überläufer – 60 m – Zieht bergauf", text: "Kugelablenkung möglich.", correct: false },
  { id: 19, title: "Fuchs – 35 m – Ruhig stehend", text: "Gutes Bild.", correct: true },
  { id: 20, title: "Rotwild – 90 m – Kahlwildgruppe", text: "Ungenaue Ansprache möglich.", correct: false },

  { id: 21, title: "Rehbock – 55 m – Hinter Zaun", text: "Kugel könnte abprallen.", correct: false },
  { id: 22, title: "Überläufer – 30 m – Breit, ruhig", text: "Sehr gutes Zielbild.", correct: true },
  { id: 23, title: "Reh – 85 m – Bewegung", text: "Bewegungsunschärfe.", correct: false },
  { id: 24, title: "Fuchs – 45 m – Sitzend", text: "Klarer Kugelfang.", correct: true },
  { id: 25, title: "Keiler – 50 m – Hinter Altholz", text: "Gefahr von Splittern & Ablenkung.", correct: false },
];

// ------------------------------------------------------------
// SOFORT-RÜCKMELDUNG
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
// PIRSCH-SIMULATOR
// ------------------------------------------------------------
export default function Pirsch() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Pirsch – Ergebnis</h1>

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
          {passed ? <b>Sehr gut! Pirsch-Simulator bestanden 🎉</b> : <b>Weiter üben – Pirsch erfordert Präzision!</b>}
        </div>

        <div style={{ marginTop: 30, maxWidth: 420 }}>
          <NavigationButton text="Zur Jagdpraxis-Übersicht" onClick={() => (window.location.href = "/jagdpraxis")} />
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Pirsch-Simulator</h1>

      <ScenarioCard title={current.title} text={current.text} />

      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 20 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton text="Schuss antragen" disabled={lockButtons} onClick={() => answer(current.correct)} />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton text="Nicht schießen" disabled={lockButtons} onClick={() => answer(!current.correct)} />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} />}
    </main>
  );
}
