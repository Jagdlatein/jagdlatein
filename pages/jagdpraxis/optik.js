import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 OPTIK-SZENARIEN – true = richtig gehandelt / beurteilt
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Dämmerung – Vergrößerung zu hoch eingestellt", text: "Vergrößerung reduzieren für mehr Licht?", correct: true },
  { id: 2, title: "Nahes Stück – 30 m – ZF auf 10x", text: "Schuss antragen?", correct: false },
  { id: 3, title: "100 m – Fuchs – ZF 5–6x – gutes Licht", text: "Einstellung passend?", correct: true },

  { id: 4, title: "Parallaxe falsch eingestellt – Ziel unscharf", text: "Vor Schuss korrigieren?", correct: true },
  { id: 5, title: "Vergrößerung 12x – flüchtiges Stück", text: "Optimal?", correct: false },
  { id: 6, title: "Dämmerung – große Austrittspupille durch geringe Vergrößerung", text: "Correct?", correct: true },

  { id: 7, title: "Starkes Gegenlicht – keine Sonnenblende", text: "Trotzdem schießen?", correct: false },
  { id: 8, title: "Ziel verwaschen – Dioptrien falsch eingestellt", text: "Korrektur vor Schuss?", correct: true },
  { id: 9, title: "Wärmebild: helles, klares Signal – kein Hintergrund erkennbar", text: "Schussabgabe?", correct: false },

  { id: 10, title: "Ferne Distanz – 180 m – ruhiges Stück – 10x Vergrößerung", text: "Schießen möglich?", correct: true },
  { id: 11, title: "Beschlagene Optik – kalter Ansitz – Feuchtigkeit", text: "Sofort schießen?", correct: false },
  { id: 12, title: "Dämmerung – Ziel gut sichtbar – 3x Vergrößerung", text: "Passend?", correct: true },

  { id: 13, title: "Wärmebild zeigt leichtes Zittern – Stück bewegt sich", text: "Schuss antragen?", correct: false },
  { id: 14, title: "Restlichtverstärker – Stück gut sichtbar – Kugelfang klar", text: "Schussabgabe korrekt?", correct: true },
  { id: 15, title: "ZF schief montiert – Schuss weicht ab", text: "Trotzdem jagen?", correct: false },

  { id: 16, title: "Flüchtige Sau – geringe Vergrößerung für weites Sehfeld", text: "Richtig gewählt?", correct: true },
  { id: 17, title: "Nahbereich – Parallaxe fix auf 100 m – Ziel auf 20 m", text: "Schussabgabe empfohlen?", correct: false },
  { id: 18, title: "Stück auf 120 m – Ziel scharf – ruhiger Anschlag", text: "Schussabgabe möglich?", correct: true },

  { id: 19, title: "Hitzeflimmern – Bild wabert – hohe Vergrößerung", text: "Vergrößerung reduzieren?", correct: true },
  { id: 20, title: "Dämmerung – Vergrößerung zu niedrig – Ziel zu klein", text: "Vergrößerung leicht erhöhen?", correct: true },

  { id: 21, title: "Mondlicht – wenig Kontrast – Ziel schwer erkennbar", text: "Trotzdem schießen?", correct: false },
  { id: 22, title: "Wärmebild hell – klare Silhouette – Kugelfang sichtbar", text: "Schussabgabe möglich?", correct: true },
  { id: 23, title: "ZF auf 1x – Ziel 100 m – präziser Einzelschuss", text: "Optimal?", correct: false },
  { id: 24, title: "Schnee – helles Umfeld – Blendung stark", text: "Helligkeit reduzieren?", correct: true },

  { id: 25, title: "100 m – Reh – 4x – stabile Auflage – klares Bild", text: "Schussabgabe korrekt?", correct: true },
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
      {isCorrect ? "Richtig entschieden!" : "Falsch entschieden!"}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – OPTIK NUTZEN
// ------------------------------------------------------------
export default function Optik() {
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
  // ENDANZEIGE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Optik richtig nutzen – Ergebnis
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
            <b>Sehr gut! Du beherrschst den Umgang mit Optik 🎉</b>
          ) : (
            <b>Weiter üben – Optikfehler sind kritisch.</b>
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
        Optik richtig nutzen
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
            text="Richtig entschieden"
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
