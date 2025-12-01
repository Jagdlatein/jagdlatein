"use client";

import { useState } from "react";

export default function NachtjagdKurs() {
  const quiz = [
    {
      frage: "Wann beginnt eine Nachsuche?",
      antworten: [
        { text: "Erst am nächsten Tag", richtig: false },
        { text: "Sobald ein Treffer zweifelhaft ist", richtig: true },
        { text: "Nur bei viel Schweiß", richtig: false },
        { text: "Nur wenn das Stück nicht liegt", richtig: false }
      ]
    },
    {
      frage: "Was ist die wichtigste Sofortmaßnahme nach dem Schuss?",
      antworten: [
        { text: "Schnell dem Stück nachrennen", richtig: false },
        { text: "Anschuss beobachten & markieren", richtig: true },
        { text: "Waffe sofort entladen", richtig: false },
        { text: "Ins Auto sitzen", richtig: false }
      ]
    },
    {
      frage: "Welche Wartezeit gilt beim Weichschuss (Pansen)?",
      antworten: [
        { text: "10 Minuten", richtig: false },
        { text: "1 Stunde", richtig: false },
        { text: "3–4 Stunden", richtig: true },
        { text: "Sofortige Nachsuche", richtig: false }
      ]
    },
    {
      frage: "Wer ist bei der Nachsuche der wichtigste Partner?",
      antworten: [
        { text: "Der Hundeführer", richtig: false },
        { text: "Der Schweißhund", richtig: true },
        { text: "Der Förster", richtig: false },
        { text: "Der Nachbar", richtig: false }
      ]
    },
    {
      frage: "Was sollte man auf der Suche unbedingt vermeiden?",
      antworten: [
        { text: "Langsam gehen", richtig: false },
        { text: "Fährte zertrampeln", richtig: true },
        { text: "Wind prüfen", richtig: false },
        { text: "Gelände lesen", richtig: false }
      ]
    },
    {
      frage: "Was gilt, wenn verletztes Wild gefunden wird?",
      antworten: [
        { text: "Sofort nah rangehen", richtig: false },
        { text: "Sicherheit beachten, Stück waidgerecht erlösen", richtig: true },
        { text: "Foto machen", richtig: false },
        { text: "Hund ableinen", richtig: false }
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
        🩸 Nachjagd – Grundlagenkurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28 }}>
        Die Nachsuche dient dazu, verletztes Wild schnell und waidgerecht zu
        finden. Ruhe, Erfahrung und ein gut geführter Schweißhund sind entscheidend
        für eine erfolgreiche und sichere Nachjagd.
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
