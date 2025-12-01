import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";
import NavigationButton from "./components/NavigationButton";

const signs = [
  {
    id: 1,
    title: "Pirschzeichen: Knochensplitter – hell – klein",
    text: "Was tust du?",
    correct: true // Nachsuche JA
  },
  {
    id: 2,
    title: "Schweiß: hellrot – fein verstäubt",
    text: "Was tust du?",
    correct: false
  }
];

export default function Schusszeichen() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const current = signs[step];

  function answer(correct) {
    if (correct) setScore(score + 1);
    setStep(step + 1);
  }

  if (step >= signs.length) {
    return (
      <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
        <HomeButton />
        <h1>Schusszeichen – Ergebnis</h1>
        <ScoreBox score={score} max={signs.length} />
        <NavigationButton text="Zurück" onClick={() => (window.location.href = "/jagdpraxis")} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Schusszeichen Simulator</h1>
      <ScenarioCard title={current.title} text={current.text} />

      <ActionButton text="Nachsuche JA" onClick={() => answer(current.correct)} />
      <ActionButton text="Nachsuche NEIN" onClick={() => answer(!current.correct)} />
    </main>
  );
}
