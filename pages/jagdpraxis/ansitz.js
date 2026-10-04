import { useState, useEffect, useRef } from "react";
import useActivityResult from "../../hooks/useActivityResult";
import ActivityResultNotice from "../../components/ActivityResultNotice";
import ScenarioCard from "./components/ScenarioCard";
import ActionButton from "./components/ActionButton";
import ScoreBox from "./components/ScoreBox";
import NavigationButton from "./components/NavigationButton";
import HomeButton from "./components/HomeButton";

// ------------------------------------------------------------
// 25 SZENARIEN – TRUE = schießen, FALSE = nicht schießen
// ------------------------------------------------------------
const scenarios = [
  { id: 1, title: "Rehbock – 70 Meter – Breit stehend", text: "Ein sauberer Bock steht breit, Kugelfang ist vorhanden, Licht gut. Schuss angetragen?", correct: true },
  { id: 2, title: "Überläufer – 120 Meter – Hinter Bewuchs", text: "Du siehst nur Teile des Wildkörpers. Bist du sicher genug?", correct: false },
  { id: 3, title: "Fuchs – 40 Meter – Schräg ziehend", text: "Der Fuchs bewegt sich. Das Zielbild ist nicht sicher, obwohl er nah ist.", correct: false },

  { id: 4, title: "Rehbock – 140 m – Im hohen Getreide", text: "Nur Haupt und Brust erkennbar, Kugelfang unklar.", correct: false },
  { id: 5, title: "Überläufer – 60 m – Breit stehend", text: "Klarer Kugelfang, gutes Licht. Saubere Lage.", correct: true },
  { id: 6, title: "Fuchs – 110 m – Schnell ziehend", text: "Hohe Geschwindigkeit, kleine Trefferfläche.", correct: false },
  { id: 7, title: "Rehgeiß – 80 m – Führt ein Kitz", text: "Die Geiß führt ein noch abhängiges Kitz. Eine behördliche Ausnahme liegt nicht vor.", correct: false },
  { id: 8, title: "Jährlingsbock – 45 m – Breit stehend", text: "Ruhiges Stück, freie Schussbahn und sicherer Kugelfang.", correct: true },
  { id: 9, title: "Krank wirkender Fuchs – 25 m – Sitzt", text: "Der Fuchs wirkt krank. Die rechtliche Freigabe ist ungeklärt; allein aus dem Aussehen kannst du keine sichere Diagnose ableiten.", correct: false },
  { id: 10, title: "Sau – 95 m – Hinter dünnem Gestrüpp", text: "Körper teils verdeckt.", correct: false },
  { id: 11, title: "Rehbock – 55 m – Schulter teilweise verdeckt", text: "Keine klare Fläche sichtbar.", correct: false },
  { id: 12, title: "Reh – 150 m – Breit stehend", text: "Diese Entfernung liegt außerhalb deiner unter vergleichbaren Bedingungen sicher beherrschten Schussdistanz.", correct: false },
  { id: 13, title: "Überläufer – 35 m – Perfekt breit", text: "Ruhiges Stück, idealer Schusswinkel.", correct: true },
  { id: 14, title: "Fuchs – 80 m – Breit stehend", text: "Ruhiges Stück, freie Schussbahn und sicherer Kugelfang.", correct: true },
  { id: 15, title: "Rotwildkahl – 120 m – Rudel in Bewegung", text: "Viele Stücke gefährdet.", correct: false },
  { id: 16, title: "Rehbock – 30 m – Direkt unter dem Hochsitz", text: "Extrem steiler Winkel.", correct: false },
  { id: 17, title: "Fasan – 40 m – Ruhig sitzend", text: "Der Fasan ist sichtbar, aber das Hintergelände ist nicht einsehbar. Ob Personen gefährdet würden, ist ungeklärt.", correct: false },
  { id: 18, title: "Fuchs – 20 m – Direkt unter der Kanzel", text: "Kein sicherer Kugelfang.", correct: false },
  { id: 19, title: "Rehbock – 100 m – Dämmerung", text: "Zielbild wird unscharf.", correct: false },
  { id: 20, title: "Überläufer – 70 m – Rückenwind", text: "Das Stück steht ruhig und breit. Schussbahn und Kugelfang sind sicher; du kannst die Situation ohne Zeitdruck beurteilen.", correct: true },
  { id: 21, title: "Reh – 45 m – Spitz von hinten", text: "Kein ethisch vertretbarer Winkel.", correct: false },
  { id: 22, title: "Fuchs – 90 m – Breit stehend", text: "Gute Trefferfläche, stabil stehend.", correct: true },
  { id: 23, title: "Rehbock – 65 m – Leicht ziehend", text: "Der Bock bewegt sich weiter. Du hast keine ausreichend sichere Schussmöglichkeit.", correct: false },
  { id: 24, title: "Rotspießer – 130 m – Steht hinter Kuh", text: "Gefahr einer Fehlkugel.", correct: false },
  { id: 25, title: "Reh – 50 m – Breit stehend – Kugelfang perfekt", text: "Sicheres Bild, ruhige Lage.", correct: true }
].map(scenario => ({
  ...scenario,
  text: scenario.correct
    ? `${scenario.text} Das Stück ist eindeutig angesprochen und nach den örtlichen Regeln zur Bejagung freigegeben; notwendige Elterntiere sind ausgeschlossen. Niemand wird gefährdet. Schussbahn, Kugelfang, Licht, Haltung und Entfernung sind sicher beurteilt und liegen innerhalb deiner nachgewiesenen Fähigkeiten.`
    : scenario.text,
}));

const explanations = {
  1: "Die Entscheidung ist in diesem Übungsfall vertretbar, weil Freigabe, sicheres Ansprechen, freie Schussbahn, Kugelfang und persönliche Schießfertigkeit ausdrücklich geklärt sind.",
  2: "Teilweise sichtbares Wild reicht nicht aus. Verdeckende Vegetation verhindert die sichere Beurteilung des Stücks und der Schussbahn.",
  3: "Nähe gleicht ein unsicheres Zielbild bei bewegtem Wild nicht aus. Warte auf eine sicher beurteilbare Situation.",
  4: "Ein unklarer Kugelfang schließt den Schuss aus. Bewuchs ist kein verlässlicher Kugelfang.",
  5: "Alle notwendigen Voraussetzungen sind im Fall ausdrücklich erfüllt. Ein ruhiges Zielbild allein würde ohne diese Prüfung nicht genügen.",
  6: "In dieser Situation kannst du keinen sicheren Schuss gewährleisten. Entfernung und Bewegung erhöhen deine Unsicherheit.",
  7: "Die Geiß wird zur Aufzucht benötigt. Notwendige Elterntiere sind bis zur Selbständigkeit der Jungtiere geschützt; beachte die örtlichen Rechtsvorschriften.",
  8: "Das Stück steht ruhig und breit; auch Freigabe, Schussbahn, Kugelfang und persönliche Fähigkeiten sind geklärt.",
  9: "Ein krankes Erscheinungsbild ersetzt weder eine sichere Diagnose noch die rechtliche Prüfung. Kläre das weitere Vorgehen mit der zuständigen jagdlichen oder behördlichen Stelle.",
  10: "Auch dünner Bewuchs kann die Schussbahn und die Beurteilung des Wildkörpers beeinträchtigen. Warte, bis beides eindeutig frei ist.",
  11: "Die entscheidende Körperpartie ist verdeckt. Du kannst die Schussmöglichkeit nicht sicher beurteilen.",
  12: "Deine persönliche, unter diesen Bedingungen nachgewiesene Grenze ist überschritten. 150 Meter sind keine allgemeine gesetzliche oder für alle Jäger gültige Grenze.",
  13: "Die günstige Lage ist nur zusammen mit den ausdrücklich geprüften rechtlichen und sicherheitsrelevanten Bedingungen ausreichend.",
  14: "Freigabe, sicheres Ansprechen, freie Schussbahn, Kugelfang und eine sicher beherrschte Situation sind in diesem Fall gegeben.",
  15: "Weitere Stücke können in die Schussbahn geraten. Ein Geschoss kann auch nach dem Durchschlagen des anvisierten Wildes gefährden.",
  16: "Der hier beschriebene extreme Winkel bietet keine sicher beurteilte Schussmöglichkeit. Die geringe Entfernung allein macht einen Schuss nicht vertretbar.",
  17: "Ohne sicher beurteiltes Hintergelände kannst du eine Gefährdung von Personen nicht ausschließen. Die Sichtbarkeit des Fasans allein genügt nicht.",
  18: "Ohne sicheren Kugelfang darf kein Kugelschuss abgegeben werden. Die Nähe zur Kanzel ändert daran nichts.",
  19: "Ein unscharfes Zielbild verhindert sicheres Ansprechen und eine sichere Schussentscheidung. Warte oder verzichte.",
  20: "Wind ersetzt keine Sicherheitsprüfung. Hier sind alle Voraussetzungen geklärt; drohendes Wittern darf dich trotzdem niemals zu einem unsicheren Schuss drängen.",
  21: "Die beschriebene Stellung bietet keine vertretbare Schussmöglichkeit. Warte auf eine andere Position.",
  22: "Die Entscheidung gilt nur für die ausdrücklich freigegebene und vollständig sicher beurteilte Situation dieses Falls.",
  23: "Auch langsame Bewegung rechtfertigt keinen Schuss, wenn du die Situation nicht sicher beherrschst. Warte auf eine sichere Stellung.",
  24: "Die Kuh steht in der Schussbahn und könnte getroffen werden, auch durch ein durchschlagendes Geschoss. Kein Schuss in dieser Anordnung.",
  25: "Das eindeutig angesprochene und freigegebene Stück kann im vollständig geprüften Übungsfall bejagt werden. Ein guter Kugelfang allein würde nicht ausreichen.",
};

// ------------------------------------------------------------
// SOFORT-RÜCKMELDUNG (grün/rot)
// ------------------------------------------------------------
function InstantFeedback({ isCorrect, scenario }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: "14px 20px",
        borderRadius: 12,
        fontSize: 18,
        fontWeight: "600",
        color: "white",
        background: isCorrect ? "#2e7d32" : "#c62828",
        transition: "opacity 0.3s ease",
        textAlign: "center",
      }}
    >
      <div role="status">{isCorrect ? "Richtige Entscheidung!" : "Falsche Entscheidung!"}</div>
      <p style={{ fontWeight: 400, lineHeight: 1.6, marginBottom: 0 }}>{explanations[scenario.id]}</p>
    </div>
  );
}

// ------------------------------------------------------------
// HAUPTSIMULATOR – PREMIUM VERSION
// ------------------------------------------------------------
export default function Ansitz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lockButtons, setLockButtons] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const startedAt = useRef(Date.now());
  const answerPending = useRef(false);
  const feedbackTimer = useRef(null);
  const activeScenario = useRef(null);
  const resultCompleted = step >= scenarios.length || (step === scenarios.length - 1 && feedback !== null);
  const activityResult = useActivityResult({
    runKey, completed: resultCompleted, type: "ansitz", country: null, topic: "Ansitzsimulator",
    totalQuestions: scenarios.length, correctAnswers: score, points: score, startedAt: startedAt.current,
  });

  useEffect(() => () => { clearTimeout(feedbackTimer.current); activeScenario.current = null; }, []);

  const current = scenarios[step];
  activeScenario.current = current?.id ?? null;

  function answer(isCorrect, scenarioId) {
    if (answerPending.current || lockButtons || activeScenario.current !== scenarioId) return;
    answerPending.current = true;

    setLockButtons(true);
    setFeedback(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    feedbackTimer.current = setTimeout(() => {
      if (activeScenario.current !== scenarioId) return;
      answerPending.current = false;
      setFeedback(null);
      setLockButtons(false);
      setStep((prev) => prev + 1);
    }, 10000);
  }

  function restart() {
    clearTimeout(feedbackTimer.current);
    answerPending.current = false;
    startedAt.current = Date.now();
    setRunKey(value => value + 1);
    setStep(0);
    setScore(0);
    setFeedback(null);
    setLockButtons(false);
  }

  // ------------------------------------------------------------
  // ENDSEITE
  // ------------------------------------------------------------
  if (step >= scenarios.length) {
    const percent = (score / scenarios.length) * 100;
    const passed = percent >= 70;

    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
        <HomeButton />
        <h1 style={{ fontSize: 34, marginBottom: 20 }}>Ansitz – Ergebnis</h1>

        <ScoreBox score={score} max={scenarios.length} />
        <ActivityResultNotice {...activityResult} nextUrl="/jagdpraxis/ansitz" />

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
          {passed ? <b>Sehr gut! Du hast bestanden 🎉</b> : <b>Weiter üben! Einige Entscheidungen waren kritisch.</b>}
        </div>

        <div style={{ marginTop: 30, maxWidth: 420 }}>
          <NavigationButton text="Noch einmal üben" onClick={restart} />
          <NavigationButton
            text="Zur Jagdpraxis-Übersicht"
            onClick={() => (window.location.href = "/jagdpraxis")}
          />
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // SIMULATOR-ANSICHT
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      <HomeButton />
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>Ansitz-Simulator</h1>
      <p>Situation {step + 1} von {scenarios.length}. Prüfe alle Angaben vor deiner Entscheidung.</p>

      <ScenarioCard
  title={current.title}
  text={current.text}
/>

      {/* BUTTONS ZENTRIERT */}
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
            text="Schuss antragen"
            disabled={lockButtons}
            onClick={() => answer(current.correct, current.id)}
          />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <ActionButton
            text="Nicht schießen"
            disabled={lockButtons}
            onClick={() => answer(!current.correct, current.id)}
          />
        </div>
      </div>

      {feedback !== null && <InstantFeedback isCorrect={feedback} scenario={current} />}
      <p style={{ marginTop: 24, fontSize: 14 }}>Grundlagen: <a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: sichere Jagd</a> und <a href="https://www.gesetze-im-internet.de/bjagdg/__22.html" target="_blank" rel="noopener noreferrer">§ 22 BJagdG (Deutschland)</a>. In Österreich und der Schweiz gelten die jeweiligen Landes- und Kantonsvorschriften.</p>
      <ActivityResultNotice {...activityResult} nextUrl="/jagdpraxis/ansitz" />
    </main>
  );
}
