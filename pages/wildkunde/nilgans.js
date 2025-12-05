import { useState } from "react";
import Image from "next/image";

export default function Nilgans() {
  const quiz = [
    {
      q: "Woran erkennt man die Nilgans besonders typisch?",
      a: [
        "Schwarzer Kopf und weißes Kinnband",
        "Auffälliger brauner Augenfleck",
        "Knallgelbe Beine und roter Schnabel"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Die Nilgans ist ein einheimischer Brutvogel Europas",
        "Die Nilgans ist ein Neozoon aus Afrika",
        "Die Nilgans lebt ausschließlich in Gebirgsregionen"
      ],
      correct: 1,
    },
    {
      q: "Wie verhält sich die Nilgans gegenüber anderen Arten?",
      a: [
        "Sehr scheu und zurückhaltend",
        "Oft aggressiv, verteidigt große Reviere",
        "Lebt ausschließlich in großen Kolonien ohne Territorialverhalten"
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

        <h1 style={styles.title}>Nilgans (Alopochen aegyptiaca)</h1>
        <p style={styles.subtitle}>
          Neozoon aus Afrika · Markanter Augenfleck · Sehr territorial & aggressiv
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/nilgans.jpg"
            alt="Nilgans"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Eine der erfolgreichsten Neozoen-Arten Europas</li>
            <li>Ursprüngliches Verbreitungsgebiet: Afrika, Naher Osten</li>
            <li>Lebensraum: Seen, Teiche, Parks, Flussauen, Ackerflächen</li>
            <li>Sehr lautstark, aggressiv und territorial</li>
            <li>Ganzjährig Standvogel</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <ul style={styles.list}>
            <li>Großer, brauner Augenfleck → wichtigstes Merkmal</li>
            <li>Heller Kopf und Brust</li>
            <li>Bräunlich-grau mit rostroten Partien</li>
            <li>Kontrastreiche Flügel im Flug (weiß-schwarz-grün)</li>
            <li>Roter Schnabel · rosa Beine</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: Februar–Juni</li>
            <li>Nest: Boden, Schilf, Bäume, Gebäude, sogar auf Dächern</li>
            <li>Gelege: 5–10 Eier</li>
            <li>Sehr hohe Brut- und Aufzuchterfolge</li>
            <li>Küken sind Nestflüchter und sehr mobil</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gräser, Kräuter, Ackerpflanzen</li>
            <li>Sämereien, Getreide</li>
            <li>Gelegentlich Insekten</li>
            <li>Weidet auch auf Feldern → kann Schäden verursachen</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Sehr aggressiv gegenüber Enten und Gänsen</li>
            <li>Verteidigt große Reviere</li>
            <li>Stark expansionsfreudig</li>
            <li>Kann heimische Arten verdrängen</li>
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
