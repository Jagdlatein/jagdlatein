import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Wildunfall() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🚗 Wildunfall-Simulator</h1>

      {step === 0 && (
        <>
          <p>Du kommst zu einem Unfall. Ein Reh liegt verletzt am Straßenrand.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was ist dein erster Schritt?</p>
          <NavigationButton text="Stelle Warndreieck auf" onClick={() => answer(1)} />
          <NavigationButton text="Schieße das Reh sofort ab" onClick={() => answer(-2)} />
          <NavigationButton text="Fahre weiter" onClick={() => answer(-3)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Wen informierst du?</p>
          <NavigationButton text="Jagdrevier-Inhaber / Polizei" onClick={() => answer(1)} />
          <NavigationButton text="Tierschutzverein" onClick={() => answer(-1)} />
          <NavigationButton text="Niemanden" onClick={() => answer(-2)} />
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
