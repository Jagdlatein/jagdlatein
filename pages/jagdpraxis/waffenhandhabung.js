import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 WAFFENHANDHABUNG-SZENARIEN – true = richtig gehandelt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Waffe wird übernommen – Verschluss geschlossen", text: "Annehmen?", correct: false },
  { id: 2, title: "Waffe übergeben – Verschluss offen – Patronenlager sichtbar leer", text: "Korrekt?", correct: true },
  { id: 3, title: "Beim Pirschgang – Finger liegt am Abzug", text: "Richtig?", correct: false },

  { id: 4, title: "Waffe auf dem Hochsitz – entladen – Lauf nach oben", text: "Sicher?", correct: true },
  { id: 5, title: "Lauf zeigt kurz Richtung Nebenperson", text: "Tolerierbar?", correct: false },
  { id: 6, title: "Waffe transportiert – Futteral verschlossen", text: "Richtig?", correct: true },

  { id: 7, title: "Schussfeld geprüft – Kugelfang gegeben", text: "Schuss antragen?", correct: true },
  { id: 8, title: "Schuss löst sich – trotz gesichert", text: "Waffe weiter benutzen?", correct: false },
  { id: 9, title: "Patrone verklemmt – Störung beheben – Lauf zeigt in sichere Richtung", text: "Korrekt?", correct: true },

  { id: 10, title: "Laden auf der Kanzel – Lauf zeigt Richtung Waldrand", text: "Sicher?", correct: false },
  { id: 11, title: "Waffe überladen – zu viele Patronen im Magazin", text: "Erlaubt?", correct: false },
  { id: 12, title: "Abschussprüfung – Verschluss offen – Magazin entnommen", text: "Korrekt?", correct: true },

  { id: 13, title: "Waffe beim Aufstehen auf dem Hochsitz kurz unkontrolliert", text: "Vertretbar?", correct: false },
  { id: 14, title: "Vor Schuss: Sicherung gelöst – Finger neben Abzug", text: "Richtig?", correct: true },
  { id: 15, title: "Nach Schuss: Waffe sofort sichern und entladen", text: "Korrekt?", correct: true },

  { id: 16, title: "Transport im Auto – ungeladen – Futteral offen", text: "Korrekt?", correct: false },
  { id: 17, title: "Munition in der Tasche – getrennt von der Waffe", text: "Richtig gehandhabt?", correct: true },
  { id: 18, title: "Schussfeld unklar – Schatten und Bewuchs", text: "Schuss abgeben?", correct: false },

  { id: 19, title: "Waffe führt der Hund beim Einsteigen ans Auto kurz um", text: "Noch sicher?", correct: false },
  { id: 20, title: "Drückjagd – Waffe geladen – Sicherung drin – Finger gerade", text: "Richtig?", correct: true },

  { id: 21, title: "Magazin fällt herunter – schmutzt – weiterverwenden?", text: "Unbedenklich?", correct: false },
  { id: 22, title: "Waffe auf dem Schießstand – Lauf zeigt immer Richtung Kugelfang", text: "Korrekt?", correct: true },
  { id: 23, title: "Vor Hindernisüberstieg: Waffe entladen", text: "Richtig?", correct: true },
  { id: 24, title: "Schussabgabe: Finger noch nicht am Abzug während Zielaufnahme", text: "Korrekt?", correct: true },

  { id: 25, title: "Waffe gesichert über die Schulter getragen – Finger nahe am Abzug", text: "Sicher?", correct: false }
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
      {isCorrect ? "Richtig gehandhabt!" : "Falsch gehandhabt!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – WAFFENHANDHABUNG
// ------------------------------------------------------------
export default function Waffenhandhabung() {
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
  // ERGEBNISSE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Waffenhandhabung – Ergebnis
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
            <b>Sehr gut! Deine Waffenhandhabung ist sicher 🎉</b>
          ) : (
            <b>Weiter üben – Waffenhandhabung ist sicherheitskritisch.</b>
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
        Waffenhandhabung
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
            text="Richtig gehandhabt"
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
