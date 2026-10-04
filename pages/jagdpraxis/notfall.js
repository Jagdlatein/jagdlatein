import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Notfall() {
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
      <h1>🚨 Notfall-Simulator</h1>

      {step === 0 && (
        <>
          <p>Ein erwachsener Jagdkollege ist vom Hochsitz gestürzt. Du hast die Umgebung auf Gefahren geprüft sowie Bewusstsein und Atmung kontrolliert. Er ist ansprechbar und atmet normal, hat aber starke Schmerzen.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Eigenschutz und erste Kontrolle sind erfolgt. Welcher nächste Schritt ist richtig?</p>
          <NavigationButton text="112 anrufen" onClick={() => answer(1)} />
          <NavigationButton text="Nach Hause fahren" onClick={() => answer(-3)} />
          <NavigationButton text="Wildbret versorgen" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Der Notruf ist abgesetzt. Der Kollege bleibt ansprechbar und atmet normal – wie hilfst du bis zum Eintreffen des Rettungsdienstes?</p>
          <NavigationButton text="Betreuen, warm halten und unnötige Bewegungen vermeiden" onClick={() => answer(1)} />
          <NavigationButton text="Alleine lassen" onClick={() => answer(-2)} />
          <NavigationButton text="Wieder auf den Sitz setzen" onClick={() => answer(-2)} />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <p>Ein Sturz aus Höhe kann schwere Verletzungen verursachen. 112 anrufen, den genauen Ort nennen und Anweisungen der Leitstelle befolgen. Keine Einrenkungsversuche; Bewusstsein und Atmung weiter beobachten.</p>
          <p>Bei Bewusstlosigkeit mit normaler Atmung: Atemwege sichern und stabile Seitenlage. Bei fehlender normaler Atmung: 112 veranlassen und sofort Wiederbelebung beginnen; verfügbare Helfer können einen AED holen, ohne die Herzdruckmassage zu unterbrechen.</p>
          <p>Quellen: <a href="https://www.drk.de/hilfe-in-deutschland/erste-hilfe/knochenbruch/knochenbrueche/" target="_blank" rel="noopener noreferrer">DRK: Verletzungen</a> · <a href="https://www.drk.de/hilfe-in-deutschland/erste-hilfe/erste-hilfe-massnahmen-zur-wiederbelebung-pruefen-rufen-druecken/" target="_blank" rel="noopener noreferrer">DRK: Wiederbelebung</a></p>
          <ScoreBox score={score} max={2} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
