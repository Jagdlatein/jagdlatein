import { useState } from "react";
import Image from "next/image";

export default function Tafelente() {
  const quiz = [
    {
      q: "Welche Ente ist eine typische Tauchente?",
      a: ["Stockente", "Krickente", "Tafelente"],
      correct: 2,
    },
    {
      q: "Woran erkennt man den Erpel der Tafelente?",
      a: [
        "Grüner Kopf, gelber Schnabel",
        "Kastanienroter Kopf, schwarze Brust",
        "Ganz weißer Körper"
      ],
      correct: 1,
    },
    {
      q: "Welche Nahrung bevorzugt die Tafelente?",
      a: [
        "Ausschließlich Fisch",
        "Wasserpflanzen, Sämereien, Kleintiere",
        "Gras wie Gänse"
      ],
      correct: 1,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected(s => ({ ...s, [qi]: ai }));
    setAnswered(s => ({ ...s, [qi]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Tafelente (Aythya ferina)</h1>
        <p style={styles.subtitle}>
          Tauchente · Rötlicher Kopf · Schwarze Brust
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/tafelente.jpg"
            alt="Tafelente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Mittelgroße Tauchente</li>
            <li>Erpel im Prachtkleid mit rotbraunem Kopf, schwarzer Brust und grauem Körper</li>
            <li>Ente überwiegend braun gefärbt</li>
            <li>Schnabel dunkel mit grauem Querband</li>
            <li>Nutzt nährstoffreiche Gewässer mit offener Wasserfläche und geeigneter Ufervegetation</li>
            <li>Tauchende Nahrungssuche mit tierischen und pflanzlichen Bestandteilen</li>
            <li>In Mitteleuropa Brutvogel sowie Zug- und Wintergast</li>
            <li>Nicht alle Populationen zeigen dasselbe Zugverhalten</li>
            <li>Außerhalb der Brutzeit oft größere Gruppen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest in geschützter Ufervegetation oder auf geeigneten Inseln und Pflanzenunterlagen</li>
            <li>Gelegegröße variabel, häufig sieben bis elf Eier</li>
            <li>Ente übernimmt Brut und Führung</li>
            <li>Küken sind Nestflüchter und können früh tauchen</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
            <li>Störungsarme Mauser- und Rastgewässer sind wichtig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/236312/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
