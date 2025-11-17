import { useState } from "react";

const quizFragen = [
  {
    frage: "Welche Aussage zu Rehwild ist richtig?",
    antworten: [
      { text: "Rehwild gehört zu den Rindern", richtig: false },
      { text: "Rehwild ist die kleinste heimische Hirschart", richtig: true },
      { text: "Rehwild lebt ausschließlich im Hochgebirge", richtig: false },
      { text: "Rehwild trägt immer Geweih, egal ob männlich oder weiblich", richtig: false }
    ]
  },
  {
    frage: "Woran erkennst du typischerweise die Fährte von Schwarzwild?",
    antworten: [
      { text: "Sehr kleine, runde Trittsiegel mit Ballenabdruck", richtig: false },
      { text: "Lange, schmale Schalen ohne Verwischen", richtig: false },
      { text: "Breite, kräftige Schalen, oft verwischt durch Wühlen", richtig: true },
      { text: "Nur an der Losung, nicht an der Fährte", richtig: false }
    ]
  },
  {
    frage: "Welche Losung passt am besten zu Rotwild?",
    antworten: [
      { text: "Kleine, bohnenförmige Kügelchen", richtig: false },
      { text: "Würstchenartige Haufen, häufig gekrümmt", richtig: false },
      { text: "Große, eiförmige Stücke, oft zu Haufen vereint", richtig: true },
      { text: "Feine, längliche Pellets mit spitzen Enden", richtig: false }
    ]
  }
];

export default function WildkundeKurs() {
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
      const next = aktuelleFrage + 1;
      if (next < quizFragen.length) {
        setAktuelleFrage(next);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 1200);
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: "40px auto",
      background: "white",
      padding: 24,
      borderRadius: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
    }}>
      
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        🦌 Wildkunde Basics
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Kompakter Einstieg in die wichtigsten heimischen Wildarten.  
        Ideal für Jungjäger und zur schnellen Wiederholung.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Rehwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Rehwild ist die kleinste heimische Hirschart. Männliche heißen <strong>Bock</strong>,
        weibliche <strong>Geiß</strong>. Die Blattzeit ist die Paarungszeit.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 25, marginBottom: 10 }}>Schwarzwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Schwarzwild lebt in Rotten. Typisch sind breite Trittsiegel, Wühlspuren,
        Suhlen und die kräftige Losung.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 25, marginBottom: 10 }}>Rotwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Rotwild ist die größte heimische Wildart. Zur Brunft röhren die Hirsche,
        während Kahlwildrudel von erfahrenen Tieren geführt werden.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {quizFragen.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>
            {frage.frage}
          </p>

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
                  width: "100%",
                  padding: "12px",
                  fontSize: 17,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color: color,
                  cursor: auswahl === null ? "pointer" : "default",
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Fertig!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von <strong>{quizFragen.length}</strong> Fragen richtig.
          </p>
        </>
      )}

    </div>
  );
              }
