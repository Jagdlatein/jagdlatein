import { useState } from "react";
import Image from "next/image";

export default function Eichhoernchen() {
  const quiz = [
    {
      q: "Wie nennt man das Nest des Eichhörnchens?",
      a: ["Horst", "Kobel", "Burg"],
      correct: 1,
    },
    {
      q: "Welche typischen Merkmale hat das Eichhörnchen?",
      a: [
        "Buschiger Schwanz und Pinselohren",
        "Schwimmhäute an den Hinterfüßen",
        "Flacher Biberschwanz"
      ],
      correct: 0,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Alle Eichhörnchen sind rot gefärbt",
        "Eichhörnchen haben viele Farbvarianten",
        "Eichhörnchen leben ausschließlich am Boden"
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

        <h1 style={styles.title}>Eichhörnchen (Sciurus vulgaris)</h1>
        <p style={styles.subtitle}>Kletterkünstler · Nahrungssammler · Kulturfolger</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/eichhoernchen.jpg"
            alt="Eichhörnchen"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 20–25 cm</li>
            <li>Gewicht: 250–400 g</li>
            <li>Lebensraum: Wälder, Parks, Gärten</li>
            <li>Sehr guter Kletterer → Lebensraum in den Baumkronen</li>
            <li>Einzelgänger, außer zur Paarungszeit</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Buschiger Schwanz</strong> als Balancier- und Wärmewerkzeug</li>
            <li><strong>Pinselohren</strong> – im Winter besonders ausgeprägt</li>
            <li>Fellfarben variieren: rot, braun, dunkel bis schwarz</li>
            <li>Lange Krallen → perfekt fürs Klettern</li>
            <li>Bewegung: schnelle Sprünge, klettert kopfüber am Stamm</li>
          </ul>
        </section>

        {/* KOBEL & LEBENSRAUM */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Kobel & Lebensweise</h2>
          <ul style={styles.list}>
            <li>Nester heißen <strong>Kobel</strong>, meist kugelförmig</li>
            <li>Oft mehrere Kobel gleichzeitig</li>
            <li>Schlaf- und Wurfkobel getrennt</li>
            <li>Vorratssammler: Nüsse, Zapfen, Pilze → Wintervorräte</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Januar–Februar & Juni–Juli</li>
            <li>Wurfgröße: 3–6 Junge</li>
            <li>Jungtiere: Nesthocker</li>
            <li>Wurfkobel gut gepolstert mit Pflanzenmaterial</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Nüsse (Hasel, Walnuss)</li>
            <li>Fichtenzapfen, Tannenzapfen</li>
            <li>Pilze, Knospen, junge Triebe</li>
            <li>Gelegentlich Vogeleier</li>
          </ul>
        </section>

        {/* VERWECHSLUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verwechslungsgefahr</h2>
          <ul style={styles.list}>
            <li><strong>Grauhörnchen (Sciurus carolinensis)</strong> – Neozoon</li>
            <li>Deutlich größer</li>
            <li>Verdrängt das heimische Eichhörnchen (Konkurrenz)</li>
            <li>In Europa lokal problematisch</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Squirrelpox-Virus (besonders im UK)</li>
            <li>Parasiten: Flöhe, Zecken, Würmer</li>
            <li>Räude möglich</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 0/0 · M 3/3 = 20</li>
            <li>Nagezähne wachsen ständig</li>
            <li>Typisches Nagetiergebiss</li>
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
