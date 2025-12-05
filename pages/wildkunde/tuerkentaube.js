import { useState } from "react";
import Image from "next/image";

export default function Tuerkentaube() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für die Türkentaube?",
      a: [
        "Weiße Flügelbinde",
        "Schwarzer Nackenring",
        "Blauer Flügelspiegel"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Türkentauben kamen als Kulturfolger aus dem Osten nach Europa",
        "Türkentauben leben nur im Wald",
        "Türkentauben sind die größte Taubenart"
      ],
      correct: 0,
    },
    {
      q: "Wovon ernährt sich die Türkentaube hauptsächlich?",
      a: [
        "Kleinsäuger und Insekten",
        "Samen, Getreide, Knospen",
        "Aas und Früchte"
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

        <h1 style={styles.title}>Türkentaube (Streptopelia decaocto)</h1>
        <p style={styles.subtitle}>
          Kulturfolger · Schwarzer Nackenring · Heller Körper · Typischer „gu-gu-gu“ Ruf
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/tuerkentaube.jpg"
            alt="Türkentaube"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Schlanke, mittelgroße Taube</li>
            <li>Lebt bevorzugt in Siedlungen, auf Bauernhöfen und in Städten</li>
            <li>Seit ca. 1940 starke Ausbreitung in Mitteleuropa</li>
            <li>Kulturfolger → klassische Prüfungsfrage!</li>
            <li>Typischer Ruf: dreisilbig „gu-gu-gu“</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <ul style={styles.list}>
            <li>Hellgrau–beige</li>
            <li>Schwarzer Nackenring (Namensgeber)</li>
            <li>Langer, schmaler Stoß</li>
            <li>Dunkles Auge, zarter Schnabel</li>
            <li>Kleiner als die Ringeltaube</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: Februar–September</li>
            <li>Bis zu 4–5 Bruten pro Jahr möglich</li>
            <li>Nest oft sehr schlicht, häufig auf Gebäuden</li>
            <li>Gelege: 2 Eier</li>
            <li>Füttern Kropfmilch – prüfungsrelevant</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Getreide und Sämereien</li>
            <li>Knospen, junge Pflanzen</li>
            <li>Sehr anpassungsfähig → findet Nahrung in Siedlungen</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Standvogel</li>
            <li>Ganzjährig im Siedlungsbereich</li>
            <li>Sehr hohe Vermehrungsrate</li>
            <li>Paarbleibend, lebenslange Bindung typisch</li>
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
    color: "#1f2b23",
  },
  subtitle: {
    fontSize: "19px",
    marginBottom: "26px",
    color: "#555",
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
