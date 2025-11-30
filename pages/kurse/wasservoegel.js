"use client";

import { useState } from "react";

export default function WasservoegelKurs() {
  const quiz = [
    {
      frage: "Was ist typisch für Tauchenten?",
      antworten: [
        { text: "Langer Hals & hohes Schwimmen", richtig: false },
        { text: "Tauchen tief und haben kompakten Körperbau", richtig: true },
        { text: "Sehr leichte Körperform", richtig: false },
        { text: "Nestbau in Bäumen", richtig: false }
      ]
    },
    {
      frage: "Wie unterscheidet man Stockente ♂ und ♀?",
      antworten: [
        { text: "Keine Unterschiede erkennbar", richtig: false },
        { text: "Erpel hat grünen Kopf, Ente braun gemustert", richtig: true },
        { text: "Erpel ist kleiner", richtig: false },
        { text: "Ente ist bunt gefärbt", richtig: false }
      ]
    }
  ];

  const [i, setI] = useState(0);
  const [s, setS] = useState(null);
  const [p, setP] = useState(0);
  const [f, setF] = useState(false);
  const q = quiz[i];

  function choose(a) {
    if (s !== null) return;
    setS(a);
    if (q.antworten[a].richtig) setP(p + 1);

    setTimeout(() => {
      if (i + 1 < quiz.length) {
        setI(i + 1);
        setS(null);
      } else setF(true);
    }, 1000);
  }

  return (
    <div style={{
      maxWidth: 800, margin: "40px auto", background: "white", padding: 24,
      borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🦢 Wasservögel sicher bestimmen</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Wasservögel lassen sich gut über Flugbild, Lautäußerungen und Gefieder 
        unterscheiden. Besonders wichtig: Schwimmverhalten, Körperform und 
        Merkmal des Schnabels.
      </p>

      {!f ? (
        <>
          <p>Frage {i + 1} von {quiz.length}</p>
          <p style={{ fontSize: 20 }}>{q.frage}</p>

          {q.antworten.map((a, idx) => {
            let bg = "#eaeaea";
            if (s !== null) {
              if (a.richtig) bg = "green";
              if (s === idx && !a.richtig) bg = "red";
            }

            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={s !== null}
                style={{
                  width: "100%", padding: 12, marginBottom: 10,
                  borderRadius: 8, background: bg, color: "white",
                  textAlign: "left", fontSize: 17
                }}
              >
                {a.text}
              </button>
            );
          })}
        </>
      ) : (
        <>
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Top!</h3>
          <p>Du hast {p} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
