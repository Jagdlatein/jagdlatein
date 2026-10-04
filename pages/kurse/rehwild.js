import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Wie nennt man ein weibliches Reh in der Jägersprache?",
    antworten: [
      { text: "Geiß", richtig: true },
      { text: "Hindin", richtig: false },
      { text: "Rick", richtig: false },
      { text: "Schmaltier", richtig: false },
    ],
  },
  {
    frage: "Was beschreibt der Begriff \"Schmalreh\"?",
    antworten: [
      {
        text: "Weibliches Reh im 2. Lebensjahr, noch ohne Kitz",
        richtig: true,
      },
      { text: "Sehr mageres Stück jeden Alters", richtig: false },
      { text: "Einjähriger Bock", richtig: false },
      { text: "Geiß mit schwachem Kitz", richtig: false },
    ],
  },
  {
    frage: "Wie nennt man den Kopf des Rehwildes in der Jägersprache?",
    antworten: [
      { text: "Haupt", richtig: true },
      { text: "Knopf", richtig: false },
      { text: "Lauscher", richtig: false },
      { text: "Blatt", richtig: false },
    ],
  },
  {
    frage: "Was bedeutet der Begriff \"Blattzeit\"?",
    antworten: [
      { text: "Brunftzeit des Rehwildes im Sommer", richtig: true },
      { text: "Zeit des Zahnwechsels beim Rehwild", richtig: false },
      { text: "Zeit des Fellwechsels", richtig: false },
      { text: "Ruhephase im Winter", richtig: false },
    ],
  },
  {
    frage: "Woran erkennst du am ehesten ein Kitz im Sommer?",
    antworten: [
      { text: "Stark gefegtes Gehörn und kräftiger Hals", richtig: false },
      {
        text: "Kleiner Körper, Flecken im Haarkleid, Nähe zur führenden Geiß",
        richtig: true,
      },
      { text: "Dunkles, grobes Haar und starker Spiegel", richtig: false },
      { text: "Fehlende Lauscher", richtig: false },
    ],
  },
  {
    frage: "Was beschreibt die \"Stange\" beim Rehbock?",
    antworten: [
      { text: "Einzelnes Gehörn (eine Seite)", richtig: true },
      { text: "Beide Gehörne zusammen", richtig: false },
      { text: "Unterkiefer beim Rehwild", richtig: false },
      { text: "Rückenlinie des Rehs", richtig: false },
    ],
  },
];

export default function RehwildKurs({ details }) {
  return (
    <MiniCourse courseId="rehwild" questions={quizFragen} details={details}>
      <p>
              Rehwild ist unser häufigstes Schalenwild. In diesem Minikurs wiederholst
              du Alters- und Geschlechtsklassen, wichtige Begriffe der Jägersprache
              und typische Ansprechkriterien.
            </p>

      <h2>Basics Rehwild</h2>

      <p>
              Geiß, Bock, Kitz, Schmalreh – die Begriffe solltest du sicher beherrschen.
              Besonders beim Abschussplan und bei der Bejagung im Sommer ist ein
              sauberes Ansprechen entscheidend.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("rehwild") } };
}
