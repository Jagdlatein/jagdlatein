import { useState } from "react";

const quizFragen = [
  {
    frage: "Wie nennt man ein weibliches Reh in der Jägersprache?",
    antworten: [
      { text: "Geiß", richtig: true },
      { text: "Hindin", richtig: false },
      { text: "Rick", richtig: false },
      { text: "Schmaltier", richtig: false },
    ],
  },
  {
    frage: "Was beschreibt der Begriff \"Schmalreh\"?",
    antworten: [
      {
        text: "Weibliches Reh im 2. Lebensjahr, noch ohne Kitz",
        richtig: true,
      },
      { text: "Sehr mageres Stück jeden Alters", richtig: false },
      { text: "Einjähriger Bock", richtig: false },
      { text: "Geiß mit schwachem Kitz", richtig: false },
    ],
  },
  {
    frage: "Wie nennt man den Kopf des Rehwildes in der Jägersprache?",
    antworten: [
      { text: "Haupt", richtig: true },
      { text: "Knopf", richtig: false },
      { text: "Lauscher", richtig: false },
      { text: "Blatt", richtig: false },
    ],
  },
  {
    frage: "Was bedeutet der Begriff \"Blattzeit\"?",
    antworten: [
      { text: "Brunftzeit des Rehwildes im Sommer", richtig: true },
      { text: "Zeit des Zahnwechsels beim Rehwild", richtig: false },
      { text: "Zeit des Fellwechsels", richtig: false },
      { text: "Ruhephase im Winter", richtig: false },
    ],
  },
  {
    frage: "Woran erkennst du am ehesten ein Kitz im Sommer?",
    antworten: [
      { text: "Stark gefegtes Gehörn und kräftiger Hals", richtig: false },
      {
        text: "Kleiner Körper, Flecken im Haarkleid, Nähe zur führenden Geiß",
        richtig: true,
      },
      { text: "Dunkles, grobes Haar und starker Spiegel", richtig: false },
      { text: "Fehlende Lauscher", richtig: false },
    ],
  },
  {
    frage: "Was beschreibt die \"Stange\" beim Rehbock?",
    antworten: [
      { text: "Einzelnes Gehörn (eine Seite)", richtig: true },
      { text: "Beide Gehörne zusammen", richtig: false },
      { text: "Unterkiefer beim Rehwild", richtig: false },
      { text: "Rückenlinie des Rehs", richtig: false },
    ],
  },
];

export default function RehwildKurs() {
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
        🦌 Rehwild sicher ansprechen – Mini-Kurs
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Rehwild ist unser häufigstes Schalenwild. In diesem Minikurs wiederholst
        du Alters- und Geschlechtsklassen, wichtige Begriffe der Jägersprache
        und typische Ansprechkriterien.
      </p>

      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Basics Rehwild</h2>
      <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
        Geiß, Bock, Kitz, Schmalreh – die Begriffe solltest du sicher beherrschen.
        Besonders beim Abschussplan und bei der Bejagung im Sommer ist ein
        sauberes Ansprechen entscheidend.
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
