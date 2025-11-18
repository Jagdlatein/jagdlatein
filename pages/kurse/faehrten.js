import { useState } from "react";

const quizFragen = [
  {
    frage: "Was versteht man in der Jägersprache unter der \"Fährte\"?",
    antworten: [
      { text: "Allgemein die Futterstellen des Wildes", richtig: false },
      {
        text: "Die Spur des Schalenwildes (Trittsiegel) in der Fortbewegung",
        richtig: true,
      },
      { text: "Nur den Wechsel von Rehwild", richtig: false },
      { text: "Den Schlafplatz des Wildes", richtig: false },
    ],
  },
  {
    frage: "Wie nennt man die Spur des Haarraubwildes (z. B. Fuchs, Marder)?",
    antworten: [
      { text: "Fährte", richtig: false },
      { text: "Spur", richtig: true },
      { text: "Losung", richtig: false },
      { text: "Wechsel", richtig: false },
    ],
  },
  {
    frage: "Woran erkennst du typischerweise die Fährte von Rehwild?",
    antworten: [
      {
        text: "Sehr große, runde Schalen, deutlich größer als beim Schwarzwild",
        richtig: false,
      },
      {
        text: "Kleine, schmale Schalen, leicht herzförmig, zierliches Trittsiegel",
        richtig: true,
      },
      {
        text: "Vier Zehenballen wie beim Hund",
        richtig: false,
      },
      {
        text: "Nur ein einzelner runder Abdruck",
        richtig: false,
      },
    ],
  },
  {
    frage: "Welche Aussage zur Fuchsspur ist TYPISCH?",
    antworten: [
      {
        text: "Die Trittsiegel stehen versetzt wie beim Hund",
        richtig: false,
      },
      {
        text: "Die Spur wirkt wie eine gerade Perlenschnur (Fuchsschnur)",
        richtig: true,
      },
      {
        text: "Man sieht stets Krallenabdrücke wie beim Keiler",
        richtig: false,
      },
      {
        text: "Die Spur ist immer doppelt so groß wie beim Hund",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was bezeichnet der Begriff \"Wechsel\"?",
    antworten: [
      {
        text: "Den Jahreszeitenwechsel im Revier",
        richtig: false,
      },
      {
        text: "Regelmäßig genutzte Wege des Wildes zwischen Einstand und Äsung",
        richtig: true,
      },
      {
        text: "Nur das Verlassen des Einstandes bei Störung",
        richtig: false,
      },
      {
        text: "Das Wechseln des Haarkleides",
        richtig: false,
      },
    ],
  },
  {
    frage: "Welche Losung passt TYPISCH zum Rehwild?",
    antworten: [
      {
        text: "Lange, wurstförmige Haufen mit Hülse",
        richtig: false,
      },
      {
        text: "Kleine, olivenförmige Ködel, oft leicht aufgeschichtet",
        richtig: true,
      },
      {
        text: "Große, flache Fladen",
        richtig: false,
      },
      {
        text: "Stark riechende, längliche Würste mit Haaranteil",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was ist beim Lesen von Fährten & Spuren immer wichtig?",
    antworten: [
      {
        text: "Nur auf ein einzelnes Trittsiegel zu achten",
        richtig: false,
      },
      {
        text: "Gesamte Spurverlauf, Umfeld, Losung und weitere Zeichen mit einbeziehen",
        richtig: true,
      },
      {
        text: "Nur auf Losung, nicht auf Trittsiegel achten",
        richtig: false,
      },
      {
        text: "Spuren stets zertrampeln, damit andere sie nicht sehen",
        richtig: false,
      },
    ],
  },
];

export default function FaehrtenKurs() {
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
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 15 }}>
        👣 Fährten & Spuren – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        In diesem Minikurs wiederholst du wichtige Grundlagen zu Fährten,
        Spuren, Wechseln und Losung – ideal für die Jagdpraxis und die
        Prüfung.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Wild erkennen am Boden</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Wer Fährten und Spuren lesen kann, weiß oft schon vor dem Ansitz,
        welche Wildart sich im Revier bewegt. Achte immer auf das
        Gesamtbild: Trittsiegel, Losung, Verbiss und Einstandsstrukturen.
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
