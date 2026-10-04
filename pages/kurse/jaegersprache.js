import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Welcher Begriff gehört NICHT zur Jägersprache?",
    antworten: [
      { text: "Blattzeit", richtig: false },
      { text: "Äsung", richtig: false },
      { text: "Teller", richtig: false },
      { text: "Autobahnspur", richtig: true }
    ]
  },
  {
    frage: "Was bedeutet der Begriff \"Äsung\"?",
    antworten: [
      { text: "Ruheplatz des Wildes", richtig: false },
      { text: "Nahrung des Wildes", richtig: true },
      { text: "Fährte eines Stückes", richtig: false },
      { text: "Lautäußerung des Wildes", richtig: false }
    ]
  },
  {
    frage: "Wie nennt man den Kopf des Rehwildes in der Jägersprache?",
    antworten: [
      { text: "Haupt", richtig: true },
      { text: "Knolle", richtig: false },
      { text: "Rumpf", richtig: false },
      { text: "Stirn", richtig: false }
    ]
  },
  {
    frage: "Was beschreibt der Begriff \"Losung\"?",
    antworten: [
      { text: "Haare am Anschuss", richtig: false },
      { text: "Fußabdruck des Wildes", richtig: false },
      { text: "Kot des Wildes", richtig: true },
      { text: "Verborgene Einstandslage", richtig: false }
    ]
  },
  {
    frage: "Was ist mit \"Schmalreh\" gemeint?",
    antworten: [
      {
        text: "Weibliches Reh im 2. Lebensjahr, noch ohne Kitz",
        richtig: true
      },
      { text: "Sehr mageres Stück jeden Alters", richtig: false },
      { text: "Einjähriger Bock", richtig: false },
      { text: "Geiß mit schwachem Kitz", richtig: false }
    ]
  },
  {
    frage: "Wie nennt man beim Schwarzwild die männlichen Eckzähne im Oberkiefer?",
    antworten: [
      { text: "Geweihe", richtig: false },
      { text: "Grandeln", richtig: false },
      { text: "Haderer", richtig: true },
      { text: "Spieße", richtig: false }
    ]
  }
];

export default function JaegerspracheKurs({ details }) {
  return (
    <MiniCourse courseId="jaegersprache" questions={quizFragen} details={details}>
      <p>
              In diesem Minikurs wiederholst du wichtige Begriffe der Jägersprache –
              perfekt für Jungjäger und zur schnellen Auffrischung vor der Prüfung.
            </p>

      <h2>Überblick</h2>

      <p>
              Viele Begriffe in der Jagd stammen aus alter Jägersprache:{" "}
              <strong>Äsung</strong> für Nahrung, <strong>Losung</strong> für Kot oder{" "}
              <strong>Fährte</strong> für die Spur des Wildes. Je sicherer du diese
              Worte beherrschst, desto leichter fallen dir Jagdpraxis und Prüfung.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("jaegersprache") } };
}
