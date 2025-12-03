import { useState } from "react";
import Image from "next/image";

export default function Fuchs() {
  const quiz = [
    {
      q: "Wann ist die Ranzzeit des Fuchses?",
      a: ["Januar–Februar", "Mai–Juni", "September"],
      correct: 0,
    },
    {
      q: "Woran erkennt man die typische Fuchslosung?",
      a: [
        "Länglich, mit Haar- oder Knochenresten",
        "Rund und trocken",
        "Flüssig und dunkelbraun"
      ],
      correct: 0,
    },
    {
      q: "Wie viele Zähne hat der Fuchs?",
      a: ["30", "38", "42"],
      correct: 2,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((x) => ({ ...x, [qi]: ai }));
    setAnswered((x) => ({ ...x, [qi]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Fuchs (Vulpes vulpes)</h1>
        <p style={styles.subtitle}>Rüde · Fähe · Welpen</p>

        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/fuchs.jpg"
            alt="Fuchs"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 5–9 kg</li>
            <li>Körperlänge: 60–90 cm · Schwanzlänge: 30–40 cm</li>
            <li>Lebensraum: Wälder, Feldfluren, Siedlungsbereiche</li>
            <li>Allesfresser: Mäuse, Kaninchen, Regenwürmer, Früchte</li>
            <li>Territorial · meist nachts aktiv</li>
            <li>Sehr anpassungsfähig – auch in Städten verbreitet</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Ranzzeit: Januar–Februar</li>
            <li>Würfe: März–April</li>
            <li>Wurfgröße: 3–6 Welpen</li>
            <li>Bau: erweitert alte Dachsbaue oder nutzt Röhren</li>
          </ul>
        </section>

        {/* MERKMALE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Roter bis rotbrauner Rücken</li>
            <li>Helle Bauchseite</li>
            <li>Typischer „Pinsel“ (weiße Schwanzspitze)</li>
            <li>Schwarze „Stiefel“ an den Läufen</li>
            <li>Fährte: 4–5 cm · länglich, eng gestellt</li>
            <li>Losung: dunkel, wulstig, oft mit Haar- & Knochenresten</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Wichtige Krankheiten</h2>
          <ul style={styles.list}>
            <li>Fuchsbandwurm (Echinococcus multilocularis)</li>
            <li>Staupe</li>
            <li>Räude (Sarcoptes scabiei)</li>
            <li>Tollwut (in DE ausgerottet, in Osteuropa noch vorhanden)</li>
          </ul>
        </section>

        {/* ZÄHNE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 2/3 = 42</li>
            <li>Reißzahngebiss – perfekt für Fleisch</li>
            <li>Typisch für Caniden</li>
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
