import PracticeLayout from "../../components/PracticeLayout";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";

// ------------------------------------------------------------
// 25 SZENARIEN – true = Wild zeigt Krankheitsanzeichen
// ------------------------------------------------------------
const scenarios = [
  {
    "id": 1,
    "title": "Reh – stark hängender Haupt – langsame Bewegungen",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 2,
    "title": "Rehbock – äst normal – glänzendes Fell",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 3,
    "title": "Fuchs – faltiges Fell – schütter – stakst langsam",
    "text": "Können diese Fellveränderungen auf Räude hinweisen, ohne sie allein zu beweisen?",
    "correct": true,
    "explanation": "Haarausfall kann bei Räude auftreten; eine gesicherte Diagnose erfordert fachliche Abklärung.",
    "source": "https://www.jagdverband.de/raeude",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 4,
    "title": "Sau – zieht sicher – glänzende Decke – normale Bewegung",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/frage-und-antwort-papier-zur-afrikanischen-schweinepest-asp",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 5,
    "title": "Reh – wiederholtes Kopfschütteln – taumelnder Gang",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 6,
    "title": "Fuchs – schneller Gang – normales Verhalten",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 7,
    "title": "Reh – dünner Rücken – eingefallen – stumpfes Fell",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 8,
    "title": "Rotwild – ruhiges Äsen – glänzende Decke",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 9,
    "title": "Sau – starkes Lahmen hinten – hinterherhängende Keule",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/frage-und-antwort-papier-zur-afrikanischen-schweinepest-asp",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 10,
    "title": "Rehbock – ruhiges Verhalten – leichte Verschnaufpause",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 11,
    "title": "Reh – Kreisbewegungen – Orientierungslos",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 12,
    "title": "Fuchs – kurze Rast – Fell normal",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 13,
    "title": "Reh – schmaler Wildkörper – struppige Decke – schwankt",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 14,
    "title": "Rotwild – zügiger Schritt – normales Verhalten",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 15,
    "title": "Sau – Fieberanzeichen unbekannt – aber extreme Trägheit",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/frage-und-antwort-papier-zur-afrikanischen-schweinepest-asp",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 16,
    "title": "Reh – strammer Schritt – reagiert gut",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 17,
    "title": "Fuchs – kaum Fell am Schweif – starke Unruhe",
    "text": "Können diese Fellveränderungen auf Räude hinweisen, ohne sie allein zu beweisen?",
    "correct": true,
    "explanation": "Haarausfall kann bei Räude auftreten; eine gesicherte Diagnose erfordert fachliche Abklärung.",
    "source": "https://www.jagdverband.de/raeude",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 18,
    "title": "Reh – mühsames Steigen – Haupt hängt",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 19,
    "title": "Sau – sauberer Gang – ruhige Bewegung",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/frage-und-antwort-papier-zur-afrikanischen-schweinepest-asp",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 20,
    "title": "Reh – leichte Lahmheit – aber sonst fit",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auch leichte Lahmheit ist auffällig; die Ursache ist daraus allein nicht sicher erkennbar.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 21,
    "title": "Reh – wirkt apathisch – reagiert verzögert",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 22,
    "title": "Rotwild – Fell glatt – Lauf stark belastet",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 23,
    "title": "Rehbock – frisst ruhig – dicker Pinsel – klare Augen",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 24,
    "title": "Fuchs – torkelt – bleibt immer wieder stehen",
    "text": "Ist diese Beobachtung ein Anlass für eine nähere fachliche Abklärung?",
    "correct": true,
    "explanation": "Auffälligkeit ist ein Hinweis, keine gesicherte Diagnose.",
    "source": "https://www.jagdverband.de/rund-um-die-jagd/wildbret/erlegen-versorgen-und-behandeln-von-wild",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  },
  {
    "id": 25,
    "title": "Sau – normaler Körperbau – normales Verhalten",
    "text": "Beweist dieses unauffällige Verhalten allein, dass das Tier sicher gesund ist?",
    "correct": false,
    "explanation": "Unauffälliges Aussehen allein belegt keine Gesundheit.",
    "source": "https://www.jagdverband.de/frage-und-antwort-papier-zur-afrikanischen-schweinepest-asp",
    "country": "Beobachtung ersetzt keine tierärztliche Diagnose"
  }
];

// ------------------------------------------------------------
// FEEDBACK
// ------------------------------------------------------------
function InstantFeedback({ isCorrect , scenario }) {
  return (
    <div role="status" aria-live="polite"
      style={{
        marginTop: 20,
        padding: "14px 20px",
        borderRadius: 12,
        fontSize: 18,
        fontWeight: "600",
        color: "white",
        background: isCorrect ? "#2e7d32" : "#c62828",
        textAlign: "center",
      }}
    >
      {isCorrect ? "Richtig erkannt!" : "Falsch eingeschätzt!"}
    {scenario?.explanation && <p style={{ fontWeight: 400, lineHeight: 1.6, marginBottom: 0 }}>{scenario.explanation}</p>}
      {typeof scenario?.source === "string" && scenario.source.startsWith("https://") && <p><a href={scenario.source} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Quelle nachlesen (neuer Tab)</a></p>}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – KRANKES WILD ERKENNEN
// ------------------------------------------------------------
export default function KrankesWildErkennen() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lockButtons, setLockButtons] = useState(false);

  const answerGuard = usePracticeAnswer(step, step >= scenarios.length);
  const current = scenarios[step];

  function answer(isCorrect) {
    if (!answerGuard.accept()) return;
    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) setScore(score + 1);

 answerGuard.schedule(() => {
  setFeedback(null);
  setLockButtons(false);
  setStep((prev) => prev + 1);
}, 10000);
}
  // ------------------------------------------------------------
  // ENDANZEIGE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <PracticeLayout exercise="krankeswild" title="Krankes Wild – Ergebnis" result>

        <ScoreBox score={score} max={scenarios.length} />

        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: passed ? "#e8f5e9" : "#ffebee",
            borderRadius: 12,
            borderLeft: passed ? "6px solid #2e7d32" : "6px solid #c62828",
            fontSize: 18,
          }}
        >
          {passed ? (
            <b>Sehr gut! Du erkennst krankes Wild sicher 🎉</b>
          ) : (
            <b>Krankes Wild zu erkennen braucht Erfahrung – weiter üben!</b>
          )}
        </div>

        <div style={{ marginTop: 30, maxWidth: 420 }}>
          <NavigationButton
            text="Zur Jagdpraxis-Übersicht"
            onClick={() => (window.location.href = "/jagdpraxis")}
          />
        </div>
      </PracticeLayout>
    );
  }

  // ------------------------------------------------------------
  // SIMULATORANSICHT
  // ------------------------------------------------------------
  return (
    <PracticeLayout exercise="krankeswild" title="Krankes Wild erkennen">

     <ScenarioCard
  title={current.title}
  text={current.text}
/>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Ja / trifft zu"
            disabled={lockButtons}
            onClick={() => answer(current.correct)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nein / trifft nicht zu"
            disabled={lockButtons}
            onClick={() => answer(!current.correct)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback scenario={current} isCorrect={feedback} />}
    </PracticeLayout>
  );
}
