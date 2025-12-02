import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Rotte() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🐗 Schwarzwild-Rotten-Erkennung</h1>

      {step === 0 && (
        <>
          <p>Eine Gruppe Schwarzwild zieht über eine Schneise. Ein kleines Stück bleibt zurück.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was ist das zurückgebliebene Stück?</p>
          <NavigationButton text="Frischling" onClick={() => answer(-1)} />
          <NavigationButton text="Überläuferbache" onClick={() => answer(1)} />
          <NavigationButton text="Leitbache" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Darf geschossen werden?</p>
          <NavigationButton text="Ja – Überläuferbache ist bejagbar" onClick={() => answer(1)} />
          <NavigationButton text="Nein – Rotte ist in Bewegung" onClick={() => answer(0)} />
          <NavigationButton text="Ja – Leitbache zuerst" onClick={() => answer(-3)} />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <ScoreBox score={score} max={2} />
          <NavigationButton text="Neu starten" onClick={() => { setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
