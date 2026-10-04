import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Wie sieht das Trittsiegel des Rotfuchses aus?",
      antworten: [
        { text: "Rund, 10 cm groß", richtig: false },
        { text: "Oval, oft ‚schnürend‘ gesetzt", richtig: true },
        { text: "Sehr tief eingedrückt", richtig: false },
        { text: "Schalenförmig", richtig: false }
      ]
    },
    {
      frage: "Was unterscheidet ein Trittsiegel vom Fährtenbild?",
      antworten: [
        { text: "Trittsiegel ist der einzelne Abdruck", richtig: true },
        { text: "Fährtenbild ist nur der Gangwechsel", richtig: false },
        { text: "Beides ist identisch", richtig: false },
        { text: "Trittsiegel = mehrere Schritte", richtig: false }
      ]
    }
  ];

export default function TrittsiegelKurs({ details }) {
  return (
    <MiniCourse courseId="trittsiegel" questions={quiz} details={details}>
      <p>
              Trittsiegel sind einzelne Fußabdrücke des Wildes. Sie geben Hinweise
              auf Art, Gewicht, Geschwindigkeit und Verhalten. Besonders bei
              Raubwild sind Form, Größe und Gangbild essentiell für eine sichere Ansprache.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("trittsiegel") } };
}
