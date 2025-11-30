"use client";

import { useState } from "react";

export default function GreifvoegelKurs() {
  const quiz = [
    {
      frage: "Welche Art ist ein typischer Greifvogel?",
      antworten: [
        { text: "Buntspecht", richtig: false },
        { text: "Habicht", richtig: true },
        { text: "Amsel", richtig: false },
        { text: "Reiher", richtig: false }
      ]
    },
    {
      frage: "Worüber lassen sich Greifvögel gut ansprechen?",
      antworten: [
        { text: "Schnabel- und Krallenform", richtig: true },
        { text: "Schwanzlänge", richtig: false },
        { text: "Körperfarbe allein", richtig: false },
        { text: "Fluggeschwindigkeit", richtig: false }
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
      maxWidth: 800,
      margin: "40px auto",
      background: "white",
      padding: 24,
      borderRadius: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
    }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        🦅 Greifvögel erkennen
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Greifvögel sind Beutegreifer mit stark gekrümmtem Schnabel und 
        kraftvollen Fängen. Zu den wichtigsten Arten zählen Bussard, Habicht 
        und Falke. Eine sichere Ansprache erfolgt über Flugbild, Silhouette 
        und typische Verhaltensweisen.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Quiz</h2>

      {!fertig && (
        <>
          <p>Frage {i + 1} von {quiz.length}</p>
          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, idx) => {
            let bg = "#eaeaea";
            let color = "#000";

            if (sel !== null) {
              if (a.richtig) { bg = "green"; color = "white"; }
              if (sel === idx && !a.richtig) { bg = "red"; color = "white"; }
            }

            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={sel !== null}
                style={{
                  width: "100%",
                  padding: 12,
                  fontSize: 17,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color: color,
                  cursor: sel === null ? "pointer" : "default",
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Sehr gut!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von <strong>{quiz.length}</strong> Fragen richtig.
          </p>
        </>
      )}
    </div>
  );
}
