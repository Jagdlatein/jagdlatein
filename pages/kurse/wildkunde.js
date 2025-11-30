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
      setPunkte(p => p + 1);
    }

    setTimeout(() => {
      const next = aktuelleFrage + 1;
      if (next < quizFragen.length) {
        setAktuelleFrage(next);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 1100);
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: "40px auto",
      background: "white",
      padding: 24,
      borderRadius: 16,
      boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
      fontFamily: "system-ui"
    }}>
      
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 15, color: "#2e4d32" }}>
        🦌 Wildkunde Basics
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Kompakter Einstieg in die wichtigsten heimischen Wildarten.  
        Ideal für Jungjäger und zur schnellen Wiederholung.
      </p>

      {/* --- REHWILD --- */}
      <h2 style={{ fontSize: 24, marginBottom: 10, color: "#254026" }}>Rehwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Rehwild ist die kleinste heimische Hirschart. Männliche heißen <strong>Bock</strong>,
        weibliche <strong>Geiß</strong>. Die Blattzeit ist die Paarungszeit.
      </p>

      {/* --- SCHWARZWILD --- */}
      <h2 style={{ fontSize: 24, marginTop: 25, marginBottom: 10, color: "#254026" }}>Schwarzwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Schwarzwild lebt in Rotten. Typisch sind breite Trittsiegel, Wühlspuren,
        Suhlen und die kräftige Losung.
      </p>

      {/* --- ROTWILD --- */}
      <h2 style={{ fontSize: 24, marginTop: 25, marginBottom: 10, color: "#254026" }}>Rotwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Rotwild ist die größte heimische Wildart. Zur Brunft röhren die Hirsche,
        während Kahlwildrudel von erfahrenen Tieren geführt werden.
      </p>

      <hr style={{ margin: "30px 0" }} />

      {/* QUIZ */}
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

            let bg = "#f1f1f1";
            let color = "#000";
            let border = "1px solid #ccc";

            if (auswahl !== null) {
              if (richtig) {
                bg = "#207a1e";
                color = "white";
                border = "none";
              }
              if (istAuswahl && !richtig) {
                bg = "#b40000";
                color = "white";
                border = "none";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAntwort(i)}
                disabled={auswahl !== null}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 17,
                  marginBottom: 12,
                  borderRadius: 10,
                  background: bg,
                  color: color,
                  border: border,
                  cursor: auswahl === null ? "pointer" : "default",
                  textAlign: "left",
                  transition: "0.2s",
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
          <h3 style={{ fontSize: 28, marginTop: 20, color: "#254026" }}>🎉 Fertig!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von <strong>{quizFragen.length}</strong> Fragen richtig beantwortet.
          </p>
        </>
      )}

    </div>
  );
}
