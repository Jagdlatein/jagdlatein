import PracticeLayout from "../../components/PracticeLayout";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";

export default function Bockjagd() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const answerGuard = usePracticeAnswer(step);

  function answer(p) {
    if (!answerGuard.accept()) return;
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <PracticeLayout exercise="bockjagd" title="Bockjagd-Wissens&#252;bung">

      {step === 0 && (
        <>
          <p>Ein Rehbock tritt auf 70 m aus der Dickung.</p>
          <p>Er wirkt schmal, wenig Gehörnmasse, langer Träger.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Kannst du das genaue Alter allein aus diesen Merkmalen sicher bestimmen?</p>
          <NavigationButton text="Nein – diese Merkmale erlauben keine sichere genaue Altersangabe" onClick={() => answer(1)} />
          <NavigationButton text="Sicher mindestens fünf Jahre alt" onClick={() => answer(-2)} />
          <NavigationButton text="Sicher genau zwei Jahre alt" onClick={() => answer(-1)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Reicht ein schwaches Gehörn allein für die Entscheidung zur Bejagung?</p>
          <NavigationButton text="Nein – Freigabe, örtliche Regeln, Ansprechen und Sicherheit müssen geklärt sein" onClick={() => answer(1)} />
          <NavigationButton text="Ja – die Gehörnstärke genügt allein" onClick={() => answer(-1)} />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <p>Gehörn und Körpermerkmale sind Hinweise, keine sichere Angabe eines exakten Alters. Ein schwaches Gehörn ersetzt weder Jagdberechtigung und örtliche Freigabe noch die Prüfung von Schussbahn, Kugelfang und persönlichen Fähigkeiten.</p>
          <p>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a>. Länderbezug: Deutschland, Österreich, Schweiz; Freigaben immer örtlich prüfen.</p>
          <ScoreBox score={score} max={2} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </PracticeLayout>
  );
}
