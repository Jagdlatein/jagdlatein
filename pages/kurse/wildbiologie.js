"use client";

import { useState } from "react";

export default function WildbiologieKurs() {
  const quiz = [
    {
      frage: "Was beschreibt den Begriff 'Fortpflanzungszeit'?",
      antworten: [
        { text: "Jahreszeit der Nahrungssuche", richtig: false },
        { text: "Paarungs- und Setzzeit des Wildes", richtig: true },
        { text: "Zeit der Ruhephase", richtig: false },
        { text: "Zeitraum der Fellfärbung", richtig: false }
      ]
    },
    {
      frage: "Wozu dient der Bast beim Hirsch?",
      antworten: [
        { text: "Schutz beim Feindkontakt", richtig: false },
        { text: "Nährstoffversorgung des wachsenden Geweihs", richtig: true },
        { text: "Geräuschdämpfung", richtig: false },
        { text: "Tarnung", richtig: false }
      ]
    }
  ];

  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = quiz[i];

  function choose(a) {
    if (sel !== null) return;
    setSel(a);
    if (frage.antworten[a].richtig) setPunkte(punkte + 1);
    setTimeout(() => {
      if (i + 1 < quiz.length) {
        setI(i + 1);
        setSel(null);
      } else setFertig(true);
    }, 1000);
  }

  return (
    <div style={{
      maxWidth: 800, margin: "40px auto", background: "white",
      padding: 24, borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🧬 Wildbiologie kompakt</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Wildbiologie beschäftigt sich mit Verhalten, Ernährung, Fortpflanzung 
        und Lebensraum der Wildarten. Ein tiefes Verständnis hilft bei der 
        waidgerechten Jagdausübung und Hege.
      </p>

      {!fertig ? (
        <>
          <p>Frage {i + 1} von {quiz.length}</p>
          <p style={{ fontSize: 20 }}>{frage.frage}</p>

          {frage.antworten.map((a, idx) => {
            let bg = "#eaeaea";
            if (sel !== null) {
              if (a.richtig) bg = "green";
              if (sel === idx && !a.richtig) bg = "red";
            }
            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={sel !== null}
                style={{
                  width: "100%", padding: 12, marginBottom: 10,
                  borderRadius: 8, background: bg, color: "white",
                  textAlign: "left"
                }}
              >
                {a.text}
              </button>
            );
          })}
        </>
      ) : (
        <>
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Hervorragend!</h3>
<p>Du hast {punkte} von {quiz.length} Fragen richtig.</p>

        </>
      )}
    </div>
  );
}
