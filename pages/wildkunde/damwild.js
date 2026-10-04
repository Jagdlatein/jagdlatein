import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Damwild() {
  const quiz = [
    {
      q: "Wie lautet die typische Brunftzeit des Damwildes?",
      a: ["Juli–August", "Oktober–November", "Februar–März"],
      correct: 1,
    },
    {
      q: "Wie nennt man das Geweih des Damhirsches?",
      a: ["Stangen", "Schaufeln"],
      correct: 1,
    },
    {
      q: "Wie lange ist die Tragezeit beim Damwild?",
      a: ["ca. 5 Monate", "ca. 7,5 Monate"],
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
    <WildlifePortraitLayout slug="damwild" title={"Damwild (Dama dama)"} subtitle={"Damhirsch, Damtier & Kalb"}>
      <div style={styles.wrap}>



        {/* ⭐ Bild aus /public */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/damwild.jpg"
            alt="Damwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* STECKBRIEF */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Mittelgroße Hirschart; Hirsche können etwa 100 kg, weibliche Tiere etwa 60 kg erreichen</li>
            <li>Bevorzugt lichte Wälder im Wechsel mit Offenland</li>
            <li>Lebt meist in getrennten Hirsch- und Kahlwildrudeln</li>
            <li>Wiederkäuer mit Gräsern, Kräutern, Trieben und Baumfrüchten im Nahrungsspektrum</li>
            <li>Fellfarben variieren von hell bis sehr dunkel</li>
            <li>Helle Flecken sind besonders im rotbraunen Sommerfell sichtbar</li>
            <li>Ältere Hirsche tragen ein charakteristisches Schaufelgeweih; die Entwicklung ist individuell unterschiedlich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Hauptbrunft im Oktober und November</li>
            <li>Tragzeit ungefähr siebeneinhalb Monate</li>
            <li>Setzzeit meist Ende Mai bis Juni; gewöhnlich ein Kalb</li>
            <li>Geweihabwurf überwiegend im April</li>
            <li>Neues Geweih wächst unter Bast bis zum Spätsommer</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Junge Hirsche tragen zunächst Spieße; eine bestimmte Schaufelgröße beweist kein genaues Alter</li>
            <li>Der dunkle Rückenstreifen wird Aalstrich genannt</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/083840/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
  main: { background: "#faf8f1", padding: "40px 20px", minHeight: "100vh" },
  wrap: { maxWidth: "900px", margin: "0 auto" },
  title: { fontSize: "42px", fontWeight: 800, marginBottom: "6px" },
  subtitle: { fontSize: "19px", marginBottom: "26px", color: "#5a5a5a" },
  imageBox: { borderRadius: "14px", overflow: "hidden", marginBottom: "32px" },
  image: { width: "100%", height: "auto" },
  section: { marginBottom: "36px" },
  sectionTitle: { fontSize: "26px", marginBottom: "14px" },
  list: { paddingLeft: "22px", lineHeight: "1.7", fontSize: "17px" },
  quizBlock: {
    marginBottom: "26px",
    padding: "16px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2d9c9",
  },
  quizQuestion: { fontSize: "18px", marginBottom: "12px", fontWeight: 600 },
  quizButton: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
    textAlign: "left",
    cursor: "pointer",
  },
};
