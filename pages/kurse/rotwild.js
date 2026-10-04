import { useState } from "react";
import useMiniQuizAnswer from "../../hooks/useMiniQuizAnswer";
import useCourseProgress from "../../hooks/useCourseProgress";
import CourseProgressNotice from "../../components/CourseProgressNotice";

const rotwildQuiz = [
  {
    frage: "Wie heißt das weibliche Rotwild?",
    antworten: [
      { text: "Geiß", richtig: false },
      { text: "Tier", richtig: true },
      { text: "Schmalreh", richtig: false },
      { text: "Hirschkuh", richtig: false }
    ]
  },
  {
    frage: "Was ist typisch für die Brunft des Rotwildes?",
    antworten: [
      { text: "Hirsche klagend bellen", richtig: false },
      { text: "Hirsche röhren lautstark", richtig: true },
      { text: "Hirsche zeigen Balzsprünge wie Federwild", richtig: false },
      { text: "Hirsche wechseln ins Hochgebirge", richtig: false }
    ]
  },
  {
    frage: "Wie erkennt man typischerweise die Losung von Rotwild?",
    antworten: [
      { text: "Kleine, trockene Kügelchen wie beim Rehwild", richtig: false },
      { text: "Würstchenform wie bei Schwarzwild", richtig: false },
      { text: "Große, eiförmige Stücke, oft in Haufen", richtig: true },
      { text: "Feine, längliche Pellets", richtig: false }
    ]
  },
  {
    frage: "Wie leben Rotwildhirsche außerhalb der Brunft?",
    antworten: [
      { text: "In großen Kahlwildrudeln", richtig: false },
      { text: "Einzeln oder in Hirschtrupps", richtig: true },
      { text: "Im Familienverbund mit Kälbern", richtig: false },
      { text: "Nur in gemischten Rudeln", richtig: false }
    ]
  }
];

export default function RotwildKompaktKurs() {
  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const answerGuard = useMiniQuizAnswer(aktuelleFrage, fertig, rotwildQuiz[aktuelleFrage].antworten.length);
  const courseProgress = useCourseProgress("rotwild", {
    started: aktuelleFrage > 0 || auswahl !== null || fertig,
    answeredQuestions: fertig ? rotwildQuiz.length : aktuelleFrage + (auswahl !== null ? 1 : 0),
    totalQuestions: rotwildQuiz.length,
    score: punkte,
    completed: fertig || (aktuelleFrage === rotwildQuiz.length - 1 && auswahl !== null),
  });

  const frage = rotwildQuiz[aktuelleFrage];

  function handleAntwort(index) {
    if (!answerGuard.accept(index)) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    answerGuard.schedule(() => {
      const next = aktuelleFrage + 1;
      if (next < rotwildQuiz.length) {
        setAktuelleFrage(next);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 1200);
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: "40px auto",
      background: "white",
      padding: 24,
      borderRadius: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        🦌 Rotwild kompakt
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Kompaktes Wissen über unser größtes heimisches Schalenwild.  
        Ideal für Jagdscheinanwärter und zur schnellen Wiederholung.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Rotwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Rotwild ist die größte heimische Schalenwildart. Die <strong>Hirsche</strong> tragen
        ein eindrucksvolles Geweih, das jedes Jahr neu gebildet, verfegt und 
        anschließend abgeworfen wird. Weibliches Rotwild heißt <strong>Tier</strong>,
        der Nachwuchs <strong>Kalb</strong>.
        <br /><br />
        Rotwild lebt in <strong>Rudeln</strong>. Kahlwildverbände werden meist von erfahrenen
        Alttieren geführt, während Hirsche außerhalb der Brunft vielfach einzeln
        oder in kleineren Hirschtrupps anzutreffen sind.
        <br /><br />
        Während der <strong>Brunft</strong> röhren die Hirsche, um Rivalen zu beeindrucken und
        Weibchen zu führen. Typische Zeichen im Revier sind Fegestellen,
        Bodenverwundungen, Suhlen und die charakteristische Losung.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {rotwildQuiz.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>
            {frage.frage}
          </p>

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
                  width: "100%",
                  padding: "12px",
                  fontSize: 17,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color: color,
                  cursor: auswahl === null ? "pointer" : "default",
                  textAlign: "left"
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
            Du hast <strong>{punkte}</strong> von <strong>{rotwildQuiz.length}</strong> Fragen richtig.
          </p>
        </>
      )}

      <CourseProgressNotice courseId="rotwild" {...courseProgress} />
    </div>
  );
}
