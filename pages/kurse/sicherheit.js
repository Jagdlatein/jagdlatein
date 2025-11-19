import { useState } from "react";

export default function SicherheitImRevierKurs() {
  const sicherheitQuiz = [
    {
      frage: "Was ist die wichtigste Grundregel beim sicheren Schießen?",
      antworten: [
        { text: "Immer schnell schießen", richtig: false },
        { text: "Waffe nie auf etwas richten, das man nicht treffen will", richtig: true },
        { text: "Nur im Gelände, nie vom Hochsitz", richtig: false },
        { text: "Immer mit Zielfernrohr schießen", richtig: false }
      ]
    },
    {
      frage: "Was ist beim Schussfeld entscheidend?",
      antworten: [
        { text: "Dass Büsche die Kugel sicher abbremsen", richtig: false },
        { text: "Ein klarer Kugelfang hinter dem Wild", richtig: true },
        { text: "Dass das Ziel sehr weit entfernt ist", richtig: false },
        { text: "Nur die Windrichtung", richtig: false }
      ]
    },
    {
      frage: "Wie wird eine Waffe sicher transportiert?",
      antworten: [
        { text: "Ladung im Lauf, aber Sicherung an", richtig: false },
        { text: "Entladen, geöffnet und im Futteral", richtig: true },
        { text: "Geladen, aber ohne Magazin", richtig: false },
        { text: "Entladen, aber gespannt", richtig: false }
      ]
    },
    {
      frage: "Welche Aussage zur Drückjagd-Sicherheit ist richtig?",
      antworten: [
        { text: "Schussrichtung ist egal, Hauptsache schnell reagieren", richtig: false },
        { text: "Man schießt niemals in Treibrichtung", richtig: true },
        { text: "Man schießt auf alles, was sich bewegt", richtig: false },
        { text: "Man hält keine Kommunikation mit Nachbarschützen", richtig: false }
      ]
    }
  ];

  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = sicherheitQuiz[aktuelleFrage];

  function handleAntwort(index) {
    if (auswahl !== null) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    setTimeout(() => {
      const next = aktuelleFrage + 1;
      if (next < sicherheitQuiz.length) {
        setAktuelleFrage(next);
        setAuswahl(null);
      } else {
        setFertig(true);
      }
    }, 1200);
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        background: "white",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        ⚠ Sicherheit im Revier
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Sicherheit ist das oberste Gebot bei jeder jagdlichen Tätigkeit.  
        Hier lernst du die wichtigsten Grundregeln für ein sicheres Verhalten im Revier.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Grundlagen</h2>

      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Eine der wichtigsten Sicherheitsregeln lautet:  
        <strong>„Behandle jede Waffe so, als wäre sie geladen.“</strong>
        <br /><br />
        Vor jedem Schießen müssen Schussfeld, Hintergrund und Kugelfang eindeutig
        identifiziert werden. Büsche oder Gräser bremsen Geschosse nicht zuverlässig ab.
        <br /><br />
        Beim Transport müssen Waffen <strong>entladen</strong>, <strong>gesichert</strong>  
        und in einem geeigneten <strong>Futteral</strong> verstaut sein.
        <br /><br />
        Auf Gesellschaftsjagden wie Drückjagden gilt:  
        Klare Kommunikation, eindeutige Schussbereiche und niemals in Treibrichtung schießen.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {sicherheitQuiz.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, i) => {
            let bg = "#eaeaea";
            let color = "#000";

            if (auswahl !== null) {
              if (a.richtig) {
                bg = "green";
                color = "white";
              }
              if (auswahl === i && !a.richtig) {
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
                  padding: 12,
                  fontSize: 17,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color: color,
                  cursor: auswahl === null ? "pointer" : "default",
                  textAlign: "left",
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
            Du hast <strong>{punkte}</strong> von <strong>{sicherheitQuiz.length}</strong> Fragen
            richtig.
          </p>
        </>
      )}
    </div>
  );
}
