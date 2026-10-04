import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was gilt als Hauptfehler bei der Nachtjagd?",
      antworten: [
        { text: "Zu frühes Schießen", richtig: false },
        { text: "Schießen ohne sichere Ansprache", richtig: true },
        { text: "Warten auf Mondlicht", richtig: false },
        { text: "Verwendung von Tarnkleidung", richtig: false }
      ]
    },
    {
      frage: "Welche Technik ist für die Pirsch bei Nacht besonders geeignet?",
      antworten: [
        { text: "Fernglas", richtig: false },
        { text: "Wärmebildgerät", richtig: true },
        { text: "Nachtsicht ohne IR", richtig: false },
        { text: "Schießstock", richtig: false }
      ]
    }
  ];

export default function NachtjagdPro({ details }) {
  return (
    <MiniCourse courseId="nachtjagd-pro" questions={quiz} details={details}>
      <p>
              Die professionelle Nachtjagd erfordert sichere Ansprache, präzise Technik
              und Erfahrung. Wärmebildgeräte helfen beim Auffinden von Wärmequellen.
              Bildqualität, Distanz und Deckung begrenzen die erkennbaren Merkmale;
              das Gerät ersetzt weder eine sichere Ansprache noch die Prüfung von
              Schussfeld und Kugelfang. Bei Unsicherheit wird kein Schuss abgegeben.
              Die Zulässigkeit der konkreten Technik ist vor Ort zu klären.
            </p>
      <p><a href="https://www.svlfg.de/sichere-jagd" target="_blank" rel="noopener noreferrer">SVLFG: Sicherheit bei der Jagd</a></p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("nachtjagd-pro") } };
}
