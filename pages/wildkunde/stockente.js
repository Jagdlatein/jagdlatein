import { useState } from "react";
import Image from "next/image";

export default function Stockente() {
  const quiz = [
    {
      q: "Wie heißt das männliche Tier der Stockente?",
      a: ["Erpel", "Ganter", "Hahn"],
      correct: 0,
    },
    {
      q: "Welche Aussage zur Stockente ist richtig?",
      a: [
        "Sie ist die häufigste Entenart Mitteleuropas",
        "Sie lebt ausschließlich im Gebirge",
        "Sie ist ein reiner Bodenbrüter im Wald"
      ],
      correct: 0,
    },
    {
      q: "Woran erkennt man den Erpel im Prachtkleid?",
      a: [
        "Brauner Kopf, gelber Schnabel",
        "Grün schimmernder Kopf, gelber Schnabel",
        "Schwarzer Kopf mit weißem Ring"
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

        <h1 style={styles.title}>Stockente (Anas platyrhynchos)</h1>
        <p style={styles.subtitle}>Häufigste Entenart · Prachtkleid · Zug- & Standvogel</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/stockente.jpg"
            alt="Stockente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Häufigste Wildentenart Mitteleuropas</li>
            <li>Erpel: auffälliges Prachtkleid mit grünem Kopf</li>
            <li>Ente: braun gemustert, stark getarnt</li>
            <li>Lebensraum: Seen, Teiche, Flüsse, Feuchtgebiete, Städte</li>
            <li>Zug- & Standvogel → viele überwintern in Europa</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <h3>Erpel (Männchen)</h3>
          <ul style={styles.list}>
            <li>Grün schillernder Kopf</li>
            <li>Gelber Schnabel</li>
            <li>Schwarze Schwanzlocke</li>
            <li>Weißer Halsring</li>
          </ul>

          <h3>Ente (Weibchen)</h3>
          <ul style={styles.list}>
            <li>Braun gemustert</li>
            <li>Orange-brauner Schnabel</li>
            <li>Stark getarnt → ideal für Bodenbrut</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Mai</li>
            <li>Nest: Bodenbrüter, oft nah am Wasser</li>
            <li>Gelege: 7–14 Eier</li>
            <li>Küken sind Nestflüchter</li>
            <li>Sehr hohe Ausfallraten durch Fressfeinde</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Allesfresser (Pflanzen, Samen, Insekten, Schnecken)</li>
            <li>Oberflächen- & Gründelente</li>
            <li>Gründelt kopfüber im Wasser</li>
          </ul>
        </section>

        {/* BEDROHUNGEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gefährdung & Besonderheiten</h2>
          <ul style={styles.list}>
            <li>Hybridisierung mit Hausenten (Gefahr für Wildform)</li>
            <li>Störungen durch Freizeitaktivitäten</li>
            <li>Bleivergiftungen durch alte Schrote (Bestandsrisiko)</li>
            <li>Hohe Anpassungsfähigkeit → häufig in Städten</li>
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
