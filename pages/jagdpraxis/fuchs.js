import PracticeLayout from "../../components/PracticeLayout";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";

export default function Fuchs() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const answerGuard = usePracticeAnswer(step);

  function answer(p) {
    if (!answerGuard.accept()) return;
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <PracticeLayout exercise="fuchs" title="Fuchs-Wissens&#252;bung">

      {step === 0 && (
        <>
          <p>Ein Fuchs zieht über die Wiese. Es ist Februar.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Wie beurteilst du die Situation rechtlich und fachlich?</p>
          <NavigationButton text="Örtliche Jagdzeiten und Elterntierschutz prüfen; Bewegung ist keine Diagnose" onClick={() => answer(1)} />
          <NavigationButton text="Im Februar gilt überall dieselbe Jagdzeit" onClick={() => answer(-1)} />
          <NavigationButton text="Ein Fuchs auf der Wiese hat sicher Tollwut" onClick={() => answer(-1)} />
        </>
      )}

      {step === 2 && (
        <>
          <h2>Ergebnis</h2>
          <p>Bewegung und Jahreszeit beweisen keine Erkrankung. Jagd- und Schonzeiten sowie der Schutz notwendiger Elterntiere sind anhand der am Ort geltenden Vorschriften zu prüfen.</p>
          <p>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a>. Länderbezug: Deutschland, Österreich, Schweiz; Freigaben immer örtlich prüfen.</p>
          <ScoreBox score={score} max={1} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </PracticeLayout>
  );
}
