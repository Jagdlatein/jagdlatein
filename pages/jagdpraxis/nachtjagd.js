import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Nachtjagd() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🌙 Nachtjagd-Simulator</h1>

      {step === 0 && (
        <>
          <p>Du jagst mit Wärmebild. Ein Stück erscheint am Waldrand.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was ist deine erste Handlung?</p>
          <NavigationButton text="Art & Sicherheit prüfen" onClick={() => answer(1)} />
          <NavigationButton text="Sofort schießen" onClick={() => answer(-2)} />
          <NavigationButton text="Waffe entsichern" onClick={() => answer(-1)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Das Stück zeigt sich: Schwarzwild Überläufer.</p>
          <NavigationButton text="Bejagen – sicherer Kugelfang" onClick={() => answer(1)} />
          <NavigationButton text="Nicht schießen – kein Kugelfang" onClick={() => answer(1)} />
          <NavigationButton text="Schießen trotz schlechter Sicht" onClick={() => answer(-2)} />
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
