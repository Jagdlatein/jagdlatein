import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was musst du vor dem Einsatz einer Falle zu den Kontrollen klären?",
      antworten: [
        { text: "Prüfung nur am Wochenende", richtig: false },
        { text: "Die örtlichen Kontrollfristen und Vorgaben zur unverzüglichen Versorgung eines Fangs", richtig: true },
        { text: "Prüfung nur bei Fangmeldung", richtig: false },
        { text: "Keine Kontrolle nötig", richtig: false }
      ],
      source: "https://www.jagdverband.de/sites/default/files/2026-05/2026-05_DJV_Fallenjagd_Laenderuebersicht.pdf",
    },
    {
      frage: "Welche Aussage zu Lebendfangkastenfallen ist richtig?",
      antworten: [
        { text: "Jede Kastenfalle ist überall zulässig", richtig: false },
        { text: "Zulässigkeit, Bauart, Aufstellung und Betrieb müssen örtliche Vorgaben und Tierschutz erfüllen", richtig: true },
        { text: "Ein Fallenmelder ersetzt jede Form der Versorgung", richtig: false },
        { text: "Die Bauart allein garantiert einen unverletzten Fang", richtig: false }
      ],
      source: "https://www.jagdverband.de/sites/default/files/2026-05/2026-05_DJV_Fallenjagd_Laenderuebersicht.pdf",
    }
  ];

export default function FallenrechtKurs({ details }) {
  return (
    <MiniCourse courseId="fallenrecht" questions={quiz} details={details}>
      <p>
              Fallenrecht regelt den Einsatz von Lebend- und Totschlagfallen.
              Vor dem Einsatz sind zulässige Bauart, erforderliche Sachkunde, Aufstellung,
              Kontrollpflichten und Tierschutz anhand der geltenden örtlichen Regeln
              zu klären. Die Kontrollanforderungen können sich nach Fallentyp und
              zugelassenem Fangmelder unterscheiden. Verbotene Fallen dürfen nicht genutzt werden.
            </p>
      <p><a href="https://www.gesetze-bayern.de/Content/Document/BayAVJG-12a" target="_blank" rel="noopener noreferrer">Amtliches Beispiel: Bayern, AVBayJG § 12a – Lebendfang und Kontrollpflichten</a></p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("fallenrecht") } };
}
