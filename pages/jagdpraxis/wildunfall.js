import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Wildunfall() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const answerGuard = usePracticeAnswer(step);

  function answer(p) {
    if (!answerGuard.accept()) return;
    setScore(score + p);
    setStep(step + 1);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
      <HomeButton />
      <h1>🚗 Wildunfall-Simulator</h1>

      {step === 0 && (
        <>
          <p>Du kommst zu einem Wildunfall. Ein Reh liegt verletzt am Straßenrand. Menschen sind augenscheinlich nicht verletzt; der Straßenverkehr kann dich und andere weiterhin gefährden.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Was ist dein erster Schritt?</p>
          <NavigationButton text="Eigenschutz beachten und Unfallstelle sicher absichern" onClick={() => answer(1)} />
          <NavigationButton text="Schieße das Reh sofort ab" onClick={() => answer(-2)} />
          <NavigationButton text="Fahre weiter" onClick={() => answer(-3)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Wen informierst du?</p>
          <NavigationButton text="Polizei verständigen; örtlich zuständige Jagd- oder Wildhut hinzuziehen lassen" onClick={() => answer(1)} />
          <NavigationButton text="Tierschutzverein" onClick={() => answer(-1)} />
          <NavigationButton text="Niemanden" onClick={() => answer(-2)} />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <p>Warnblinker einschalten, Warnweste tragen und die Unfallstelle absichern, soweit das ohne eigene Gefährdung möglich ist. Verletzte Menschen benötigen Erste Hilfe und bei einem Notfall den Rettungsdienst über 112.</p>
          <p>Verletztes Wild nicht anfassen, verfolgen oder eigenmächtig töten. Die Polizei informieren und den Anweisungen der zuständigen Personen folgen. Auch wenn das Tier flüchtet, den Unfall melden und die Fluchtrichtung merken.</p>
          <p><a href="https://www.polizei.rlp.de/service/presse/detail/wildunfaelle-vermeiden-landeskriminalamt-gibt-tipps-fuer-autofahrerinnen-und-autofahrer" target="_blank" rel="noopener noreferrer">Quelle: Polizei Rheinland-Pfalz – Verhalten bei Wildunfällen</a>. Zuständigkeiten und Meldewege richten sich nach dem Unfallort.</p>
          <ScoreBox score={score} max={2} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
