"use client";

import { useState } from "react";

export default function LockjagdBasicKurs() {
  const quiz = [
    {
      frage: "Was ist die wichtigste Voraussetzung für erfolgreiche Lockjagd?",
      antworten: [
        { text: "Möglichst lautes und häufiges Locken", richtig: false },
        { text: "Natürliche Laute + richtige Jahreszeit + Windrichtung", richtig: true },
        { text: "Bunte Kleidung", richtig: false },
        { text: "Viel Bewegung am Stand", richtig: false }
      ]
    },
    {
      frage: "Warum ist Wind bei der Lockjagd entscheidend?",
      antworten: [
        { text: "Wild ignoriert Gerüche", richtig: false },
        { text: "Wild kommt meist gegen den Wind", richtig: true },
        { text: "Wind hilft beim Lockruf-Tragen", richtig: false },
        { text: "Der Wind ist unwichtig", richtig: false }
      ]
    },
    {
      frage: "Welche Locklaute werden typischerweise beim Fuchs verwendet?",
      antworten: [
        { text: "Vogelangstruf, Hasenklage, Mäusepfiff", richtig: true },
        { text: "Kuhglocke", richtig: false },
        { text: "Hirschtrompete", richtig: false },
        { text: "Krähenbalzruf", richtig: false }
      ]
    },
    {
      frage: "Wann ist Blattjagd auf Rehwild sinnvoll?",
      antworten: [
        { text: "Im Dezember", richtig: false },
        { text: "Nur während der Blattzeit (Juli/August)", richtig: true },
        { text: "Nur nachts", richtig: false },
        { text: "Im Frühjahr", richtig: false }
      ]
    },
    {
      frage: "Wie sollte man Lockrufe beginnen?",
      antworten: [
        { text: "Sehr laut starten", richtig: false },
        { text: "Leise beginnen und steigern", richtig: true },
        { text: "Dauerhaft gleich laut rufen", richtig: false },
        { text: "Ununterbrochen rufen", richtig: false }
      ]
    },
    {
      frage: "Was ist bei der Krähenjagd besonders wichtig?",
      antworten: [
        { text: "Locker und auffällig bewegen", richtig: false },
        { text: "Gutes Tarnbild + natürliches Lockbild", richtig: true },
        { text: "Auf dem Feldweg stehen", richtig: false },
        { text: "Immer ohne Lockbild jagen", richtig: false }
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
        🎯 Lockjagd Basic – Einstieg in die Kunst des Rufens
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28 }}>
        Die Lockjagd ist eine der spannendsten Jagdarten. Sie verlangt Gefühl,
        Kenntnis über Lautäußerungen des Wildes und perfekte Tarnung. Dieser Kurs 
        vermittelt die Grundlagen für Fuchs-, Rehwild- und Krähenlockjagd.
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
            Du hast <strong>{punkte}</strong> von <strong>{quiz.length}</strong> Fragen richtig.
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
