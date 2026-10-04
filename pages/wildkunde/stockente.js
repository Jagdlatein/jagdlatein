import { useState } from "react";
import Image from "next/image";

export default function Stockente() {
  const quiz = [
    {
      q: "Wie heißt das männliche Tier der Stockente?",
      a: ["Erpel", "Ganter", "Hahn"],
      correct: 0,
    },
    {
      q: "Welche Aussage zur Stockente ist richtig?",
      a: [
        "Sie ist eine häufige und anpassungsfähige Gründelente",
        "Sie lebt ausschließlich im Gebirge",
        "Sie ist ein reiner Bodenbrüter im Wald"
      ],
      correct: 0,
    },
    {
      q: "Woran erkennt man den Erpel im Prachtkleid?",
      a: [
        "Brauner Kopf, gelber Schnabel",
        "Grün schimmernder Kopf, gelber Schnabel",
        "Schwarzer Kopf mit weißem Ring"
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

        <h1 style={styles.title}>Stockente (Anas platyrhynchos)</h1>
        <p style={styles.subtitle}>Häufigste Entenart · Prachtkleid · Zug- & Standvogel</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/stockente.jpg"
            alt="Stockente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Häufige, anpassungsfähige Gründelente</li>
            <li>Nutzt Gewässer verschiedener Größe, auch in Siedlungen</li>
            <li>Erpel im Prachtkleid mit grün schimmerndem Kopf, weißem Halsring und gelbem Schnabel</li>
            <li>Ente überwiegend braun gemustert</li>
            <li>Blauer, weiß eingefasster Flügelspiegel bei beiden Geschlechtern</li>
            <li>Erpel im Schlichtkleid unauffälliger und leichter mit Enten zu verwechseln</li>
            <li>Frisst pflanzliche Nahrung sowie kleine wirbellose Tiere</li>
            <li>Nahrungssuche an der Oberfläche und durch Gründeln</li>
            <li>Zugverhalten variiert zwischen Populationen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarbildung kann bereits im Herbst und Winter beginnen</li>
            <li>Nest meist gut versteckt am Boden; andere Standorte sind möglich</li>
            <li>Gelegegröße variabel, häufig sieben bis dreizehn Eier</li>
            <li>Küken sind Nestflüchter und nehmen früh selbst Nahrung auf</li>
            <li>Ente führt die Küken</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
            <li>Deckungsreiche, störungsarme Gewässer sind dann besonders wichtig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Auch beide Geschlechter in der Mauser oder Jungvögel müssen sorgfältig unterschieden werden</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/101065/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
