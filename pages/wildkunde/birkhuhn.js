import { useState } from "react";
import Image from "next/image";

export default function Birkhuhn() {
  const quiz = [
    {
      q: "Wie nennt man das Männchen des Birkhuhns?",
      a: ["Spielhahn", "Gockel", "Racker"],
      correct: 0,
    },
    {
      q: "Was ist typisch für die Balz des Birkhuhns?",
      a: [
        "Balz auf Bäumen",
        "Balz auf offenen Balzplätzen",
        "Balz im Wasser"
      ],
      correct: 1,
    },
    {
      q: "Welche Merkmale hat der Birkhahn?",
      a: [
        "Rote Rosen und sichelförmiger Stoß",
        "Weißer Bürzel und langer Hals",
        "Gelbe Wangen und blauer Kopf"
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

        <h1 style={styles.title}>Birkhuhn (Lyrurus tetrix, Synonym Tetrao tetrix)</h1>
        <p style={styles.subtitle}>Balzplätze · Spielhähne · Strukturreicher Lebensraum</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/birkhuhn.jpg"
            alt="Birkhuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* -------------------------------- */}
        {/* ALLGEMEINES */}
        {/* -------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Raufußhuhn halboffener Übergangsbereiche von Wald und Offenland</li>
            <li>Nutzt unter anderem Moorränder, lichte Bergwälder und alpine Matten</li>
            <li>Kleiner als das Auerhuhn</li>
            <li>Spielhahn mit dunklem, bläulich glänzendem Gefieder und sichelförmigen äußeren Schwanzfedern</li>
            <li>Weiße Unterschwanzdecken sind bei der Balz auffällig</li>
            <li>Henne braun gemustert; Brust im Gegensatz zur Auerhenne gebändert</li>
            <li>Nahrung: Triebe, Knospen, Blätter und Früchte</li>
            <li>Im Winter unter anderem Knospen und Kätzchen von Birken und anderen Gehölzen</li>
            <li>Junge benötigen zunächst viele Insekten</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Gemeinschaftsbalz auf offenen Balzarenen</li>
            <li>Höhepunkt häufig Ende April bis Anfang Mai; regionale Unterschiede</li>
            <li>Hähne kullern und zischen</li>
            <li>Brut und Aufzucht übernimmt die Henne</li>
            <li>Gelegegröße variabel, häufig sieben bis zehn Eier</li>
            <li>Brutdauer ungefähr 25 bis 27 Tage</li>
            <li>Küken sind Nestflüchter</li>
            <li>Schneehöhlen dienen im Winter als geschützte Ruheplätze</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Rote Rosen liegen über den Augen des Spielhahns</li>
            <li>Ruheplätze und Balzarenen sind besonders störungsempfindlich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/102436/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
