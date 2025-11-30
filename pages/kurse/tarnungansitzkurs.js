"use client";

import { useState } from "react";

export default function NachtjagdKurs() {
  const quiz = [
    {
      frage: "Warum ist Wind beim nächtlichen Ansitz besonders wichtig?",
      antworten: [
        { text: "Weil er Mondlicht verstärkt", richtig: false },
        { text: "Weil Wild den Menschengeruch stark wahrnimmt", richtig: true },
        { text: "Weil Tiere dann schlafen", richtig: false },
        { text: "Weil Wärmebildgeräte schlechter funktionieren", richtig: false }
      ]
    },
    {
      frage: "Welches Hilfsmittel ist für die Nachtjagd typisch?",
      antworten: [
        { text: "Schalldämpfer", richtig: false },
        { text: "Wärmebildgerät", richtig: true },
        { text: "Fangspiegel", richtig: false },
        { text: "Flinte", richtig: false }
      ]
    },
    {
      frage: "Was ist bei der Nachsuche in der Nacht wichtig?",
      antworten: [
        { text: "Sofort loslaufen", richtig: false },
        { text: "Wärmebild & ruhiges Vorgehen", richtig: true },
        { text: "Schreien und Rufen", richtig: false },
        { text: "Alle Lichter ausschalten", richtig: false }
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
      } else {
        setFertig(true);
      }
    }, 1000);
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
        🌙 Nachtjagd Basics
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Die Nachtjagd erfordert besondere Vorsicht und Erfahrung. Wärmebildtechnik ermöglicht 
        eine sichere Ansprache auch bei Dunkelheit. Wind, Geräusche und Lichtdisziplin 
        spielen eine entscheidende Rolle.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {i + 1} von {quiz.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, idx) => {
            let bg = "#eaeaea";
            let color = "#000";

            if (sel !== null) {
              if (a.richtig) {
                bg = "green";
                color = "white";
              }
              if (sel === idx && !a.richtig) {
                bg = "red";
                color = "white";
              }
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
            Du hast <strong>{punkte}</strong> von <strong>{quiz.length}</strong> Fragen richtig.
          </p>
        </>
      )}
    </div>
  );
}
