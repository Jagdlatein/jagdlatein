import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Welche Aussage zu Rehwild ist richtig?",
    antworten: [
      { text: "Rehwild gehört zu den Rindern", richtig: false },
      { text: "Rehwild ist die kleinste heimische Hirschart", richtig: true },
      { text: "Rehwild lebt ausschließlich im Hochgebirge", richtig: false },
      { text: "Rehwild trägt immer Geweih, egal ob männlich oder weiblich", richtig: false }
    ]
  },
  {
    frage: "Woran erkennst du typischerweise die Fährte von Schwarzwild?",
    antworten: [
      { text: "Sehr kleine, runde Trittsiegel mit Ballenabdruck", richtig: false },
      { text: "Lange, schmale Schalen ohne Verwischen", richtig: false },
      { text: "Breite, kräftige Schalen, oft verwischt durch Wühlen", richtig: true },
      { text: "Nur an der Losung, nicht an der Fährte", richtig: false }
    ]
  },
  {
    frage: "Welche Losung passt am besten zu Rotwild?",
    antworten: [
      { text: "Kleine, bohnenförmige Kügelchen", richtig: false },
      { text: "Würstchenartige Haufen, häufig gekrümmt", richtig: false },
      { text: "Große, eiförmige Stücke, oft zu Haufen vereint", richtig: true },
      { text: "Feine, längliche Pellets mit spitzen Enden", richtig: false }
    ]
  }
];

export default function WildkundeKurs({ details }) {
  return (
    <MiniCourse courseId="wildkunde" questions={quizFragen} details={details}>
      <p>
              Kompakter Einstieg in die wichtigsten heimischen Wildarten.
              Ideal für Jungjäger und zur schnellen Wiederholung.
            </p>

      {/* --- REHWILD --- */}

      <h2>Rehwild</h2>

      <p>
              Rehwild ist die kleinste heimische Hirschart. Männliche heißen <strong>Bock</strong>,
              weibliche <strong>Geiß</strong>. Die Blattzeit ist die Paarungszeit.
            </p>

      {/* --- SCHWARZWILD --- */}

      <h2>Schwarzwild</h2>

      <p>
              Schwarzwild lebt in Rotten. Typisch sind breite Trittsiegel, Wühlspuren,
              Suhlen und die kräftige Losung.
            </p>

      {/* --- ROTWILD --- */}

      <h2>Rotwild</h2>

      <p>
              Rotwild ist eine große heimische Hirschart. Zur Brunft röhren die Hirsche,
              während Kahlwildrudel von erfahrenen Tieren geführt werden.
            </p>

      {/* QUIZ */}
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("wildkunde") } };
}
