import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const scenarios = [
  {
    id: 1,
    title: "Keiler kommt frontal auf 15 Meter",
    text: "Du hörst ein Grunzen, dann kommt ein starker Keiler frontal auf dich zu. Was tust du?",
    options: [
      { text: "Seitlich ausweichen, Sichtkontakt halten", correct: true },
      { text: "Rennen", correct: false },
      { text: "Drehen und weglaufen", correct: false },
    ]
  },
  {
    id: 2,
    title: "Keiler steht 40 Meter im Mais",
    text: "Du hörst Brechen im Mais, der Keiler steht aber. Was machst du?",
    options: [
      { text: "Langsam zurück, kein Risiko", correct: true },
      { text: "Laut rufen und ihn vertreiben", correct: false },
    ]
  }
];

export default function Keiler() {
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
        <h1>Keiler – Ergebnis</h1>
        <ScoreBox score={score} max={scenarios.length} />
        <NavigationButton text="Zurück" onClick={() => (window.location.href = "/jagdpraxis")} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Gefahrensituation – Keiler</h1>
      <ScenarioCard title={current.title} text={current.text} />

      {current.options.map((o, i) => (
        <ActionButton key={i} text={o.text} onClick={() => answer(o.correct)} />
      ))}
    </main>
  );
}
