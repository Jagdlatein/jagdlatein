import { useState } from "react";

export default function TarnungAnsitzKurs() {
  const quiz = [
    {
      frage: "Welche Farbe eignet sich für Tarnkleidung am besten?",
      antworten: [
        { text: "Knallrot", richtig: false },
        { text: "Neonorange", richtig: false },
        { text: "Erdfarben / Camouflage", richtig: true },
        { text: "Weiß", richtig: false }
      ]
    },
    {
      frage: "Was ist bei der Ansitzwahl besonders wichtig?",
      antworten: [
        { text: "Hoher Geräuschpegel", richtig: false },
        { text: "Windrichtung beachten", richtig: true },
        { text: "Sich oft bewegen", richtig: false },
        { text: "Grelles Licht verwenden", richtig: false }
      ]
    },
    {
      frage: "Warum wird Tarnung eingesetzt?",
      antworten: [
        { text: "Um Wild anzulocken", richtig: false },
        { text: "Um vom Wild nicht wahrgenommen zu werden", richtig: true },
        { text: "Um gesehen zu werden", richtig: false },
        { text: "Weil es Pflicht ist", richtig: false }
      ]
    }
  ];

  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [fertig, setFertig] = useState(false);

  const frage = quiz[i];

  function choose(index) {
    if (sel !== null) return;
    setSel(index);
    if (frage.antworten[index].richtig) setPunkte(p => p + 1);

    setTimeout(() => {
      if (i + 1 < quiz.length) {
        setI(i + 1);
        setSel(null);
      } else setFertig(true);
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
      <h1 style={{ fontSize: 32, marginBottom: 15 }}>🌲 Tarnung & Ansitz – Grundlagen</h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 25 }}>
        Eine gute Tarnung ist entscheidend für eine erfolgreiche Jagd. Bewegung, Geräusche 
        und Kontrast sind die Hauptfaktoren, die Wildtiere wahrnehmen. Der Ansitz muss
        <strong> windrichtig</strong>, ruhig und möglichst unauffällig sein.
        <br /><br />
        Camouflage oder Erdfarben helfen, sich der Umgebung anzupassen. 
        Auch das Verhalten spielt eine zentrale Rolle: Langsame Bewegungen, wenig Geräusche
        und eine optimale Platzwahl sind entscheidend.
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Quiz</h2>

      {!fertig && (
        <>
          <p style={{ fontSize: 18, marginBottom: 12 }}>
            Frage {i + 1} von {quiz.length}
          </p>

          <p style={{ fontSize: 20, marginBottom: 16 }}>{frage.frage}</p>

          {frage.antworten.map((a, idx) => {
            let bg = "#eaeaea";
            let color = "#000";

            if (sel !== null) {
              if (a.richtig) { bg = "green"; color = "white"; }
              if (sel === idx && !a.richtig) { bg = "red"; color = "white"; }
            }

            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={sel !== null}
                style={{
                  width: "100%",
                  padding: 12,
                  fontSize: 17,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color: color,
                  cursor: sel === null ? "pointer" : "default",
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
          <h3 style={{ fontSize: 24, marginTop: 20 }}>🎉 Geschafft!</h3>
          <p style={{ fontSize: 20 }}>
            Du hast <strong>{punkte}</strong> von <strong>{quiz.length}</strong> Fragen richtig.
          </p>
        </>
      )}
    </div>
  );
}
