import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was verbessert die Präzision bei weiten Schüssen?",
      antworten: [
        { text: "Zittern", richtig: false },
        { text: "Fester Anschlag + ruhige Atmung", richtig: true },
        { text: "Schnelles Abdrücken", richtig: false },
        { text: "Augen schließen", richtig: false }
      ]
    },
    {
      frage: "Was beeinflusst die Ballistik stark?",
      antworten: [
        { text: "Farbe der Waffe", richtig: false },
        { text: "Geschossgewicht & Geschwindigkeit", richtig: true },
        { text: "Riemenbreite", richtig: false },
        { text: "Länge des Putzstocks", richtig: false }
      ]
    }
  ];

export default function SchiessenProKurs({ details }) {
  return (
    <MiniCourse courseId="schiessen-pro" questions={quiz} details={details}>
      <p>
              Fortgeschrittenes Schießen erfordert absolute Beherrschung von Anschlag,
              Atmung, Abzugskontrolle und Ballistik. Schon minimale Abweichungen wirken
              sich auf große Distanzen stark aus. Präzision entsteht durch Ruhe,
              Wiederholbarkeit und saubere Technik.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("schiessen-pro") } };
}
