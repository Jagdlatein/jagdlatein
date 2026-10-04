import PracticeLayout from "../../components/PracticeLayout";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";

export default function Federwild() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const answerGuard = usePracticeAnswer(step);

  function answer(p) {
    if (!answerGuard.accept()) return;
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <PracticeLayout exercise="federwild" title="Federwild-Wissens&#252;bung">

      {step === 0 && (
        <>
          <p>Ein Ententrupp fliegt an. Eine hat ein scharf gezeichnetes Prachtkleid.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was folgt aus der Beschreibung allein?</p>
          <NavigationButton text="Art und rechtliche Freigabe sind noch nicht sicher geklärt" onClick={() => answer(1)} />
          <NavigationButton text="Alle Enten im Prachtkleid sind überall freigegeben" onClick={() => answer(-2)} />
          <NavigationButton text="Die Gefiederzeichnung allein ersetzt die Artbestimmung" onClick={() => answer(-3)} />
        </>
      )}

      {step === 2 && (
        <>
          <h2>Ergebnis</h2>
          <p>Eine grobe Beschreibung des Gefieders genügt nicht zur sicheren Artbestimmung. Jagdbarkeit und Freigabe unterscheiden sich nach Land, Region, Art, Saison und Schutzstatus; erst danach kommt die Prüfung der Schusssicherheit.</p>
          <p>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a>. Länderbezug: Deutschland, Österreich, Schweiz; Freigaben immer örtlich prüfen.</p>
          <ScoreBox score={score} max={1} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </PracticeLayout>
  );
}
