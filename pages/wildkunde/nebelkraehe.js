import { useState } from "react";
import Image from "next/image";

export default function Nebelkraehe() {
  const quiz = [
    {
      q: "Wie unterscheidet sich die Nebelkrähe optisch von der Rabenkrähe?",
      a: [
        "Komplett schwarzes Gefieder",
        "Grauer Körper mit schwarzen Flügeln, Kopf und Brust",
        "Weißer Kopf und brauner Körper"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Nebelkrähe und Rabenkrähe sind zwei völlig verschiedene Arten",
        "Nebelkrähe ist die graue Farbmorphe der Rabenkrähe",
        "Nebelkrähe lebt ausschließlich im Gebirge"
      ],
      correct: 1,
    },
    {
      q: "Wo kommt die Nebelkrähe hauptsächlich vor?",
      a: [
        "In Westdeutschland und Westeuropa",
        "In Ostdeutschland, Osteuropa und Skandinavien",
        "Nur in Süditalien"
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

        <h1 style={styles.title}>Nebelkrähe (Corvus cornix)</h1>
        <p style={styles.subtitle}>
          Zweifarbige Krähe · Graues Gefieder mit schwarzen Partien · Ost- & Nordeuropa
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/nebelkraehe.jpg"
            alt="Nebelkrähe"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Zweifarbige Variante der Rabenkrähe</li>
            <li>Lebensraum: Städte, Ackerland, Küstenregionen, Wälder</li>
            <li>Sehr intelligent und anpassungsfähig</li>
            <li>Starker Kulturfolger</li>
            <li>Hybridzone: Mitte Deutschlands (beide Formen mischen sich)</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <ul style={styles.list}>
            <li>Grauer Rumpf und graue Unterseite</li>
            <li>Schwarzer Kopf, Brust, Schwanz und Flügel</li>
            <li>Kräftiger schwarzer Schnabel</li>
            <li>Flugbild identisch zur Rabenkrähe</li>
            <li>Ruf: typische Krähenlaute, kaum unterscheidbar</li>
          </ul>

        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Mai</li>
            <li>Baut große, stabile Nester in Bäumen</li>
            <li>Gelege: 3–6 Eier</li>
            <li>Jungvögel verlassen das Nest nach etwa 4 Wochen</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Aas, Insekten, Larven</li>
            <li>Eier, Jungvögel, Mäuse</li>
            <li>Getreide, Obst, Abfälle</li>
            <li>Sehr vielseitiger Allesfresser</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Sehr lernfähig und sozial</li>
            <li>Kann Nüsse und Muscheln aus großer Höhe fallen lassen</li>
            <li>Nutzen von Werkzeugen möglich</li>
            <li>Teilweise große Schwärme</li>
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
