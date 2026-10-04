import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Größen gehören zu den Einflüssen auf die Geschossflugbahn?",
      antworten: [
        { text: "Waffengewicht", richtig: false },
        { text: "Geschossgeschwindigkeit, Luftwiderstand, Schwerkraft, Wind und Entfernung", richtig: true },
        { text: "Riemenbreite", richtig: false },
        { text: "Schalldämpferfarbe", richtig: false }
      ]
    },
    {
      frage: "Was beschreibt die Deformationswirkung?",
      antworten: [
        { text: "Wie laut ein Schuss ist", richtig: false },
        { text: "Wie sich ein Geschoss im Ziel aufpilzt", richtig: true },
        { text: "Rückstoßverhalten", richtig: false },
        { text: "Reichweite der Optik", richtig: false }
      ]
    }
  ];

export default function BallistikKurs({ details }) {
  return (
    <MiniCourse courseId="ballistik" questions={quiz} details={details}>
      <p>
              Ballistik beschreibt die Flugbahn eines Geschosses. Geschwindigkeit, Masse und
              Form bestimmen Reichweite und Wirkung. Deformationsgeschosse pilzen im Wildkörper auf
              und erhöhen die Energieabgabe.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("ballistik") } };
}
