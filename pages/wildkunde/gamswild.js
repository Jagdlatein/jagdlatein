import { useState } from "react";
import Image from "next/image";

export default function Gamswild() {
  const quiz = [
    {
      q: "Wann brunftet das Gamswild?",
      a: ["September", "November", "Januar"],
      correct: 1,
    },
    {
      q: "Wie nennt man das typische Horn des Gamsbocks?",
      a: ["Schaufel", "Spirale", "Krucke"],
      correct: 2,
    },
    {
      q: "Wie lange ist die Tragzeit beim Gamswild?",
      a: ["ca. 5 Monate", "ca. 7 Monate"],
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

        <h1 style={styles.title}>Gamswild (Rupicapra rupicapra)</h1>
        <p style={styles.subtitle}>Bock · Geiß · Kitz</p>

        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/gamswild.jpg"
            alt="Gamswild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: Bock 25–40 kg · Geiß 20–32 kg</li>
            <li>Körperlänge: 110–130 cm · Schulterhöhe: 70–85 cm</li>
            <li>Lebensraum: Hochgebirge, Steilhänge, Latschenzonen, Lawinenzüge</li>
            <li>Nahrung: Kräuter, Gräser, Knospen, Zwergsträucher</li>
            <li>Aktiv: tag- und dämmerungsaktiv</li>
            <li>Sozialstruktur: Geißrudel · Böcke oft einzeln oder in kleinen Gruppen</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brunft: November</li>
            <li>Tragzeit: ca. 7 Monate</li>
            <li>Setzzeit: Mai–Juni (1 Kitz)</li>
          </ul>
        </section>

        {/* HÖRNER */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Hörner & Merkmale</h2>
          <ul style={styles.list}>
            <li>Bock & Geiß tragen Hörner („Krucken“)</li>
            <li>Typisch: stark nach hinten gebeugt („Hakeln“)</li>
            <li>Jahresringe → Altersbestimmung eingeschränkt möglich</li>
            <li>Winterhaar schwarz–braun · Sommerhaar hellbraun</li>
            <li>Charakteristischer heller Gesichtsausdruck („Gamsbartfarbe“)</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Markanter Aalstrich am Rücken</li>
            <li>Hell abgesetzte Wangen und Kehlfleck</li>
            <li>Sehr trittsicher · bevorzugt Steillagen</li>
            <li>Fährte: 3–5 cm lang, spitz, eng stehend</li>
            <li>Losung klein, zylindrisch, oft spitz zulaufend</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Wiederkäuer → keine Schneidezähne im Oberkiefer</li>
            <li>M1–M3 wichtig für Altersbestimmung</li>
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

  // QUIZ STYLES
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
