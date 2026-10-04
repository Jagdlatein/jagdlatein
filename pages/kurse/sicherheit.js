import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const sicherheitQuiz = [
    {
      frage: "Was ist die wichtigste Grundregel beim sicheren Schießen?",
      antworten: [
        { text: "Immer schnell schießen", richtig: false },
        { text: "Waffe nie auf etwas richten, das man nicht treffen will", richtig: true },
        { text: "Nur im Gelände, nie vom Hochsitz", richtig: false },
        { text: "Immer mit Zielfernrohr schießen", richtig: false }
      ]
    },
    {
      frage: "Was ist beim Schussfeld entscheidend?",
      antworten: [
        { text: "Dass Büsche die Kugel sicher abbremsen", richtig: false },
        { text: "Ein klarer Kugelfang hinter dem Wild", richtig: true },
        { text: "Dass das Ziel sehr weit entfernt ist", richtig: false },
        { text: "Nur die Windrichtung", richtig: false }
      ]
    },
    {
      frage: "Was gehört zum sicheren und rechtmäßigen Waffentransport?",
      antworten: [
        { text: "Ladung im Lauf, aber Sicherung an", richtig: false },
        { text: "Entladen, gegen unbefugten Zugriff gesichert und nach den örtlichen Transportvorgaben", richtig: true },
        { text: "Geladen, aber ohne Magazin", richtig: false },
        { text: "Entladen, aber gespannt", richtig: false }
      ],
      source: "https://www.gesetze-im-internet.de/waffg_2002/__12.html",
    },
    {
      frage: "Welche Aussage zur Sicherheit bei einer Gesellschaftsjagd ist richtig?",
      antworten: [
        { text: "Schussrichtung ist egal, Hauptsache schnell reagieren", richtig: false },
        { text: "Nur im freigegebenen Schussbereich schießen, mit ausreichendem Kugelfang und ohne Gefährdung anderer", richtig: true },
        { text: "Man schießt auf alles, was sich bewegt", richtig: false },
        { text: "Man hält keine Kommunikation mit Nachbarschützen", richtig: false }
      ],
      source: "https://www.svlfg.de/fa-sichere-erntejagd",
    }
  ];

export default function SicherheitImRevierKurs({ details }) {
  return (
    <MiniCourse courseId="sicherheit" questions={sicherheitQuiz} details={details}>
      <p>
              Sicherheit ist das oberste Gebot bei jeder jagdlichen Tätigkeit.
              Hier lernst du die wichtigsten Grundregeln für ein sicheres Verhalten im Revier.
            </p>

      <h2>Grundlagen</h2>

      <p>
              Eine der wichtigsten Sicherheitsregeln lautet:
              <strong>„Behandle jede Waffe so, als wäre sie geladen.“</strong>
              <br /><br />
              Vor jedem Schießen müssen Schussfeld, Hintergrund und Kugelfang eindeutig
              identifiziert werden. Büsche oder Gräser bremsen Geschosse nicht zuverlässig ab.
              <br /><br />
              Beim Transport wird die Waffe <strong>entladen</strong> und gegen unbefugten
              Zugriff gesichert. Behältnis, Zugänglichkeit und zulässiger Transportzweck
              richten sich nach dem örtlichen Waffenrecht.
              <br /><br />
              Auf Gesellschaftsjagden wie Drückjagden gilt:
              Klare Kommunikation, freigegebene Schussbereiche, ausreichender Kugelfang und
              keine Gefährdung von Treibern, Hunden oder anderen Personen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("sicherheit") } };
}
