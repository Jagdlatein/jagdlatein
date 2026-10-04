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
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Alpenschneehuhn: Raufußhuhn kalter Hochgebirgs- und nördlicher Lebensräume</li>
            <li>Im Alpenraum vorwiegend oberhalb der Baumgrenze</li>
            <li>Vorkommen auch in den Hochlagen der bayerischen Alpen</li>
            <li>Dicht befiederte Beine und Zehen helfen bei Kälte und Schnee</li>
            <li>Wintergefieder überwiegend weiß, Schwanzfedern bleiben dunkel</li>
            <li>Sommergefieder überwiegend braun-grau gescheckt</li>
            <li>Hahn mit schwarzem Zügelstreifen und roten Rosen</li>
            <li>Nahrung im Winter: Triebe, Knospen und weitere Pflanzenteile</li>
            <li>Im Sommer Kräuter; Küken zunächst besonders Insekten und Spinnen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Jahreszeitlicher Gefiederwechsel verbessert Tarnung und Isolation</li>
            <li>Brutbeginn im Gebirge abhängig von Schneelage, meist im späten Frühjahr oder Frühsommer</li>
            <li>Bodennest in geschützter Vegetation</li>
            <li>Gelegegröße variabel, häufig sechs bis neun Eier</li>
            <li>Brutdauer ungefähr drei Wochen</li>
            <li>Küken sind Nestflüchter</li>
            <li>Nutzt im Winter auch Schneehöhlen</li>
            <li>Klimawandel und Freizeitstörungen können den Lebensraum beeinträchtigen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Henne ohne den auffälligen schwarzen Zügel des Hahns</li>
            <li>Alpine Vorkommen liegen häufig ungefähr zwischen 1.800 und 3.000 Metern</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/120348/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.lfu.bayern.de/natur/sap/arteninformationen/steckbrief/zeige?stbname=Lagopus+muta+helvetica" target="_blank" rel="noopener noreferrer">LfU Bayern: Alpenschneehuhn</a></p>
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
