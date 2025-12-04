import { useState } from "react";
import Image from "next/image";

export default function Birkhuhn() {
  const quiz = [
    {
      q: "Wie nennt man das Männchen des Birkhuhns?",
      a: ["Spielhahn", "Gockel", "Racker"],
      correct: 0,
    },
    {
      q: "Was ist typisch für die Balz des Birkhuhns?",
      a: [
        "Balz auf Bäumen",
        "Balz auf offenen Balzplätzen",
        "Balz im Wasser"
      ],
      correct: 1,
    },
    {
      q: "Welche Merkmale hat der Birkhahn?",
      a: [
        "Rote Rosen und sichelförmiger Stoß",
        "Weißer Bürzel und langer Hals",
        "Gelbe Wangen und blauer Kopf"
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

        <h1 style={styles.title}>Birkhuhn (Tetrao tetrix)</h1>
        <p style={styles.subtitle}>Balzplätze · Spielhähne · Strukturreicher Lebensraum</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/birkhuhn.jpg"
            alt="Birkhuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* -------------------------------- */}
        {/* ALLGEMEINES */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Lebensraum: Moorlandschaften, Heidelandschaften, Gebirge</li>
            <li>Bestände vielerorts stark rückläufig</li>
            <li>Sehr störungsempfindlich während der Balz</li>
            <li>Jagd in vielen Ländern nur stark begrenzt erlaubt</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* ERKENNUNG */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Birkhahn:</strong> schwarz glänzend, rote Rosen, weißer Flügelspiegel</li>
            <li>Sichelförmiger Stoß → wichtigstes Merkmal</li>
            <li><strong>Birkhenne:</strong> braun-grau gemustert, gut getarnt</li>
            <li>Kleiner als Auerhuhn</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* BALZ */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Balz</h2>
          <ul style={styles.list}>
            <li>Balzzeit: April–Mai</li>
            <li>Balzplätze in offenen Bereichen</li>
            <li>Spielhähne kämpfen lautstark → Fauchen, Zischen, Kollern</li>
            <li>Balzarena wird über Jahre genutzt</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* FORTPFLANZUNG */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Gelege: 6–10 Eier, gut versteckt am Boden</li>
            <li>Brutdauer: ca. 26 Tage</li>
            <li>Küken sind Nestflüchter</li>
            <li>Junge benötigen hohe Insektennahrung</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* NAHRUNG */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Kn os pen, Kräuter, Beeren</li>
            <li>Junge: Insekten → extrem wichtig!</li>
            <li>Im Winter Birkenknospen</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* VERWECHSLUNG */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verwechslungsgefahr</h2>
          <ul style={styles.list}>
            <li>Auerhuhn → größer, anderer Stoß</li>
            <li>Birkhenne ähnelt Auerhenne, aber deutlich kleiner</li>
            <li>Balzverhalten unterscheidet sich stark</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* BEDROHUNG */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gefährdung</h2>
          <ul style={styles.list}>
            <li>Lebensraumverlust (Verbuschung, Nutzungswandel)</li>
            <li>Störung durch Freizeitaktivitäten</li>
            <li>Witterungseinflüsse</li>
            <li>Raubwilddruck</li>
          </ul>
        </section>

        {/* -------------------------------- */}
        {/* QUIZ */}
        {/* -------------------------------- */}
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
