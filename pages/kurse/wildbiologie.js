import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was beschreibt den Begriff 'Fortpflanzungszeit'?",
      antworten: [
        { text: "Jahreszeit der Nahrungssuche", richtig: false },
        { text: "Paarungs- und Setzzeit des Wildes", richtig: true },
        { text: "Zeit der Ruhephase", richtig: false },
        { text: "Zeitraum der Fellfärbung", richtig: false }
      ]
    },
    {
      frage: "Wozu dient der Bast beim Hirsch?",
      antworten: [
        { text: "Schutz beim Feindkontakt", richtig: false },
        { text: "Nährstoffversorgung des wachsenden Geweihs", richtig: true },
        { text: "Geräuschdämpfung", richtig: false },
        { text: "Tarnung", richtig: false }
      ]
    }
  ];

export default function WildbiologieKurs({ details }) {
  return (
    <MiniCourse courseId="wildbiologie" questions={quiz} details={details}>
      <p>
              Die Wildbiologie umfasst Verhalten, Fortpflanzung, Ernährung, Energiehaushalt
              und Lebensräume unserer Wildarten. Ein solides Verständnis unterstützt
              eine waidgerechte Jagdausübung und korrekte Ansprache im Revier.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("wildbiologie") } };
}
