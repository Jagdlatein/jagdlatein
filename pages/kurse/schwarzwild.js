import { useState } from "react";
import useCourseProgress from "../../hooks/useCourseProgress";
import CourseProgressNotice from "../../components/CourseProgressNotice";

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

export default function SchwarzwildKurs() {
  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const courseProgress = useCourseProgress("schwarzwild", {
    started: aktuelleFrage > 0 || auswahl !== null || fertig,
    answeredQuestions: fertig ? quizFragen.length : aktuelleFrage + (auswahl !== null ? 1 : 0),
    totalQuestions: quizFragen.length,
    score: punkte,
    completed: fertig || (aktuelleFrage === quizFragen.length - 1 && auswahl !== null),
  });

  const frage = quizFragen[aktuelleFrage];

  function handleAntwort(index) {
    if (auswahl !== null) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    setTimeout(() => {
      if (aktuelleFrage + 1 < quizFragen.length) {
        setAktuelleFrage((f) => f + 1);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 800);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "20px 16px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        🐗 Schwarzwild verstehen – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Hier wiederholst du wichtige Grundlagen zu Schwarzwild: Rottenaufbau,
        Altersklassen und typische Zeichen im Revier – ideal für Praxis und
        Prüfung.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Rotte, Frischling, Keiler</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Schwarzwild lebt meist in Rotten aus Bachen und Frischlingen. Keiler sind
        häufig Einzelgänger. Wichtig ist das sichere Ansprechen von Frischlingen,
        Überläufern und erwachsenen Stücken – auch unter schlechten
        Lichtverhältnissen.
      </p>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {quizFragen.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, i) => {
            const richtig = a.richtig;
            const istAuswahl = auswahl === i;

            let bg = "#eaeaea";
            let color = "#000";

            if (auswahl !== null) {
              if (richtig) {
                bg = "green";
                color = "white";
              }
              if (istAuswahl && !richtig) {
                bg = "red";
                color = "white";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAntwort(i)}
                disabled={auswahl !== null}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: bg,
                  color,
                  cursor: auswahl === null ? "pointer" : "default",
                  fontSize: 16,
                }}
              >
                {a.text}
              </button>
            );
          })}
        </>
      )}

      {fertig && (
        <>
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Fertig!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von{" "}
            <strong>{quizFragen.length}</strong> Fragen richtig.
          </p>
        </>
      )}
      <CourseProgressNotice courseId="schwarzwild" {...courseProgress} />
    </div>
  );
}
