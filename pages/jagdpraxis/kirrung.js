import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Kirrung() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const answerGuard = usePracticeAnswer(step);

  function answer(points) {
    if (!answerGuard.accept()) return;
    setScore(score + points);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />

      <h1>🪵 Kirrung-Wissensübung</h1>

      {/* STEP 0 */}
      {step === 0 && (
        <>
          <p>Du näherst dich einer Kirrung. Der Wind kommt schwach von links.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <p>Eine Rotte Schwarzwild tritt vorsichtig an. Ein größeres Stück bleibt aufmerksam; seine Führungsrolle ist noch ungeklärt.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(2); }} />
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <p>Frage: Was muss vor einer Entscheidung geklärt werden?</p>

          <NavigationButton
            text="Sicheres Ansprechen, örtliche Freigabe, Elterntierschutz und Schusssicherheit"
            onClick={() => answer(1)}
          />
          <NavigationButton
            text="Jedes Stück unter 20 kg ist ohne weitere Prüfung freigegeben"
            onClick={() => answer(-1)}
          />
          <NavigationButton
            text="Das größte Stück zuerst erlegen"
            onClick={() => answer(-2)}
          />
        </>
      )}

      {/* STEP 3 – ENDE */}
      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <p>Gewicht, Gruppengröße oder eine vermutete Führungsrolle reichen nicht als Freigabe. Auch die Kirrung selbst unterliegt örtlichen Regeln. Im Zweifel verzichten und die zuständige jagdliche Stelle einbeziehen.</p>
          <p>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a>. Länderbezug: Deutschland, Österreich, Schweiz; Freigaben immer örtlich prüfen.</p>
          <ScoreBox score={score} max={1} />
          <NavigationButton text="Nochmal spielen" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
