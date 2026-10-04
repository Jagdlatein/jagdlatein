import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Was versteht man in der Jägersprache unter der \"Fährte\"?",
    antworten: [
      { text: "Allgemein die Futterstellen des Wildes", richtig: false },
      {
        text: "Die Spur des Schalenwildes (Trittsiegel) in der Fortbewegung",
        richtig: true,
      },
      { text: "Nur den Wechsel von Rehwild", richtig: false },
      { text: "Den Schlafplatz des Wildes", richtig: false },
    ],
  },
  {
    frage: "Wie nennt man die Spur des Haarraubwildes (z. B. Fuchs, Marder)?",
    antworten: [
      { text: "Fährte", richtig: false },
      { text: "Spur", richtig: true },
      { text: "Losung", richtig: false },
      { text: "Wechsel", richtig: false },
    ],
  },
  {
    frage: "Woran erkennst du typischerweise die Fährte von Rehwild?",
    antworten: [
      {
        text: "Sehr große, runde Schalen, deutlich größer als beim Schwarzwild",
        richtig: false,
      },
      {
        text: "Kleine, schmale Schalen, leicht herzförmig, zierliches Trittsiegel",
        richtig: true,
      },
      {
        text: "Vier Zehenballen wie beim Hund",
        richtig: false,
      },
      {
        text: "Nur ein einzelner runder Abdruck",
        richtig: false,
      },
    ],
  },
  {
    frage: "Welche Aussage zur Fuchsspur ist TYPISCH?",
    antworten: [
      {
        text: "Die Trittsiegel stehen versetzt wie beim Hund",
        richtig: false,
      },
      {
        text: "Die Spur wirkt wie eine gerade Perlenschnur (Fuchsschnur)",
        richtig: true,
      },
      {
        text: "Man sieht stets Krallenabdrücke wie beim Keiler",
        richtig: false,
      },
      {
        text: "Die Spur ist immer doppelt so groß wie beim Hund",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was bezeichnet der Begriff \"Wechsel\"?",
    antworten: [
      {
        text: "Den Jahreszeitenwechsel im Revier",
        richtig: false,
      },
      {
        text: "Regelmäßig genutzte Wege des Wildes zwischen Einstand und Äsung",
        richtig: true,
      },
      {
        text: "Nur das Verlassen des Einstandes bei Störung",
        richtig: false,
      },
      {
        text: "Das Wechseln des Haarkleides",
        richtig: false,
      },
    ],
  },
  {
    frage: "Welche Losung passt TYPISCH zum Rehwild?",
    antworten: [
      {
        text: "Lange, wurstförmige Haufen mit Hülse",
        richtig: false,
      },
      {
        text: "Kleine, olivenförmige Ködel, oft leicht aufgeschichtet",
        richtig: true,
      },
      {
        text: "Große, flache Fladen",
        richtig: false,
      },
      {
        text: "Stark riechende, längliche Würste mit Haaranteil",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was ist beim Lesen von Fährten & Spuren immer wichtig?",
    antworten: [
      {
        text: "Nur auf ein einzelnes Trittsiegel zu achten",
        richtig: false,
      },
      {
        text: "Gesamte Spurverlauf, Umfeld, Losung und weitere Zeichen mit einbeziehen",
        richtig: true,
      },
      {
        text: "Nur auf Losung, nicht auf Trittsiegel achten",
        richtig: false,
      },
      {
        text: "Spuren stets zertrampeln, damit andere sie nicht sehen",
        richtig: false,
      },
    ],
  },
];

export default function FaehrtenKurs({ details }) {
  return (
    <MiniCourse courseId="faehrten" questions={quizFragen} details={details}>
      <p>
              In diesem Minikurs wiederholst du wichtige Grundlagen zu Fährten,
              Spuren, Wechseln und Losung – ideal für die Jagdpraxis und die
              Prüfung.
            </p>

      <h2>Wild erkennen am Boden</h2>

      <p>
              Wer Fährten und Spuren lesen kann, weiß oft schon vor dem Ansitz,
              welche Wildart sich im Revier bewegt. Achte immer auf das
              Gesamtbild: Trittsiegel, Losung, Verbiss und Einstandsstrukturen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("faehrten") } };
}
