import { useState } from "react";

const quizFragen = [
  {
    frage: "Was ist eine Grundregel der sicheren Waffenhandhabung?",
    antworten: [
      {
        text: "Die Mündung zeigt grundsätzlich in eine sichere Richtung",
        richtig: true,
      },
      {
        text: "Die Mündung darf zur Kontrolle kurz auf Personen zeigen",
        richtig: false,
      },
      {
        text: "Nur ungeladene Waffen sind gefährlich",
        richtig: false,
      },
      {
        text: "Immer mit eingelegter Patrone führen, um schnell zu sein",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wann gehört der Finger an den Abzug?",
    antworten: [
      {
        text: "Schon beim Angehen zum Stand, um schnell schießen zu können",
        richtig: false,
      },
      {
        text: "Erst, wenn die Waffe ins Ziel eingegangen ist und die Entscheidung zum Schuss gefallen ist",
        richtig: true,
      },
      {
        text: "Immer, solange die Sicherung eingelegt ist",
        richtig: false,
      },
      {
        text: "Beim Klettern über Zäune für besseren Halt",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wie wird eine Büchse in der Regel sicher transportiert?",
    antworten: [
      {
        text: "Geladen, entsichert auf dem Beifahrersitz",
        richtig: false,
      },
      {
        text: "Entladen, mit offener Kammer im Futteral",
        richtig: true,
      },
      {
        text: "Mit eingelegtem Magazin und geschlossener Kammer",
        richtig: false,
      },
      {
        text: "Geladen quer auf dem Amaturenbrett",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wie gehst du beim Übersteigen eines Zaunes mit der Waffe vor?",
    antworten: [
      {
        text: "Geladen und entsichert in der Hand behalten",
        richtig: false,
      },
      {
        text: "Waffe entladen, sicher ablegen oder Partner übergeben",
        richtig: true,
      },
      {
        text: "Waffe mit dem Lauf zuerst über den Zaun werfen",
        richtig: false,
      },
      {
        text: "Waffe auf den Rücken hängen und klettern",
        richtig: false,
      },
    ],
  },
  {
    frage: "Was ist bei der Sicherheitsüberprüfung vor dem Schießen wichtig?",
    antworten: [
      {
        text: "Nur auf das Wild achten, Kugelfang ist nebensächlich",
        richtig: false,
      },
      {
        text: "Kugelfang, Umfeld, mögliche Gefährdungsbereiche und Hintergrund prüfen",
        richtig: true,
      },
      {
        text: "Nur auf Windrichtung und Entfernung achten",
        richtig: false,
      },
      {
        text: "Es reicht, wenn der Nachbarschütze aufgepasst",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wann darf bei einer Gesellschaftsjagd geladen werden?",
    antworten: [
      {
        text: "Schon auf dem Weg vom Auto, um keine Zeit zu verlieren",
        richtig: false,
      },
      {
        text: "Erst am Stand, wenn die Sicherheitsbelehrung erfolgt ist",
        richtig: true,
      },
      {
        text: "Zu Hause vor der Abfahrt, damit man nichts vergisst",
        richtig: false,
      },
      {
        text: "Beim Aussteigen aus dem Auto",
        richtig: false,
      },
    ],
  },
  {
    frage: "Wie kontrollierst du nach der Jagd sicher, ob die Waffe entladen ist?",
    antworten: [
      {
        text: "Kurz auf den Boden schießen, dann ist sie leer",
        richtig: false,
      },
      {
        text: "Kammer öffnen, Magazin entnehmen/entleeren, in Lauf und Lager sehen",
        richtig: true,
      },
      {
        text: "Auf das Klicken des Schlagbolzens hören",
        richtig: false,
      },
      {
        text: "Einfach Sicherung einlegen, dann ist alles gut",
        richtig: false,
      },
    ],
  },
];

export default function WaffenKurs() {
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
        🔫 Waffenhandhabung sicher – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Sicherheit geht bei der Jagd immer vor. In diesem Minikurs wiederholst
        du die wichtigsten Regeln für das sichere Hantieren mit der Büchse
        – von der Mündungskontrolle bis zum sicheren Transport.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Grundregeln</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Behandle jede Waffe so, als wäre sie geladen. Mündung in sichere
        Richtung, Finger außerhalb des Abzugsbügels, erst laden, wenn
        geschossen werden soll – diese Grundsätze retten im Zweifel Leben.
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
