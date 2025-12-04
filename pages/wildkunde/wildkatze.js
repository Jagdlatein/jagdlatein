import { useState } from "react";
import Image from "next/image";

export default function Wildkatze() {
  const quiz = [
    {
      q: "Welches Merkmal unterscheidet die Wildkatze eindeutig von der Hauskatze?",
      a: [
        "Schlanker Schwanz",
        "Buschiger Schwanz mit 3–5 dunklen Ringen und stumpfer Spitze",
        "Dreifarbige Fellmusterung"
      ],
      correct: 1,
    },
    {
      q: "Welchen Schutzstatus hat die Wildkatze?",
      a: [
        "Jagbar mit Schonzeit",
        "Ganzjährig streng geschützt",
        "Jagbar nur in bestimmten Regionen"
      ],
      correct: 1,
    },
    {
      q: "Wo lebt die Wildkatze bevorzugt?",
      a: [
        "Offene Agrarlandschaft",
        "Nadelwälder ohne Deckung",
        "Laub- und Mischwälder mit viel Deckung"
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

        <h1 style={styles.title}>Wildkatze (Felis silvestris)</h1>
        <p style={styles.subtitle}>Streng geschützt · heimliches Waldtier</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/wildkatze.jpg"
            alt="Wildkatze"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 45–65 cm</li>
            <li>Gewicht: 3–8 kg</li>
            <li>Lebensraum: strukturreiche Laub- und Mischwälder</li>
            <li>Sehr scheu, dämmerungs- und nachtaktiv</li>
            <li>Ernährung: Mäuse, Kleinvögel, Jungkaninchen</li>
            <li>Bevorzugt Wildnisareale mit viel Deckung</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Buschiger, stumpf endender Schwanz mit 3–5 dunklen Ringen</strong></li>
            <li>Typischer Aalstrich auf dem Rücken</li>
            <li>Fell: sandgrau bis fahlbraun, gleichmäßig getönt</li>
            <li>Ohren breit, Kopf rundlich</li>
            <li>Stärkerer Körperbau als Hauskatze</li>
            <li>Fährte: wie Hauskatze, aber etwas breiter (3,5–4,5 cm)</li>
          </ul>
        </section>

        {/* UNTERSCHIED ZUR HAUSKATZE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zur Hauskatze</h2>
          <ul style={styles.list}>
            <li>Wildkatze: buschiger Schwanz, stumpf, klar geringelt</li>
            <li>Hauskatze: dünnerer Schwanz, oft spitz zulaufend</li>
            <li>Wildkatze: Aalstrich deutlich ausgeprägt</li>
            <li>Hauskatze: abwechslungsreiche Fellfarben möglich</li>
            <li>Wildkatze massiver Körperbau</li>
            <li>Hauskatze schlanker, leichter</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Januar–März</li>
            <li>Tragzeit: ca. 65 Tage</li>
            <li>Wurfzeit: März–Mai</li>
            <li>Wurfgröße: 2–4 Junge</li>
            <li>Geburtsort: Wurfhöhlen, Baumstümpfe, dichtes Unterholz</li>
          </ul>
        </section>

        {/* SCHUTZSTATUS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Schutzstatus</h2>
          <ul style={styles.list}>
            <li><strong>Ganzjährig streng geschützt!</strong></li>
            <li>Keine Bejagung erlaubt</li>
            <li>Sensible Art mit Wiederansiedlungsprogrammen</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe (selten)</li>
            <li>Toxoplasmose</li>
            <li>Katzenkrankheiten wie FeLV, FIV</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 3/2 · M 1/1 = 30</li>
            <li>Typisches Katzengebiss mit kräftigen Fangzähnen</li>
            <li>Perfekt für den Mäusefang angepasst</li>
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
