import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was ist beim Aufbrechen besonders wichtig?",
      antworten: [
        { text: "Lang warten", richtig: false },
        { text: "Sauberes, kontaminationsfreies Arbeiten", richtig: true },
        { text: "Mit Erde abreiben", richtig: false },
        { text: "Kein Messer verwenden", richtig: false }
      ]
    },
    {
      frage: "Was gehört zur Beurteilung von Wildbret?",
      antworten: [
        { text: "Starker Geruch", richtig: false },
        { text: "Geruch, Aussehen, auffällige Befunde und den gesamten hygienischen Umgang gemeinsam bewerten", richtig: true },
        { text: "Schmierige Oberfläche", richtig: false },
        { text: "Grünliche Töne", richtig: false }
      ],
      source: "https://www.bfr.bund.de/presse/infografiken/lebensmittelsicherheit-wildbret/",
    }
  ];

export default function WildhygieneKurs({ details }) {
  return (
    <MiniCourse courseId="wildhygiene" questions={quiz} details={details}>
      <p>
              Wildhygiene beginnt bereits beim Schuss. Sauberes Aufbrechen, Kühlung,
              richtige Lagerung und fachgerechtes Zerwirken sichern hohe Fleischqualität
              und verhindern Verderb oder Verunreinigungen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("wildhygiene") } };
}
