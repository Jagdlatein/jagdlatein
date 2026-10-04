import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was ist die wichtigste Voraussetzung für erfolgreiche Lockjagd?",
      antworten: [
        { text: "Möglichst lautes und häufiges Locken", richtig: false },
        { text: "Natürliche Laute + richtige Jahreszeit + Windrichtung", richtig: true },
        { text: "Bunte Kleidung", richtig: false },
        { text: "Viel Bewegung am Stand", richtig: false }
      ]
    },
    {
      frage: "Warum beeinflusst Wind die Planung einer Lockjagd?",
      antworten: [
        { text: "Wild ignoriert Gerüche", richtig: false },
        { text: "Wind transportiert die eigene Witterung und beeinflusst, wo Wild sie wahrnehmen kann", richtig: true },
        { text: "Wind hilft beim Lockruf-Tragen", richtig: false },
        { text: "Der Wind ist unwichtig", richtig: false }
      ]
    },
    {
      frage: "Welche Locklaute werden typischerweise beim Fuchs verwendet?",
      antworten: [
        { text: "Vogelangstruf, Hasenklage, Mäusepfiff", richtig: true },
        { text: "Kuhglocke", richtig: false },
        { text: "Hirschtrompete", richtig: false },
        { text: "Krähenbalzruf", richtig: false }
      ]
    },
    {
      frage: "Wann ist Blattjagd auf Rehwild sinnvoll?",
      antworten: [
        { text: "Im Dezember", richtig: false },
        { text: "Nur während der Blattzeit (Juli/August)", richtig: true },
        { text: "Nur nachts", richtig: false },
        { text: "Im Frühjahr", richtig: false }
      ]
    },
    {
      frage: "Wie sollte man Lockrufe beginnen?",
      antworten: [
        { text: "Sehr laut starten", richtig: false },
        { text: "Leise beginnen und steigern", richtig: true },
        { text: "Dauerhaft gleich laut rufen", richtig: false },
        { text: "Ununterbrochen rufen", richtig: false }
      ]
    },
    {
      frage: "Was ist bei der Krähenjagd besonders wichtig?",
      antworten: [
        { text: "Locker und auffällig bewegen", richtig: false },
        { text: "Gutes Tarnbild + natürliches Lockbild", richtig: true },
        { text: "Auf dem Feldweg stehen", richtig: false },
        { text: "Immer ohne Lockbild jagen", richtig: false }
      ]
    }
  ];

export default function LockjagdBasicKurs({ details }) {
  return (
    <MiniCourse courseId="lockjagd" questions={quiz} details={details}>
      <p>
              Die Lockjagd ist eine der spannendsten Jagdarten. Sie verlangt Gefühl,
              Kenntnis über Lautäußerungen des Wildes und perfekte Tarnung. Dieser Kurs
              vermittelt die Grundlagen für Fuchs-, Rehwild- und Krähenlockjagd.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("lockjagd") } };
}
