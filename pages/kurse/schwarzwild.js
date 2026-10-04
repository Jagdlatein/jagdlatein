import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quizFragen = [
  {
    frage: "Wie nennt man eine Gruppe von weiblichem Schwarzwild mit Nachwuchs?",
    antworten: [
      { text: "Rudel", richtig: false },
      { text: "Rotte", richtig: true },
      { text: "Kette", richtig: false },
      { text: "Sprung", richtig: false }
    ]
  },
  {
    frage: "Was ist ein Überläufer?",
    antworten: [
      { text: "Schwarzwild im 2. Lebensjahr", richtig: true },
      { text: "Alte Bache mit Frischlingen", richtig: false },
      { text: "Alter Keiler", richtig: false },
      { text: "Schwarzwild kurz vor dem Frischen", richtig: false }
    ]
  },
  {
    frage: "Was ist jagdlich mit \"Frischling\" gemeint?",
    antworten: [
      { text: "Schwarzwild bis etwa 1 Jahr", richtig: true },
      { text: "Schwarzwild im 3. Lebensjahr", richtig: false },
      { text: "Zeichnende Bache", richtig: false },
      { text: "Alter Keiler", richtig: false }
    ]
  },
  {
    frage: "Wo findest du typischerweise Suhlen von Schwarzwild?",
    antworten: [
      { text: "Auf trockenen Kuppen im Hochwald", richtig: false },
      { text: "Nur im Gebirge", richtig: false },
      {
        text: "An feuchten, schlammigen Stellen, oft im Schatten",
        richtig: true
      },
      { text: "Direkt an stark befahrenen Wegen", richtig: false }
    ]
  },
  {
    frage: "Was lässt sich aus einem einzelnen Schwarzwild-Trittsiegel sicher ableiten?",
    antworten: [
      {
        text: "Jeder breite Abdruck beweist einen alten Keiler",
        richtig: false
      },
      {
        text: "Ein einzelnes Trittsiegel reicht für eine sichere Geschlechts- und Altersbestimmung nicht aus",
        richtig: true
      },
      { text: "Jeder kleine Abdruck beweist eine Bache", richtig: false },
      { text: "Die Bodenfarbe zeigt die Altersklasse", richtig: false }
    ]
  },
  {
    frage: "Was ist beim Schwarzwild ein wichtiges Sicherheitsmerkmal an der Kirrung?",
    antworten: [
      { text: "Kugelfang bergauf in Richtung Straße", richtig: false },
      {
        text: "Geschossfang hangabwärts in freien Horizont",
        richtig: false
      },
      {
        text: "Ausreichender natürlicher Kugelfang und ein Schussfeld ohne Gefährdung von Menschen oder Gebäuden",
        richtig: true
      },
      { text: "Hauptsache der Stand ist bequem", richtig: false }
    ],
    source: "https://www.svlfg.de/sichere-jagd",
  }
];

export default function SchwarzwildKurs({ details }) {
  return (
    <MiniCourse courseId="schwarzwild" questions={quizFragen} details={details}>
      <p>
              Hier wiederholst du wichtige Grundlagen zu Schwarzwild: Rottenaufbau,
              Altersklassen und typische Zeichen im Revier – ideal für Praxis und
              Prüfung.
            </p>

      <h2>Rotte, Frischling, Keiler</h2>

      <p>
              Schwarzwild lebt meist in Rotten aus Bachen und Frischlingen. Keiler sind
              häufig Einzelgänger. Wichtig ist das sichere Ansprechen von Frischlingen,
              Überläufern und erwachsenen Stücken – auch unter schlechten
              Lichtverhältnissen.
            </p>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("schwarzwild") } };
}
