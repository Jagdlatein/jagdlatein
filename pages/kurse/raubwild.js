"use client";

import { useState } from "react";

export default function RaubwildKurs() {
  const quiz = [
    {
      frage: "Welche Art gehört NICHT zum Raubwild?",
      antworten: [
        { text: "Fuchs", richtig: false },
        { text: "Dachs", richtig: false },
        { text: "Marder", richtig: false },
        { text: "Rehwild", richtig: true }
      ]
    },
    {
      frage: "Wann ist der Fuchs am aktivsten?",
      antworten: [
        { text: "Mittags", richtig: false },
        { text: "In den Nacht- und Dämmerungsstunden", richtig: true },
        { text: "Nur im Winter", richtig: false },
        { text: "Nur während der Ranz", richtig: false }
      ]
    },
    {
      frage: "Welches Merkmal weist typisch auf Marderbefall hin?",
      antworten: [
        { text: "Kugelrunde Trittsiegel", richtig: false },
        { text: "Versetzte Fährte, 4–5 cm", richtig: true },
        { text: "Schalenabdruck", richtig: false },
        { text: "Hufspur", richtig: false }
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
        🦊 Raubwildkunde – kompakt
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Raubwild umfasst Arten wie Fuchs, Dachs, Marder und Iltis. 
        Sie sind wichtige Glieder des Ökosystems und übernehmen natürliche 
        Regulierungsfunktionen. Ihre Aktivitäten konzentrieren sich meist 
        auf die Dämmerung und Nachtstunden.
        <br /><br />
        Die sichere Ansprache erfolgt über Fährten, Trittsiegel, Losung 
        und Lautäußerungen. Besonders der Rotfuchs ist weit verbreitet 
        und passt sich hervorragend an unterschiedliche Lebensräume an.
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Geschafft!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von <strong>{quiz.length}</strong> Fragen richtig.
          </p>
        </>
      )}
    </div>
  );
}
