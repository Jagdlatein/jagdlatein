"use client";

import { useState } from "react";

export default function NachtjagdKurs() {
  const quiz = [
    {
      frage: "Warum ist Nachtjagd besonders anspruchsvoll?",
      antworten: [
        { text: "Weil Jäger nachts schneller rennen müssen", richtig: false },
        { text: "Weil Sicht, Ansprache & Sicherheit erschwert sind", richtig: true },
        { text: "Weil Wild nachts schläft", richtig: false },
        { text: "Weil Waffen anders funktionieren", richtig: false }
      ]
    },
    {
      frage: "Wofür eignet sich das Wärmebildgerät besonders?",
      antworten: [
        { text: "Zum sicheren Ansprechen", richtig: false },
        { text: "Zum Entdecken von Wild", richtig: true },
        { text: "Zum Messen der Entfernung", richtig: false },
        { text: "Zum Locken", richtig: false }
      ]
    },
    {
      frage: "Was ist die wichtigste Regel bei Nacht?",
      antworten: [
        { text: "Immer sofort schießen", richtig: false },
        { text: "Keine sichere Ansprache = kein Schuss", richtig: true },
        { text: "Nur bei Regen jagen", richtig: false },
        { text: "Wild mit Licht anleuchten", richtig: false }
      ]
    },
    {
      frage: "Welches Wild ist typischerweise nachtaktiv?",
      antworten: [
        { text: "Rebhuhn", richtig: false },
        { text: "Schwarzwild", richtig: true },
        { text: "Fasan", richtig: false },
        { text: "Steinwild", richtig: false }
      ]
    },
    {
      frage: "Was sollte man bei der Nachtpirsch besonders beachten?",
      antworten: [
        { text: "Sehr schnelle Bewegungen", richtig: false },
        { text: "Extrem leises Vorgehen & Wind", richtig: true },
        { text: "Helle Kleidung tragen", richtig: false },
        { text: "Auf freiem Feld stehen bleiben", richtig: false }
      ]
    },
    {
      frage: "Was gilt bei Schwarzwild in der Nacht?",
      antworten: [
        { text: "Nur Leitbachen schießen", richtig: false },
        { text: "Frischlinge sicher ausschließen, Rottenstruktur respektieren", richtig: true },
        { text: "Blind auf die Rotte schießen", richtig: false },
        { text: "Nachtjagd ist verboten", richtig: false }
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
    if (frage.antworten[a].richtig) setPunkte(prev => prev + 1);

    setTimeout(() => {
      if (i + 1 < quiz.length) {
        setI(prev => prev + 1);
        setSel(null);
      } else {
        setFertig(true);
      }
    }, 900);
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: "40px auto",
      background: "white",
      padding: 24,
      borderRadius: 14,
      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ fontSize: 34, fontWeight: "bold", marginBottom: 20 }}>
        🌙 Nachtjagd – Grundlagenkurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28 }}>
        Die Nachtjagd erfordert besondere Sicherheit, Technik und Erfahrung.
        Wärmebildgeräte, Nachtsichttechnik und richtiges Verhalten bei Dunkelheit
        ermöglichen eine waidgerechte Jagdausübung.
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
              if (a.richtig) { bg = "#2e7d32"; color = "white"; border = "1px solid #2e7d32"; }
              if (sel === idx && !a.richtig) { bg = "#c62828"; color = "white"; border = "1px solid #c62828"; }
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
                  transition: "0.2s"
                }}
              >
                {a.text}
              </button>
            );
          })}
        </>
      ) : (
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <h3 style={{ fontSize: 26, marginBottom: 12 }}>🎉 Sehr gut!</h3>
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
              cursor: "pointer"
            }}
          >
            Nochmal starten 🔄
          </button>
        </div>
      )}
    </div>
  );
}
