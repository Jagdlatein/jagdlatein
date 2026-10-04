import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welches Merkmal ist typisch für den Dachs?",
      antworten: [
        { text: "Roter Fuchsbalg", richtig: false },
        { text: "Schwarz-weiße Kopfbänderung", richtig: true },
        { text: "Gepunktetes Fell", richtig: false },
        { text: "Schwarze Schwanzspitze", richtig: false }
      ]
    },
    {
      frage: "Welche Art ist ein Kulturfolger und lebt häufig in Gebäuden?",
      antworten: [
        { text: "Iltis", richtig: false },
        { text: "Baummarder", richtig: false },
        { text: "Steinmarder", richtig: true },
        { text: "Hermelin", richtig: false }
      ]
    },
    {
      frage: "Wie groß ist ein typisches Marder-Trittsiegel?",
      antworten: [
        { text: "1 cm", richtig: false },
        { text: "4–5 cm", richtig: true },
        { text: "12 cm", richtig: false },
        { text: "20 cm", richtig: false }
      ]
    }
  ];

export default function KleinraubwildKurs({ details }) {
  return (
    <MiniCourse courseId="kleinraubwild" questions={quiz} details={details}>
      <p>
              Der Dachs gehört zu den größten heimischen Kleinraubwildarten. Seine
              markante Kopfbänderung macht ihn unverwechselbar. Marder – insbesondere
              der Steinmarder – leben oft im Siedlungsraum und sind äußerst anpassungsfähig.
              <br /><br />
              Die sichere Unterscheidung erfolgt über Trittsiegel, Lebensraum und Verhalten.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("kleinraubwild") } };
}
