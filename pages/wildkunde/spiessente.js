import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Spiessente() {
  const quiz = [
    {
      q: "Welches Schwanzmerkmal ist typisch für den Spießenten-Erpel im Prachtkleid?",
      a: [
        "Runder, kurzer Schwanz",
        "Sehr langer, spitzer Schwanz",
        "Roter Kopf mit weißem Brustband"
      ],
      correct: 1,
    },
    {
      q: "Wie wirkt die Spießente im Körperbau?",
      a: [
        "Sehr plump und kurz",
        "Queroval und kompakt",
        "Schlank, langhalsig und elegant"
      ],
      correct: 2,
    },
    {
      q: "Welcher Lebensraum wird bevorzugt?",
      a: [
        "Tiefe Wälder",
        "Offene Flachwasserzonen und Küsten",
        "Felsige Berghänge"
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
    <WildlifePortraitLayout slug="spiessente" title={"Spießente (Anas acuta)"} subtitle={"\r\n          Eleganteste Entenart · Langer Schwanzspieß · Zugvogel\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/spiessente.jpg"
            alt="Spießente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Schlanke Gründelente mit langem Hals</li>
            <li>Erpel im Prachtkleid mit langen spießartigen Schwanzfedern</li>
            <li>Brauner Kopf und weißer Hals- und Brustbereich beim Erpel</li>
            <li>Ente überwiegend hellbraun und unauffälliger</li>
            <li>Nutzt flache Binnengewässer, Feuchtgebiete und Überschwemmungsflächen</li>
            <li>In Mitteleuropa vor allem Durchzügler und Wintergast; seltene Bruten möglich</li>
            <li>Nahrungsspektrum pflanzlich und tierisch, abhängig von Jahreszeit und Angebot</li>
            <li>Nahrungssuche überwiegend durch Gründeln</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest am Boden in geschützter Vegetation, nicht zwingend direkt am Wasser</li>
            <li>Eiablage häufig April bis Juni, regional variabel</li>
            <li>Gelegegröße variabel, häufig sieben bis elf Eier</li>
            <li>Brutdauer ungefähr 22 bis 24 Tage</li>
            <li>Küken sind Nestflüchter und werden von der Ente geführt</li>
            <li>Junge benötigen besonders tierische Nahrung</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Spieß bezeichnet die verlängerten mittleren Schwanzfedern des Erpels</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/236141/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
