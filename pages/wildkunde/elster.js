import { useState } from "react";
import Image from "next/image";

export default function Elster() {
  const quiz = [
    {
      q: "Woran erkennt man die Elster eindeutig?",
      a: [
        "Komplett schwarzes Gefieder",
        "Schwarz-weißes Gefieder mit sehr langem Schwanz",
        "Grauer Körper mit schwarzem Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Die Elster ist ein typischer Kulturfolger",
        "Die Elster lebt ausschließlich im Hochgebirge",
        "Elstern bauen keine Nester"
      ],
      correct: 0,
    },
    {
      q: "Wofür ist die Elster besonders bekannt?",
      a: [
        "Für ihr völlig scheues Verhalten",
        "Für das Plündern von Nestern anderer Arten",
        "Für das Leben ausschließlich in großen Schwärmen"
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

        <h1 style={styles.title}>Elster (Pica pica)</h1>
        <p style={styles.subtitle}>
          Schwarz-weiß · Sehr langer Stoß · Intelligent · Nestplünderer · Kulturfolger
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/elster.jpg"
            alt="Elster"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Auffälliger Rabenvogel mit schwarz-weißem Gefieder</li>
            <li>Sehr langer Schwanz (Stoß) — markantestes Merkmal</li>
            <li>Lebensraum: Dörfer, Städte, Parks, Feldgehölze</li>
            <li>Ausgeprägter Kulturfolger</li>
            <li>Sehr intelligent, kann Werkzeuge nutzen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <ul style={styles.list}>
            <li>Schwarz-weißes Gefieder mit blau-grünem Glanz</li>
            <li>Langer, keilförmiger Stoß (Schwanz)</li>
            <li>Weiße Flügeldeckfedern → kontrastreich im Flug</li>
            <li>Schwarzer Kopf und Brust</li>
            <li>Typischer Ruf: „tschärr-tschärr“</li>
          </ul>

        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Juni</li>
            <li>Großes, kugelförmiges Nest mit seitlichem Eingang</li>
            <li>Gelege: 4–7 Eier</li>
            <li>Stark territorial während der Brutzeit</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Insekten, Würmer, Larven</li>
            <li>Eier und Jungvögel (wichtiger Prüfpunkt!)</li>
            <li>Kleinsäuger, Aas</li>
            <li>Getreide, Früchte, Abfälle</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Sehr intelligent und lernfähig</li>
            <li>Neugierig und mutig</li>
            <li>Oft paarweise oder in kleinen Gruppen unterwegs</li>
            <li>Kann andere Arten verdrängen (Prädator)</li>
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
