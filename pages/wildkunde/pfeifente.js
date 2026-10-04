import { useState } from "react";
import Image from "next/image";

export default function Pfeifente() {
  const quiz = [
    {
      q: "Was ist typisch für den Ruf des Pfeifenten-Erpels?",
      a: ["Tiefes Knurren", "Hohes pfeifendes 'fiie'", "Lautes Kollern wie beim Birkhahn"],
      correct: 1,
    },
    {
      q: "Woran erkennt man den Erpel im Prachtkleid?",
      a: [
        "Grün schillernder Kopf",
        "Kastanienbrauner Kopf mit heller Stirn",
        "Ganz weißes Gefieder",
      ],
      correct: 1,
    },
    {
      q: "Welche Nahrung bevorzugt die Pfeifente?",
      a: ["Ausschließlich Fisch", "Wasserpflanzen, Gräser, Kräuter", "Kleine Säuger"],
      correct: 1,
    },
  ];

  const [answers, setAnswers] = useState({});

  const choose = (qi, ai) => {
    setAnswers((prev) => ({ ...prev, [qi]: ai }));
  };

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Pfeifente (Mareca penelope)</h1>
        <p style={styles.subtitle}>Markanter Ruf · Zugvogel · Pflanzennahrung</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/pfeifente.jpg"
            alt="Pfeifente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Mittelgroße Gründelente</li>
            <li>Erpel im Prachtkleid mit kastanienbraunem Kopf und heller Stirn</li>
            <li>Rosa-bräunliche Brust und überwiegend graue Körperpartien beim Erpel</li>
            <li>Ente überwiegend braun und unauffälliger</li>
            <li>Männchen mit charakteristischem pfeifendem Ruf</li>
            <li>Brutgebiete vor allem im Norden Eurasiens</li>
            <li>In Mitteleuropa vor allem Durchzügler und Wintergast</li>
            <li>Nutzt flache Gewässer, Lagunen, Küstenfeuchtgebiete und überschwemmte Wiesen</li>
            <li>Nahrung überwiegend Wasserpflanzen, Gräser, Kräuter und Samen</li>
            <li>Sucht Nahrung sowohl im Wasser als auch weidend an Land</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Brütet in einem geschützten Bodennest</li>
            <li>Jahreszeit und Gelegegröße variieren regional</li>
            <li>Junge sind Nestflüchter; Ente übernimmt die Führung</li>
            <li>Außerhalb der Brutzeit häufig gesellig</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Weibchen rufen eher tief und knurrend als pfeifend</li>
            <li>Beide Geschlechter haben einen blau-grauen Schnabel mit dunkler Spitze</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://ffh-arten.naturschutzinformationen.nrw.de/ffh-arten/de/arten/vogelarten/kurzbeschreibung/102962" target="_blank" rel="noopener noreferrer">Fachquelle zur Art</a> · <a href="https://animaldiversity.org/accounts/Anas_penelope/" target="_blank" rel="noopener noreferrer">University of Michigan: Pfeifente (Biologie)</a></p>
          <p>Zeiten und Größen sind typische Richtwerte und können regional oder individuell abweichen. Eine Artbeschreibung ersetzt keine Prüfung der örtlichen Jagd- und Schutzbestimmungen.</p>
          <h2 style={styles.sectionTitle}>Quiz</h2>

          {quiz.map((q, qi) => (
            <div key={qi} style={styles.quizBlock}>
              <p style={styles.quizQuestion}>{q.q}</p>
              {answers[qi] !== undefined && (
                <p role="status">
                  {answers[qi] === q.correct ? "Richtig." : "Noch nicht richtig."}
                  {" "}Die richtige Antwort lautet: {q.a[q.correct]}
                </p>
              )}

              {q.a.map((ans, ai) => {
                const selected = answers[qi];
                const isCorrect = ai === q.correct;

                let bg = "#fff";
                if (selected !== undefined) {
                  if (ai === selected && isCorrect) bg = "#c6f6c6";
                  else if (ai === selected && !isCorrect) bg = "#f7c6c6";
                  else if (isCorrect) bg = "#e9ffe9";
                }

                return (
                  <button
                    key={ai}
                    disabled={answers[qi] !== undefined}
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
    marginBottom: "40px",
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
