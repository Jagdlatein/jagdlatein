import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Nilgans() {
  const quiz = [
    {
      q: "Woran erkennt man die Nilgans besonders typisch?",
      a: [
        "Schwarzer Kopf und weißes Kinnband",
        "Auffälliger brauner Augenfleck",
        "Knallgelbe Beine und roter Schnabel"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Die Nilgans ist ein einheimischer Brutvogel Europas",
        "Die Nilgans ist ein Neozoon aus Afrika",
        "Die Nilgans lebt ausschließlich in Gebirgsregionen"
      ],
      correct: 1,
    },
    {
      q: "Welches Verhalten können Nilgänse im Brutbereich zeigen?",
      a: [
        "Sie verteidigen niemals ihren Brutbereich",
        "Sie können Nest und Junge energisch gegen andere Tiere verteidigen",
        "Lebt ausschließlich in großen Kolonien ohne Territorialverhalten"
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
    <WildlifePortraitLayout slug="nilgans" title={"Nilgans (Alopochen aegyptiaca)"} subtitle={"\r\n          Neozoon aus Afrika · Markanter Augenfleck · Sehr territorial & aggressiv\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="nilgans" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Entenvogel mit ursprünglichem Verbreitungsgebiet in Afrika</li>
            <li>In Europa durch Aussetzungen und entkommene Ziervögel etabliert</li>
            <li>Charakteristischer brauner Augenfleck</li>
            <li>Graubraunes Gefieder und auffälliges weißes Flügelfeld</li>
            <li>Rötlicher Schnabel und rosa bis rötliche Beine</li>
            <li>Nutzt verschiedene Still- und Fließgewässer sowie Park- und Agrarflächen</li>
            <li>Nahrung vorwiegend pflanzlich; weidet häufig an Land</li>
            <li>Kann Nahrung und Brutbereich energisch verteidigen</li>
            <li>Einzelne aggressive Beobachtungen beweisen keine allgemeine Verdrängung heimischer Arten</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Neststandorte sehr vielfältig: Boden, Bäume und teils Gebäude</li>
            <li>Bruten vor allem im Frühjahr; Beginn kann mit Klima und Standort variieren</li>
            <li>Gelegegröße variabel, häufig fünf bis zehn Eier</li>
            <li>Junge sind Nestflüchter</li>
            <li>Paarbindung häufig längerfristig</li>
            <li>Ökologische Auswirkungen müssen orts- und artspezifisch beurteilt werden</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/087931/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
    </WildlifePortraitLayout>
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
