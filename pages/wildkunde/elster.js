import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Elster() {
  const quiz = [
    {
      q: "Welche Merkmalskombination ist typisch für eine erwachsene Elster?",
      a: [
        "Komplett schwarzes Gefieder",
        "Schwarz-weißes Gefieder mit sehr langem Schwanz",
        "Grauer Körper mit schwarzem Kopf"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Die Elster ist ein typischer Kulturfolger",
        "Die Elster lebt ausschließlich im Hochgebirge",
        "Elstern bauen keine Nester"
      ],
      correct: 0,
    },
    {
      q: "Welche Aussage beschreibt den Nestbau vieler Elstern?",
      a: [
        "Sie legen ihre Eier ausschließlich in Erdhöhlen ab",
        "Ihr Reisignest besitzt oft ein Dach über der Nestmulde",
        "Sie bauen niemals eigene Nester"
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
    <WildlifePortraitLayout slug="elster" title={"Elster (Pica pica)"} subtitle={"\r\n          Schwarz-weiß · Sehr langer Stoß · Intelligent · Nestplünderer · Kulturfolger\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/elster.jpg"
            alt="Elster"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Rabenvogel mit langem Schwanz und kontrastreichem schwarz-weißem Gefieder</li>
            <li>Dunkle Federn können blau-grün schillern</li>
            <li>Häufig in halboffenen Landschaften, Dörfern, Parks und Gärten</li>
            <li>Typischer schackernder Ruf</li>
            <li>Kulturfolger mit anpassungsfähigem Verhalten</li>
            <li>Allesfresser: Wirbellose, kleine Wirbeltiere, Aas, Samen und Früchte</li>
            <li>Auch Vogeleier können zum Nahrungsspektrum gehören; dies beweist keine allgemeine Verdrängung anderer Arten</li>
            <li>Geschlechter ähnlich gefärbt</li>
            <li>Jungvögel haben zunächst kürzere Schwanzfedern</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Zur Brutzeit lebt die Elster meist als territoriales Paar</li>
            <li>Nest oft mit Reisigdach über der Nestmulde</li>
            <li>Gelegegröße variabel, häufig fünf bis sieben Eier</li>
            <li>Brut- und Nestlingsphase dauern jeweils ungefähr drei Wochen</li>
            <li>Nach der Brutzeit können größere Schlafgesellschaften entstehen</li>
            <li>Junge sind Nesthocker</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/213481/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
    </WildlifePortraitLayout>
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
