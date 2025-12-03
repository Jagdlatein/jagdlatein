import { useState } from "react";
import Image from "next/image";

export default function Muffelwild() {
  const quiz = [
    {
      q: "Wie nennt man das männliche Muffelwild?",
      a: ["Widder", "Bock", "Hirsch"],
      correct: 0,
    },
    {
      q: "Wann setzt das Muffelschaf in der Regel?",
      a: ["Mai–Juni", "November–Dezember", "Januar–Februar"],
      correct: 0,
    },
    {
      q: "Wie viele Zähne hat das Muffelwild?",
      a: ["30", "32", "34"],
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

        <h1 style={styles.title}>Muffelwild (Ovis musimon)</h1>
        <p style={styles.subtitle}>Widder · Schaf · Lamm</p>

        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/muffelwild.jpg"
            alt="Muffelwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: Widder 35–50 kg · Schaf 25–35 kg</li>
            <li>Körperlänge: 110–130 cm · Schulterhöhe: 65–75 cm</li>
            <li>Lebensraum: Mittelgebirge, Felsregionen, große Waldgebiete</li>
            <li>Nahrung: Gräser, Kräuter, Knospen, junge Triebe, Heidekraut</li>
            <li>Sozialstruktur: Widderrudel & Schafrudel getrennt</li>
            <li>Sehr gute Kletterfähigkeit und Fluchtdistanz</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brunftzeit: Oktober–November</li>
            <li>Tragzeit: ca. 5 Monate</li>
            <li>Setzzeit: Mai–Juni</li>
            <li>Schaf setzt 1 Lamm, selten 2</li>
          </ul>
        </section>

        {/* HÖRNER (SCHNECKEN) */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Hörner (Schnecken)</h2>
          <ul style={styles.list}>
            <li>Widder trägt starke, gedrehte Schnecken (Hörner)</li>
            <li>Schnecken wachsen lebenslang</li>
            <li>Jahresringe → grobe Altersbestimmung möglich</li>
            <li>Schafe i.d.R. ohne Hörner</li>
            <li>Stärke & Länge der Schnecken = wichtiges Merkmal</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Typischer weißer „Sattel“ beim Widder</li>
            <li>Dunkelbraunes Fell, im Winter dichter</li>
            <li>Schmaler Kopf, helle Fangpartie</li>
            <li>Fährte: klein, schmal, 3–4 cm, ähnlich Rehwild aber runder</li>
            <li>Losung: linsenförmig, ähnlich Schaflosung</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Typischer Wiederkäuer</li>
            <li>Kauflächen der Backenzähne verraten das Alter</li>
            <li>Kein Oberkiefer-Schneidezahn</li>
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
