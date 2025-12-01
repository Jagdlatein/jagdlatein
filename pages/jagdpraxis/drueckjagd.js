import { useState } from "react";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

const scenarios = [
  {
    id: 1,
    title: "Laufendes Stück – 50 Meter – schräg ziehend",
    text: "Ein Überläufer zieht schräg links an dir vorbei. Sicherer Kugelfang ist vorhanden. Was tust du?",
    options: [
      { text: "Mitziehen, sauberer Vorhaltemaß, Schuss", correct: true },
      { text: "Sofort schießen ohne mitzuziehen", correct: false },
      { text: "Nicht schießen", correct: false },
    ],
  },
  {
    id: 2,
    title: "Hund kommt zuerst – dann Rotwild",
    text: "Vor dir erscheint zuerst ein Hund, unmittelbar dahinter Rotwild. Was machst du?",
    options: [
      { text: "Nicht schießen – Hund gefährdet", correct: true },
      { text: "Schnell schießen bevor der Hund im Weg ist", correct: false },
    ],
  },
  {
    id: 3,
    title: "Starkes Stück Schwarzwild – frontal anwechselnd",
    text: "Ein Keiler kommt frontal im Troll an. Was machst du?",
    options: [
      { text: "Nicht schießen – kein sicherer Kugelfang", correct: true },
      { text: "Frontaler Schuss ist ok", correct: false },
    ],
  },
  {
    id: 4,
    title: "Rotwild – bestätigt – 80 Meter – ziehend",
    text: "Bewegtes Rotwild darf geschossen werden. Kugelfang ist gut. Schießt du?",
    options: [
      { text: "Ja – aber nur wenn sicher angesprochen", correct: true },
      { text: "Nein – niemals Rotwild auf Bewegungsjagd", correct: false },
    ],
  },
  {
    id: 5,
    title: "Jagdlinie – Treiber – Schussfeld",
    text: "Du hörst Treiberstimmen hinter dir und siehst Wild im Seitenwinkel. Was ist erlaubt?",
    options: [
      { text: "Nur in sicheren Schusssektor / Schneise schießen", correct: true },
      { text: "Über die Treiber hinweg schießen", correct: false },
      { text: "Schießen sobald Wild sichtbar ist", correct: false },
    ],
  },
];

export default function Drueckjagd() {
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
        <h1>Drückjagd – Ergebnis</h1>
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
      <h1>Drückjagd-Simulator</h1>
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
