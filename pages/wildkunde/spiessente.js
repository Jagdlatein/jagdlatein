import { useState } from "react";
import Image from "next/image";

export default function Spiessente() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für die Spießente?",
      a: [
        "Runder, kurzer Schwanz",
        "Sehr langer, spitzer Schwanz",
        "Roter Kopf mit weißem Brustband"
      ],
      correct: 1,
    },
    {
      q: "Wie wirkt die Spießente im Körperbau?",
      a: [
        "Sehr plump und kurz",
        "Queroval und kompakt",
        "Schlank, langhalsig und elegant"
      ],
      correct: 2,
    },
    {
      q: "Welcher Lebensraum wird bevorzugt?",
      a: [
        "Tiefe Wälder",
        "Offene Flachwasserzonen und Küsten",
        "Felsige Berghänge"
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

        <h1 style={styles.title}>Spießente (Anas acuta)</h1>
        <p style={styles.subtitle}>
          Eleganteste Entenart · Langer Schwanzspieß · Zugvogel
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/spiessente.jpg"
            alt="Spießente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Mittelgroße bis große Gründelente</li>
            <li>Sehr eleganter, schlanker Körperbau</li>
            <li>Extrem langer Schwanz beim Erpel → „Spieß“</li>
            <li>Lebensraum: Flachwasser, Küsten, Lagunen, Überflutungsflächen</li>
            <li>Starker Zugvogel (bis Afrika)</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <h3>Erpel</h3>
          <ul style={styles.list}>
            <li>Langer spitzer Schwanz</li>
            <li>Schokoladenbrauner Kopf</li>
            <li>Weißer Hals mit nach oben ziehendem Streifen</li>
            <li>Schlanker Hals, elegante Körperform</li>
            <li>Flügelspiegel: bronzefarben und unauffällig</li>
          </ul>

          <h3>Ente</h3>
          <ul style={styles.list}>
            <li>Unauffällig braun gemustert</li>
            <li>Deutlich schlanker als Stockenten</li>
            <li>Kleinerer, feiner Kopf</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: April–Juni</li>
            <li>Nest: gut versteckte Bodenbrut in Ufervegetation</li>
            <li>Gelege: 7–9 Eier</li>
            <li>Küken sind Nestflüchter</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gründelt und weidet wie eine Gans</li>
            <li>Frisst Wasserpflanzen, Gräser, Samen</li>
            <li>Küken: Insekten und Kleintiere</li>
          </ul>
        </section>

        {/* ZUGVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zugverhalten</h2>
          <ul style={styles.list}>
            <li>Sehr starker Langstreckenzieher</li>
            <li>Brütet in Nordeuropa, Sibirien</li>
            <li>Überwintert in Süd- und Westeuropa, Afrika, Nahost</li>
            <li>Häufig in großen Schwärmen beobachtet</li>
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
