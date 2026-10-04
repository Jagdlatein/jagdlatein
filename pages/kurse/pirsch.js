import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const pirschAnsitzQuiz = [
    {
      frage: "Was ist beim Pirschen besonders wichtig?",
      antworten: [
        { text: "Schnelles Vorankommen", richtig: false },
        { text: "Windrichtung beachten", richtig: true },
        { text: "Laute Kommunikation", richtig: false },
        { text: "Immer aufrecht gehen", richtig: false }
      ]
    },
    {
      frage: "Was beschreibt den idealen Ansitzplatz?",
      antworten: [
        { text: "Mit dem Rücken ohne Deckung", richtig: false },
        { text: "Guter Überblick und sicherer Kugelfang", richtig: true },
        { text: "Direkt an Wildwechseln ohne Sicht", richtig: false },
        { text: "Sehr niedrige Sitzhöhe", richtig: false }
      ]
    },
    {
      frage: "Welche Technik hilft beim lautlosen Pirschen?",
      antworten: [
        { text: "Fersengang", richtig: false },
        { text: "Abrollen über die Fußaußenkante", richtig: true },
        { text: "Springender Schritttakt", richtig: false },
        { text: "Nur Laufen mit Stöcken", richtig: false }
      ]
    },
    {
      frage: "Worauf muss beim Schuss vom Ansitz besonders geachtet werden?",
      antworten: [
        { text: "Schnelles Schießen", richtig: false },
        { text: "Sicherer Kugelfang hinter dem Wild", richtig: true },
        { text: "Nur auf stehendes Wild verzichten", richtig: false },
        { text: "Wild nur aus großer Entfernung beschießen", richtig: false }
      ]
    }
  ];

export default function PirschAnsitzKurs({ details }) {
  return (
    <MiniCourse courseId="pirsch" questions={pirschAnsitzQuiz} details={details}>
      <p>
              Grundlagen der leisen Pirsch und des sicheren Ansitzes.
              Perfekt für Jagdscheinanwärter und praktische Revierarbeit.
            </p>

      <h2>Pirsch</h2>

      <p>
              Die Pirsch ist eine der anspruchsvollsten Jagdarten.
              Entscheidend sind <strong>Windrichtung</strong>, <strong>Deckung</strong> und
              <strong>geräuscharmes Bewegen</strong>.
              <br /><br />
              Leise Fortbewegung gelingt über das <strong>Abrollen der Füße</strong>, langsames
              Vorrücken, häufiges Beobachten und das Nutzen von Deckung wie Büschen
              oder Geländeformen.
            </p>

      <h2>
              Ansitz
            </h2>

      <p>
              Beim Ansitz kommt es auf Ruhe, Geduld und die Wahl eines sicheren,
              übersichtlichen Standortes an. Ein idealer Ansitz bietet:
              <br /><br />
              • guten Überblick über das Gelände
              • sicheren <strong>Kugelfang</strong>
              • unauffälligen Zugang zum Platz
              <br /><br />
              Der Schuss erfolgt nur auf eindeutig angesprochenes Wild — und nur,
              wenn Kugelfang und Umgebung absolut sicher sind.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("pirsch") } };
}
