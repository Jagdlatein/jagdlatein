import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Was versteht man unter Anschusszeichen?",
    antworten: [
      { text: "Nur die Fährte des flüchtenden Stückes", richtig: false },
      {
        text: "Alle am Schussort auffindbaren Pirschzeichen wie Schweiß, Haar, Knochensplitter",
        richtig: true,
      },
      { text: "Nur Schweiß am Wechsel", richtig: false },
      { text: "Nur Lautäußerungen des Wildes", richtig: false },
    ],
  },
  {
    frage: "Welches Zeichen deutet am ehesten auf einen Kammerschuss hin?",
    antworten: [
      {
        text: "Heller, schaumiger Lungenschweiß am Anschuss",
        richtig: true,
      },
      {
        text: "Reine Losung ohne Schweiß",
        richtig: false,
      },
      {
        text: "Nur Spiegelhaar ohne weiteren Befund",
        richtig: false },
      {
        text: "Knochensplitter vom Röhrenknochen",
        richtig: false,
      },
    ],
  },
  {
    frage: "Woran erkennst du typischerweise einen Laufschuss?",
    antworten: [
      {
        text: "Dunkler Leber- oder Pansenschweiß mit Darminhalt",
        richtig: false,
      },
      {
        text: "Splitter vom Röhrenknochen und weite, oft schweißarme Flucht",
        richtig: true,
      },
      {
        text: "Nur Lungenschaum am Anschuss",
        richtig: false,
      },
      {
        text: "Kein Schweiß, kein Haar, nur Losung",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was spricht TYPISCH für einen Weichschuss (Pansen/Darm)?",
    antworten: [
      {
        text: "Heller, fein zerstäubter Lungenschweiß",
        richtig: false,
      },
      {
        text: "Schweiß mit Panseninhalt, Darminhalt und starkem Geruch",
        richtig: true,
      },
      {
        text: "Nur Spiegelhaar ohne Schweiß",
        richtig: false,
      },
      {
        text: "Nur Knochensplitter am Anschuss",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wie verhältst du dich bei Verdacht auf Weichschuss am sinnvollsten?",
    antworten: [
      {
        text: "Sofort hinterher, bevor die Fährte kalt wird",
        richtig: false,
      },
      {
        text: "Nachsuchenführer umgehend informieren und Wartezeit sowie weiteres Vorgehen mit ihm abstimmen",
        richtig: true,
      },
      {
        text: "Stück direkt laut rufend nachgehen",
        richtig: false,
      },
      {
        text: "Gar nichts unternehmen, das Stück verendet schon irgendwo",
        richtig: false,
      },
    ],
    source: "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
  },
  {
    frage: "Was ist beim Sichern des Anschusses wichtig?",
    antworten: [
      {
        text: "Nur grob merken, irgendwo dort im Bestand",
        richtig: false,
      },
      {
        text: "Genauen Ort einprägen, markieren und erst dann zurück zum Stand",
        richtig: true,
      },
      {
        text: "Anschuss zertrampeln, damit kein anderes Wild gewittert wird",
        richtig: false,
      },
      {
        text: "Keine Markierung setzen, um Unbeteiligte zu verwirren",
        richtig: false,
      },
    ],
  },
  {
    frage: "Welches Hilfsmittel IST sinnvoll am Anschuss?",
    antworten: [
      { text: "Starkes Parfum, um Wildgeruch zu überdecken", richtig: false },
      { text: "Markierungsband oder Zweig zum Kennzeichnen", richtig: true },
      { text: "Laute Musik vom Handy", richtig: false },
      { text: "Offenes Feuer zum besseren Licht", richtig: false },
    ],
  },
];

export default function AnschussKurs({ details }) {
  return (
    <MiniCourse courseId="anschuss" questions={quizFragen} details={details}>
      <p>
              Am Anschuss entscheidet sich oft, ob eine Nachsuche erfolgreich wird.
              In diesem Minikurs wiederholst du typische Anschusszeichen und lernst,
              wie du sie richtig deutest.
            </p>

      <h2>Anschuss & Pirschzeichen</h2>

      <p>
              Schweiß, Haar, Knochensplitter, Panseninhalt – jedes Zeichen liefert
              Hinweise auf die Trefferlage. Wichtig sind Ruhe, sauberes Beobachten
              und der Respekt vor der Arbeit des Nachsuchengespanns.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("anschuss") } };
}
