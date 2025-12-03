import { useState } from "react";
import Image from "next/image";

export default function Sikawild() {
  const quiz = [
    {
      q: "Wann brunftet das Sikawild?",
      a: ["September–November", "Juni–Juli", "Dezember–Januar"],
      correct: 0,
    },
    {
      q: "Welche Größe erreicht ein Sikahirsch ungefähr?",
      a: ["15–25 kg", "40–70 kg", "120–200 kg"],
      correct: 1,
    },
    {
      q: "Welche Fellzeichnung ist typisch für Sikawild?",
      a: ["Gefleckt, auch im Winter sichtbar", "Komplett einfarbig braun"],
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
        <h1 style={styles.title}>Sikawild (Cervus nippon)</h1>
        <p style={styles.subtitle}>Sikahirsch, Sikatier & Kalb</p>

        {/* ⭐ Bild aus /public */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/sikawild.jpg"
            alt="Sikawild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* STECKBRIEF */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Mittelgroßes Hirschwild</li>
            <li>Gewicht: Hirsch 40–70 kg, Tier 30–50 kg</li>
            <li>Körperlänge: 110–160 cm · Schulterhöhe 70–95 cm</li>
            <li>Vorkommen: Mischwälder, Dickungen, Feld-Wald-Mosaik</li>
            <li>Nahrung: Gräser, Kräuter, Knospen, Nadeln, Rinde</li>
            <li>Sozialstruktur: kleine Rudelbildung</li>
            <li>Brunftzeit: September–November</li>
            <li>Setzzeit: Mai–Juni (1 Kalb)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Geweih</h2>
          <ul style={styles.list}>
            <li>Stangengeweih mit 3–8 Enden</li>
            <li>Ähnlich Reh- oder Rotwild, jedoch feiner</li>
            <li>Abwurf: April</li>
            <li>Schieben unter Bast: Frühling</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Ganzjährig helle Flecken auf braunem Fell</li>
            <li>Deutlicher Aalstrich (dunkler Mittelrückenstreifen)</li>
            <li>Charakteristischer „Pfeifton“ bei Erregung</li>
            <li>Spiegel nierenförmig, weiß umrandet</li>
            <li>Bewegung: mehr „trippelnd“ als Rotwild</li>
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
