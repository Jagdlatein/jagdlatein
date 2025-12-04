import { useState } from "react";
import Image from "next/image";

export default function Auerhuhn() {
  const quiz = [
    {
      q: "Wie nennt man das Männchen des Auerhuhns?",
      a: ["Gockel", "Auerhahn", "Spielhahn"],
      correct: 1,
    },
    {
      q: "Was ist typisch für die Balz des Auerhahns?",
      a: [
        "Balz auf Bäumen im Sitzen",
        "Vierstufiger Balzgesang mit Hauptschlag",
        "Balz im Wasser"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist korrekt?",
      a: [
        "Auerhennen sind auffällig bunt",
        "Auerhennen sind braun getarnt",
        "Auerhennen haben sichelförmige Schwanzfedern"
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

        <h1 style={styles.title}>Auerhuhn (Tetrao urogallus)</h1>
        <p style={styles.subtitle}>Großvogel des Bergwaldes · Balzkönig · Selten</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/auerhuhn.jpg"
            alt="Auerhuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ===================================== */}
        {/* ALLGEMEINES */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Größtes Raufußhuhn Europas</li>
            <li>Lebensraum: strukturreiche Berg- & Nadelwälder</li>
            <li>In Mitteleuropa stark gefährdet</li>
            <li>Sehr störungsempfindlich</li>
            <li>Strenger Schutz in vielen Ländern</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* ERKENNUNG */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Auerhahn:</strong> schwarzgrün metallisch glänzend</li>
            <li>Großer Fächerstoß (kein Sichelstoß wie Birkhuhn!)</li>
            <li>Blutrote Rosen über dem Auge</li>
            <li><strong>Auerhenne:</strong> braun-orange gemustert, stark getarnt</li>
            <li>Deutlich größer als Birkhenne</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* BALZ */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Balz & Balzgesang</h2>
          <ul style={styles.list}>
            <li>Balzzeit: April–Mai</li>
            <li>Typisch: <strong>Vierstufiger Balzgesang</strong></li>
            <li>Phasen: „Knappen“ → „Trillern“ → „Hauptschlag“ → „Wettschlag“</li>
            <li>Hahn wird während des Hauptschlags „taub“ für kurze Zeit</li>
            <li>Balz findet am Boden oder in niedrigen Bäumen statt</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* FORTPFLANZUNG */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Gelege: 6–12 Eier</li>
            <li>Brutdauer: ca. 26 Tage</li>
            <li>Auerhenne führt die Küken allein</li>
            <li>Küken benötigen Insekten → Eiweiß für schnelles Wachstum</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* NAHRUNG */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Jährlich: Kräuter, Beeren, Knospen</li>
            <li>Winter: Nadeln und Triebe von Kiefern & Tannen</li>
            <li>Küken: Insekten (lebensnotwendig!)</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* VERWECHSLUNG */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verwechslungsgefahr</h2>
          <ul style={styles.list}>
            <li>Birkhahn: kleiner, schwarzer, sichelförmiger Stoß</li>
            <li>Auerhenne ↔ Birkhenne: Auerhenne deutlich größer</li>
            <li>Balzplatz unterscheidet sich → Auer balzt einzeln, Birkhuhn in Gruppen</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* GEFÄHRDUNG */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gefährdung & Schutz</h2>
          <ul style={styles.list}>
            <li>Lebensraumverlust → fehlende strukturreiche Wälder</li>
            <li>Freizeitdruck (Wanderer, Skitouren, Hunde)</li>
            <li>Klimawandel verändert Schneedecken und Vegetation</li>
            <li>In vielen Ländern streng geschützt</li>
          </ul>
        </section>

        {/* ===================================== */}
        {/* QUIZ */}
        {/* ===================================== */}
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
