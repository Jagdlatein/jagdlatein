import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Art gehört NICHT zum Raubwild?",
      antworten: [
        { text: "Fuchs", richtig: false },
        { text: "Dachs", richtig: false },
        { text: "Marder", richtig: false },
        { text: "Rehwild", richtig: true }
      ]
    },
    {
      frage: "Wann ist der Fuchs am aktivsten?",
      antworten: [
        { text: "Mittags", richtig: false },
        { text: "In den Nacht- und Dämmerungsstunden", richtig: true },
        { text: "Nur im Winter", richtig: false },
        { text: "Nur während der Ranz", richtig: false }
      ]
    },
    {
      frage: "Welches Merkmal weist typisch auf Marderbefall hin?",
      antworten: [
        { text: "Kugelrunde Trittsiegel", richtig: false },
        { text: "Versetzte Fährte, 4–5 cm", richtig: true },
        { text: "Schalenabdruck", richtig: false },
        { text: "Hufspur", richtig: false }
      ]
    }
  ];

export default function RaubwildKurs({ details }) {
  return (
    <MiniCourse courseId="raubwild" questions={quiz} details={details}>
      <p>
              Raubwild umfasst Arten wie Fuchs, Dachs, Marder und Iltis.
              Sie sind wichtige Glieder des Ökosystems und übernehmen natürliche
              Regulierungsfunktionen. Ihre Aktivitäten konzentrieren sich meist
              auf die Dämmerung und Nachtstunden.
              <br /><br />
              Die sichere Ansprache erfolgt über Fährten, Trittsiegel, Losung
              und Lautäußerungen. Besonders der Rotfuchs ist weit verbreitet
              und passt sich hervorragend an unterschiedliche Lebensräume an.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("raubwild") } };
}
