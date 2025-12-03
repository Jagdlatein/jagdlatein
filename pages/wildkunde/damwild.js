import { useState } from "react";
import Image from "next/image";

export default function Damwild() {
  const quiz = [
    {
      q: "Wie lautet die typische Brunftzeit des Damwildes?",
      a: ["Juli–August", "Oktober–November", "Februar–März"],
      correct: 1,
    },
    {
      q: "Wie nennt man das Geweih des Damhirsches?",
      a: ["Stangen", "Schaufeln"],
      correct: 1,
    },
    {
      q: "Wie lange ist die Tragezeit beim Damwild?",
      a: ["ca. 5 Monate", "ca. 7,5 Monate"],
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
        <h1 style={styles.title}>Damwild (Dama dama)</h1>
        <p style={styles.subtitle}>Damhirsch, Damtier & Kalb</p>

        {/* ⭐ Bild aus /public */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/damwild.jpg"
            alt="Damwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* STECKBRIEF */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Mittelgroßes Schalenwild</li>
            <li>Gewicht: Hirsch 60–100 kg, Tier 35–60 kg</li>
            <li>Körperlänge: 130–175 cm, Schulterhöhe 80–110 cm</li>
            <li>Vorkommen: Parkwild, Wälder, Feldreviere</li>
            <li>Nahrung: Gräser, Kräuter, Knospen, Eicheln, Bucheckern</li>
            <li>Sozialstruktur: Rudelbildung, sehr standorttreu</li>
            <li>Brunftzeit: Oktober–November („Platzbrunft“)</li>
            <li>Setzzeit: Juni (meist 1 Kalb)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Geweih</h2>
          <ul style={styles.list}>
            <li>Damhirsch trägt ein charakteristisches Schaufelgeweih</li>
            <li>1. Kopf Spießer → ab 3. Kopf Schaufeln</li>
            <li>Abwurf: April</li>
            <li>Neubildung unter Bast im Frühjahr</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Typischer Aalstrich (dunkler Rückenstreifen)</li>
            <li>Gefleckte Decke im Sommer (weiß auf braun)</li>
            <li>Spiegel: sehr groß, herzförmig, schwarz umrandet</li>
            <li>Losung kleiner als beim Rotwild, länglicher als Rehwild</li>
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
