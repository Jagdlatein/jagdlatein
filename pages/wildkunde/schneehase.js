import { useState } from "react";
import Image from "next/image";

export default function Schneehase() {
  const quiz = [
    {
      q: "Welche Fellfarbe trägt der Schneehase im Winter?",
      a: ["Graubraun","Weiß mit schwarzen Ohrspitzen","Dunkel gesprenkelt"],
      correct: 1,
    },
    {
      q: "Wo kommt der Schneehase im deutschsprachigen Raum typischerweise vor?",
      a: ["In warmen Küstenmarschen","In jeder offenen Feldflur","In den Alpen"],
      correct: 2,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Schneehase ist größer als Feldhase",
        "Im Vergleich zum Feldhasen meist kleiner und mit kürzeren Ohren",
        "Schneehase lebt ausschließlich im Bau"
      ],
      correct: 1,
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

        <h1 style={styles.title}>Schneehase (Lepus timidus)</h1>
        <p style={styles.subtitle}>An kalte Bergregionen angepasst</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/schneehase.jpg"
            alt="Schneehase"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Hasenartiger kalter Regionen; im deutschsprachigen Alpenraum vor allem in Gebirgslagen</li>
            <li>Kleiner und gedrungener als der Feldhase, mit kürzeren Ohren</li>
            <li>Sommerfell überwiegend graubraun</li>
            <li>Alpenschneehasen tragen im Winter ein weißes Fell mit schwarzen Ohrspitzen</li>
            <li>Weiße Schwanzoberseite ist ein weiterer Hinweis gegenüber dem Feldhasen</li>
            <li>Besonders spreizbare, behaarte Hinterpfoten helfen im Schnee</li>
            <li>Nahrung: Gräser, Kräuter, Zwergsträucher, Knospen, Zweige und Rinde</li>
            <li>Alpenschneehasen leben eher einzeln und sind vor allem dämmerungs- und nachtaktiv</li>
            <li>Ruhen in geschützten Mulden; nutzen im Winter auch Schneehöhlen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Fortpflanzung hauptsächlich vom Frühjahr bis in den Sommer; regionale Variation</li>
            <li>Tragzeit ungefähr 50 Tage</li>
            <li>Meist zwei, gelegentlich drei Würfe pro Jahr</li>
            <li>Wurfgröße variabel, häufig zwei bis drei Junge</li>
            <li>Junge werden behaart und sehfähig geboren</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/126311/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://nationalpark.ch/flora-und-fauna/schneehase/" target="_blank" rel="noopener noreferrer">Nationalpark: Schneehase</a> · <a href="https://jagdverband.it/schneehase-2/" target="_blank" rel="noopener noreferrer">Südtiroler Jagdverband: Schneehase</a></p>
          <p>Zeiten und Größen sind typische Richtwerte und können regional oder individuell abweichen. Eine Artbeschreibung ersetzt keine Prüfung der örtlichen Jagd- und Schutzbestimmungen.</p>
          <h2 style={styles.sectionTitle}>Quiz</h2>

          {quiz.map((q, qi) => (
            <div key={qi} style={styles.quizBlock}>
              <p style={styles.quizQuestion}>{q.q}</p>
              {answered[qi] && (
                <p role="status">
                  {selected[qi] === q.correct ? "Richtig." : "Noch nicht richtig."}
                  {" "}Die richtige Antwort lautet: {q.a[q.correct]}
                </p>
              )}

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
                    disabled={Boolean(answered[qi])}
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
