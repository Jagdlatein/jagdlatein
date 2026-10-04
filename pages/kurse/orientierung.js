import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Woran kann man ohne Technik die Himmelsrichtung bestimmen?",
      antworten: [
        { text: "Am Rauschen der Bäume", richtig: false },
        { text: "Am Sonnenstand", richtig: true },
        { text: "Am Jagdhund", richtig: false },
        { text: "An der Temperatur", richtig: false }
      ]
    },
    {
      frage: "Was ist bei der Revierarbeit besonders wichtig?",
      antworten: [
        { text: "Sicherheit und Übersicht", richtig: true },
        { text: "Schnelligkeit", richtig: false },
        { text: "Laute Kommunikation", richtig: false },
        { text: "Alleine arbeiten", richtig: false }
      ]
    }
  ];

export default function OrientierungKurs({ details }) {
  return (
    <MiniCourse courseId="orientierung" questions={quiz} details={details}>
      <p>
              Revierpraxis umfasst Wegeplanung, Wildbeobachtung, Pflegearbeiten und
              Orientierung im Gelände. Wichtig ist stets, die eigene Position,
              Windrichtung und mögliche Gefahren zu kennen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("orientierung") } };
}
