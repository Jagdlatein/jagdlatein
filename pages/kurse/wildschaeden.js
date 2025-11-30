"use client";

import { useState } from "react";

export default function WildschaedenKurs() {
  const quiz = [
    {
      frage: "Welche Wildart verursacht typischerweise Verbissschäden?",
      antworten: [
        { text: "Rotfuchs", richtig: false },
        { text: "Rehwild", richtig: true },
        { text: "Fasan", richtig: false },
        { text: "Ente", richtig: false }
      ]
    },
    {
      frage: "Wie erkennt man Wühl- oder Grabeschäden?",
      antworten: [
        { text: "An losen Erdaufschüttungen", richtig: true },
        { text: "An abgebrochenen Zweigen", richtig: false },
        { text: "Am Gefieder", richtig: false },
        { text: "An Losung auf Steinen", richtig: false }
      ]
    },
    {
      frage: "Welche Maßnahme hilft gegen Wildschäden?",
      antworten: [
        { text: "Unregelmäßige Kontrollen", richtig: false },
        { text: "Schutzmaßnahmen wie Zäune", richtig: true },
        { text: "Grelles Licht", richtig: false },
        { text: "Jagen im Mai", richtig: false }
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
    if (frage.antworten[a].richtig) setPunkte(p => p + 1);

    setTimeout(() => {
      if (i + 1 < quiz.length) {
        setI(i + 1);
        setSel(null);
      } else setFertig(true);
    }, 1000);
  }

  return (
    <div style={{
      maxWidth: 800, margin: "40px auto", padding: 24, background: "white",
      borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🌾 Wildschäden erkennen</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Wildschäden entstehen vor allem durch Verbiss, Schälen oder Wühlen. 
        Besonders Reh-, Rot- und Schwarzwild verursachen Schäden im Wald 
        und in landwirtschaftlichen Kulturen. Schutzmaßnahmen und Hege 
        helfen, die Schäden gering zu halten.
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
                  width: "100%", padding: 12, marginBottom: 10, borderRadius: 8,
                  background: bg, color: "white", textAlign: "left"
                }}
              >
                {a.text}
              </button>
            );
          })}
        </>
      ) : (
        <>
          <h3 style={{ fontSize: 24 }}>🎉 Hervorragend!</h3>
          <p>Du hast {punkte} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
