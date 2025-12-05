import { useState } from "react";
import Image from "next/image";

export default function Rabenkraehe() {
  const quiz = [
    {
      q: "Woran erkennt man die Rabenkrähe?",
      a: [
        "Grau-schwarzes Gefieder",
        "Komplett schwarzes Gefieder",
        "Weißer Bauch und schwarzer Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Rabenkrähen sind reine Waldvögel",
        "Rabenkrähen sind sehr anpassungsfähige Kulturfolger",
        "Rabenkrähen leben nur in Felsgebieten"
      ],
      correct: 1,
    },
    {
      q: "Was frisst die Rabenkrähe hauptsächlich?",
      a: [
        "Ausschließlich Samen",
        "Aas, Insekten, Kleintiere, Getreide – Allesfresser",
        "Nur Fische"
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

        <h1 style={styles.title}>Rabenkrähe (Corvus corone)</h1>
        <p style={styles.subtitle}>
          Ganz schwarz · Sehr intelligent · Kulturfolger · Aas- & Allesfresser
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/rabenkraehe.jpg"
            alt="Rabenkrähe"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Eine der häufigsten Krähenarten Mitteleuropas</li>
            <li>Sehr hohe Intelligenz (Werkzeuggebrauch belegt)</li>
            <li>Lebensraum: landwirtschaftliche Flächen, Städte, Wälder, Küsten</li>
            <li>Starker Kulturfolger → profitiert von menschlichen Strukturen</li>
            <li>Teilweise problematisch für Bodenbrüter</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <ul style={styles.list}>
            <li>Komplett schwarz (Feder, Schnabel, Beine)</li>
            <li>Kein grauer Mantel (→ Unterschied zur Nebelkrähe)</li>
            <li>Groß, kräftig, mächtiger Schnabel</li>
            <li>Flugbild: lange Flügel, ruhiger Flügelschlag</li>
            <li>Ruf: hartes „krääh“</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Mai</li>
            <li>Nest im Baum oder Gebäuden</li>
            <li>Gelege: 3–6 Eier</li>
            <li>Junge werden 3–4 Wochen gefüttert</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Aas, Insekten, Larven</li>
            <li>Kleinsäuger, Jungvögel, Eier</li>
            <li>Getreide, Früchte, Abfälle</li>
            <li>Sehr opportunistischer Allesfresser</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Hoch sozial</li>
            <li>Sehr lernfähig</li>
            <li>Nutzt Werkzeuge</li>
            <li>Kann Schalen von Muscheln oder Nüssen öffnen</li>
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
