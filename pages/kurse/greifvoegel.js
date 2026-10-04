import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Art ist ein typischer Greifvogel?",
      antworten: [
        { text: "Buntspecht", richtig: false },
        { text: "Habicht", richtig: true },
        { text: "Amsel", richtig: false },
        { text: "Reiher", richtig: false }
      ]
    },
    {
      frage: "Welche Kombination hilft bei der Bestimmung von Greifvögeln?",
      antworten: [
        { text: "Flugbild, Körperproportionen, Gefieder und weitere Merkmale zusammen betrachten", richtig: true },
        { text: "Schwanzlänge", richtig: false },
        { text: "Körperfarbe allein", richtig: false },
        { text: "Fluggeschwindigkeit", richtig: false }
      ]
    }
  ];

export default function GreifvoegelKurs({ details }) {
  return (
    <MiniCourse courseId="greifvoegel" questions={quiz} details={details}>
      <p>
              Greifvögel sind Beutegreifer mit stark gekrümmtem Schnabel und
              kraftvollen Fängen. Zu den wichtigsten Arten zählen Bussard, Habicht
              und Falke. Eine sichere Ansprache erfolgt über Flugbild, Silhouette
              und typische Verhaltensweisen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("greifvoegel") } };
}
