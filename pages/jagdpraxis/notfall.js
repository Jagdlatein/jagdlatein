import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Notfall() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🚨 Notfall-Simulator</h1>

      {step === 0 && (
        <>
          <p>Ein Jagdkollege stürzt vom Hochsitz und ist verletzt.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was tust du zuerst?</p>
          <NavigationButton text="112 anrufen" onClick={() => answer(1)} />
          <NavigationButton text="Nach Hause fahren" onClick={() => answer(-3)} />
          <NavigationButton text="Wildbret versorgen" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Kollege ist bei Bewusstsein – was nun?</p>
          <NavigationButton text="Stabilisieren & betreuen" onClick={() => answer(1)} />
          <NavigationButton text="Alleine lassen" onClick={() => answer(-2)} />
          <NavigationButton text="Wieder auf den Sitz setzen" onClick={() => answer(-2)} />
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
