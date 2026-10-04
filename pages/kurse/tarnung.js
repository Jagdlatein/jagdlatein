import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Warum ist Tarnung bei der Jagd wichtig?",
      antworten: [
        { text: "Wild erkennt Farben schlecht", richtig: false },
        { text: "Um Konturen zu brechen und Bewegung zu reduzieren", richtig: true },
        { text: "Damit Kleidung nicht schmutzig wird", richtig: false },
        { text: "Um schneller laufen zu können", richtig: false }
      ]
    },
    {
      frage: "Welche Handlung kann den Beobachter trotz Tarnkleidung deutlich sichtbar machen?",
      antworten: [
        { text: "Geräusch der Kleidung", richtig: false },
        { text: "Auffällige Bewegung", richtig: true },
        { text: "Schuhfarbe", richtig: false },
        { text: "Rucksackgröße", richtig: false }
      ]
    },
    {
      frage: "Warum sollte man sich beim Ansitz im Schatten aufhalten?",
      antworten: [
        { text: "Weil es dort wärmer ist", richtig: false },
        { text: "Weil der Jäger schlechter erkannt wird", richtig: true },
        { text: "Um besser fotografieren zu können", richtig: false },
        { text: "Weil Wild Schatten meidet", richtig: false }
      ]
    },
    {
      frage: "Worauf ist beim Aufsteigen auf den Hochsitz zu achten?",
      antworten: [
        { text: "Schnell rauf, damit es fertig ist", richtig: false },
        { text: "Zustand und Standsicherheit prüfen, Waffe entladen und sicheren Halt behalten", richtig: true },
        { text: "Mit freiem Gewehrlauf schwingen", richtig: false },
        { text: "Geräusche sind egal", richtig: false }
      ],
      source: "https://www.svlfg.de/sichere-jagd",
    },
    {
      frage: "Was sollte beim Glasen vermieden werden?",
      antworten: [
        { text: "Langsam zu schauen", richtig: false },
        { text: "Schnelle, ruckartige Bewegungen", richtig: true },
        { text: "Im Sitzen zu beobachten", richtig: false },
        { text: "Ein Fernglas zu benutzen", richtig: false }
      ]
    },
    {
      frage: "Was ist bei Wind und Thermik zu beachten?",
      antworten: [
        { text: "Wind ist egal bei Tarnkleidung", richtig: false },
        { text: "Veränderungen beachten und vermeiden, dass die eigene Witterung zum Wild zieht", richtig: true },
        { text: "Windrichtung verändert sich nie", richtig: false },
        { text: "Wind ist nur relevant bei Regen", richtig: false }
      ],
      source: "https://www.meteoschweiz.admin.ch/wetter/wetter-und-klima-von-a-bis-z/wind.html",
    }
  ];

export default function TarnungAnsitzKurs({ details }) {
  return (
    <MiniCourse courseId="tarnung" questions={quiz} details={details}>
      <p>
              Tarnung, Bewegungskontrolle, Wind und ein sauber gewählter Ansitzplatz
              entscheiden darüber, ob Wild vertraut bleibt. Dieser Kurs vermittelt
              die wichtigsten Grundlagen für eine waidgerechte und erfolgreiche Ansitzjagd.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("tarnung") } };
}
