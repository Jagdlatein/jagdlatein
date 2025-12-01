import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const scenarios = [
  {
    id: 1,
    title: "Schuss: Hochblatt – Stück zeichnet kaum – wenig Schweiß",
    text: "Am Anschuss findest du nur ein paar helle Tropfen. Das Wild flüchtet in Deckung. Was tust du?",
    options: [
      { text: "Sofort nach!", correct: false },
      { text: "20 Minuten warten und dann mit Hund ran", correct: true },
      { text: "Abbrechen, Wild ist sicher tot", correct: false },
    ],
  },
  {
    id: 2,
    title: "Pirschzeichen: Knochensplitter hell – Lunge ausgeschlossen",
    text: "Helle, feine Splitter am Anschuss. Welches Verhalten ist richtig?",
    options: [
      { text: "Sofort verfolgen", correct: false },
      { text: "Nachsuchengespann rufen – nicht selber rein", correct: true },
      { text: "Nur 50 Meter folgen, dann abbrechen", correct: false },
    ],
  },
  {
    id: 3,
    title: "Schweiß: Dunkelrot – dick – Blattschuss?",
    text: "Am Anschuss dunkler, klumpiger Schweiß, tief sitzend. Was bedeutet das?",
    options: [
      { text: "Lebensfährlich – kurze Flucht", correct: false },
      { text: "Pansen- oder Weichschuss – Hund erforderlich", correct: true },
      { text: "Lungenschuss – kurze Nachsuche", correct: false },
    ],
  },
  {
    id: 4,
    title: "Panseninhalt – Grün – Futterreste",
    text: "Du findest Mageninhalt, Wild flüchtet in Dickung. Richtige Vorgehensweise?",
    options: [
      { text: "4–6 Stunden warten – Hund holen – kalte Nachsuche", correct: true },
      { text: "Sofort nach, um Nichtleiden zu vermeiden", correct: false },
      { text: "Abbrechen – das Wild überlebt", correct: false },
    ],
  },
  {
    id: 5,
    title: "Schuss auf Sau – Standlaut in Dickung",
    text: "Der Hund steht Standlaut. Das Stück ist angeschweißt. Was tust du?",
    options: [
      { text: "Nicht hineingehen – Nachsuchengespann arbeiten lassen", correct: true },
      { text: "Sofort in die Dickung rein", correct: false },
      { text: "Hund zurückrufen und alleine nachgehen", correct: false },
    ],
  },
  {
    id: 6,
    title: "Weidwund schweißendes Reh – Fährte wird schlechter",
    text: "Schweiß wird spärlich, Pirschzeichen weniger. Was tust du?",
    options: [
      { text: "Abbrechen und Profi holen", correct: true },
      { text: "Weiter im Laufschritt hinterher", correct: false },
      { text: "Nach Gefühl weitersuchen", correct: false },
    ],
  },
];

export default function Nachsuche() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const current = scenarios[step];

  function answer(correct) {
    if (correct) setScore(score + 1);
    setStep(step + 1);
  }

  if (step >= scenarios.length) {
    return (
      <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
        <HomeButton />
        <h1>Nachsuche – Ergebnis</h1>
        <ScoreBox score={score} max={scenarios.length} />
        <NavigationButton
          text="Zurück"
          onClick={() => (window.location.href = "/jagdpraxis")}
        />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Nachsuche Simulator</h1>

      <ScenarioCard title={current.title} text={current.text} />

      {current.options.map((o, i) => (
        <ActionButton key={i} text={o.text} onClick={() => answer(o.correct)} />
      ))}
    </main>
  );
}
