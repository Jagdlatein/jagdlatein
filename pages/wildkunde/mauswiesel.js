import { useState } from "react";
import Image from "next/image";

export default function Mauswiesel() {
  const quiz = [
    {
      q: "Was ist das wichtigste Unterscheidungsmerkmal zum Hermelin?",
      a: [
        "Braunes Sommerfell",
        "Keine schwarze Schwanzspitze",
        "Kleinerer Kopf"
      ],
      correct: 1,
    },
    {
      q: "Wie groß wird das Mauswiesel maximal?",
      a: ["12–20 cm", "20–35 cm", "35–45 cm"],
      correct: 0,
    },
    {
      q: "Von welcher Beute ernährt sich das Mauswiesel hauptsächlich?",
      a: [
        "Rebhühner",
        "Kaninchen",
        "Mäuse"
      ],
      correct: 2,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((x) => ({ ...x, [qi]: ai }));
    setAnswered((x) => ({ ...x, [qi]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Mauswiesel (Mustela nivalis)</h1>
        <p style={styles.subtitle}>Kleinster heimischer Raubwildvertreter · Mäusejäger</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/mauswiesel.jpg"
            alt="Mauswiesel"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 12–20 cm (winzig!)</li>
            <li>Gewicht: 25–80 g</li>
            <li>Schnellster Stoffwechsel aller heimischen Raubtiere</li>
            <li>Lebensraum: Wiesen, Feldgehölze, Steinmauern, Hecken</li>
            <li>Beute: fast ausschließlich Mäuse (Wühlmäuse, Feldmäuse)</li>
            <li>Kann Beute in engen Gängen verfolgen</li>
            <li>Kein Winterschlaf, aktiv das ganze Jahr</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Wichtig:</strong> KEINE schwarze Schwanzspitze</li>
            <li>Sommerfell: rotbraun oben, weiß unten</li>
            <li>Winterfell: teils weiß, aber selten komplett wie Hermelin</li>
            <li>Extrem kleiner Kopf</li>
            <li>Hohe Beweglichkeit, schnelle Sprünge</li>
            <li>Fährte: <strong>winzig</strong> – 0,8–1,5 cm</li>
            <li>Losung: 2–4 cm, dünn, gedreht</li>
          </ul>
        </section>

        {/* UNTERSCHIED ZUM HERMELIN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zum Hermelin</h2>
          <ul style={styles.list}>
            <li>Mauswiesel: <strong>keine schwarze Schwanzspitze</strong></li>
            <li>Hermelin: <strong>immer schwarze Spitze</strong></li>
            <li>Mauswiesel deutlich kleiner</li>
            <li>Hermelin kräftiger gebaut</li>
            <li>Mauswiesel selten komplett weiß im Winter</li>
            <li>Hermelin deutlich größere Fährte</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: März–September</li>
            <li>Tragzeit: ca. 34 Tage</li>
            <li>Wurfzeit: April–Mai</li>
            <li>Wurfgröße: 4–6 Junge</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe</li>
            <li>Räude</li>
            <li>Bandwürmer</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 3/3 · M 1/2 = 34</li>
            <li>Kleines, aber scharfes Raubtiergebiss</li>
            <li>Perfekt für Mäusejagd ausgelegt</li>
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
