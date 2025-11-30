"use client";

import { useState } from "react";

export default function FederwildKurs() {
  const quiz = [
    {
      frage: "Welche Art zählt zum Federwild?",
      antworten: [
        { text: "Rehwild", richtig: false },
        { text: "Stockente", richtig: true },
        { text: "Dachs", richtig: false },
        { text: "Marderhund", richtig: false }
      ]
    },
    {
      frage: "Wie lässt sich Federwild gut ansprechen?",
      antworten: [
        { text: "Über Schalenabdrücke", richtig: false },
        { text: "Über Flugbild & Gefieder", richtig: true },
        { text: "Über Lautäußerungen von Säugetieren", richtig: false },
        { text: "Über Losung", richtig: false }
      ]
    },
    {
      frage: "Für welchen Lebensraum ist die Stockente typisch?",
      antworten: [
        { text: "Wüstengebiete", richtig: false },
        { text: "Feuchtgebiete & Stillgewässer", richtig: true },
        { text: "Hochgebirge", richtig: false },
        { text: "Steppen", richtig: false }
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
        🪶 Federwild Basics
      </h1>

      <p style={{ fontSize: 18, marginBottom: 25, lineHeight: 1.6 }}>
        Zum Federwild zählen alle jagdbaren Vogelarten. Typische Vertreter sind 
        Enten, Gänse, Fasane und Tauben. Die Ansprache erfolgt über Flugbild, 
        Körperform, Gefieder und Verhalten.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Quiz</h2>

      {!fertig ? (
        <>
          <p>Frage {i + 1} von {quiz.length}</p>
          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

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
                  borderRadius: 8, border: "none",
                  background: bg, color: sel !== null ? "white" : "black",
                  fontSize: 17, textAlign: "left"
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
