import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was gehört zu einer guten Revierplanung?",
      antworten: [
        { text: "Unklare Wegeführung", richtig: false },
        { text: "Sichere Hochsitzstandorte", richtig: true },
        { text: "Zufällige Fütterungsstellen", richtig: false },
        { text: "Keine Wildruhezonen", richtig: false }
      ]
    },
    {
      frage: "Warum sind Ruhezonen wichtig?",
      antworten: [
        { text: "Zur besseren Jagdübersicht", richtig: false },
        { text: "Sie reduzieren Stress und fördern gesunden Wildbestand", richtig: true },
        { text: "Weil sie schön aussehen", richtig: false },
        { text: "Damit Wild weniger frisst", richtig: false }
      ]
    }
  ];

export default function RevierplanungKurs({ details }) {
  return (
    <MiniCourse courseId="revierplanung" questions={quiz} details={details}>
      <p>
              Revierplanung umfasst Wildruhezonen, Hochsitzplanung, Wechselbeobachtung,
              Fütterungsmanagement und Sicherheitsaspekte. Ein gut strukturiertes Revier
              erleichtert Jagdausübung und schützt den Wildbestand langfristig.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("revierplanung") } };
}
