import { useState } from "react";
import Image from "next/image";

export default function Nebelkraehe() {
  const quiz = [
    {
      q: "Wie unterscheidet sich die Nebelkrähe optisch von der Rabenkrähe?",
      a: [
        "Komplett schwarzes Gefieder",
        "Grauer Körper mit schwarzen Flügeln, Kopf und Brust",
        "Weißer Kopf und brauner Körper"
      ],
      correct: 1,
    },
    {
      q: "Wie hängen Nebelkrähe und Rabenkrähe zusammen?",
      a: [
        "Sie gehören zu völlig verschiedenen Vogelfamilien",
        "Eng verwandte Krähen, die in Kontaktzonen hybridisieren können",
        "Nebelkrähe lebt ausschließlich im Gebirge"
      ],
      correct: 1,
    },
    {
      q: "Wo kommt die Nebelkrähe hauptsächlich vor?",
      a: [
        "In Westdeutschland und Westeuropa",
        "In Ostdeutschland, Osteuropa und Skandinavien",
        "Nur in Süditalien"
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

        <h1 style={styles.title}>Nebelkrähe (Corvus cornix)</h1>
        <p style={styles.subtitle}>
          Zweifarbige Krähe · Graues Gefieder mit schwarzen Partien · Ost- & Nordeuropa
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/nebelkraehe.jpg"
            alt="Nebelkrähe"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Rabenvogel mit grauem Rumpf und schwarzem Kopf, Brustbereich, Flügeln und Schwanz</li>
            <li>Als Corvus cornix geführt; eng mit der Rabenkrähe verwandt</li>
            <li>In Kontaktzonen entstehen Hybriden; keine beliebige Farbvariante einzelner Rabenkrähen</li>
            <li>Nutzt offene Landschaften und Siedlungsbereiche</li>
            <li>Krächzende Rufe ähneln denen der Rabenkrähe</li>
            <li>Allesfresser: Wirbellose, kleine Wirbeltiere, Aas, Samen, Früchte und weitere Nahrung</li>
            <li>Verpaarte Tiere verteidigen Brutreviere gegen Nichtbrütertrupps</li>
            <li>Kann Personen und Fahrzeuge unterscheiden und auf Erfahrungen reagieren</li>
            <li>Verbreitung vor allem in nördlichen und östlichen Teilen Europas; Kontaktzone unter anderem in Deutschland und Österreich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest meist hoch in Bäumen oder an anderen erhöhten Standorten</li>
            <li>Gelegegröße variabel, häufig drei bis sechs Eier</li>
            <li>Brutdauer ungefähr 18 bis 20 Tage</li>
            <li>Junge sind Nesthocker</li>
            <li>Nestlingszeit ungefähr ein Monat</li>
            <li>Alte Nester können von anderen Vogelarten genutzt werden</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.birdlife.at/voegel/nebelkraehe/" target="_blank" rel="noopener noreferrer">BirdLife Österreich: Artprofil</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6445362/" target="_blank" rel="noopener noreferrer">Knief et al. 2019: Krähen-Hybridzone</a></p>
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
