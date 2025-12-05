import { useState } from "react";
import Image from "next/image";

export default function Graugans() {
  const quiz = [
    {
      q: "Welche Schnabelfarbe hat die Graugans?",
      a: ["Schwarz", "Orange", "Gelb"],
      correct: 1,
    },
    {
      q: "Was ist typisch für den Flug der Graugans?",
      a: [
        "Unruhiger Zickzackflug",
        "Gleichmäßiger Kraftflug in V-Formation",
        "Rüttelflug wie ein Turmfalke"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Die Graugans ist die Stammform der Hausgans",
        "Graugänse sind reine Hochgebirgsvögel",
        "Graugänse brüten ausschließlich in Baumhöhlen"
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

        <h1 style={styles.title}>Graugans (Anser anser)</h1>
        <p style={styles.subtitle}>
          Größte heimische Wildgans · Stammform der Hausgans · Charakteristische V-Formation
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/graugans.jpg"
            alt="Graugans"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Größte natürlich vorkommende Gans Mitteleuropas</li>
            <li>Schlicht graues Gefieder</li>
            <li>Typisch: ORANGEFARBENER Schnabel & rosa Füße</li>
            <li>Lebensraum: Seen, Flussauen, Feuchtgebiete, Kulturland</li>
            <li>Oft in großen, lautstarken Verbänden</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <h3>Äußere Merkmale</h3>
          <ul style={styles.list}>
            <li>Orangefarbener Schnabel</li>
            <li>Grau-braunes Gefieder mit heller Brust</li>
            <li>Rosafarbene Beine</li>
            <li>Langer Hals · massive Körperform</li>
          </ul>

          <h3>Flugbild</h3>
          <ul style={styles.list}>
            <li>Breite Flügel</li>
            <li>Ruhiger, kraftvoller Flügelschlag</li>
            <li>Typische V-Formation oder Linie</li>
            <li>Lautes „ga-ga-ga“-Rufen</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Mai</li>
            <li>Nest: Bodenbrut, gut versteckt in Schilf oder Wiesen</li>
            <li>Gelege: 4–7 Eier</li>
            <li>Küken: Nestflüchter, folgen den Eltern sofort</li>
            <li>Familiiverband bleibt lange zusammen</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gräser, Kräuter, Getreide</li>
            <li>Frisst oft auf Ackerflächen (Schadwild)</li>
            <li>Wasserpflanzen an Flachwasserzonen</li>
          </ul>
        </section>

        {/* ZUGVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zugverhalten</h2>
          <ul style={styles.list}>
            <li>Teilzieher</li>
            <li>Viele Populationen überwintern in Mitteleuropa</li>
            <li>Bekannt für V-Formationsflug</li>
            <li>Weite Zugstrecken möglich</li>
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
