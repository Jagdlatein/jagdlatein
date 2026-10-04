import PracticeLayout from "../../components/PracticeLayout";
import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";

// ------------------------------------------------------------
// 25 NACH-SUCHE Szenarien – true = richtige Entscheidung, false = falsch
// ------------------------------------------------------------
const scenarios = [
  {
    "id": 1,
    "title": "Reh – feine Lungenblasen am Anschuss",
    "text": "Kannst du allein wegen schaumigen Schweißes ohne abgestimmtes Vorgehen sofort hinterhergehen?",
    "correct": false,
    "explanation": "Pirschzeichen sind Hinweise. Beginn und Vorgehen mit einem erfahrenen Nachsuchenführer abstimmen.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 2,
    "title": "Keiler – dunkler Schweiß + Panseninhalt",
    "text": "Nachsuchenführer umgehend informieren und die passende Wartezeit mit ihm abstimmen?",
    "correct": true,
    "explanation": "Panseninhalt melden. Eine starre Zeitregel ersetzt keine fachliche Einschätzung.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 3,
    "title": "Reh – wenig Schweiß, aber Fährte tief eingedrückt",
    "text": "Trotz wenig Schweiß eine fachgerechte Kontrollsuche organisieren?",
    "correct": true,
    "explanation": "Wenig Schweiß schließt einen Treffer nicht aus. Ein geeignetes Gespann übernimmt die Kontrolle.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 4,
    "title": "Rotwild – großer vermeintlicher Lungenschweiß-Bereich",
    "text": "Befunde dokumentieren und mit dem Nachsuchenführer die Suche organisieren?",
    "correct": true,
    "explanation": "Auch deutliche Pirschzeichen werden fachlich eingeordnet; keine eigenmächtige Verfolgung.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 5,
    "title": "Überläufer – Flucht 150 m – verdächtige Pirschzeichen gefunden",
    "text": "Bei Verdacht auf Weichschuss die Wartezeit individuell mit dem Nachsuchenführer abstimmen?",
    "correct": true,
    "explanation": "Verletzungsbild und Umstände bestimmen das Vorgehen, nicht pauschal vier oder fünf Stunden.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 6,
    "title": "Reh – viel Knochensplitter – wenig Schweiß",
    "text": "Wegen Knochensplittern eigenmächtig lange warten, ohne die Nachsuche umgehend zu organisieren?",
    "correct": false,
    "explanation": "Knochensplitter sind ernst zu nehmen. Nachsuche zeitnah organisieren und Beginn abstimmen.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 7,
    "title": "Fuchs – fällt im Feuer – kein Fluchtweg sichtbar",
    "text": "Vor dem Aufnehmen aus sicherer Position prüfen, ob das Stück tatsächlich verendet ist?",
    "correct": true,
    "explanation": "Bewegungslosigkeit beweist den Tod nicht. Eigen- und Umfeldsicherheit behalten Vorrang.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 8,
    "title": "Keiler – starkes Gebrumm in Dickung",
    "text": "Allein in die Dickung zu einem vermutlich verletzten Keiler hineingehen?",
    "correct": false,
    "explanation": "Wehrhaftes Wild gefährdet Menschen und Hunde; ein geeignetes Nachsuchegespann einsetzen.",
    "source": "https://www.jagdschutz.ch/wp-content/uploads/2024/01/2023_Richtlinie_Nachsuchenwesen_JAGDAARGAU.pdf",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 9,
    "title": "Rehwild – hellroter Schweiß – Spritzer – pirschbar",
    "text": "Schweißfunde und Fluchtrichtung für den Nachsuchenführer festhalten?",
    "correct": true,
    "explanation": "Farbe allein belegt keinen sicheren tödlichen Treffer. Beobachtungen helfen bei der Einsatzplanung.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 10,
    "title": "Sau – Pansenschweiß – starker Wildbretgeruch",
    "text": "Umgehend Kontakt zum Nachsuchenführer aufnehmen und Wartezeit sowie Suche abstimmen?",
    "correct": true,
    "explanation": "Organisation beginnt unverzüglich; der tatsächliche Suchbeginn ist vom Einzelfall abhängig.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 11,
    "title": "Rotwild – Hohlschuss vermutet – Flucht weit",
    "text": "Einen vermuteten Hohlschuss ohne fachgerechte Kontrolle als harmlosen Fehlschuss abhaken?",
    "correct": false,
    "explanation": "Ein vermeintlich harmloser Schuss kann verletzen; geeigneten Hund und erfahrenen Führer hinzuziehen.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 12,
    "title": "Rehbock – viel vermeintlicher Lungenschweiß – Spur klar",
    "text": "Ein für die Aufgabe geeignetes Gespann einsetzen, statt nur nach der Schweißmenge zu entscheiden?",
    "correct": true,
    "explanation": "Eignung und Erfahrung von Hund und Führer sind entscheidend.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 13,
    "title": "Reh – nur Tropfen dunkelroten Schweißes",
    "text": "Wegen einzelner dunkler Schweißtropfen allein sofort hinterherlaufen?",
    "correct": false,
    "explanation": "Befunde sichern und den Nachsuchenführer informieren; die Fährte nicht unnötig zertreten.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 14,
    "title": "Überläufer – Strecke kurz, Hund frei verfügbar",
    "text": "Den verfügbaren Hund nur im abgestimmten Einsatz eines geeigneten Gespanns verwenden?",
    "correct": true,
    "explanation": "Verfügbarkeit genügt nicht. Ungeplantes Freigeben kann Wild aufscheuchen und Hunde gefährden.",
    "source": "https://www.jagdschutz.ch/wp-content/uploads/2024/01/2023_Richtlinie_Nachsuchenwesen_JAGDAARGAU.pdf",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 15,
    "title": "Rotwild – tiefschwarzer Schweiß – schwere Pirschzeichen",
    "text": "Nachsuche umgehend organisieren und den Beginn fachlich bestimmen lassen?",
    "correct": true,
    "explanation": "Eine Schweißfarbe rechtfertigt keine pauschale Wartezeit von fünf Stunden.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 16,
    "title": "Reh – Fährte verwischt – kein Schweiß",
    "text": "Ohne Schweiß ist eine Verletzung sicher ausgeschlossen?",
    "correct": false,
    "explanation": "Fehlende Pirschzeichen beweisen keinen Fehlschuss; eine fachgerechte Kontrollsuche veranlassen.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 17,
    "title": "Sau – Schweiß mit Leberstrukturen",
    "text": "Gewebefunde dem Nachsuchenführer melden und das weitere Vorgehen abstimmen?",
    "correct": true,
    "explanation": "Vermutete Lebertreffer lassen sich nicht allein mit einem festen Zeitfenster behandeln.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 18,
    "title": "Rehwild – deutliche Fährte + reichlich Schweiß",
    "text": "Anschuss und Fluchtrichtung möglichst schonend markieren und das Gespann informieren?",
    "correct": true,
    "explanation": "Markierungen unterstützen die Suche; unnötiges Ablaufen verschlechtert die Spurenlage.",
    "source": "https://www.jagdschutz.ch/wp-content/uploads/2024/01/2023_Richtlinie_Nachsuchenwesen_JAGDAARGAU.pdf",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 19,
    "title": "Sau – Treffer im Weichbereich – Spur in Dickung",
    "text": "Nach einem vermuteten Weichschuss allein sofort in die Dickung gehen?",
    "correct": false,
    "explanation": "Unüberlegtes Nachgehen kann verletztes Wild aufscheuchen und die spätere Suche erschweren.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 20,
    "title": "Rotwild – Lungenblut + Blasen – ruhige Flucht",
    "text": "Auch bei vermeintlichem Lungentreffer den Suchbeginn mit dem Nachsuchenführer abstimmen?",
    "correct": true,
    "explanation": "Pirschzeichen müssen im Zusammenhang bewertet werden. Kein Befund garantiert einen sicheren Ablauf.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 21,
    "title": "Rehbock – Knochensplitter + Stoßschweiß",
    "text": "Knochensplitter ohne fachliche Einschätzung ignorieren und die Fluchtfährte ablaufen?",
    "correct": false,
    "explanation": "Eine erkennbare Verletzung erfordert fachgerechte Nachsuche; Spuren und Beobachtungen sichern.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 22,
    "title": "Sau – frische Wundbettsuche – Hund zeigt an",
    "text": "Bei einem frischen Wundbett das weitere Vorgehen vom erfahrenen Hundeführer bestimmen lassen?",
    "correct": true,
    "explanation": "Wundbett und Hundeverhalten können auf nahes, lebendes Wild hinweisen; Sicherheit ist vorrangig.",
    "source": "https://www.jagdschutz.ch/wp-content/uploads/2024/01/2023_Richtlinie_Nachsuchenwesen_JAGDAARGAU.pdf",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 23,
    "title": "Reh – kaum Pirschzeichen – aber Fluchtspur markant",
    "text": "Eine unklare Schusswirkung durch ein geeignetes Nachsuchegespann kontrollieren lassen?",
    "correct": true,
    "explanation": "Wenig sichtbare Pirschzeichen schließen eine Verletzung nicht aus.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 24,
    "title": "Rotwild – Leberfarbener Schweiß – großer Fleck",
    "text": "Die Wartezeit anhand der gesamten Situation mit dem Nachsuchenführer festlegen?",
    "correct": true,
    "explanation": "Farbe und Menge des Schweißes ergeben keine allgemeingültige Zwei- oder Drei-Stunden-Regel.",
    "source": "https://www.bjv-ffb.de/jagdpraxis/nachsuche-und-leitfaden/",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
  },
  {
    "id": 25,
    "title": "Sau – keinerlei Schweiß – unklare Situation",
    "text": "Ohne Schweiß die Suche ohne fachgerechte Kontrolle abbrechen?",
    "correct": false,
    "explanation": "Ein unklarer Schuss muss geklärt werden; fehlender Schweiß ist kein Beweis für Unversehrtheit.",
    "source": "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
    "country": "DE/AT/CH: Vorgehen mit örtlichem Nachsuchenführer abstimmen"
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
      {isCorrect ? "Richtige Entscheidung!" : "Falsche Entscheidung!"}
    {scenario?.explanation && <p style={{ fontWeight: 400, lineHeight: 1.6, marginBottom: 0 }}>{scenario.explanation}</p>}
      {typeof scenario?.source === "string" && scenario.source.startsWith("https://") && <p><a href={scenario.source} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Quelle nachlesen (neuer Tab)</a></p>}
    </div>
  );
}

// ------------------------------------------------------------
// NACH-SUCHE SIMULATOR
// ------------------------------------------------------------
export default function Nachsuche() {
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
  // ENDSEITE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <PracticeLayout exercise="nachsuche" title="Nachsuche – Ergebnis" result>

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
            <b>Sehr gut! Deine Nachsuche-Entscheidungen sind stark 🎉</b>
          ) : (
            <b>Weiter trainieren – Nachsuchen erfordern Erfahrung.</b>
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
  // SIMULATOR ANSICHT
// ------------------------------------------------------------
  return (
    <PracticeLayout exercise="nachsuche" title="Nachsuche-Simulator">

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
