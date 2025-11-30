"use client";

import { useState } from "react";

export default function TrittsiegelKurs() {
  const quiz = [
    {
      frage: "Wie sieht das Trittsiegel des Rotfuchses aus?",
      antworten: [
        { text: "Rund, 10 cm groß", richtig: false },
        { text: "Oval, oft ‚schnürend‘ gesetzt", richtig: true },
        { text: "Sehr tief eingedrückt", richtig: false },
        { text: "Schalenförmig", richtig: false }
      ]
    },
    {
      frage: "Was unterscheidet ein Trittsiegel vom Fährtenbild?",
      antworten: [
        { text: "Trittsiegel ist der einzelne Abdruck", richtig: true },
        { text: "Fährtenbild ist nur der Gangwechsel", richtig: false },
        { text: "Beides ist identisch", richtig: false },
        { text: "Trittsiegel = mehrere Schritte", richtig: false }
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
      maxWidth: 800, margin: "40px auto",
      background: "white", padding: 24,
      borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🔍 Trittsiegel Intensivkurs</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Trittsiegel sind einzelne Fußabdrücke des Wildes. Sie geben Hinweise 
        auf Art, Gewicht, Geschwindigkeit und Verhalten. Besonders bei 
        Raubwild sind Form, Größe und Gangbildessentiell.
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Sehr gut!</h3>
          <p>Du hast {punkte} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
