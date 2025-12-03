import { useState } from "react";
import Image from "next/image";

export default function Rotwild() {
  const quiz = [
    {
      q: "Wann brunftet das Rotwild?",
      a: ["Mai–Juni", "September–Oktober", "Januar–Februar"],
      correct: 1,
    },
    {
      q: "Besitzt Rotwild Grandeln?",
      a: ["Ja", "Nein"],
      correct: 0,
    },
    {
      q: "Wie lautet die Zahnformel?",
      a: [
        "I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32",
        "I 3/3 · C 1/1 · P 4/4 · M 3/3 = 44",
      ],
      correct: 0,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qIndex, aIndex) {
    setSelected((s) => ({ ...s, [qIndex]: aIndex }));
    setAnswered((s) => ({ ...s, [qIndex]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Rotwild (Cervus elaphus)</h1>
        <p style={styles.subtitle}>Rotwild – Hirsch, Tier & Kalb</p>

        {/* ⭐ Bild aus /public – funktioniert IMMER */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/hirsch.jpg"
            alt="Rotwild Hirsch"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* --- STECKBRIEF --- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Größtes heimisches Schalenwild</li>
            <li>Gewicht: Hirsch 120–220 kg, Tier 70–120 kg</li>
            <li>Körperlänge 170–240 cm, Schulterhöhe 110–140 cm</li>
            <li>Lebensraum: Bergwälder, Mittelgebirge, Rotwildgebiete</li>
            <li>Nahrung: Gräser, Kräuter, Triebe, Rinde</li>
            <li>Sozialstruktur: Rudel um ein erfahrenes Alttier</li>
            <li>Brunftzeit: September–Oktober</li>
            <li>Setzzeit: Mai–Juni (meist 1 Kalb)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zähne & Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Grandeln = rudimentäre Eckzähne im Oberkiefer</li>
            <li>Kälber: Milchgebiss vollständig</li>
            <li>Zahnwechsel ab 13 Monaten</li>
            <li>Altersschätzung über M2 & M3</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Hirsch mit mächtigem Stangengeweih</li>
            <li>Sommerfell rotbraun – Winterfell graubraun</li>
            <li>Spiegel gelblich-weiß</li>
            <li>Losung olivenförmig</li>
            <li>Fährte 6–8 cm, breit gestellt</li>
          </ul>
        </section>

        {/* --- QUIZ --- */}
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
