import PracticeLayout from "../../components/PracticeLayout";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";

export default function Rotte() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const answerGuard = usePracticeAnswer(step);

  function answer(p) {
    if (!answerGuard.accept()) return;
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <PracticeLayout exercise="rotte" title="Schwarzwild-Rotten-Erkennung">

      {step === 0 && (
        <>
          <p>Eine Gruppe Schwarzwild zieht über eine Schneise. Ein kleines Stück bleibt zurück.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Lassen Größe und Position allein Alter und Geschlecht sicher erkennen?</p>
          <NavigationButton text="Die Position beweist, dass es ein Frischling ist" onClick={() => answer(-1)} />
          <NavigationButton text="Nein – eine sichere Ansprache ist mit diesen Angaben nicht möglich" onClick={() => answer(1)} />
          <NavigationButton text="Das letzte Stück ist immer die Leitbache" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Was folgt daraus für eine Schussentscheidung?</p>
          <NavigationButton text="Verzichten – sichere Ansprache, Freigabe und Schusssicherheit sind ungeklärt" onClick={() => answer(1)} />
          <NavigationButton text="Die kleine Körpergröße ersetzt jede weitere Prüfung" onClick={() => answer(0)} />
          <NavigationButton text="Die Leitbache immer zuerst erlegen" onClick={() => answer(-3)} />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <p>Die Position in einer Rotte beweist weder Alter noch Geschlecht oder Führungsrolle. Ohne sichere Ansprache, Freigabe und Gefährdungsprüfung darf aus dem Kurztext keine Schussfreigabe abgeleitet werden.</p>
          <p>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a>. Länderbezug: Deutschland, Österreich, Schweiz; Freigaben immer örtlich prüfen.</p>
          <ScoreBox score={score} max={2} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </PracticeLayout>
  );
}
