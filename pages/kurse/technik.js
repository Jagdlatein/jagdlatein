"use client";

import { useState } from "react";

export default function TechnikKurs() {
  const quiz = [
    {
      frage: "Was ist ein Vorteil von Wärmebildgeräten?",
      antworten: [
        { text: "Sie zeigen Farben realistisch", richtig: false },
        { text: "Sie erkennen Wärmesignaturen unabhängig vom Licht", richtig: true },
        { text: "Sie ersetzen die sichere Ansprache", richtig: false },
        { text: "Sie sind bei Regen nutzlos", richtig: false }
      ]
    },
    {
      frage: "Worauf muss bei Technik immer geachtet werden?",
      antworten: [
        { text: "Aufladung, Sicherheit & Bedienung", richtig: true },
        { text: "Farbe des Geräts", richtig: false },
        { text: "Modetrends", richtig: false },
        { text: "Nur Mondlicht", richtig: false }
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
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🔭 Wärmebild & Technik</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Moderne Technik spielt eine entscheidende Rolle in der Jagd. Wärmebildgeräte 
        erkennen Wild unabhängig vom Licht und ermöglichen sichere Entscheidungen.
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Großartig!</h3>
          <p>Du hast {punkte} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
