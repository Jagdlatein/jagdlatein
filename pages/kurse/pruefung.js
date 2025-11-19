import { useState } from "react";

export default function PruefungstippsKurs() {
  const tipps = [
    "1. Lerne jeden Tag ein bisschen statt alles auf einmal.",
    "2. Wiederhole die wichtigsten Wildarten täglich.",
    "3. Lies die Fragen in der Theorieprüfung immer zweimal.",
    "4. Merke dir typische Schusszeichen und Pirschzeichen.",
    "5. Lerne die Sicherheitsregeln auswendig – fehlerfrei.",
    "6. Gehe Stoffgebiete systematisch durch (Wildkunde, Waffen, Recht).",
    "7. Benutze Eselsbrücken für schwierige Begriffe.",
    "8. Übe Waffenhandhabung regelmäßig trocken.",
    "9. Nimm reale Patronenattrappen zum Laden/Entladen üben.",
    "10. Sprich Wild sicher an – Altersmerkmale wiederholen.",
    "11. Lerne Losungen, Trittsiegel und Fährtenbilder.",
    "12. Verstehe Kugelfang, Hintergrund und Schusswinkel.",
    "13. Beobachte im Revier echte Wildwechsel – Praxiswissen hilft.",
    "14. Stelle viele Prüfungsfragen nach.",
    "15. Achte auf ruhige Atmung beim Schießen.",
    "16. Schieße im Anschlag mehrere Sekunden ruhig nach.",
    "17. Lerne typische Waffenstörungen und wie man reagiert.",
    "18. Schau dir Videos zu Wildverhalten an.",
    "19. Arbeite mit Karte/Kompass – Orientierung zählt.",
    "20. Wiederhole Prüfungsarbeit in kleiner Gruppe.",
    "21. Frage Ausbilder oder Jäger nach ihren Prüfungstipps.",
    "22. Präge dir Jagdzeiten und Schonzeiten ein.",
    "23. Nutze Merksätze für wichtige Revierzeichen.",
    "24. Bleibe ruhig – Nervosität ist normal.",
    "25. Schlaf vor der Prüfung ausreichend. ",
  ];

  const quiz = [
    {
      frage: "Was führt häufig zu Fehlern in der Theorieprüfung?",
      antworten: [
        { text: "Zu schnell lesen", richtig: true },
        { text: "Fragen zweimal lesen", richtig: false },
        { text: "Antworten auswendig lernen", richtig: false },
        { text: "Nachdenken vor dem Ankreuzen", richtig: false }
      ]
    },
    {
      frage: "Was ist für die Waffenhandhabung besonders wichtig?",
      antworten: [
        { text: "Schnelles Laden", richtig: false },
        { text: "Sicherheitsregeln fehlerfrei beherrschen", richtig: true },
        { text: "Die lauteste Waffe auswählen", richtig: false },
        { text: "Immer durchladen", richtig: false }
      ]
    },
    {
      frage: "Wie verbessert man die Schießleistung am besten?",
      antworten: [
        { text: "Unmittelbar vor dem Schießen Kaffee trinken", richtig: false },
        { text: "Ruhig atmen und Nachhalten üben", richtig: true },
        { text: "Nur aus dem Bauch schießen", richtig: false },
        { text: "So schnell wie möglich schießen", richtig: false }
      ]
    },
    {
      frage: "Wie merkt man sich Wildarten am besten?",
      antworten: [
        { text: "Nur Namen auswendig lernen", richtig: false },
        { text: "Merkmale & Verhalten regelmäßig wiederholen", richtig: true },
        { text: "Nur Bilder anschauen", richtig: false },
        { text: "Jedes Tier ansprechen, wie man will", richtig: false }
      ]
    }
  ];

  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [auswahl, setAuswahl] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = quiz[aktuelleFrage];

  function handleAntwort(index) {
    if (auswahl !== null) return;

    setAuswahl(index);

    if (frage.antworten[index].richtig) {
      setPunkte((p) => p + 1);
    }

    setTimeout(() => {
      const next = aktuelleFrage + 1;
      if (next < quiz.length) {
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
        📚 25 Prüfungstipps
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Kompakte Tipps, die dir helfen, die Jagdprüfung sicher zu bestehen.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 14 }}>Tipps</h2>

      <ul style={{ fontSize: 17, lineHeight: 1.7, paddingLeft: 20 }}>
        {tipps.map((tipp, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{tipp}</li>
        ))}
      </ul>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {aktuelleFrage + 1} von {quiz.length}
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
            Du hast <strong>{punkte}</strong> von <strong>{quiz.length}</strong> Fragen richtig.
          </p>
        </>
      )}
    </div>
  );
}
