import { useState } from "react";
import Image from "next/image";

export default function Fasan() {
  const quiz = [
    {
      q: "Wie nennt man den männlichen Fasan?",
      a: ["Henne", "Hahn", "Gockel"],
      correct: 1,
    },
    {
      q: "Wo hält sich der Fasan bevorzugt auf?",
      a: [
        "Dichte Wälder",
        "Offenes Feld mit Hecken und Deckung",
        "Hochgebirge"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Fasanen sind Bodenbrüter",
        "Fasanen brüten auf Bäumen",
        "Fasanen brüten in Erdhöhlen"
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
        
        <h1 style={styles.title}>Fasan (Phasianus colchicus)</h1>
        <p style={styles.subtitle}>Bodenbrüter · Kulturfolger · Niederwild</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/fasan.jpg"
            alt="Fasan"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Hühnervogel mit ursprünglichem Verbreitungsgebiet in Asien</li>
            <li>In Europa seit langer Zeit durch Menschen angesiedelt</li>
            <li>Hahn farbenreicher und größer als die braun getarnte Henne</li>
            <li>Beide Geschlechter mit langem Schwanz, beim Hahn besonders ausgeprägt</li>
            <li>Nutzt vielfältige Feldfluren mit Hecken, Gehölzen, Schilf und Brachen</li>
            <li>Ruht auch in Bäumen und Gebüschen</li>
            <li>Nahrung: Samen, Körner und weitere Pflanzen sowie Wirbellose</li>
            <li>Küken brauchen besonders in den ersten Lebenswochen viele Insekten</li>
            <li>Strukturreiche Deckung ist auch im Winter wichtig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Balz im Frühjahr; Hahn kann mehrere Hennen begleiten</li>
            <li>Henne legt das Nest am Boden an</li>
            <li>Gelegegröße variabel, häufig zwölf bis sechzehn Eier</li>
            <li>Brutdauer ungefähr 23 bis 24 Tage</li>
            <li>Küken sind Nestflüchter</li>
            <li>Henne übernimmt Brut, Führung und Wärmen der Jungen</li>
            <li>Küken sind empfindlich gegen Nässe und Kälte</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Hahn ruft zur Balz und zeigt auffällige Flügelbewegungen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/102449/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
