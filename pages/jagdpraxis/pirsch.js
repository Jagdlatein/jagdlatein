import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const scenarios = [
  {
    id: 1,
    title: "Wind dreht nach links",
    text: "Du pirschst auf Rehwild. Der Wind beginnt leicht nach links zu drehen. Wie reagierst du?",
    options: [
      { text: "Sofort abbrechen", correct: true },
      { text: "Weiterlaufen", correct: false },
    ]
  },
  {
    id: 2,
    title: "Knacken im Gebüsch",
    text: "Du hörst ein Knacken. Was machst du?",
    options: [
      { text: "Stehen bleiben und beobachten", correct: true },
      { text: "Schnell weitergehen", correct: false },
    ]
  }
];

export default function Pirsch() {
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
        <h1>Pirsch – Ergebnis</h1>
        <ScoreBox score={score} max={scenarios.length} />
        <NavigationButton text="Zurück" onClick={() => (window.location.href = "/jagdpraxis")} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Pirsch – Verhalten</h1>
      <ScenarioCard title={current.title} text={current.text} />

      {current.options.map((o, i) => (
        <ActionButton key={i} text={o.text} onClick={() => answer(o.correct)} />
      ))}
    </main>
  );
}
