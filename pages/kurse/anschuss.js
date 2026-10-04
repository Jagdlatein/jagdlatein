import { useState } from "react";
import useCourseProgress from "../../hooks/useCourseProgress";
import CourseProgressNotice from "../../components/CourseProgressNotice";

const quizFragen = [
  {
    frage: "Was versteht man unter Anschusszeichen?",
    antworten: [
      { text: "Nur die Fährte des flüchtenden Stückes", richtig: false },
      {
        text: "Alle am Schussort auffindbaren Pirschzeichen wie Schweiß, Haar, Knochensplitter",
        richtig: true,
      },
      { text: "Nur Schweiß am Wechsel", richtig: false },
      { text: "Nur Lautäußerungen des Wildes", richtig: false },
    ],
  },
  {
    frage: "Welches Zeichen deutet am ehesten auf einen Kammerschuss hin?",
    antworten: [
      {
        text: "Heller, schaumiger Lungenschweiß am Anschuss",
        richtig: true,
      },
      {
        text: "Reine Losung ohne Schweiß",
        richtig: false,
      },
      {
        text: "Nur Spiegelhaar ohne weiteren Befund",
        richtig: false },
      {
        text: "Knochensplitter vom Röhrenknochen",
        richtig: false,
      },
    ],
  },
  {
    frage: "Woran erkennst du typischerweise einen Laufschuss?",
    antworten: [
      {
        text: "Dunkler Leber- oder Pansenschweiß mit Darminhalt",
        richtig: false,
      },
      {
        text: "Splitter vom Röhrenknochen und weite, oft schweißarme Flucht",
        richtig: true,
      },
      {
        text: "Nur Lungenschaum am Anschuss",
        richtig: false,
      },
      {
        text: "Kein Schweiß, kein Haar, nur Losung",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was spricht TYPISCH für einen Weichschuss (Pansen/Darm)?",
    antworten: [
      {
        text: "Heller, fein zerstäubter Lungenschweiß",
        richtig: false,
      },
      {
        text: "Schweiß mit Panseninhalt, Darminhalt und starkem Geruch",
        richtig: true,
      },
      {
        text: "Nur Spiegelhaar ohne Schweiß",
        richtig: false,
      },
      {
        text: "Nur Knochensplitter am Anschuss",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wie verhältst du dich bei Verdacht auf Weichschuss am sinnvollsten?",
    antworten: [
      {
        text: "Sofort hinterher, bevor die Fährte kalt wird",
        richtig: false,
      },
      {
        text: "Nachsuchenführer umgehend informieren und Wartezeit sowie weiteres Vorgehen mit ihm abstimmen",
        richtig: true,
      },
      {
        text: "Stück direkt laut rufend nachgehen",
        richtig: false,
      },
      {
        text: "Gar nichts unternehmen, das Stück verendet schon irgendwo",
        richtig: false,
      },
    ],
    source: "https://www.jghv.de/aktuelles/pressemitteilung-jghv-nachsuche",
  },
  {
    frage: "Was ist beim Sichern des Anschusses wichtig?",
    antworten: [
      {
        text: "Nur grob merken, irgendwo dort im Bestand",
        richtig: false,
      },
      {
        text: "Genauen Ort einprägen, markieren und erst dann zurück zum Stand",
        richtig: true,
      },
      {
        text: "Anschuss zertrampeln, damit kein anderes Wild gewittert wird",
        richtig: false,
      },
      {
        text: "Keine Markierung setzen, um Unbeteiligte zu verwirren",
        richtig: false,
      },
    ],
  },
  {
    frage: "Welches Hilfsmittel IST sinnvoll am Anschuss?",
    antworten: [
      { text: "Starkes Parfum, um Wildgeruch zu überdecken", richtig: false },
      { text: "Markierungsband oder Zweig zum Kennzeichnen", richtig: true },
      { text: "Laute Musik vom Handy", richtig: false },
      { text: "Offenes Feuer zum besseren Licht", richtig: false },
    ],
  },
];

export default function AnschussKurs() {
  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const courseProgress = useCourseProgress("anschuss", {
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
        🔍 Anschusszeichen lesen – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Am Anschuss entscheidet sich oft, ob eine Nachsuche erfolgreich wird.
        In diesem Minikurs wiederholst du typische Anschusszeichen und lernst,
        wie du sie richtig deutest.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Anschuss & Pirschzeichen</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Schweiß, Haar, Knochensplitter, Panseninhalt – jedes Zeichen liefert
        Hinweise auf die Trefferlage. Wichtig sind Ruhe, sauberes Beobachten
        und der Respekt vor der Arbeit des Nachsuchengespanns.
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
      <CourseProgressNotice courseId="anschuss" {...courseProgress} />
    </div>
  );
}
