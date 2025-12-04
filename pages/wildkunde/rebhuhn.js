import { useState } from "react";
import Image from "next/image";

export default function Rebhuhn() {
  const quiz = [
    {
      q: "Wie nennt man den Familienverband beim Rebhuhn?",
      a: ["Rudel", "Kette", "Sprung"],
      correct: 1,
    },
    {
      q: "Wo lebt das Rebhuhn typischerweise?",
      a: ["Dichter Wald", "Offene Feldflur mit Hecken", "Hochgebirge"],
      correct: 1,
    },
    {
      q: "Welche Aussage ist korrekt?",
      a: [
        "Rebhühner sind Bodenbrüter",
        "Rebhühner bauen Nester in Bäumen",
        "Rebhühner leben als Einzelgänger"
      ],
      correct: 0,
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
        
        <h1 style={styles.title}>Rebhuhn (Perdix perdix)</h1>
        <p style={styles.subtitle}>Agrarlandschaft · Kettenbildung · Stark gefährdet</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/rebhuhn.jpg"
            alt="Rebhuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 28–32 cm</li>
            <li>Gewicht: 300–450 g</li>
            <li>Lebensraum: Offene Feldflur, Buntbrachen, Hecken, Feldraine</li>
            <li>Kulturfolger der Agrarlandschaft</li>
            <li>Bestände europaweit stark rückläufig</li>
            <li>Hohe Bedeutung für Niederwildhege</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Rundlicher Körper, braun-grau gemustert</li>
            <li>Brustfleck („Hufeisen“) beim Hahn ausgeprägt</li>
            <li>Kurze Flügel, schneller Aufflug</li>
            <li>Sanfte, helle Gesichtsfärbung</li>
            <li>Ruf: „kirrick-kirrick“</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li><strong>Lebensweise im Familienverband = Kette</strong></li>
            <li>Tagaktiv</li>
            <li>Flucht: erst laufen, dann kurzer schneller Flug</li>
            <li>Sehr störungsempfindlich zur Brutzeit</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: April–Mai</li>
            <li>Gelege: 10–20 Eier → eines der größten Gelege heimischer Vögel</li>
            <li>Brutdauer: ca. 24 Tage</li>
            <li>Junge sind Nestflüchter</li>
            <li>Familienverband bleibt lange zusammen</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gräser, Kräuter, Samen</li>
            <li>Insekten → extrem wichtig für Jungvögel!</li>
            <li>Korn und Feldfrüchte</li>
          </ul>
        </section>

        {/* GEFAHREN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gefahren & Rückgang</h2>
          <ul style={styles.list}>
            <li>Intensive Landwirtschaft → Verlust der Deckung</li>
            <li>Pestizide → weniger Insekten</li>
            <li>Prädatoren: Fuchs, Marder, Habicht</li>
            <li>Schlechtwetterperioden im Frühjahr</li>
          </ul>
        </section>

        {/* HEGE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Hege & Maßnahmen</h2>
          <ul style={styles.list}>
            <li>Anlage von Buntbrachen und Blühflächen</li>
            <li>Schonung während der Brutzeit</li>
            <li>Reduktion von Beutegreifern</li>
            <li>Winterfütterung nur bei extremer Witterung</li>
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
