import { useState } from "react";
import Image from "next/image";

export default function Reiherente() {
  const quiz = [
    {
      q: "Woran erkennt man den Erpel der Reiherente?",
      a: [
        "Roter Kopf, schwarze Brust",
        "Schwarzer Kopf mit Federschopf und gelben Augen",
        "Komplett weißer Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Ente gehört zu den Tauchenten?",
      a: ["Stockente", "Reiherente", "Krickente"],
      correct: 1,
    },
    {
      q: "Welche Nahrung bevorzugt die Reiherente?",
      a: [
        "Pflanzen, Samen und Beeren an Land",
        "Fisch als Hauptnahrung",
        "Muscheln, Schnecken, Insektenlarven"
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

        <h1 style={styles.title}>Reiherente (Aythya fuligula)</h1>
        <p style={styles.subtitle}>
          Tauchente · Gelbe Augen · Federschopf · Kontrastreiches Prachtkleid
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/reiherente.jpg"
            alt="Reiherente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Tauchente geeigneter Seen, Weiher und weiterer Binnengewässer</li>
            <li>Erpel im Prachtkleid mit dunklem Kopf und Rücken sowie hellen Flanken</li>
            <li>Federschopf am Hinterkopf, beim Erpel ausgeprägter</li>
            <li>Leuchtend gelbe Augen bei erwachsenen Tieren</li>
            <li>Ente überwiegend dunkelbraun mit helleren Flanken</li>
            <li>Weißer Flügelstreifen bei beiden Geschlechtern</li>
            <li>Nahrung überwiegend Muscheln, Schnecken, Krebse und Insektenlarven; auch Samen</li>
            <li>Sucht Nahrung tauchend</li>
            <li>Außerhalb der Brutzeit häufig gesellig in größeren Trupps</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest am Boden in Ufernähe und dichter Vegetation</li>
            <li>Brutbeginn häufig Mai bis Juni, regional variabel</li>
            <li>Gelegegröße variabel, häufig sechs bis zwölf Eier</li>
            <li>Brutdauer ungefähr vier Wochen</li>
            <li>Küken sind Nestflüchter und können früh tauchen</li>
            <li>Ente führt die Jungen</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/101081/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
