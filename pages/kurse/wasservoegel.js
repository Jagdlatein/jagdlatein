import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was ist typisch für Tauchenten?",
      antworten: [
        { text: "Langer Hals & hohes Schwimmen", richtig: false },
        { text: "Tauchen tief und haben kompakten Körperbau", richtig: true },
        { text: "Sehr leichte Körperform", richtig: false },
        { text: "Nestbau in Bäumen", richtig: false }
      ]
    },
    {
      frage: "Wie unterscheiden sich männliche und weibliche Stockenten im Prachtkleid?",
      antworten: [
        { text: "Keine Unterschiede erkennbar", richtig: false },
        { text: "Der Erpel hat unter anderem einen grünen Kopf; das Weibchen ist braun gemustert", richtig: true },
        { text: "Erpel ist kleiner", richtig: false },
        { text: "Ente ist bunt gefärbt", richtig: false }
      ]
    }
  ];

export default function WasservoegelKurs({ details }) {
  return (
    <MiniCourse courseId="wasservoegel" questions={quiz} details={details}>
      <p>
              Wasservögel unterscheiden sich über Flugbild, Stimme, Gefieder und
              Verhalten. Besonders wichtig: Körperform, Schwimmverhalten und
              Schnabelmerkmale – damit kann man Arten sicher ansprechen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("wasservoegel") } };
}
