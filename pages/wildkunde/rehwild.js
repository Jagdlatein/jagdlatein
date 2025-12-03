import { useState } from "react";
import Image from "next/image";

export default function Rehwild() {
  const quiz = [
    {
      q: "Wie lautet die Brunftzeit des Rehwildes?",
      a: ["April–Mai", "Juli–August", "Oktober–November"],
      correct: 1,
    },
    {
      q: "Wie nennt man das Männchen beim Rehwild?",
      a: ["Hirsch", "Bock", "Keiler"],
      correct: 1,
    },
    {
      q: "Wie lange ist die Tragezeit des Rehwildes (inkl. Keimruhe)?",
      a: ["ca. 5 Monate", "ca. 9,5 Monate"],
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
        <h1 style={styles.title}>Rehwild (Capreolus capreolus)</h1>
        <p style={styles.subtitle}>Rehbock, Ricke & Kitz</p>

        {/* ⭐ Bild aus /public */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/rehwild.jpg"
            alt="Rehwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* STECKBRIEF */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Kleinstes einheimisches Schalenwild</li>
            <li>Gewicht: Bock 20–30 kg, Ricke 18–26 kg</li>
            <li>Körperlänge: 95–140 cm, Schulterhöhe 60–75 cm</li>
            <li>Lebensraum: Feld-Wald-Mosaik, Waldränder, Agrarlandschaften</li>
            <li>Nahrung: Kräuter, Knospen, Blätter, Triebe, Beeren</li>
            <li>Sozialstruktur: territorial · Einzelgänger</li>
            <li>Brunftzeit: Juli–August</li>
            <li>Setzzeit: Mai–Juni (meist zwei Kitze)</li>
            <li>Besonderheit: Keimruhe (embryonale Diapause)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Geweih</h2>
          <ul style={styles.list}>
            <li>Bock trägt ein Stangengehörn mit 2–6 Enden</li>
            <li>Abwurf: Oktober–November</li>
            <li>Schieben unter Bast: Januar–April</li>
            <li>Farbe abhängig vom Fegen (Baumarten)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Spiegel: weiß, nierenförmig (Ricke → herzförmig)</li>
            <li>Sommer: rotbraune Decke</li>
            <li>Winter: graubraune Decke</li>
            <li>Losung: kleine, rundliche Kötel</li>
            <li>Fährte: klein, schmal, 2–4 cm</li>
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
  main: { background: "#faf8f1", padding: "40px 20px", minHeight: "100vh" },
  wrap: { maxWidth: "900px", margin: "0 auto" },
  title: { fontSize: "42px", fontWeight: 800, marginBottom: "6px" },
  subtitle: { fontSize: "19px", marginBottom: "26px", color: "#5a5a5a" },
  imageBox: { borderRadius: "14px", overflow: "hidden", marginBottom: "32px" },
  image: { width: "100%", height: "auto" },
  section: { marginBottom: "36px" },
  sectionTitle: { fontSize: "26px", marginBottom: "14px" },
  list: { paddingLeft: "22px", lineHeight: "1.7", fontSize: "17px" },
  quizBlock: {
    marginBottom: "26px",
    padding: "16px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2d9c9",
  },
  quizQuestion: { fontSize: "18px", marginBottom: "12px", fontWeight: 600 },
  quizButton: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
    textAlign: "left",
    cursor: "pointer",
  },
};
