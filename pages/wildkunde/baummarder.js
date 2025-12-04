import { useState } from "react";
import Image from "next/image";

export default function Baummarder() {
  const quiz = [
    {
      q: "Was ist das wichtigste Erkennungsmerkmal des Baummarders?",
      a: [
        "Weißer, gegabelter Kehlfleck",
        "Gelblicher, ovaler Kehlfleck",
        "Völlig fehlender Kehlfleck"
      ],
      correct: 1,
    },
    {
      q: "Welchen Lebensraum bevorzugt der Baummarder?",
      a: [
        "Städte und Siedlungen",
        "Offene Feldfluren",
        "Waldreiche, naturnahe Gebiete"
      ],
      correct: 2,
    },
    {
      q: "Wie viele Zähne besitzt der Baummarder?",
      a: ["36", "38", "40"],
      correct: 1,
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

        <h1 style={styles.title}>Baummarder (Martes martes)</h1>
        <p style={styles.subtitle}>Waldmarder · Indikator für gesunde Wälder</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/baummarder.jpg"
            alt="Baummarder"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 1,5–2 kg (ähnlich Steinmarder)</li>
            <li>Körperlänge: 40–55 cm</li>
            <li>Lebensraum: dichte Wälder, naturnahe Gebiete</li>
            <li>Sehr guter Kletterer → lebt oft in Bäumen</li>
            <li>Nahrung: Kleinsäuger, Vögel, Eier, Früchte</li>
            <li>Deutlich scheuer als der Steinmarder</li>
          </ul>
        </section>

        {/* IDENTIFIKATION */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Gelblicher, ovaler Kehlfleck (nicht gegabelt!)</li>
            <li>Dichter, seidiger Pelz</li>
            <li>Längerer Schwanz als Steinmarder</li>
            <li>Dunkelbraunes Fell</li>
            <li>Fährte: 3–4 cm, oft Doppeltritt</li>
          </ul>
        </section>

        {/* UNTERSCHIED ZUM STEINMARDER */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zum Steinmarder</h2>
          <ul style={styles.list}>
            <li><strong>Kehlfleck:</strong> Baummarder → gelb, oval · Steinmarder → weiß, gespalten</li>
            <li><strong>Lebensraum:</strong> Baummarder → Wald · Steinmarder → Siedlungen</li>
            <li><strong>Fell:</strong> Baummarder weicher & dichter</li>
            <li><strong>Schwanz:</strong> länger & buschiger</li>
            <li><strong>Schnauze:</strong> Baummarder rundlicher, Steinmarder spitzer</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Juli–August</li>
            <li>Keimruhe</li>
            <li>Wurfzeit: März–April</li>
            <li>Wurfgröße: 2–4 Jungtiere</li>
            <li>Aufzucht in Baumhöhlen</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe</li>
            <li>Räude</li>
            <li>Bandwürmer (v.a. bei Mäusejagd)</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 1/2 = 38</li>
            <li>Starkes Raubtiergebiss</li>
            <li>Reißzähne sehr ausgeprägt</li>
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
