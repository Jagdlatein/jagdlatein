import { useState } from "react";
import Image from "next/image";

export default function Schneehuhn() {
  const quiz = [
    {
      q: "Wie nennt man das Schneehuhn im Winterkleid?",
      a: ["Weißhuhn", "Schneehuhn", "Alpenwildhuhn"],
      correct: 1,
    },
    {
      q: "Was ist typisch für das Schneehuhn?",
      a: [
        "Ganzjährig braunes Gefieder",
        "Weißes Winterkleid als Tarnung",
        "Roter Rosenkamm und Fächerstoß"
      ],
      correct: 1,
    },
    {
      q: "Wo lebt das Schneehuhn?",
      a: [
        "Alpine Hochlagen und Tundren",
        "Tiefe Mischwälder",
        "Sumpfgebiete"
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

        <h1 style={styles.title}>Schneehuhn (Lagopus muta)</h1>
        <p style={styles.subtitle}>Alpenregion · Weiße Tarnung · Extrem kälteresistent</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/schneehuhn.jpg"
            alt="Schneehuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Lebensraum: Alpen, arktische Regionen, Tundra</li>
            <li>Extrem gut an Kälte angepasst</li>
            <li>Wechselt mehrfach im Jahr das Gefieder</li>
            <li>Schneehuhn kommt in CH & AT vor, in DE verschollen</li>
            <li>Jagdstatus regional streng reglementiert</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Winter:</strong> völlig weißes Gefieder → perfekte Tarnung</li>
            <li><strong>Sommer:</strong> braun-grau gemustert</li>
            <li>Männchen mit rotem Rosenkamm</li>
            <li>Beinbefiederung („Schneeschuhe“) zur Wärmeisolierung</li>
            <li>Kompakter Körperbau</li>
          </ul>
        </section>

        {/* MAUSER */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Mauser & Färbung</h2>
          <ul style={styles.list}>
            <li>3 Jahreskleider: Winter, Sommer, Übergang</li>
            <li>Weißkleid = Schutz vor Raubfeinden</li>
            <li>Sommerkleid schützt vor Sichtung zwischen Felsen</li>
            <li>Männchen im Frühjahr teils noch weiß → Balzzeit</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: Mai–Juni</li>
            <li>Gelege: 5–10 Eier</li>
            <li>Bodenbrüter in Felsspalten und Geröll</li>
            <li>Küken: Nestflüchter</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Winter: Knospen, Triebe, Beeren</li>
            <li>Sommer: Kräuter, Blätter, Insekten</li>
            <li>Küken brauchen tierisches Eiweiß</li>
          </ul>
        </section>

        {/* GEFÄHRDUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gefährdung & Schutz</h2>
          <ul style={styles.list}>
            <li>Klimawandel → schrumpfender Lebensraum</li>
            <li>Störung durch Wintersport</li>
            <li>Rückgang der Schneedecke</li>
            <li>Prädation durch Fuchs, Marder, Greifvögel</li>
          </ul>
        </section>

        {/* QUIZ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quiz</h2>

          {quiz.map((q, qi) => (
            <div key={qi} style={styles.quizBlock}>
              <p style={styles.quizQuestion}>{q.q}</p>

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
