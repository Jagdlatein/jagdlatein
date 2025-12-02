import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Revier() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🌲 Revierarbeit-Simulator</h1>

      {step === 0 && (
        <>
          <p>Du kontrollierst deine Kanzeln. Eine davon wirkt morsch.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Wie handelst du?</p>
          <NavigationButton text="Sofort sperren & reparieren" onClick={() => answer(1)} />
          <NavigationButton text="Nur Warnhinweis anbringen" onClick={() => answer(-1)} />
          <NavigationButton text="Ignorieren" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Du findest frische Fraßspuren: Verbiss an Jungbäumen.</p>
          <NavigationButton text="Beobachtung verstärken" onClick={() => answer(1)} />
          <NavigationButton text="Fütterung erhöhen" onClick={() => answer(-2)} />
          <NavigationButton text="Nichts tun" onClick={() => answer(-1)} />
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
