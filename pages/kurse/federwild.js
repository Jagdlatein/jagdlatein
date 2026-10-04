import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Art zählt zum Federwild?",
      antworten: [
        { text: "Rehwild", richtig: false },
        { text: "Stockente", richtig: true },
        { text: "Dachs", richtig: false },
        { text: "Marderhund", richtig: false }
      ]
    },
    {
      frage: "Wie lässt sich Federwild gut ansprechen?",
      antworten: [
        { text: "Über Schalenabdrücke", richtig: false },
        { text: "Über Flugbild & Gefieder", richtig: true },
        { text: "Über Lautäußerungen von Säugetieren", richtig: false },
        { text: "Über Losung", richtig: false }
      ]
    },
    {
      frage: "Für welchen Lebensraum ist die Stockente typisch?",
      antworten: [
        { text: "Wüstengebiete", richtig: false },
        { text: "Feuchtgebiete & Stillgewässer", richtig: true },
        { text: "Hochgebirge", richtig: false },
        { text: "Steppen", richtig: false }
      ]
    }
  ];

export default function FederwildKurs({ details }) {
  return (
    <MiniCourse courseId="federwild" questions={quiz} details={details}>
      <p>
              Zum Federwild zählen alle jagdbaren Vogelarten. Typische Vertreter sind
              Enten, Gänse, Fasane und Tauben. Die Ansprache erfolgt über Flugbild,
              Körperform, Gefieder und Verhalten.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("federwild") } };
}
