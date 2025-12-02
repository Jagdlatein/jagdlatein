import { useState } from "react";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Kirrung() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  function answer(points) {
    setScore(score + points);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />

      <h1>🪵 Kirrung-Simulator</h1>

      {/* STEP 0 */}
      {step === 0 && (
        <>
          <p>Du näherst dich einer Kirrung. Der Wind kommt schwach von links.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(1)} />
        </>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <p>Eine Rotte Schwarzwild tritt vorsichtig an. Die Leitbache prüft den Wind.</p>
          <NavigationButton text="Weiter" onClick={() => setStep(2)} />
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <p>Frage: Welches Stück darfst du an der Kirrung bevorzugt erlegen?</p>

          <NavigationButton
            text="Einzelner Überläufer"
            onClick={() => answer(1)}
          />
          <NavigationButton
            text="Frischling < 20 kg"
            onClick={() => answer(-1)}
          />
          <NavigationButton
            text="Leitbache"
            onClick={() => answer(-2)}
          />
        </>
      )}

      {/* STEP 3 – ENDE */}
      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <ScoreBox score={score} max={1} />
          <NavigationButton text="Nochmal spielen" onClick={() => { setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
