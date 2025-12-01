import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const zones = [
  {
    id: 1,
    title: "Rehbock – breit stehend",
    text: "Wo liegt der beste Haltepunkt?",
    options: [
      { text: "Hinterblatt, mittlere Höhe", correct: true },
      { text: "Tief vor dem Blatt", correct: false },
      { text: "Hochblatt", correct: false },
    ]
  },
  {
    id: 2,
    title: "Sau – breit stehend",
    text: "Richtiger Haltepunkt?",
    options: [
      { text: "Hinter dem Schild", correct: true },
      { text: "Mittig Bauch", correct: false },
    ]
  }
];

export default function Trefferzonen() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const current = zones[step];

  function answer(correct) {
    if (correct) setScore(score + 1);
    setStep(step + 1);
  }

  if (step >= zones.length) {
    return (
      <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
        <HomeButton />
        <h1>Trefferzonen – Ergebnis</h1>
        <ScoreBox score={score} max={zones.length} />
        <NavigationButton text="Zurück" onClick={() => (window.location.href = "/jagdpraxis")} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Trefferzonen Simulator</h1>
      <ScenarioCard title={current.title} text={current.text} />

      {current.options.map((o, i) => (
        <ActionButton key={i} text={o.text} onClick={() => answer(o.correct)} />
      ))}
    </main>
  );
}
