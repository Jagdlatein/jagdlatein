import { useState } from "react";
import Image from "next/image";

export default function Biber() {
  const quiz = [
    {
      q: "Wie heißt der typische Schwanz des Bibers?",
      a: ["Rundschwanz", "Kelle", "Bürste"],
      correct: 1,
    },
    {
      q: "Was ist ein klassisches Erkennungsmerkmal eines Bibers?",
      a: [
        "Schwarze Ohrpinsel",
        "Flacher, breiter Schwanz",
        "Komplett weißes Winterfell"
      ],
      correct: 1,
    },
    {
      q: "Welchen Schutzstatus hat der Biber?",
      a: [
        "Ganzjährig jagdbar",
        "Mit Auflagen jagdbar",
        "Ganzjährig streng geschützt"
      ],
      correct: 2,
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

        <h1 style={styles.title}>Biber (Castor fiber)</h1>
        <p style={styles.subtitle}>Streng geschützt · Landschaftsgestalter</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/biber.jpg"
            alt="Biber"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 15–30 kg → eines der größten Nagetiere Europas</li>
            <li>Körperlänge: 80–100 cm</li>
            <li>Lebensraum: Flüsse, Seen, Bäche, Auenlandschaften</li>
            <li>Streng geschützt in DE, AT, CH</li>
            <li>Hervorragender Schwimmer</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Flacher, breiter Schwanz (Kelle)</strong> → wichtigstes Merkmal</li>
            <li>Orangerote Schneidezähne</li>
            <li>Großer Kopf, kleine Ohren</li>
            <li>Dichtes braunes Fell</li>
            <li>Beim Schwimmen ragt nur Kopf + Rücken heraus</li>
          </ul>
        </section>

        {/* SPUREN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Spuren & Hinweise</h2>
          <ul style={styles.list}>
            <li><strong>Fraßspuren:</strong> angenagte Bäume, typisch schräg gefällte Stämme</li>
            <li><strong>Biberpfade</strong> vom Wasser ans Land</li>
            <li><strong>Rutschbahnen</strong> → vom Körper glatt gedrückt</li>
            <li>Losung: länglich, dunkel, oft im Wasser</li>
          </ul>
        </section>

        {/* BURG & DAMM */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Biberburg & Biberdamm</h2>
          <ul style={styles.list}>
            <li>Biber bauen Burgen aus Ästen, Schlamm & Pflanzenmaterial</li>
            <li>Eingang meist unter Wasser zur Feindvermeidung</li>
            <li>Dämme stauen Wasser an und formen neue Lebensräume</li>
            <li><strong>Ökologisch extrem wichtig</strong> → schaffen neue Biotope</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Rinde, Zweige, Blätter</li>
            <li>Kräuter und Wasserpflanzen</li>
            <li>Winterfuttervorräte unter Wasser</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Januar–März</li>
            <li>Tragzeit: ca. 105 Tage</li>
            <li>Wurfgröße: 1–3 Junge</li>
            <li>Familienverband bleibt zusammen</li>
          </ul>
        </section>

        {/* SCHÄDEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Konflikte & Schäden</h2>
          <ul style={styles.list}>
            <li>Überflutete Felder & Wiesen</li>
            <li>Gefällte Bäume, beschädigte Uferbereiche</li>
            <li>Dämme blockieren Gewässer und Durchflüsse</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 0/0 · M 3/3 = 20</li>
            <li><strong>Sehr starke Schneidezähne</strong></li>
            <li>Schneidezähne wachsen ständig nach</li>
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
