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

    if (frage.antworten[a].richtig) {
      setPunkte((p) => p + 1);
    }

    setTimeout(() => {
      if (i + 1 < quiz.length) {
        setI((prev) => prev + 1);
        setSel(null);
      } else {
        setFertig(true);
      }
    }, 900);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        padding: 24,
        background: "white",
        borderRadius: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 34, fontWeight: "bold", marginBottom: 20 }}>
        🎯 Schießtechnik – Basics
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28 }}>
        Eine saubere Schießtechnik beginnt mit stabilem Stand, korrekter Anschlaghaltung,
        ruhigem Atemrhythmus und einem gleichmäßigen Abzugsverhalten.  
        Jeder dieser Faktoren beeinflusst die Schusspräzision maßgeblich.
      </p>

      {!fertig ? (
        <>
          <p style={{ fontSize: 17, marginBottom: 8 }}>
            Frage {i + 1} von {quiz.length}
          </p>

          <p style={{ fontSize: 22, marginBottom: 18, fontWeight: 500 }}>
            {frage.frage}
          </p>

          {frage.antworten.map((a, idx) => {
            let bg = "#f3f3f3";
            let color = "#000";
            let border = "1px solid #ccc";

            if (sel !== null) {
              if (a.richtig) {
                bg = "#2e7d32";
                color = "white";
                border = "1px solid #2e7d32";
              }
              if (sel === idx && !a.richtig) {
                bg = "#c62828";
                color = "white";
                border = "1px solid #c62828";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={sel !== null}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: 12,
                  borderRadius: 10,
                  background: bg,
                  color,
                  border,
                  textAlign: "left",
                  cursor: sel === null ? "pointer" : "default",
                  fontSize: 17,
                  transition: "0.2s",
                }}
              >
                {a.text}
              </button>
            );
          })}
        </>
      ) : (
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <h3 style={{ fontSize: 26, marginBottom: 12 }}>🎉 Prima!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von{" "}
            <strong>{quiz.length}</strong> Fragen richtig.
          </p>

          <button
            onClick={() => {
              setI(0);
              setSel(null);
              setPunkte(0);
              setFertig(false);
            }}
            style={{
              marginTop: 20,
              padding: "12px 18px",
              fontSize: 18,
              borderRadius: 8,
              border: "none",
              background: "#1b5e20",
              color: "white",
              cursor: "pointer",
            }}
          >
            Nochmal starten 🔄
          </button>
        </div>
      )}
    </div>
  );
}
