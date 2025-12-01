import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const scenarios = [
  {
    id: 1,
    title: "Silhouette – eher klein, langer schmaler Träger, hoher Spiegel",
    text: "Welches Stück siehst du?",
    options: [
      { text: "Rehgeiß", correct: true },
      { text: "Schmalreh", correct: false },
      { text: "Damspießer", correct: false },
    ],
  },
  {
    id: 2,
    title: "Starkes Stück – gedrungener Körper, hoher Widerrist, dunkler Träger",
    text: "Welche Art ist das?",
    options: [
      { text: "Keiler", correct: true },
      { text: "Rotkalb", correct: false },
      { text: "Gams", correct: false },
    ],
  },
  {
    id: 3,
    title: "Wildkörper ist rotbraun, deutlicher Wedel, rundlicher Spiegel",
    text: "Welches Wild?",
    options: [
      { text: "Damwild", correct: true },
      { text: "Rotwild", correct: false },
      { text: "Rehwild", correct: false },
    ],
  },
  {
    id: 4,
    title: "Schwarzbraune Decke, gerader Rücken, schmale Lauscher – steht an Steilhang",
    text: "Welches Wild siehst du?",
    options: [
      { text: "Gamswild", correct: true },
      { text: "Sikawild", correct: false },
      { text: "Rehschmalreh", correct: false },
    ],
  },
  {
    id: 5,
    title: "Zwei Kitze, dahinter eine führende Geiß – vorsichtig äsend",
    text: "Darf geschossen werden?",
    options: [
      { text: "Nein – führende Geiß ist tabu", correct: true },
      { text: "Ja – eines der Kitze", correct: false },
      { text: "Ja – die Geiß", correct: false },
    ],
  },
  {
    id: 6,
    title: "Schwarzwild – klein, schlank, lange Läufe, helles Borstenkleid",
    text: "Welche Altersklasse?",
    options: [
      { text: "Überläufer", correct: true },
      { text: "Bache", correct: false },
      { text: "Keiler", correct: false },
    ],
  },
  {
    id: 7,
    title: "Ziemlich kleiner Wildkörper, kaum erkennbarer Träger, große Lauscher",
    text: "Was könnte das sein?",
    options: [
      { text: "Kitz", correct: true },
      { text: "Kalb", correct: false },
      { text: "Gais", correct: false },
    ],
  }
];

export default function Wildansprache() {
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
        <h1>Wildansprache – Ergebnis</h1>
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
      <h1>Wildansprache Simulator</h1>

      <ScenarioCard title={current.title} text={current.text} />

      {current.options.map((o, i) => (
        <ActionButton
          key={i}
          text={o.text}
          onClick={() => answer(o.correct)}
        />
      ))}
    </main>
  );
}
