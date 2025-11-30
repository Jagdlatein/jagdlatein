"use client";

import { useState } from "react";

export default function SchiessenBasicKurs() {
  const quiz = [
    {
      frage: "Welche Haltung ist beim Schießen wichtig?",
      antworten: [
        { text: "Fester Stand & Körperstabilität", richtig: true },
        { text: "Lockere, unruhige Haltung", richtig: false },
        { text: "Rückwärts lehnen", richtig: false },
        { text: "Nur auf die Optik schauen", richtig: false }
      ]
    },
    {
      frage: "Wofür dient der Atemrhythmus?",
      antworten: [
        { text: "Zum Wärmen", richtig: false },
        { text: "Zum Beruhigen & Stabilisieren", richtig: true },
        { text: "Für laute Signale", richtig: false },
        { text: "Zum Abwehren von Wild", richtig: false }
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
        setI(i + 1); setSel(null);
      } else setFertig(true);
    }, 1000);
  }

  return (
    <div style={{
      maxWidth: 800, margin: "40px auto", padding: 24,
      background: "white", borderRadius: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🎯 Schießtechnik Basics</h1>

      <p style={{ fontSize: 18, marginBottom: 25 }}>
        Eine gute Schießtechnik beginnt mit stabiler Haltung, sicherem Zielvorgang 
        und ruhiger Ausführung. Atemtechnik und richtige Abzugsposition 
        beeinflussen die Präzision maßgeblich.
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
              <button key={idx} onClick={() => choose(idx)} disabled={sel !== null}
                style={{
                  width: "100%", padding: 12, marginBottom: 10,
                  borderRadius: 8, background: bg, color: "white"
                }}>
                {a.text}
              </button>
            );
          })}
        </>
      ) : (
        <>
          <h3 style={{ fontSize: 24 }}>🎉 Prima!</h3>
          <p>Du hast {punkte} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
