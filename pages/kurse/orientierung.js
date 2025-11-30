"use client";

import { useState } from "react";

export default function OrientierungKurs() {
  const quiz = [
    {
      frage: "Woran kann man ohne Technik die Himmelsrichtung bestimmen?",
      antworten: [
        { text: "Am Rauschen der Bäume", richtig: false },
        { text: "Am Sonnenstand", richtig: true },
        { text: "Am Jagdhund", richtig: false },
        { text: "An der Temperatur", richtig: false }
      ]
    },
    {
      frage: "Was ist bei der Revierarbeit besonders wichtig?",
      antworten: [
        { text: "Sicherheit und Übersicht", richtig: true },
        { text: "Schnelligkeit", richtig: false },
        { text: "Laute Kommunikation", richtig: false },
        { text: "Alleine arbeiten", richtig: false }
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
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🧭 Orientierung & Revierpraxis</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Revierpraxis umfasst Wegeplanung, Wildbeobachtung, Pflegearbeiten und 
        Orientierung im Gelände. Wichtig ist stets, die eigene Position, 
        Windrichtung und mögliche Gefahren zu kennen.
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
                  borderRadius: 8, background: bg,
                  color: sel !== null ? "white" : "black",
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Gut gemacht!</h3>
          <p>Du hast {punkte} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
