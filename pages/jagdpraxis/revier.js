import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – Revierkunde: richtige Einschätzung? true = korrekt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Kuhlen im Wald – windstiller Bereich – dichter Bewuchs", text: "Ist das ein typischer Tageseinstand des Rehwilds?", correct: true },
  { id: 2, title: "Offene Wiese – Mittagszeit – keine Deckung", text: "Ist dies ein realistischer Ruheplatz für Rehwild?", correct: false },
  { id: 3, title: "Hangkante mit Thermik – Morgenwind steigt auf", text: "Rotwild nutzt solche Bereiche vermehrt am Morgen?", correct: true },

  { id: 4, title: "Freie Fläche – frische Suhle – Trittsiegel", text: "Nutzen Schwarzwild diese Bereiche regelmäßig?", correct: true },
  { id: 5, title: "Stark begangener Wanderweg – Geräusche – viel Verkehr", text: "Guter Ruheplatz für Wild?", correct: false },
  { id: 6, title: "Schmale Waldschneise – frische Fegespuren", text: "Hinweis auf Bockterritorium?", correct: true },

  { id: 7, title: "Dichter Fichtenjungwuchs – windstill – kaum Sicht", text: "Geeigneter Einstand für Rehwild?", correct: true },
  { id: 8, title: "Hochmoor – nasse Stellen – kaum Deckung", text: "Regelmäßiger Wechsel von Rehwild?", correct: false },
  { id: 9, title: "Geländewechsel Wald → Wiese – frische Losung", text: "Typischer Wechselpunkt?", correct: true },

  { id: 10, title: "Hangrücken – Thermik fällt ab – Abend", text: "Rotwild zieht bei fallender Thermik abwärts?", correct: true },
  { id: 11, title: "Weit offene Fläche ohne Deckung", text: "Einstände für Schwarzwild?", correct: false },
  { id: 12, title: "Lichtes Buchenaltholz – kaum Unterwuchs", text: "Gibt dem Wild Tagesdeckung?", correct: false },

  { id: 13, title: "Dickung – Brombeeren – Spuren von Suhle", text: "Schwarzwild hält sich hier tagsüber auf?", correct: true },
  { id: 14, title: "Steiler Hang – keine Wechsel erkennbar – blanker Boden", text: "Hauptwechsel?", correct: false },
  { id: 15, title: "Altholzbruch – viel Windwurf – reichlich Deckung", text: "Beliebter Einstand?", correct: true },

  { id: 16, title: "Waldweg – frische Fährten – Querungspunkte", text: "Wechsel?", correct: true },
  { id: 17, title: "Überhöhte Kanzel – offenes Tal – Morgen", text: "Thermik steigt → gute Beobachtung?", correct: true },
  { id: 18, title: "Hochlage – Nebel zieht ein – starker Seitenwind", text: "Guter Pirschort?", correct: false },

  { id: 19, title: "Waldwiese – große Liegestellen – wiederkehrende Nutzung", text: "Tagesruheplatz Rotwild?", correct: true },
  { id: 20, title: "Weinberg – offenes Gelände – wenig Deckung", text: "Einstand für Schwarzwild?", correct: false },

  { id: 21, title: "Talwind zieht nach unten – Abend", text: "Rehwild zieht häufig abwärts mit dem Wind?", correct: true },
  { id: 22, title: "Kahl geschlagenes Feld – keine Deckung mehr vorhanden", text: "Wildruheplatz?", correct: false },
  { id: 23, title: "Wechsel zwischen zwei Dickungen – frische Fegespuren", text: "Bockterritorium?", correct: true },
  { id: 24, title: "Flacher Hang – dichter Heckenstreifen – Windschutz", text: "Rehwild bevorzugt solche Bereiche?", correct: true },

  { id: 25, title: "Steinbruch – offene Fläche – keine Deckung – starker Lärm", text: "Wild nutzt diese Bereiche regelmäßig?", correct: false },
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
      {isCorrect ? "Richtig erkannt!" : "Falsch eingeschätzt!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – REVIERKUNDE
// ------------------------------------------------------------
export default function Revierkunde() {
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

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Revierkunde – Ergebnis
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
            <b>Sehr gut! Du erkennst Geländeformen und Einstände sicher 🎉</b>
          ) : (
            <b>Weiter üben – Gelände lesen erfordert Erfahrung!</b>
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

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Revierkunde & Geländeformen
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
            text="Korrekte Einschätzung"
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
