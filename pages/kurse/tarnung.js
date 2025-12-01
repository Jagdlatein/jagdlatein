"use client";

import { useState } from "react";

export default function TarnungAnsitzKurs() {
  const quiz = [
    {
      frage: "Warum ist Tarnung bei der Jagd wichtig?",
      antworten: [
        { text: "Wild erkennt Farben schlecht", richtig: false },
        { text: "Um Konturen zu brechen und Bewegung zu reduzieren", richtig: true },
        { text: "Damit Kleidung nicht schmutzig wird", richtig: false },
        { text: "Um schneller laufen zu können", richtig: false }
      ]
    },
    {
      frage: "Welcher Faktor verrät den Jäger am häufigsten?",
      antworten: [
        { text: "Geräusch der Kleidung", richtig: false },
        { text: "Bewegung", richtig: true },
        { text: "Schuhfarbe", richtig: false },
        { text: "Rucksackgröße", richtig: false }
      ]
    },
    {
      frage: "Warum sollte man sich beim Ansitz im Schatten aufhalten?",
      antworten: [
        { text: "Weil es dort wärmer ist", richtig: false },
        { text: "Weil der Jäger schlechter erkannt wird", richtig: true },
        { text: "Um besser fotografieren zu können", richtig: false },
        { text: "Weil Wild Schatten meidet", richtig: false }
      ]
    },
    {
      frage: "Worauf ist beim Aufsteigen auf den Hochsitz zu achten?",
      antworten: [
        { text: "Schnell rauf, damit es fertig ist", richtig: false },
        { text: "Langsam, leise und gegen den Wind", richtig: true },
        { text: "Mit freiem Gewehrlauf schwingen", richtig: false },
        { text: "Geräusche sind egal", richtig: false }
      ]
    },
    {
      frage: "Was sollte beim Glasen vermieden werden?",
      antworten: [
        { text: "Langsam zu schauen", richtig: false },
        { text: "Schnelle, ruckartige Bewegungen", richtig: true },
        { text: "Im Sitzen zu beobachten", richtig: false },
        { text: "Ein Fernglas zu benutzen", richtig: false }
      ]
    },
    {
      frage: "Was ist beim Wind zu beachten?",
      antworten: [
        { text: "Wind ist egal bei Tarnkleidung", richtig: false },
        { text: "Immer gegen den Wind jagen", richtig: true },
        { text: "Windrichtung verändert sich nie", richtig: false },
        { text: "Wind ist nur relevant bei Regen", richtig: false }
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
      } else setFertig(true);
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
        🍂 Tarnung & Ansitz – Jagdtechnik kompakt
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28 }}>
        Tarnung, Bewegungskontrolle, Wind und ein sauber gewählter Ansitzplatz
        entscheiden darüber, ob Wild vertraut bleibt. Dieser Kurs vermittelt
        die wichtigsten Grundlagen für eine waidgerechte und erfolgreiche Ansitzjagd.
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
                  fontSize: 17,
                  cursor: sel === null ? "pointer" : "default",
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
