import { useState } from "react";
import usePracticeAnswer from "../../hooks/usePracticeAnswer";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ResultBox from "./components/ResultBox";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 WAFFENHANDHABUNG-SZENARIEN – true = richtig gehandelt
// ------------------------------------------------------------
const scenarios = [
  {
    "id": 1,
    "title": "Eine fremde Waffe wird mit geschlossenem Verschluss gereicht",
    "text": "Ohne eigene Entladekontrolle übernehmen?",
    "correct": false,
    "explanation": "Jede Waffe als geladen behandeln; bei sicherer Mündung Lager und Magazin selbst kontrollieren.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 2,
    "title": "Übergabe: Lager und Magazin kontrolliert leer, Verschluss offen",
    "text": "Ist dieser kontrollierte Zustand bei sicherer Mündungsrichtung richtig?",
    "correct": true,
    "explanation": "Ein offener Verschluss allein genügt nicht; die vollständige Entladekontrolle gehört dazu.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 3,
    "title": "Beim Pirschen liegt der Finger am Abzug",
    "text": "Ist das sicher?",
    "correct": false,
    "explanation": "Finger außerhalb des Abzugsbügels halten, bis der Schuss bewusst abgegeben werden soll.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 4,
    "title": "Auf dem Hochsitz wird eine entladene Waffe gehandhabt",
    "text": "Mündungsrichtung auch jetzt kontrollieren und ungefährlich halten?",
    "correct": true,
    "explanation": "Eine entladene Waffe wird mit derselben Sorgfalt gehandhabt.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 5,
    "title": "Die Laufmündung zeigt kurz auf eine andere Person",
    "text": "Ist das tolerierbar?",
    "correct": false,
    "explanation": "Auch kurzzeitiges Überstreichen einer Person gefährdet sie.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 6,
    "title": "Deutschland: Beförderung nach § 12 Abs. 3 Nr. 2 WaffG",
    "text": "Entladen, nicht zugriffsbereit und zu einem zulässigen Zweck transportieren?",
    "correct": true,
    "explanation": "Ein Futteral allein genügt nicht; Entladezustand, Zugänglichkeit und Transportzweck sind maßgeblich.",
    "source": "https://www.gesetze-im-internet.de/waffg_2002/__12.html",
    "country": "DE"
  },
  {
    "id": 7,
    "title": "Vor dem Schuss werden Ziel, Umfeld, Kugelfang und örtliche Berechtigung geprüft",
    "text": "Ist diese vollständige Prüfung erforderlich?",
    "correct": true,
    "explanation": "Ein vorhandener Kugelfang ersetzt weder sicheres Ansprechen noch die Prüfung möglicher Gefährdungen.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 8,
    "title": "Eine Waffe hat trotz betätigter Sicherung unbeabsichtigt ausgelöst",
    "text": "Ohne fachliche Prüfung weiterverwenden?",
    "correct": false,
    "explanation": "Sicher aus dem Einsatz nehmen; Reparaturen gehören in eine Fachwerkstatt.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 9,
    "title": "Eine Patrone klemmt; die Ursache ist unklar",
    "text": "Sichere Mündung behalten und nur nach Herstelleranleitung fachgerecht vorgehen?",
    "correct": true,
    "explanation": "Unklare Störungen nicht gewaltsam beheben. Bei Zweifel fachliche Hilfe holen.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 10,
    "title": "Beim Laden zeigt die Mündung zum Waldrand; Gefährdung ist unklar",
    "text": "Reicht „Waldrand“ als sichere Richtung?",
    "correct": false,
    "explanation": "Bewuchs beweist keine ungefährliche Richtung. Jede Mündungsbewegung kontrollieren.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 11,
    "title": "Das Magazin soll über die vorgesehene Kapazität hinaus befüllt werden",
    "text": "Ist das sachgerecht?",
    "correct": false,
    "explanation": "Waffe und Magazin nur bestimmungsgemäß nach Herstellerangaben verwenden.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 12,
    "title": "Das Magazin ist entfernt; das Patronenlager wird ebenfalls kontrolliert",
    "text": "Sind beide Kontrollen für sicheres Entladen erforderlich?",
    "correct": true,
    "explanation": "Auch ohne Magazin kann sich noch eine Patrone im Lager befinden.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 13,
    "title": "Beim Aufstehen auf dem Hochsitz bleibt die Waffe kurz unkontrolliert",
    "text": "Ist das vertretbar?",
    "correct": false,
    "explanation": "Waffe und Mündungsrichtung müssen bei jeder Bewegung unter Kontrolle bleiben.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 14,
    "title": "Das Ziel wird erst aufgenommen; die Schussentscheidung ist noch nicht gefallen",
    "text": "Finger außerhalb des Abzugsbügels lassen?",
    "correct": true,
    "explanation": "Zielaufnahme allein ist noch keine bewusste Schussabgabe.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 15,
    "title": "Nach der Schussabgabe wird das Stück beobachtet; vor Absteigen oder Bergen wird entladen",
    "text": "Ist dieses kontrollierte Vorgehen richtig?",
    "correct": true,
    "explanation": "Schussreaktion beobachten und Handhabung situationsgerecht sichern; vor Gefahrenbewegungen entladen.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 16,
    "title": "Deutschland: Standardtransport nach § 12 Abs. 3 Nr. 2 WaffG; entladene Waffe liegt sofort griffbereit",
    "text": "Ist das allein wegen des Entladens zulässig?",
    "correct": false,
    "explanation": "Diese Beförderungsausnahme verlangt auch fehlende Zugriffsbereitschaft. Andere jagdliche Ausnahmen gesondert prüfen.",
    "source": "https://www.gesetze-im-internet.de/waffg_2002/__12.html",
    "country": "DE"
  },
  {
    "id": 17,
    "title": "Deutschland: Munition wird lose in der Tasche neben einer entladenen Waffe transportiert",
    "text": "Reicht dieser Umstand allein als Nachweis eines rechtmäßigen Transports?",
    "correct": false,
    "explanation": "Die gesamte Beförderung muss die einschlägigen Voraussetzungen erfüllen; „getrennt“ allein beantwortet das nicht.",
    "source": "https://www.gesetze-im-internet.de/waffg_2002/__12.html",
    "country": "DE"
  },
  {
    "id": 18,
    "title": "Zielbereich und Hintergrund sind wegen Schatten und Bewuchs unklar",
    "text": "Trotzdem schießen?",
    "correct": false,
    "explanation": "Bei unklarer Gefährdung unterbleibt der Schuss.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 19,
    "title": "Ein Hund stößt beim Einsteigen gegen die Waffe; die Mündung wird unkontrolliert",
    "text": "Ist das sicher?",
    "correct": false,
    "explanation": "Vor Einsteigen entladen und die Waffe gegen unkontrollierte Bewegungen sichern.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 20,
    "title": "Drückjagd: zugewiesener Stand, Freigabe, sichere Mündung; geladene Waffe nach Herstelleranleitung gesichert",
    "text": "Ist dieser Zustand nach Einweisung zulässig?",
    "correct": true,
    "explanation": "Nur während freigegebener Jagdausübung laden; Sicherung ersetzt sichere Handhabung nicht.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 21,
    "title": "Ein Magazin ist nach einem Sturz verschmutzt",
    "text": "Ohne Prüfung weiterverwenden?",
    "correct": false,
    "explanation": "Verschmutzung und Schäden können Störungen verursachen; sichere Prüfung und Reinigung sind erforderlich.",
    "source": "https://so.ch/fileadmin/internet/vwd/vwd-awjf-jagd/pdf/Jagdpruefung/Merkblatt_praktische_Jagdpruefung_Waffenhandhabung.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 22,
    "title": "Auf dem Schützenstand zeigt die Mündung in die freigegebene Schussrichtung",
    "text": "Ist das für die sichere Handhabung erforderlich?",
    "correct": true,
    "explanation": "Die Standaufsicht und Standordnung bleiben zusätzlich verbindlich.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 23,
    "title": "Ein Hindernis soll überwunden werden",
    "text": "Vorher entladen und den sicheren Übergang planen?",
    "correct": true,
    "explanation": "Entladen und kontrollierte Handhabung reduzieren das Risiko beim Hindernisüberstieg.",
    "source": "https://cdn.svlfg.de/fiona8-blobs/public/svlfgonpremiseproduction/8a17ae3e3d74af01/0eb4f2df124a/b11-broschuere-jagd.pdf",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 24,
    "title": "Während der Zielaufnahme liegt der Finger außerhalb des Abzugsbügels",
    "text": "Ist das richtig?",
    "correct": true,
    "explanation": "Erst für die bewusste sichere Schussabgabe an den Abzug gehen.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
  },
  {
    "id": 25,
    "title": "Eine gesicherte Waffe wird mit dem Finger am Abzug getragen",
    "text": "Macht die Sicherung das ungefährlich?",
    "correct": false,
    "explanation": "Eine technische Sicherung ersetzt niemals Mündungskontrolle und Abzugsdisziplin.",
    "source": "https://www.svlfg.de/sichere-jagd",
    "country": "Grundsätzliche Sicherheit; örtliches Recht zusätzlich prüfen"
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
      {isCorrect ? "Richtig gehandhabt!" : "Falsch gehandhabt!"}
    {scenario?.explanation && <p style={{ fontWeight: 400, lineHeight: 1.6, marginBottom: 0 }}>{scenario.explanation}</p>}
      {typeof scenario?.source === "string" && scenario.source.startsWith("https://") && <p><a href={scenario.source} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Quelle nachlesen (neuer Tab)</a></p>}
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – WAFFENHANDHABUNG
// ------------------------------------------------------------
export default function Waffenhandhabung() {
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
  // ERGEBNISSE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />

        <h1 style={{ fontSize: 34, marginBottom: 20 }}>
          Waffenhandhabung – Ergebnis
        </h1>

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
            <b>Sehr gut! Deine Waffenhandhabung ist sicher 🎉</b>
          ) : (
            <b>Weiter üben – Waffenhandhabung ist sicherheitskritisch.</b>
          )}
        </div>

        <div style={{ marginTop: 30, maxWidth: 420 }}>
          <NavigationButton
            text="Zur Jagdpraxis-Übersicht"
            onClick={() => (window.location.href = "/jagdpraxis")}
          />
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // SIMULATORANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />

      <h1 style={{ fontSize: 34, marginBottom: 10 }}>
        Waffenhandhabung
      </h1>

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
    </main>
  );
}
