import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Bockjagd() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(p) {
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🦌 Bockjagd-Simulator</h1>

      {step === 0 && (
        <>
          <p>Ein Rehbock tritt auf 70 m aus der Dickung.</p>
          <p>Er wirkt schmal, wenig Gehörnmasse, langer Träger.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Wie alt ist der Bock?</p>
          <NavigationButton text="1-jährig (Jährling)" onClick={() => answer(1)} />
          <NavigationButton text="Altbock 5+" onClick={() => answer(-2)} />
          <NavigationButton text="2-jährig" onClick={() => answer(-1)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Darfst du ihn schießen?</p>
          <NavigationButton text="Ja – schwacher Jährling" onClick={() => answer(1)} />
          <NavigationButton text="Nein – Verdacht auf Leitbock" onClick={() => answer(-1)} />
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
