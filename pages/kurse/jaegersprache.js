import { useState } from "react";

const quizFragen = [
  {
    frage: "Welcher Begriff gehört NICHT zur Jägersprache?",
    antworten: [
      { text: "Blattzeit", richtig: false },
      { text: "Äsung", richtig: false },
      { text: "Teller", richtig: false },
      { text: "Autobahnspur", richtig: true }
    ]
  },
  {
    frage: "Was bedeutet der Begriff \"Äsung\"?",
    antworten: [
      { text: "Ruheplatz des Wildes", richtig: false },
      { text: "Nahrung des Wildes", richtig: true },
      { text: "Fährte eines Stückes", richtig: false },
      { text: "Lautäußerung des Wildes", richtig: false }
    ]
  },
  {
    frage: "Wie nennt man den Kopf des Rehwildes in der Jägersprache?",
    antworten: [
      { text: "Haupt", richtig: true },
      { text: "Knolle", richtig: false },
      { text: "Rumpf", richtig: false },
      { text: "Stirn", richtig: false }
    ]
  },
  {
    frage: "Was beschreibt der Begriff \"Losung\"?",
    antworten: [
      { text: "Haare am Anschuss", richtig: false },
      { text: "Fußabdruck des Wildes", richtig: false },
      { text: "Kot des Wildes", richtig: true },
      { text: "Verborgene Einstandslage", richtig: false }
    ]
  },
  {
    frage: "Was ist mit \"Schmalreh\" gemeint?",
    antworten: [
      {
        text: "Weibliches Reh im 2. Lebensjahr, noch ohne Kitz",
        richtig: true
      },
      { text: "Sehr mageres Stück jeden Alters", richtig: false },
      { text: "Einjähriger Bock", richtig: false },
      { text: "Geiß mit schwachem Kitz", richtig: false }
    ]
  },
  {
    frage: "Wie nennt man beim Schwarzwild die männlichen Eckzähne im Oberkiefer?",
    antworten: [
      { text: "Geweihe", richtig: false },
      { text: "Grandeln", richtig: false },
      { text: "Haderer", richtig: true },
      { text: "Spieße", richtig: false }
    ]
  }
];

export default function JaegerspracheKurs() {
  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = quizFragen[aktuelleFrage];

  function handleAntwort(index) {
    if (auswahl !== null) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    setTimeout(() => {
      if (aktuelleFrage + 1 < quizFragen.length) {
        setAktuelleFrage((f) => f + 1);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 800);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "20px 16px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        📖 Jägersprache – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        In diesem Minikurs wiederholst du wichtige Begriffe der Jägersprache –
        perfekt für Jungjäger und zur schnellen Auffrischung vor der Prüfung.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Überblick</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Viele Begriffe in der Jagd stammen aus alter Jägersprache:{" "}
        <strong>Äsung</strong> für Nahrung, <strong>Losung</strong> für Kot oder{" "}
        <strong>Fährte</strong> für die Spur des Wildes. Je sicherer du diese
        Worte beherrschst, desto leichter fallen dir Jagdpraxis und Prüfung.
      </p>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {quizFragen.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, i) => {
            const richtig = a.richtig;
            const istAuswahl = auswahl === i;

            let bg = "#eaeaea";
            let color = "#000";

            if (auswahl !== null) {
              if (richtig) {
                bg = "green";
                color = "white";
              }
              if (istAuswahl && !richtig) {
                bg = "red";
                color = "white";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAntwort(i)}
                disabled={auswahl !== null}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: bg,
                  color,
                  cursor: auswahl === null ? "pointer" : "default",
                  fontSize: 16,
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
            Du hast <strong>{punkte}</strong> von{" "}
            <strong>{quizFragen.length}</strong> Fragen richtig.
          </p>
        </>
      )}
    </div>
  );
}
