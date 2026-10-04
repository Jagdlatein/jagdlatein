import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Wildart verursacht typischerweise Verbissschäden?",
      antworten: [
        { text: "Rotfuchs", richtig: false },
        { text: "Rehwild", richtig: true },
        { text: "Fasan", richtig: false },
        { text: "Ente", richtig: false }
      ]
    },
    {
      frage: "Wie erkennt man Wühl- oder Grabeschäden?",
      antworten: [
        { text: "An losen Erdaufschüttungen", richtig: true },
        { text: "An abgebrochenen Zweigen", richtig: false },
        { text: "Am Gefieder", richtig: false },
        { text: "An Losung auf Steinen", richtig: false }
      ]
    },
    {
      frage: "Welche Maßnahme hilft gegen Wildschäden?",
      antworten: [
        { text: "Unregelmäßige Kontrollen", richtig: false },
        { text: "Schutzmaßnahmen wie Zäune", richtig: true },
        { text: "Grelles Licht", richtig: false },
        { text: "Jagen im Mai", richtig: false }
      ]
    }
  ];

export default function WildschaedenKurs({ details }) {
  return (
    <MiniCourse courseId="wildschaeden" questions={quiz} details={details}>
      <p>
              Wildschäden entstehen vor allem durch Verbiss, Schälen oder Wühlen.
              Besonders Reh-, Rot- und Schwarzwild verursachen deutliche Schäden
              im Wald und in landwirtschaftlichen Kulturen. Schutzmaßnahmen und
              angepasste Hege helfen, diese gering zu halten.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("wildschaeden") } };
}
