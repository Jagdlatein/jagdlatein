import { useState } from "react";

export default function WildkundeKurs() {

  const quizFragen = [
    {
      frage: "Welche Fährte gehört zum Rehwild?",
      antworten: [
        { text: "Schmal, parallele Schalen", richtig: true },
        { text: "Rund, tiefer Abdruck", richtig: false },
        { text: "Große, breite Schalen", richtig: false },
      ]
    }
  ];

  const [auswahl, setAuswahl] = useState(null);

  return (
    <div style={{ maxWidth: 750, margin: "40px auto", padding: 20, background: "white", borderRadius: 12 }}>
      
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 20 }}>
        🦌 Wildkunde Basics
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        Dieser Mini-Kurs vermittelt dir die grundlegenden Unterschiede der wichtigsten Wildarten.
        Ideal für Jungjäger und zur schnellen Wiederholung.
      </p>

      <h2 style={{ marginTop: 30, fontSize: 24 }}>Rehwild</h2>
      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        Rehwild ist die kleinste Hirschart Europas. Typisch: leichter Körper, große Lauscher, feiner Kopf.
        Bock und Geiß unterscheiden sich durch das Gehörn und die Feistzeit (Blattzeit).
      </p>

      <h2 style={{ marginTop: 30, fontSize: 24 }}>Schwarzwild</h2>
      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        Schwarzwild lebt im Familienverband (Rotte). Keiler sind Einzelgänger. Typisch: Wühlspuren,
        dreieckige Fährten, Losung in „Würsten“.
      </p>

      <h2 style={{ marginTop: 30, fontSize: 24 }}>Rotwild</h2>
      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        Größte heimische Wildart. Hirschkuh lebt im Kahlwildrudel, Hirsche sammeln sich zur Brunft.
      </p>

      <hr style={{ margin: "40px 0" }} />

      <h2 style={{ marginBottom: 20, fontSize: 26 }}>Quiz zum Kurs</h2>

      <p style={{ fontSize: 20, marginBottom: 20 }}>
        {quizFragen[0].frage}
      </p>

      {quizFragen[0].antworten.map((a, i) => {
        const richtig = a.richtig;
        const istAuswahl = auswahl === i;

        let bg = "#eaeaea";
        let color = "black";

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
            disabled={auswahl !== null}
            onClick={() => setAuswahl(i)}
            style={{
              display: "block",
              width: "100%",
              padding: "14px",
              marginBottom: "10px",
              fontSize: 18,
              borderRadius: 8,
              border: "none",
              background: bg,
              color: color,
              cursor: "pointer",
            }}
          >
            {a.text}
          </button>
        );
      })}

    </div>
  );
          }
