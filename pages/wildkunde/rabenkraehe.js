import { useState } from "react";
import Image from "next/image";

export default function Rabenkraehe() {
  const quiz = [
    {
      q: "Woran erkennt man die Rabenkrähe?",
      a: [
        "Grau-schwarzes Gefieder",
        "Komplett schwarzes Gefieder",
        "Weißer Bauch und schwarzer Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Rabenkrähen sind reine Waldvögel",
        "Rabenkrähen sind sehr anpassungsfähige Kulturfolger",
        "Rabenkrähen leben nur in Felsgebieten"
      ],
      correct: 1,
    },
    {
      q: "Was frisst die Rabenkrähe hauptsächlich?",
      a: [
        "Ausschließlich Samen",
        "Aas, Insekten, Kleintiere, Getreide – Allesfresser",
        "Nur Fische"
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

        <h1 style={styles.title}>Rabenkrähe (Corvus corone)</h1>
        <p style={styles.subtitle}>
          Ganz schwarz · Sehr intelligent · Kulturfolger · Aas- & Allesfresser
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/rabenkraehe.jpg"
            alt="Rabenkrähe"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Rabenvogel mit durchgehend schwarzem Gefieder</li>
            <li>Schnabel und Beine ebenfalls dunkel</li>
            <li>Im Unterschied zur erwachsenen Saatkrähe ist die Schnabelwurzel befiedert</li>
            <li>Nutzt halboffene Landschaften und Siedlungen</li>
            <li>Raue krächzende Stimme; gehört systematisch zu den Singvögeln</li>
            <li>Allesfresser mit pflanzlicher und tierischer Nahrung sowie Aas</li>
            <li>Geschlechter ähnlich gefärbt</li>
            <li>Verpaarte Tiere verhalten sich territorial; Nichtbrüter bilden häufig Trupps</li>
            <li>Raben- und Nebelkrähen sind eng verwandt und können in Kontaktzonen hybridisieren</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Balz und Brut im Frühjahr</li>
            <li>Nest meist auf Bäumen, auch andere erhöhte Standorte möglich</li>
            <li>Gelegegröße variabel, häufig vier bis sechs Eier</li>
            <li>Brutdauer ungefähr 18 bis 20 Tage</li>
            <li>Junge sind Nesthocker</li>
            <li>Beide Eltern versorgen die Jungen auch nach dem Ausfliegen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/131712/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/24948738/" target="_blank" rel="noopener noreferrer">Poelstra et al. 2014: Krähen-Hybridzone</a></p>
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
