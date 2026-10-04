import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Warum ist Nachtjagd besonders anspruchsvoll?",
      antworten: [
        { text: "Weil Jäger nachts schneller rennen müssen", richtig: false },
        { text: "Weil Sicht, Ansprache & Sicherheit erschwert sind", richtig: true },
        { text: "Weil Wild nachts schläft", richtig: false },
        { text: "Weil Waffen anders funktionieren", richtig: false }
      ]
    },
    {
      frage: "Wofür eignet sich das Wärmebildgerät besonders?",
      antworten: [
        { text: "Zum sicheren Ansprechen", richtig: false },
        { text: "Zum Entdecken von Wild", richtig: true },
        { text: "Zum Messen der Entfernung", richtig: false },
        { text: "Zum Locken", richtig: false }
      ]
    },
    {
      frage: "Was ist die wichtigste Regel bei Nacht?",
      antworten: [
        { text: "Immer sofort schießen", richtig: false },
        { text: "Keine sichere Ansprache = kein Schuss", richtig: true },
        { text: "Nur bei Regen jagen", richtig: false },
        { text: "Wild mit Licht anleuchten", richtig: false }
      ]
    },
    {
      frage: "Welches Wild ist typischerweise nachtaktiv?",
      antworten: [
        { text: "Rebhuhn", richtig: false },
        { text: "Schwarzwild", richtig: true },
        { text: "Fasan", richtig: false },
        { text: "Steinwild", richtig: false }
      ]
    },
    {
      frage: "Was sollte man bei der Nachtpirsch besonders beachten?",
      antworten: [
        { text: "Sehr schnelle Bewegungen", richtig: false },
        { text: "Extrem leises Vorgehen & Wind", richtig: true },
        { text: "Helle Kleidung tragen", richtig: false },
        { text: "Auf freiem Feld stehen bleiben", richtig: false }
      ]
    },
    {
      frage: "Was ist beim Ansprechen von Schwarzwild in der Nacht zu beachten?",
      antworten: [
        { text: "Nur Leitbachen schießen", richtig: false },
        { text: "Wild sicher bestimmen, Schutz führender Bachen und örtliche Freigaben beachten", richtig: true },
        { text: "Blind auf die Rotte schießen", richtig: false },
        { text: "Nachtjagd ist verboten", richtig: false }
      ],
      source: "https://www.gesetze-im-internet.de/bjagdg/__22.html",
    }
  ];

export default function NachtjagdKurs({ details }) {
  return (
    <MiniCourse courseId="nachtjagd" questions={quiz} details={details}>
      <p>
              Die Nachtjagd erfordert besondere Sicherheit, Technik und Erfahrung.
              Wärmebildgeräte, Nachtsichttechnik und richtiges Verhalten bei Dunkelheit
              ermöglichen eine waidgerechte Jagdausübung.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("nachtjagd") } };
}
