import { useState } from "react";

export default function PirschAnsitzKurs() {
  const pirschAnsitzQuiz = [
    {
      frage: "Was ist beim Pirschen besonders wichtig?",
      antworten: [
        { text: "Schnelles Vorankommen", richtig: false },
        { text: "Windrichtung beachten", richtig: true },
        { text: "Laute Kommunikation", richtig: false },
        { text: "Immer aufrecht gehen", richtig: false }
      ]
    },
    {
      frage: "Was beschreibt den idealen Ansitzplatz?",
      antworten: [
        { text: "Mit dem Rücken ohne Deckung", richtig: false },
        { text: "Guter Überblick und sicherer Kugelfang", richtig: true },
        { text: "Direkt an Wildwechseln ohne Sicht", richtig: false },
        { text: "Sehr niedrige Sitzhöhe", richtig: false }
      ]
    },
    {
      frage: "Welche Technik hilft beim lautlosen Pirschen?",
      antworten: [
        { text: "Fersengang", richtig: false },
        { text: "Abrollen über die Fußaußenkante", richtig: true },
        { text: "Springender Schritttakt", richtig: false },
        { text: "Nur Laufen mit Stöcken", richtig: false }
      ]
    },
    {
      frage: "Worauf muss beim Schuss vom Ansitz besonders geachtet werden?",
      antworten: [
        { text: "Schnelles Schießen", richtig: false },
        { text: "Sicherer Kugelfang hinter dem Wild", richtig: true },
        { text: "Nur auf stehendes Wild verzichten", richtig: false },
        { text: "Wild nur aus großer Entfernung beschießen", richtig: false }
      ]
    }
  ];

  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = pirschAnsitzQuiz[aktuelleFrage];

  function handleAntwort(index) {
    if (auswahl !== null) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    setTimeout(() => {
      const next = aktuelleFrage + 1;
      if (next < pirschAnsitzQuiz.length) {
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
        🌲 Pirsch & Ansitz
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Grundlagen der leisen Pirsch und des sicheren Ansitzes.  
        Perfekt für Jagdscheinanwärter und praktische Revierarbeit.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Pirsch</h2>

      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Die Pirsch ist eine der anspruchsvollsten Jagdarten.  
        Entscheidend sind <strong>Windrichtung</strong>, <strong>Deckung</strong> und
        <strong>geräuscharmes Bewegen</strong>.
        <br /><br />
        Leise Fortbewegung gelingt über das <strong>Abrollen der Füße</strong>, langsames  
        Vorrücken, häufiges Beobachten und das Nutzen von Deckung wie Büschen  
        oder Geländeformen.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 25, marginBottom: 10 }}>
        Ansitz
      </h2>

      <p style={{ fontSize: 17, lineHeight: 1.6 }}>
        Beim Ansitz kommt es auf Ruhe, Geduld und die Wahl eines sicheren,  
        übersichtlichen Standortes an. Ein idealer Ansitz bietet:
        <br /><br />
        • guten Überblick über das Gelände  
        • sicheren <strong>Kugelfang</strong>  
        • unauffälligen Zugang zum Platz  
        <br /><br />
        Der Schuss erfolgt nur auf eindeutig angesprochenes Wild — und nur,  
        wenn Kugelfang und Umgebung absolut sicher sind.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {pirschAnsitzQuiz.length}
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
            Du hast <strong>{punkte}</strong> von <strong>{pirschAnsitzQuiz.length}</strong> Fragen
            richtig.
          </p>
        </>
      )}
    </div>
  );
}
