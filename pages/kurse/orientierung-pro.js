import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Kombination hilft bei der Orientierung, wenn elektronische Geräte ausfallen?",
      antworten: [
        { text: "Smartphone allein", richtig: false },
        { text: "Karte und Kompass, deren Nutzung vorher geübt wurde", richtig: true },
        { text: "Richtung nach Gefühl", richtig: false },
        { text: "Sterne nur bei Tageslicht", richtig: false }
      ]
    },
    {
      frage: "Was ist ein typisches Merkmal guter Revierplanung?",
      antworten: [
        { text: "Keine Wege oder Strukturen", richtig: false },
        { text: "Klare Wegeführung & Orientierungspunkte", richtig: true },
        { text: "Unübersichtliche Bestände", richtig: false },
        { text: "Jagd ohne Rücksicht auf Gelände", richtig: false }
      ]
    }
  ];

export default function OrientierungProKurs({ details }) {
  return (
    <MiniCourse courseId="orientierung-pro" questions={quiz} details={details}>
      <p>
              Fortgeschrittene Orientierungstechnik umfasst das Lesen topografischer Karten,
              sichere Kompassführung, Geländestruktur-Erkennen und Navigieren bei Nacht.
              Im Revier sind feste Orientierungspunkte, klare Wege und Sicherheitszonen essenziell.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("orientierung-pro") } };
}
