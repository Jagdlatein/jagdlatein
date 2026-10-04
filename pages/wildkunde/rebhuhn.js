import { useState } from "react";
import Image from "next/image";

export default function Rebhuhn() {
  const quiz = [
    {
      q: "Wie nennt man den Familienverband beim Rebhuhn?",
      a: ["Rudel", "Kette", "Sprung"],
      correct: 1,
    },
    {
      q: "Wo lebt das Rebhuhn typischerweise?",
      a: ["Dichter Wald", "Offene Feldflur mit Hecken", "Hochgebirge"],
      correct: 1,
    },
    {
      q: "Welche Aussage ist korrekt?",
      a: [
        "Rebhühner sind Bodenbrüter",
        "Rebhühner bauen Nester in Bäumen",
        "Rebhühner leben als Einzelgänger"
      ],
      correct: 0,
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
        
        <h1 style={styles.title}>Rebhuhn (Perdix perdix)</h1>
        <p style={styles.subtitle}>Agrarlandschaft · Kettenbildung · Stark gefährdet</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/rebhuhn.jpg"
            alt="Rebhuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Feldhuhn strukturreicher offener Agrarlandschaften</li>
            <li>Gedrungener Körper, kurzer Schwanz und braungraues Tarngefieder</li>
            <li>Nutzt Äcker, Wiesen, Hecken, Brachen und Altgrasstreifen</li>
            <li>Bei Gefahr zunächst oft geduckt, später rasche Flucht</li>
            <li>Benötigt Deckung, Nahrung und trockene Bereiche für Staubbäder</li>
            <li>Erwachsene fressen überwiegend pflanzliche Kost</li>
            <li>Küken sind zunächst stark auf Insekten angewiesen</li>
            <li>Familien und Wintergruppen werden Ketten genannt</li>
            <li>Nässe und Kälte können die Kükenaufzucht beeinträchtigen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarbildung häufig im späten Winter und Frühjahr</li>
            <li>Nest am Boden in deckungsreicher Vegetation</li>
            <li>Gelegegröße variabel, häufig etwa zwölf bis fünfzehn Eier</li>
            <li>Henne brütet, Hahn beteiligt sich an Bewachung und Jungenführung</li>
            <li>Junge sind Nestflüchter</li>
            <li>Familienverband bleibt über längere Zeit zusammen</li>
            <li>Lebensraumverbesserung umfasst unter anderem Brachen, Altgras- und Blühflächen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Körperlänge häufig ungefähr 30 cm</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/102425/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
