import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const fallenjagdQuiz = [
    {
      frage: "Welche Falle ist eine klassische Lebendfangfalle?",
      antworten: [
        { text: "Schlagfalle", richtig: false },
        { text: "Kastenfalle", richtig: true },
        { text: "Tellereisen", richtig: false },
        { text: "Selbstschussgerät", richtig: false }
      ]
    },
    {
      frage: "Was gehört zur verantwortlichen Kontrolle einer Fangvorrichtung?",
      antworten: [
        { text: "Kontrolle alle 7 Tage", richtig: false },
        { text: "Die örtlich vorgeschriebenen Kontrollfristen einhalten und Fänge unverzüglich versorgen", richtig: true },
        { text: "Nur bei Fangmeldung kontrollieren", richtig: false },
        { text: "Nur am Wochenende prüfen", richtig: false }
      ],
      source: "https://www.jagdverband.de/sites/default/files/2026-05/2026-05_DJV_Fallenjagd_Laenderuebersicht.pdf",
    },
    {
      frage: "Welches Ziel verfolgt die tierschutzgerechte Fallenjagd?",
      antworten: [
        { text: "Hohe Fangzahlen ohne Rücksicht", richtig: false },
        { text: "Gezielter Fang ohne unnötiges Leid", richtig: true },
        { text: "Nur Fang von Großraubwild", richtig: false },
        { text: "Keine gesetzliche Grundlage nötig", richtig: false }
      ]
    },
    {
      frage: "Welches Ziel hat eine geeignete Lebendfangkastenfalle bei korrektem Betrieb?",
      antworten: [
        { text: "Sie tötet das Wild sofort", richtig: false },
        { text: "Das Tier lebend fangen; Verletzungen und Belastungen sollen vermieden werden", richtig: true },
        { text: "Sie wird im Wasser eingesetzt", richtig: false },
        { text: "Sie ist nur für Schwarzwild", richtig: false }
      ],
      source: "https://www.jagdverband.de/rund-um-die-jagd/was-draussen-passiert/fangjagd",
    }
  ];

export default function FallenjagdBasicKurs({ details }) {
  return (
    <MiniCourse courseId="fallenjagd" questions={fallenjagdQuiz} details={details}>
      <p>
              Grundlagen der waidgerechten und tierschutzgerechten Fallenjagd.
              Kompakt erklärt für Ausbildung und Praxis.
            </p>

      <h2>Fallenjagd</h2>

      <p>
              Die Fallenjagd dient der <strong>Hege</strong>, der <strong>Prädatorenregulierung</strong>
              und dem <strong>Artenschutz</strong>. Dabei steht der Tierschutz im Vordergrund.
              <br /><br />
              Häufig eingesetzt werden <strong>Kastenfallen</strong>, die Wild lebend und
              unverletzt fangen. Schlagfallen sind nur für bestimmte Arten und unter
              strengen gesetzlichen Vorgaben erlaubt.
              <br /><br />
              Kontrollpflichten, zulässige Bauarten und erforderliche Sachkundenachweise
              richten sich nach den geltenden örtlichen Vorschriften. Je nach Fallentyp
              und zugelassenem Fangmelder können unterschiedliche Anforderungen gelten.
              Wichtige Faktoren sind Standortwahl, Tarnung, Lockwirkung und eine sichere
              Entnahme gefangenen Wildes.
            </p>
      <p><a href="https://www.gesetze-bayern.de/Content/Document/BayAVJG-12a" target="_blank" rel="noopener noreferrer">Amtliches Beispiel: Bayern, AVBayJG § 12a – Lebendfang und Kontrollpflichten</a></p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("fallenjagd") } };
}
