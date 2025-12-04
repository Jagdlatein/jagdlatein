import { useState } from "react";
import Image from "next/image";

export default function Hermelin() {
  const quiz = [
    {
      q: "Welches Merkmal unterscheidet das Hermelin eindeutig vom Mauswiesel?",
      a: [
        "Längeres Fell",
        "Schwarze Schwanzspitze",
        "Sommerfell rötlicher"
      ],
      correct: 1,
    },
    {
      q: "Wie verändert sich das Hermelin im Winter?",
      a: [
        "Es bekommt ein graues Fell",
        "Es bleibt unverändert",
        "Es wechselt ins weiße Schneefell"
      ],
      correct: 2,
    },
    {
      q: "Welche Zahnformel besitzt das Hermelin?",
      a: [
        "I 3/3 · C 1/1 · P 4/4 · M 2/2 = 40",
        "I 3/3 · C 1/1 · P 3/3 · M 1/2 = 34",
        "I 3/3 · C 1/1 · P 4/4 · M 1/2 = 38"
      ],
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

        <h1 style={styles.title}>Hermelin (Mustela erminea)</h1>
        <p style={styles.subtitle}>Schneefellträger · Extrem beweglicher Kleindrauber</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/hermelin.jpg"
            alt="Hermelin"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 17–30 cm</li>
            <li>Gewicht: 100–450 g</li>
            <li>Lebensraum: Wiesen, Hecken, Feldgehölze, Hochlagen</li>
            <li>Hervorragender Jäger auf Mäuse</li>
            <li>Kann Beutetiere größer als sich selbst überwältigen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Charakteristisch: <strong>Schwarze Schwanzspitze</strong> → wichtigstes Merkmal!</li>
            <li>Sommerfell: braun oben, weiß unten</li>
            <li>Winterfell (Schneefell): komplett weiß, Schwanzspitze bleibt schwarz</li>
            <li>Langer, schlanker Körper</li>
            <li>Sehr schnelle Bewegungen</li>
            <li>Losung: dünn, gedreht, 4–6 cm</li>
            <li>Fährte: 1–2 cm, sehr kleine Trittsiegel</li>
          </ul>
        </section>

        {/* UNTERSCHIED ZUM MAUSWIESEL */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zum Mauswiesel</h2>
          <ul style={styles.list}>
            <li><strong>Hermelin:</strong> schwarze Schwanzspitze</li>
            <li><strong>Mauswiesel:</strong> Schwanz ohne Schwarz</li>
            <li>Hermelin größer und kräftiger</li>
            <li>Mauswiesel kleinste heimische Raubwildart</li>
            <li>Hermelin zeigt Schneefell → Mauswiesel selten vollständig weiß</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Mai–August</li>
            <li>Ausgeprägte Keimruhe</li>
            <li>Wurfzeit: April</li>
            <li>Wurfgröße: 4–9 Junge</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe</li>
            <li>Räude</li>
            <li>Bandwürmer</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 1/2 = 38</li>
            <li>Raubtiergebiss</li>
            <li>Schmale Reißzähne</li>
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
