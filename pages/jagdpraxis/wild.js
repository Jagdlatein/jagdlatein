import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const animals = [
  {
    id: 1,
    title: "Silhouette – hoch, schlank, langer Spiegel",
    text: "Welches Stück ist das?",
    options: [
      { text: "Rehgeiß", correct: true },
      { text: "Überläufer", correct: false },
      { text: "Damspießer", correct: false },
    ]
  },
  {
    id: 2,
    title: "Silhouette – kräftig, abfallender Rücken, Teller oben",
    text: "Welches Stück?",
    options: [
      { text: "Keiler", correct: true },
      { text: "Rotkalb", correct: false },
    ]
  }
];

export default function WildErkennen() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const current = animals[step];

  function answer(correct) {
    if (correct) setScore(score + 1);
    setStep(step + 1);
  }

  if (step >= animals.length) {
    return (
      <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
        <HomeButton />
        <h1>Wild erkennen – Ergebnis</h1>
        <ScoreBox score={score} max={animals.length} />
        <NavigationButton text="Zurück" onClick={() => (window.location.href = "/jagdpraxis")} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Wild erkennen Simulator</h1>
      <ScenarioCard title={current.title} text={current.text} />

      {current.options.map((o, i) => (
        <ActionButton key={i} text={o.text} onClick={() => answer(o.correct)} />
      ))}
    </main>
  );
}
