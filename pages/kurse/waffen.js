import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Was ist eine Grundregel der sicheren Waffenhandhabung?",
    antworten: [
      {
        text: "Die Mündung zeigt grundsätzlich in eine sichere Richtung",
        richtig: true,
      },
      {
        text: "Die Mündung darf zur Kontrolle kurz auf Personen zeigen",
        richtig: false,
      },
      {
        text: "Nur ungeladene Waffen sind gefährlich",
        richtig: false,
      },
      {
        text: "Immer mit eingelegter Patrone führen, um schnell zu sein",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wann gehört der Finger an den Abzug?",
    antworten: [
      {
        text: "Schon beim Angehen zum Stand, um schnell schießen zu können",
        richtig: false,
      },
      {
        text: "Erst, wenn die Waffe ins Ziel eingegangen ist und die Entscheidung zum Schuss gefallen ist",
        richtig: true,
      },
      {
        text: "Immer, solange die Sicherung eingelegt ist",
        richtig: false,
      },
      {
        text: "Beim Klettern über Zäune für besseren Halt",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was gehört zum sicheren und rechtmäßigen Transport einer Büchse?",
    antworten: [
      {
        text: "Geladen, entsichert auf dem Beifahrersitz",
        richtig: false,
      },
      {
        text: "Entladen, gegen unbefugten Zugriff gesichert und nach den örtlichen Transportvorgaben",
        richtig: true,
      },
      {
        text: "Mit eingelegtem Magazin und geschlossener Kammer",
        richtig: false,
      },
      {
        text: "Geladen quer auf dem Amaturenbrett",
        richtig: false,
      },
    ],
    source: "https://www.gesetze-im-internet.de/waffg_2002/__12.html",
  },
  {
    frage: "Wie gehst du beim Übersteigen eines Zaunes mit der Waffe vor?",
    antworten: [
      {
        text: "Geladen und entsichert in der Hand behalten",
        richtig: false,
      },
      {
        text: "Waffe entladen, sicher ablegen oder Partner übergeben",
        richtig: true,
      },
      {
        text: "Waffe mit dem Lauf zuerst über den Zaun werfen",
        richtig: false,
      },
      {
        text: "Waffe auf den Rücken hängen und klettern",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was ist bei der Sicherheitsüberprüfung vor dem Schießen wichtig?",
    antworten: [
      {
        text: "Nur auf das Wild achten, Kugelfang ist nebensächlich",
        richtig: false,
      },
      {
        text: "Kugelfang, Umfeld, mögliche Gefährdungsbereiche und Hintergrund prüfen",
        richtig: true,
      },
      {
        text: "Nur auf Windrichtung und Entfernung achten",
        richtig: false,
      },
      {
        text: "Es reicht, wenn der Nachbarschütze aufgepasst",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wann darf bei einer Gesellschaftsjagd geladen werden?",
    antworten: [
      {
        text: "Schon auf dem Weg vom Auto, um keine Zeit zu verlieren",
        richtig: false,
      },
      {
        text: "Am zugewiesenen Stand nach Einweisung und Freigabe durch die Jagdleitung",
        richtig: true,
      },
      {
        text: "Zu Hause vor der Abfahrt, damit man nichts vergisst",
        richtig: false,
      },
      {
        text: "Beim Aussteigen aus dem Auto",
        richtig: false,
      },
    ],
    source: "https://www.svlfg.de/fa-sichere-erntejagd",
  },
  {
    frage: "Wie kontrollierst du nach der Jagd sicher, ob die Waffe entladen ist?",
    antworten: [
      {
        text: "Kurz auf den Boden schießen, dann ist sie leer",
        richtig: false,
      },
      {
        text: "Bei sicherer Mündungsrichtung nach Herstelleranleitung Magazin und Patronenlager auf Munition prüfen",
        richtig: true,
      },
      {
        text: "Auf das Klicken des Schlagbolzens hören",
        richtig: false,
      },
      {
        text: "Einfach Sicherung einlegen, dann ist alles gut",
        richtig: false,
      },
    ],
    source: "https://www.svlfg.de/sichere-jagd",
  },
];

export default function WaffenKurs({ details }) {
  return (
    <MiniCourse courseId="waffen" questions={quizFragen} details={details}>
      <p>
              Sicherheit geht bei der Jagd immer vor. In diesem Minikurs wiederholst
              du die wichtigsten Regeln für das sichere Hantieren mit der Büchse
              – von der Mündungskontrolle bis zum sicheren Transport.
            </p>

      <h2>Grundregeln</h2>

      <p>
              Behandle jede Waffe so, als wäre sie geladen. Mündung in sichere
              Richtung, Finger außerhalb des Abzugsbügels, erst laden, wenn
              geschossen werden soll – diese Grundsätze retten im Zweifel Leben.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("waffen") } };
}
