import { useState } from "react";
import Image from "next/image";

export default function Steinwild() {
  const quiz = [
    {
      q: "Wann brunftet das Steinwild?",
      a: ["August–September", "Dezember–Januar", "April–Mai"],
      correct: 1,
    },
    {
      q: "Wie nennt man die Hörner des Steinwildes?",
      a: ["Schaufeln", "Krucken", "Stangen"],
      correct: 1,
    },
    {
      q: "Wann setzt die Steinwild-Geiß üblicherweise?",
      a: ["Mai–Juni", "September", "Dezember"],
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

        <h1 style={styles.title}>Steinwild (Capra ibex)</h1>
        <p style={styles.subtitle}>Steinbock · Geiß · Kitz</p>

        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/steinwild.jpg"
            alt="Steinwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Lebt im Hochgebirge der Alpen</li>
            <li>Gewicht: Bock 70–120 kg · Geiß 40–55 kg</li>
            <li>Körperlänge: 130–165 cm · Schulterhöhe: 85–100 cm</li>
            <li>Lebensraum: Felsregionen, Schrofen, alpine Matten</li>
            <li>Extrem trittsicher und kletterstark</li>
            <li>Nahrung: Gräser, Kräuter, Moose, Zwergsträucher</li>
            <li>Sozialstruktur: Böcke und Geißen leben getrennt</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brunftzeit: Dezember–Januar</li>
            <li>Tragzeit: ca. 6 Monate</li>
            <li>Setzzeit: Mai–Juni</li>
            <li>Geiß setzt 1 Kitz, selten 2</li>
          </ul>
        </section>

        {/* HÖRNER */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Hörner</h2>
          <ul style={styles.list}>
            <li>Böcke tragen massive, stark gebogene Hörner</li>
            <li>Hörner wachsen lebenslang → deutliche Jahresringe</li>
            <li>Geißen tragen deutlich kleinere, schwächere Hörner</li>
            <li>Bockhörner bis 1 Meter lang möglich</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Mächtige Körperform, dunkles Haarkleid</li>
            <li>Sommerfell heller, Winterfell dunkler & dichter</li>
            <li>Typische „Kletterbewegung“ in Felswänden</li>
            <li>Fährte: breit, 5–7 cm · runde, kräftige Schalen</li>
            <li>Losung: länglich, dunkel, oft gruppiert</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Typischer Wiederkäuer → keine Oberkiefer-Schneidezähne</li>
            <li>Altersbestimmung über Molaren möglich</li>
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

  // QUIZ
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
