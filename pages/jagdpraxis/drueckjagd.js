import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 DRÜCKJAGD-SZENARIEN – TRUE = schießen, FALSE = nicht schießen
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Überläufer – 25 m – Langsam ziehend", text: "Kugelfang vorhanden, Stück läuft ruhig im Treiben.", correct: true },
  { id: 2, title: "Bache – 40 m – Frischlinge sichtbar", text: "Gefahr für führende Bache – nicht schießen!", correct: false },
  { id: 3, title: "Keiler – 60 m – Schnell flüchtend", text: "Schwieriges Ziel, hohe Fehlerquote.", correct: false },

  { id: 4, title: "Überläufer – 35 m – Frei, quer ziehend", text: "Saubere Seite sichtbar, sicherer Hintergrund.", correct: true },
  { id: 5, title: "Rotspießer – 70 m – Hinter Treiberlinie", text: "Gefahr eines Querschlägers.", correct: false },
  { id: 6, title: "Schwarzwild – 20 m – Direkt vor Hunden", text: "Hund könnte gefährdet werden.", correct: false },
  { id: 7, title: "Fuchs – 50 m – Ruhig ziehend", text: "Kleine Trefferfläche, aber möglich.", correct: true },
  { id: 8, title: "Überläufer – 15 m – Kommt frontal", text: "Frontaler Schuss auf bewegtes Stück – heikel.", correct: false },
  { id: 9, title: "Rotwildkalb – 45 m – Hinter Alttier", text: "Gefahr einer Doppelentnahme.", correct: false },
  { id: 10, title: "Keiler – 30 m – Breit ziehend", text: "Gewicht schätzen? Kugelfang sicher.", correct: true },

  { id: 11, title: "Überläufer – 90 m – Schnell ziehend", text: "Zu weit und zu schnell, Risiko hoch.", correct: false },
  { id: 12, title: "Fuchs – 25 m – Kurz sichtbar", text: "Sicherer Kugelfang, kurzer Schussweg.", correct: true },
  { id: 13, title: "Rotwild – 80 m – Treiben unübersichtlich", text: "Gefahr für Treiber nicht ausgeschlossen.", correct: false },
  { id: 14, title: "Überläufer – 40 m – Ruhige Bewegung", text: "Gutes Zielbild.", correct: true },
  { id: 15, title: "Sau – 55 m – Hinter Gestrüpp", text: "Verdeckung = Risiko.", correct: false },

  { id: 16, title: "Überläufer – 20 m – Perfekt breit", text: "Klarer Schuss.", correct: true },
  { id: 17, title: "Keiler – 70 m – Unsichere Altersansprache", text: "Kein sicherer Schuss.", correct: false },
  { id: 18, title: "Fuchs – 60 m – Offen laufend", text: "Möglich, aber kleiner Zielbereich.", correct: true },
  { id: 19, title: "Überläufer – 15 m – Direkt vor Treiber", text: "Gefährdung! Nicht schießen.", correct: false },
  { id: 20, title: "Sau – 35 m – Gute Sicht, ruhiger Ablauf", text: "Sicher antragbar.", correct: true },

  { id: 21, title: "Rotwild – 30 m – Läuft zwischen Hunden", text: "Keine klaren Schussflächen.", correct: false },
  { id: 22, title: "Überläufer – 25 m – Quer, wenig Bewuchs", text: "Gutes Bild, kurze Distanz.", correct: true },
  { id: 23, title: "Fuchs – 45 m – Hinter Baumgruppe", text: "Verdeckung = Risiko.", correct: false },
  { id: 24, title: "Keiler – 40 m – Ruhiges Tempo", text: "Sicherer Kugelfang, gute Chance.", correct: true },
  { id: 25, title: "Sau – 50 m – Dämmerung", text: "Unsicheres Zielbild – Risiko zu groß.", correct: false },
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
// DRÜCKJAGD-SIMULATOR
// ------------------------------------------------------------
export default function Drueckjagd() {
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
    const passed = percent >= 60;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Drückjagd – Ergebnis</h1>

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
          {passed ? <b>Starke Leistung! Drückjagd bestanden 🎉</b> : <b>Weiter üben – Treiben sind anspruchsvoll!</b>}
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Drückjagd-Simulator</h1>

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
