import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const rotwildQuiz = [
  {
    frage: "Wie heißt das weibliche Rotwild?",
    antworten: [
      { text: "Geiß", richtig: false },
      { text: "Tier", richtig: true },
      { text: "Schmalreh", richtig: false },
      { text: "Hirschkuh", richtig: false }
    ]
  },
  {
    frage: "Was ist typisch für die Brunft des Rotwildes?",
    antworten: [
      { text: "Hirsche klagend bellen", richtig: false },
      { text: "Hirsche röhren lautstark", richtig: true },
      { text: "Hirsche zeigen Balzsprünge wie Federwild", richtig: false },
      { text: "Hirsche wechseln ins Hochgebirge", richtig: false }
    ]
  },
  {
    frage: "Wie erkennt man typischerweise die Losung von Rotwild?",
    antworten: [
      { text: "Kleine, trockene Kügelchen wie beim Rehwild", richtig: false },
      { text: "Würstchenform wie bei Schwarzwild", richtig: false },
      { text: "Große, eiförmige Stücke, oft in Haufen", richtig: true },
      { text: "Feine, längliche Pellets", richtig: false }
    ]
  },
  {
    frage: "Wie leben Rotwildhirsche außerhalb der Brunft?",
    antworten: [
      { text: "In großen Kahlwildrudeln", richtig: false },
      { text: "Einzeln oder in Hirschtrupps", richtig: true },
      { text: "Im Familienverbund mit Kälbern", richtig: false },
      { text: "Nur in gemischten Rudeln", richtig: false }
    ]
  }
];

export default function RotwildKompaktKurs({ details }) {
  return (
    <MiniCourse courseId="rotwild" questions={rotwildQuiz} details={details}>
      <p>
              Kompaktes Wissen über unser größtes heimisches Schalenwild.
              Ideal für Jagdscheinanwärter und zur schnellen Wiederholung.
            </p>

      <h2>Rotwild</h2>

      <p>
              Rotwild ist die größte heimische Schalenwildart. Die <strong>Hirsche</strong> tragen
              ein eindrucksvolles Geweih, das jedes Jahr neu gebildet, verfegt und
              anschließend abgeworfen wird. Weibliches Rotwild heißt <strong>Tier</strong>,
              der Nachwuchs <strong>Kalb</strong>.
              <br /><br />
              Rotwild lebt in <strong>Rudeln</strong>. Kahlwildverbände werden meist von erfahrenen
              Alttieren geführt, während Hirsche außerhalb der Brunft vielfach einzeln
              oder in kleineren Hirschtrupps anzutreffen sind.
              <br /><br />
              Während der <strong>Brunft</strong> röhren die Hirsche, um Rivalen zu beeindrucken und
              Weibchen zu führen. Typische Zeichen im Revier sind Fegestellen,
              Bodenverwundungen, Suhlen und die charakteristische Losung.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("rotwild") } };
}
