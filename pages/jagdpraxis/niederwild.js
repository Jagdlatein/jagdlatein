import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import NavigationButton from "./components/NavigationButton";
import ScoreBox from "./components/ScoreBox";
import HomeButton from "./components/HomeButton";

export default function Niederwild() {
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
      <h1>🐇 Niederwild-Wissensübung</h1>

      {step === 0 && (
        <>
          <p>Ein Fasanenhahn fliegt hoch auf. Entfernung 35 m.</p>
          <NavigationButton text="Weiter" onClick={() => { if (!answerGuard.accept()) return; setStep(1); }} />
        </>
      )}

      {step === 1 && (
        <>
          <p>Reichen Artangabe und Entfernung allein für die Entscheidung?</p>
          <NavigationButton text="Nein – Freigabe, Schussfeld und mögliche Gefährdungen sind ungeklärt" onClick={() => answer(1)} />
          <NavigationButton text="Ja – 35 Meter erlauben automatisch einen sicheren Schuss" onClick={() => answer(0)} />
          <NavigationButton text="Andere Personen und Hunde müssen nicht berücksichtigt werden" onClick={() => answer(-2)} />
        </>
      )}

      {step === 2 && (
        <>
          <p>Ein Hase zieht über die Wiese. Entfernung, örtliche Freigabe und Hintergelände sind nicht geklärt.</p>
          <NavigationButton text="Nicht schießen – die entscheidenden Voraussetzungen fehlen" onClick={() => answer(1)} />
          <NavigationButton text="Sofort schießen" onClick={() => answer(-1)} />
          <NavigationButton text="Schießen beim Sprung" onClick={() => answer(-2)} />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Ergebnis</h2>
          <p>Eine Entfernung allein macht keinen Schuss sicher oder rechtlich zulässig. Art und Freigabe müssen geklärt sein, ebenso Gefährdungen von Menschen, Hunden und anderen Tieren sowie die eigenen Fähigkeiten.</p>
          <p>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a>. Länderbezug: Deutschland, Österreich, Schweiz; Freigaben immer örtlich prüfen.</p>
          <ScoreBox score={score} max={2} />
          <NavigationButton text="Neu starten" onClick={() => { if (!answerGuard.accept()) return;  setScore(0); setStep(0); }} />
        </>
      )}
    </main>
  );
}
