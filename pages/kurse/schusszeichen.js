import { useState } from "react";

const quizFragen = [
  {
    frage: "Was versteht man unter \"Schusszeichen\"?",
    antworten: [
      { text: "Lautäußerungen des Wildes vor dem Schuss", richtig: false },
      {
        text: "Reaktionen von Wild und Pirschzeichen nach dem Treffer",
        richtig: true,
      },
      { text: "Art der geladenen Munition", richtig: false },
      { text: "Standort des Schützen", richtig: false },
    ],
  },
  {
    frage: "Welches Schusszeichen passt TYPISCH zu einem Kammerschuss?",
    antworten: [
      {
        text: "Wild zeichnet, springt hoch ab und flüchtet oft noch ein kurzes Stück",
        richtig: true,
      },
      {
        text: "Wild bricht sofort im Knall zusammen, kaum Flucht",
        richtig: false,
      },
      {
        text: "Wild flüchtet scheinbar unbeeindruckt, später langsame Pirschzeichen",
        richtig: false,
      },
      {
        text: "Wild setzt sich, zieht Hinterhand nach und schleift Läufe",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was ist ein typisches Zeichen für einen Weichschuss (Leber/Bauch)?",
    antworten: [
      {
        text: "Heller, schweißarmer Anschuss ohne Darminhalt",
        richtig: false,
      },
      {
        text: "Schweiß mit Darminhalt, Pansenteilen und üblem Geruch",
        richtig: true,
      },
      {
        text: "Nur Knochensplitter und Läufe weggezogen",
        richtig: false,
      },
      {
        text: "Nur Spiegelhaar ohne Schweiß",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was zeigt oft auf einen Laufschuss hin?",
    antworten: [
      {
        text: "Starker Schweiß am Anschuss, Wild bleibt im Knall liegen",
        richtig: false,
      },
      {
        text: "Splitter vom Röhrenknochen, weite, oft schweißarme Flucht",
        richtig: true,
      },
      {
        text: "Nur Pansenteile am Anschuss",
        richtig: false,
      },
      {
        text: "Nur Spiegelhaar und dünner Schweißfilm",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wie verhältst du dich nach einem mutmaßlichen Kammerschuss beim Rehwild?",
    antworten: [
      {
        text: "Sofort hinterher, um das Stück schnell zu bekommen",
        richtig: false,
      },
      {
        text: "Je nach Situation 5–10 Minuten warten, dann Anschuss kontrollieren",
        richtig: true,
      },
      {
        text: "Mindestens 4 Stunden warten, bevor du nachsiehst",
        richtig: false,
      },
      {
        text: "Prinzipiell nie nähern, nur Hund schicken",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was ist bei Verdacht auf Weichschuss sinnvoll?",
    antworten: [
      {
        text: "Sofortiges Hinterhergehen ohne Hund, bevor die Fährte kalt wird",
        richtig: false,
      },
      {
        text: "Nach kurzer Wartezeit das Stück im Feuer halten",
        richtig: false,
      },
      {
        text: "Längere Wartezeit (mehrere Stunden) und dann erfahrene Nachsuche anfordern",
        richtig: true,
      },
      {
        text: "Die Situation ignorieren, das Stück wird schon verenden",
        richtig: false,
      },
    ],
  },
];

export default function SchusszeichenKurs() {
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
        🎯 Schusszeichen & Nachsuche – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Nach dem Schuss beginnt die eigentliche Arbeit. In diesem Minikurs
        wiederholst du typische Schusszeichen, Pirschzeichen am Anschuss und
        Grundregeln für die Nachsuche.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Anschuss & Pirschzeichen</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Schweiß, Knochensplitter, Pansenteile, Haar – all das kann dir Hinweise
        auf die Trefferlage geben. Wichtig: Ruhe bewahren, Anschuss merken und
        bei Unsicherheit rechtzeitig einen erfahrenen Nachsuchengespannführer
        hinzuziehen.
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
