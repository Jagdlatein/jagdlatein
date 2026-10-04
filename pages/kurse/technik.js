import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was ist ein Vorteil von Wärmebildgeräten?",
      antworten: [
        { text: "Sie zeigen Farben realistisch", richtig: false },
        { text: "Sie erkennen Wärmesignaturen unabhängig vom Licht", richtig: true },
        { text: "Sie ersetzen die sichere Ansprache", richtig: false },
        { text: "Sie sind bei Regen nutzlos", richtig: false }
      ]
    },
    {
      frage: "Worauf muss bei Technik immer geachtet werden?",
      antworten: [
        { text: "Aufladung, Sicherheit & Bedienung", richtig: true },
        { text: "Farbe des Geräts", richtig: false },
        { text: "Modetrends", richtig: false },
        { text: "Nur Mondlicht", richtig: false }
      ]
    }
  ];

export default function TechnikKurs({ details }) {
  return (
    <MiniCourse courseId="technik" questions={quiz} details={details}>
      <p>
              Moderne Jagdtechnik unterstützt sichere Entscheidungen. Wärmebildgeräte
              erkennen Wild unabhängig von Lichtquellen, erleichtern die Pirsch und
              erhöhen die Sicherheit bei Nacht und schlechtem Wetter.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("technik") } };
}
