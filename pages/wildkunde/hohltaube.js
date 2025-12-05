import { useState } from "react";
import Image from "next/image";

export default function Hohltaube() {
  const quiz = [
    {
      q: "Wichtigstes Erkennungsmerkmal der Hohltaube?",
      a: [
        "Weißer Halsfleck",
        "Kein Halsfleck + kleiner als Ringeltaube",
        "Blauer Flügelspiegel"
      ],
      correct: 1,
    },
    {
      q: "Wo brütet die Hohltaube?",
      a: [
        "Bodenbrüter",
        "Gebäudebrüter",
        "Baumhöhlen & Spechthöhlen"
      ],
      correct: 2,
    },
    {
      q: "Welche Nahrung bevorzugt die Hohltaube?",
      a: [
        "Aas und Kleintiere",
        "Samen, Getreide, Bucheckern",
        "Fische und Insektenlarven"
      ],
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

        <h1 style={styles.title}>Hohltaube (Columba oenas)</h1>
        <p style={styles.subtitle}>
          Zierliche Taube · Kein Halsfleck · Höhlenbrüter · Wichtig in der Prüfung!
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/hohltaube.jpg"
            alt="Hohltaube"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Kleiner und zierlicher als die Ringeltaube</li>
            <li>Ohne weißen Halsfleck – wichtiges Prüfungsmerkmal</li>
            <li>Großes Verbreitungsgebiet in Europa</li>
            <li>Sehr scheu, meidet Siedlungen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <ul style={styles.list}>
            <li>Einheitlich graublaues Gefieder</li>
            <li>Kein weißer Halsfleck</li>
            <li>Kürzerer, schmaler Schwanz</li>
            <li>Kleinere Körpergröße</li>
            <li>Oft in kleinen Trupps</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Juli</li>
            <li>Typisch: Brütet in Baumhöhlen & Spechthöhlen</li>
            <li>Nest kaum ausgebaut (Prüfungswissen!)</li>
            <li>Gelege: 2 Eier</li>
            <li>Füttert Kropfmilch</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Sämereien, Getreide</li>
            <li>Bucheckern, Eicheln</li>
            <li>Knospen und grüne Pflanzenteile</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Sehr scheu und unauffällig</li>
            <li>Waldgebundene Art</li>
            <li>Teilzieher</li>
            <li>Oft in kleinen Gruppen unterwegs</li>
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
    color: "#555",
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
