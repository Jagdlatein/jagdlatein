import { useState } from "react";
import Image from "next/image";

export default function Schwarzwild() {
  const quiz = [
    {
      q: "Wie nennt man das weibliche Stück beim Schwarzwild?",
      a: ["Rickel", "Bache", "Geiß"],
      correct: 1,
    },
    {
      q: "Wie lange ist die Tragzeit beim Schwarzwild?",
      a: ["ca. 5 Monate", "3 Monate + 3 Wochen + 3 Tage"],
      correct: 1,
    },
    {
      q: "Welche Besonderheit hat das Gebiss des Keilers?",
      a: ["Schaufeln", "Haderer und Gewehre (Hauer)"],
      correct: 1,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((s) => ({ ...s, [qi]: ai }));
    setAnswered((s) => ({ ...s, [qi]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Schwarzwild (Sus scrofa)</h1>
        <p style={styles.subtitle}>Keiler · Bache · Frischlinge</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/schwarzwild.jpg"
            alt="Schwarzwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* Allgemeines */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: Keiler 90–200+ kg, Bache 60–120 kg</li>
            <li>Körperlänge: 120–180 cm · Schulterhöhe: 70–110 cm</li>
            <li>Lebensraum: Wälder, Felder, Feuchtgebiete</li>
            <li>Nahrung: Allesfresser (Eicheln, Bucheckern, Mais, Würmer)</li>
            <li>Sozialstruktur: Rotte aus Bachen & Frischlingen</li>
            <li>Keiler leben meist einzelgängerisch</li>
          </ul>
        </section>

        {/* Fortpflanzung */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Rauschzeit: November–Januar</li>
            <li>Tragzeit: „3 Monate, 3 Wochen, 3 Tage“</li>
            <li>Frischlingswurf: März–Mai (4–8 Frischlinge)</li>
          </ul>
        </section>

        {/* Gebiss */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Besonderheiten</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 3/3 = 44</li>
            <li>Keiler: Haderer (unten) & Gewehre (oben)</li>
            <li>Gefährlicher Hauerbiss durch Selbstschärfung</li>
            <li>Dicke Schwarte schützt vor Verletzungen</li>
          </ul>
        </section>

        {/* Merkmale */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Farbe: schwarz–braun, borstig</li>
            <li>Frischlinge: gelb-braune Streifen</li>
            <li>Überläufer: 1–2 Jahre alt</li>
            <li>Losung: wurstartig, grob</li>
            <li>Fährte: rund, kräftig, 6–10 cm</li>
          </ul>
        </section>

        {/* QUIZ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quiz</h2>

          {quiz.map((q, qi) => (
            <div key={qi} style={styles.quizBlock}>
              <p style={styles.quizQuestion}>{q.q}</p>

              {q.a.map((ans, ai) => {
                const isCorrect = ai === q.correct;
                const isSelected = selected[qi] === ai;
                let bg = "#fff";

                if (answered[qi]) {
                  if (isCorrect && isSelected) bg = "#c6f6c6";
                  else if (!isCorrect && isSelected) bg = "#f7c6c6";
                }

                return (
                  <button
                    key={ai}
                    onClick={() => choose(qi, ai)}
                    style={{ ...styles.quizButton, background: bg }}
                  >
                    {ans}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

const styles = {
  main: {
    background: "#faf8f1",
    padding: "40px 20px",
    minHeight: "100vh",
  },
  wrap: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  title: {
    fontSize: "42px",
    fontWeight: 800,
    marginBottom: "6px",
    color: "#1f2b23",
  },
  subtitle: {
    fontSize: "19px",
    marginBottom: "26px",
    color: "#5a5a5a",
  },
  imageBox: {
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "32px",
  },
  image: {
    width: "100%",
    height: "auto",
  },
  section: {
    marginBottom: "36px",
  },
  sectionTitle: {
    fontSize: "26px",
    marginBottom: "14px",
    color: "#1f2b23",
  },
  list: {
    paddingLeft: "22px",
    lineHeight: "1.7",
    fontSize: "17px",
    color: "#333",
  },

  // QUIZ
  quizBlock: {
    marginBottom: "26px",
    padding: "16px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2d9c9",
  },
  quizQuestion: {
    fontSize: "18px",
    marginBottom: "12px",
    fontWeight: 600,
  },
  quizButton: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 14px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
    cursor: "pointer",
  },
};
