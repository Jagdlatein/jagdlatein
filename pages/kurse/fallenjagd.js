import { useState } from "react";
import useMiniQuizAnswer from "../../hooks/useMiniQuizAnswer";
import useCourseProgress from "../../hooks/useCourseProgress";
import CourseProgressNotice from "../../components/CourseProgressNotice";

export default function FallenjagdBasicKurs() {
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

  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const answerGuard = useMiniQuizAnswer(aktuelleFrage, fertig, fallenjagdQuiz[aktuelleFrage].antworten.length);
  const courseProgress = useCourseProgress("fallenjagd", {
    started: aktuelleFrage > 0 || auswahl !== null || fertig,
    answeredQuestions: fertig ? fallenjagdQuiz.length : aktuelleFrage + (auswahl !== null ? 1 : 0),
    totalQuestions: fallenjagdQuiz.length,
    score: punkte,
    completed: fertig || (aktuelleFrage === fallenjagdQuiz.length - 1 && auswahl !== null),
  });

  const frage = fallenjagdQuiz[aktuelleFrage];

  function handleAntwort(index) {
    if (!answerGuard.accept(index)) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    answerGuard.schedule(() => {
      const next = aktuelleFrage + 1;
      if (next < fallenjagdQuiz.length) {
        setAktuelleFrage(next);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 1200);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        background: "white",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        🪤 Fallenjagd Basics
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Grundlagen der waidgerechten und tierschutzgerechten Fallenjagd.  
        Kompakt erklärt für Ausbildung und Praxis.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Fallenjagd</h2>

      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Die Fallenjagd dient der <strong>Hege</strong>, der <strong>Prädatorenregulierung</strong>
        und dem <strong>Artenschutz</strong>. Dabei steht der Tierschutz im Vordergrund.
        <br /><br />
        Häufig eingesetzt werden <strong>Kastenfallen</strong>, die Wild lebend und
        unverletzt fangen. Schlagfallen sind nur für bestimmte Arten und unter
        strengen gesetzlichen Vorgaben erlaubt.
        <br /><br />
        Fallen müssen <strong>mindestens einmal täglich</strong> kontrolliert werden.
        Wichtige Faktoren sind Standortwahl, Tarnung, Lockwirkung und eine sichere
        Entnahme gefangenen Wildes.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {fallenjagdQuiz.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, i) => {
            let bg = "#eaeaea";
            let color = "#000";

            if (auswahl !== null) {
              if (a.richtig) {
                bg = "green";
                color = "white";
              }
              if (auswahl === i && !a.richtig) {
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
                  padding: 12,
                  fontSize: 17,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color: color,
                  cursor: auswahl === null ? "pointer" : "default",
                  textAlign: "left",
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
            Du hast <strong>{punkte}</strong> von <strong>{fallenjagdQuiz.length}</strong> Fragen
            richtig.
          </p>
        </>
      )}
      <CourseProgressNotice courseId="fallenjagd" {...courseProgress} />
    </div>
  );
}
