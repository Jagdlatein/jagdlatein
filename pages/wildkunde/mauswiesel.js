import { useState } from "react";
import Image from "next/image";

export default function Mauswiesel() {
  const quiz = [
    {
      q: "Was ist das wichtigste Unterscheidungsmerkmal zum Hermelin?",
      a: [
        "Braunes Sommerfell",
        "Keine schwarze Schwanzspitze",
        "Kleinerer Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Größenangabe passt häufig zur Kopf-Rumpf-Länge des Mauswiesels?",
      a: ["Etwa 15–25 cm, regional unterschiedlich", "60–90 cm", "Über 100 cm"],
      correct: 0,
    },
    {
      q: "Von welcher Beute ernährt sich das Mauswiesel hauptsächlich?",
      a: [
        "Rebhühner",
        "Kaninchen",
        "Mäuse"
      ],
      correct: 2,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((x) => ({ ...x, [qi]: ai }));
    setAnswered((x) => ({ ...x, [qi]: true }));
  }

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Mauswiesel (Mustela nivalis)</h1>
        <p style={styles.subtitle}>Kleinster heimischer Raubwildvertreter · Mäusejäger</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/mauswiesel.jpg"
            alt="Mauswiesel"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Kleinster heimischer Vertreter der Raubtiere</li>
            <li>Kopf-Rumpf-Länge häufig etwa 15 bis 25 cm; Größe variiert regional und zwischen Geschlechtern</li>
            <li>Langgestreckter Körper erlaubt die Jagd in engen Nagergängen</li>
            <li>Kurze Rute ohne schwarze Endquaste, im Unterschied zum Hermelin</li>
            <li>Oberseite meist braun, Unterseite weißlich</li>
            <li>Winterfärbung ist regional verschieden; in nördlichen und manchen Gebirgspopulationen weiß</li>
            <li>Nutzt strukturreiche Feld- und Wiesenlandschaften, Hecken, Steinhaufen und Nagerbaue</li>
            <li>Hauptbeute sind kleine Nagetiere</li>
            <li>Kann zu verschiedenen Tageszeiten aktiv sein; hält keinen Winterschlaf</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Lange Fortpflanzungsperiode vom Frühjahr bis Sommer</li>
            <li>Keine verlängerte Tragzeit durch Keimruhe</li>
            <li>Tragzeit ungefähr fünf Wochen</li>
            <li>Junge sind anfangs Nesthocker</li>
            <li>Bei gutem Nahrungsangebot sind zwei Würfe im Jahr möglich</li>
            <li>Fortpflanzungserfolg und Bestände hängen stark vom Kleinnagerangebot ab</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 3/3 · M 1/2 = 34</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/101647/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://courses.ecampus.oregonstate.edu/wildlife/species.php?id=358" target="_blank" rel="noopener noreferrer">Oregon State University: Mustela nivalis</a></p>
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
