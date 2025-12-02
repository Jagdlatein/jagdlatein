import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Fuchs() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🦊 Fuchs-Simulator</h1>

      {step === 0 && (
        <>
          <p>Ein Fuchs zieht über die Wiese. Es ist Februar.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was ist zu beachten?</p>
          <NavigationButton text="Ranzzeit – erhöhte Bewegung" onClick={() => answer(1)} />
          <NavigationButton text="Schonzeit (falsch)" onClick={() => answer(-1)} />
          <NavigationButton text="Er ist tollwütig (falsch)" onClick={() => answer(-1)} />
        </>
      )}

      {step === 2 && (
        <>
          <h2>Ergebnis</h2>
          <ScoreBox score={score} max={1} />
          <NavigationButton text="Neu starten" onClick={() => { setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
