import { useState } from "react";
import Image from "next/image";

export default function Tafelente() {
  const quiz = [
    {
      q: "Welche Ente ist eine typische Tauchente?",
      a: ["Stockente", "Krickente", "Tafelente"],
      correct: 2,
    },
    {
      q: "Woran erkennt man den Erpel der Tafelente?",
      a: [
        "Grüner Kopf, gelber Schnabel",
        "Kastanienroter Kopf, schwarze Brust",
        "Ganz weißer Körper"
      ],
      correct: 1,
    },
    {
      q: "Welche Nahrung bevorzugt die Tafelente?",
      a: [
        "Ausschließlich Fisch",
        "Wasserpflanzen, Sämereien, Kleintiere",
        "Gras wie Gänse"
      ],
      correct: 1,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected(s => ({ ...s, [qi]: ai }));
    setAnswered(s => ({ ...s, [qi]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Tafelente (Aythya ferina)</h1>
        <p style={styles.subtitle}>
          Tauchente · Rötlicher Kopf · Schwarze Brust
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/tafelente.jpg"
            alt="Tafelente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Mittelgroße Tauchente</li>
            <li>Lebensraum: Seen, Teiche, Altwasser, ruhige Flüsse</li>
            <li>Fliegt schnell, startet mit kräftigem Anlauf</li>
            <li>Bevorzugt tiefere Gewässer</li>
            <li>Wintergast in großen Gruppen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <h3>Erpel (Prachtkleid)</h3>
          <ul style={styles.list}>
            <li>Kastanienroter Kopf</li>
            <li>Schwarze Brust</li>
            <li>Grauer Körper</li>
            <li>Hellblauer Schnabel mit dunkler Spitze</li>
          </ul>

          <h3>Ente</h3>
          <ul style={styles.list}>
            <li>Braun getarnt</li>
            <li>Deutlich unauffälliger als der Erpel</li>
            <li>Kleinerer, runder Kopf</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: April–Juni</li>
            <li>Nest in dichter Ufervegetation</li>
            <li>Gelege: 8–10 Eier</li>
            <li>Küken: Nestflüchter, tauchen früh</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Tauchente → sucht Nahrung unter Wasser</li>
            <li>Pflanzenreste, Samen, Schnecken, Muscheln, Insektenlarven</li>
            <li>Küken benötigen tierisches Eiweiß</li>
          </ul>
        </section>

        {/* ZUGVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zugverhalten</h2>
          <ul style={styles.list}>
            <li>Starker Zugvogel</li>
            <li>Brütet in Europa und Asien</li>
            <li>Überwintert in Mitteleuropa, Mittelmeer, Afrika</li>
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
    border: "1px solid "#ccc",
    fontSize: "16px",
    cursor: "pointer",
  },
};
