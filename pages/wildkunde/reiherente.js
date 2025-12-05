import { useState } from "react";
import Image from "next/image";

export default function Reiherente() {
  const quiz = [
    {
      q: "Woran erkennt man den Erpel der Reiherente?",
      a: [
        "Roter Kopf, schwarze Brust",
        "Schwarzer Kopf mit Federschopf und gelben Augen",
        "Komplett weißer Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Ente gehört zu den Tauchenten?",
      a: ["Stockente", "Reiherente", "Krickente"],
      correct: 1,
    },
    {
      q: "Welche Nahrung bevorzugt die Reiherente?",
      a: [
        "Pflanzen, Samen und Beeren an Land",
        "Fisch als Hauptnahrung",
        "Muscheln, Schnecken, Insektenlarven"
      ],
      correct: 2,
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

        <h1 style={styles.title}>Reiherente (Aythya fuligula)</h1>
        <p style={styles.subtitle}>
          Tauchente · Gelbe Augen · Federschopf · Kontrastreiches Prachtkleid
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/reiherente.jpg"
            alt="Reiherente"
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
            <li>Weit verbreitet in Europa</li>
            <li>Lebensraum: Seen, Teiche, Altwasser, Stadtgewässer</li>
            <li>Gute Taucherin (bis 3–4 m Tiefe)</li>
            <li>Bildet große Wintertrupps</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <h3>Erpel (Prachtkleid)</h3>
          <ul style={styles.list}>
            <li>Tiefer schwarzer Kopf mit violettem Glanz</li>
            <li>Markanter Federschopf</li>
            <li>Knallgelbe Augen</li>
            <li>Weiße Flanken, schwarzer Rücken</li>
          </ul>

          <h3>Ente</h3>
          <ul style={styles.list}>
            <li>Braun gemustert</li>
            <li>Kleiner Schopf, aber weniger ausgeprägt</li>
            <li>Gelbliche bis braune Augen</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: April–Juli</li>
            <li>Nest: Bodenbrüter, oft in dichter Vegetation</li>
            <li>Gelege: 8–11 Eier</li>
            <li>Küken: Nestflüchter, können früh tauchen</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Muscheln, Schnecken, Würmer, Insektenlarven</li>
            <li>Taucht aktiv am Gewässergrund</li>
            <li>Pflanzliche Beikost nur gering</li>
          </ul>
        </section>

        {/* ZUGVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zugverhalten</h2>
          <ul style={styles.list}>
            <li>Teilzieher</li>
            <li>Nordeuropäische Populationen ziehen nach Westeuropa</li>
            <li>Bildet große Wintergruppen auf offenen Gewässern</li>
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
