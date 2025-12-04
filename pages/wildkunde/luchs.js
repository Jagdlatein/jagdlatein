import { useState } from "react";
import Image from "next/image";

export default function Luchs() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für den Luchs?",
      a: [
        "Langer dünner Schwanz",
        "Schwarze Ohrpinsel",
        "Gänzlich ungeflecktes Fell"
      ],
      correct: 1,
    },
    {
      q: "Wie ist der Schutzstatus des Luchses?",
      a: [
        "Jagbar mit Schonzeit",
        "Nur in Ausnahmefällen jagdbar",
        "Ganzjährig streng geschützt"
      ],
      correct: 2,
    },
    {
      q: "Wie groß ist die Trittspur eines Luchses?",
      a: [
        "3–4 cm",
        "5–6 cm",
        "7–9 cm"
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

        <h1 style={styles.title}>Luchs (Lynx lynx)</h1>
        <p style={styles.subtitle}>Streng geschützt · heimlicher Waldräuber</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/luchs.jpg"
            alt="Luchs"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 80–110 cm</li>
            <li>Gewicht: 15–30 kg</li>
            <li>Lebensraum: große, geschlossene Waldgebiete</li>
            <li>Einzelgänger, sehr große Streifgebiete (100+ km²)</li>
            <li>Ernährung: Rehwild, Hasen, Füchse, Vögel</li>
            <li>Sehr heimlich, kaum sichtbar</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Typische schwarze Ohrpinsel</strong></li>
            <li><strong>Backenbart („Backenbärte“)</strong></li>
            <li>Gepunktetes Fell → Muster individuell wie Fingerabdruck</li>
            <li>Stummelschwanz mit schwarzer Spitze</li>
            <li>Fährte: sehr groß → 7–9 cm, rund ohne Krallenabdruck</li>
            <li>Losung: ähnelt Katze, aber größer und oft haarreich</li>
          </ul>
        </section>

        {/* JAGDVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Jagdverhalten</h2>
          <ul style={styles.list}>
            <li>Pirscht langsam, schlägt Beute mit einem kurzen Sprint</li>
            <li>Bevorzugte Beute: Rehwild</li>
            <li>Tötet durch Kehlbiss</li>
            <li>Verbleibt häufig an der geschlagenen Beute und frisst mehrere Tage daran</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Februar–März</li>
            <li>Tragzeit: 70 Tage</li>
            <li>Wurfzeit: Mai–Juni</li>
            <li>Wurfgröße: 1–3 Junge</li>
          </ul>
        </section>

        {/* SCHUTZSTATUS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Schutzstatus</h2>
          <ul style={styles.list}>
            <li><strong>Ganzjährig streng geschützt</strong></li>
            <li>Wiederansiedlungsprogramme in DE/AT/CH</li>
            <li>Monitoring über Fotofallen & DNA</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Katzenkrankheiten (FIV, FeLV)</li>
            <li>Parasiten (Bandwürmer, Spulwürmer)</li>
            <li>Räude selten</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 3/2 · M 1/1 = 30</li>
            <li>Kräftige Fangzähne</li>
            <li>Schneidende Reißzähne</li>
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
