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
    title: "Rehbock – 70 Meter – Breit stehend",
    text: "Ein sauberer Bock steht breit, Kugelfang ist vorhanden, Licht gut. Schuss angetragen?",
    correct: true,
  },
  {
    id: 2,
    title: "Überläufer – 120 Meter – Hinter Bewuchs",
    text: "Du siehst nur Teile des Wildkörpers. Bist du sicher genug?",
    correct: false,
  },
  {
    id: 3,
    title: "Fuchs – 40 Meter – Schräg ziehend",
    text: "Kleine Fläche, Bewegung, aber nah. Schuss?",
    correct: true,
  }
];

export default function Ansitz() {
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
        <h1>Ansitz – Ergebnis</h1>
        <ScoreBox score={score} max={scenarios.length} />
        <NavigationButton text="Zurück" onClick={() => (window.location.href = "/jagdpraxis")} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>Ansitz – Schussentscheidung</h1>
      <ScenarioCard title={current.title} text={current.text} />

      <ActionButton text="Schuss antragen" onClick={() => answer(current.correct)} />
      <ActionButton text="Nicht schießen" onClick={() => answer(!current.correct)} />
    </main>
  );
}
