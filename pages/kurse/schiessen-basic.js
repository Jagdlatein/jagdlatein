import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Welche Haltung ist beim Schießen wichtig?",
      antworten: [
        { text: "Fester Stand & Körperstabilität", richtig: true },
        { text: "Lockere, unruhige Haltung", richtig: false },
        { text: "Rückwärts lehnen", richtig: false },
        { text: "Nur auf die Optik schauen", richtig: false }
      ]
    },
    {
      frage: "Wofür dient der Atemrhythmus?",
      antworten: [
        { text: "Zum Wärmen", richtig: false },
        { text: "Zum Beruhigen & Stabilisieren", richtig: true },
        { text: "Für laute Signale", richtig: false },
        { text: "Zum Abwehren von Wild", richtig: false }
      ]
    }
  ];

export default function SchiessenBasicKurs({ details }) {
  return (
    <MiniCourse courseId="schiessen-basic" questions={quiz} details={details}>
      <p>
              Eine saubere Schießtechnik beginnt mit stabilem Stand, korrekter Anschlaghaltung,
              ruhigem Atemrhythmus und einem gleichmäßigen Abzugsverhalten.
              Jeder dieser Faktoren beeinflusst die Schusspräzision maßgeblich.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("schiessen-basic") } };
}
