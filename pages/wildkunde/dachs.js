import { useState } from "react";
import Image from "next/image";

export default function Dachs() {
  const quiz = [
    {
      q: "Wann ist der Dachs am aktivsten?",
      a: ["Tagsüber", "In der Dämmerung und nachts", "Mittags"],
      correct: 1,
    },
    {
      q: "Wie nennt man den Bau des Dachses?",
      a: ["Setz", "Kessel", "Röhre"],
      correct: 2,
    },
    {
      q: "Wie lautet die Zahnformel des Dachses?",
      a: ["I 3/3 · C 1/1 · P 4/4 · M 2/3", "I 3/3 · C 1/1 · P 4/3 · M 2/2", "I 2/2 · C 1/1 · P 3/3 · M 3/3"],
      correct: 0,
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

        <h1 style={styles.title}>Dachs (Meles meles)</h1>
        <p style={styles.subtitle}>Dachs – Meistergräber</p>

        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/dachs.jpg"
            alt="Dachs"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 8–17 kg, im Herbst bis über 20 kg</li>
            <li>Körperlänge: 60–90 cm</li>
            <li>Lebensraum: Mischwälder, Feldgehölze, Waldränder</li>
            <li>Nahrung: Regenwürmer, Insekten, Früchte, Aas, Getreide</li>
            <li>Omnivor und sehr anpassungsfähig</li>
            <li>Sehr reinliches Tier – „Toilettenplätze“ außerhalb des Baues</li>
          </ul>
        </section>

        {/* BAU */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Bau & Lebensweise</h2>
          <ul style={styles.list}>
            <li>Dachs lebt in großen, weit verzweigten Bauen („Röhren“)</li>
            <li>Bau wird über Jahrzehnte genutzt</li>
            <li>Mehrere Notausgänge</li>
            <li>Oft Gemeinschaftsbau mit Fuchs</li>
            <li>Winterruhe (keine echte Winterstarre)</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Februar–April</li>
            <li>Keimruhe → effektiver Wurf im Februar</li>
            <li>2–3 Jungtiere („Dachswelpen“)</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Markante schwarz-weiße Kopfzeichnung</li>
            <li>Kurz, gedrungen, kräftige Beine</li>
            <li>Fährte: breit, 5 Zehen sichtbar</li>
            <li>Losung: breiig bis kompakt, je nach Nahrung</li>
            <li>Lauft: gleitend, schwerfällig</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe</li>
            <li>Tuberkulose</li>
            <li>Räude</li>
            <li>Trichinen (selten, aber relevant)</li>
          </ul>
        </section>

        {/* ZÄHNE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 2/3 = 38</li>
            <li>Starkes Raubtiergebiss, kann harte Nahrung aufbrechen</li>
            <li>Breite Molaren für Allesfresser typisch</li>
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
