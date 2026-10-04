import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Warum ist Windrichtung wichtig?",
      antworten: [
        { text: "Wild sieht dadurch schlechter", richtig: false },
        { text: "Wild nimmt Gerüche über den Wind wahr", richtig: true },
        { text: "Weil der Schuss lauter wird", richtig: false },
        { text: "Für die Optikeinstellung", richtig: false }
      ]
    },
    {
      frage: "Wann sind viele Rehe und Wildschweine besonders gut zu beobachten, abhängig von Störung und Lebensraum?",
      antworten: [
        { text: "Bei starkem Sturm", richtig: false },
        { text: "Häufig in den Dämmerungsphasen", richtig: true },
        { text: "Bei greller Mittagssonne", richtig: false },
        { text: "Nur bei Regen", richtig: false }
      ]
    }
  ];

export default function WetterKurs({ details }) {
  return (
    <MiniCourse courseId="wetter" questions={quiz} details={details}>
      <p>
              Wetter beeinflusst Wildverhalten, Schussabgabe und Lautstärke enorm.
              Windrichtung entscheidet über Witterungskontakt – der wichtigste Faktor
              für eine erfolgreiche Ansitz- und Pirschjagd.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("wetter") } };
}
