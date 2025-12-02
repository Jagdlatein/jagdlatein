import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Niederwild() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🐇 Niederwild-Simulator</h1>

      {step === 0 && (
        <>
          <p>Ein Fasanenhahn fliegt hoch auf. Entfernung 35 m.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Schießen?</p>
          <NavigationButton text="Ja – sicherer Schuss" onClick={() => answer(1)} />
          <NavigationButton text="Nein – zu unsicher" onClick={() => answer(0)} />
          <NavigationButton text="Ja – aber in Bodennähe" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Ein Hase zieht breitflächig über die Wiese.</p>
          <NavigationButton text="Nicht schießen – zu große Entfernung" onClick={() => answer(1)} />
          <NavigationButton text="Sofort schießen" onClick={() => answer(-1)} />
          <NavigationButton text="Schießen beim Sprung" onClick={() => answer(-2)} />
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
