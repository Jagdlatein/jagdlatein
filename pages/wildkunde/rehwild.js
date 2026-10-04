import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Rehwild() {
  const quiz = [
    {
      q: "Wie lautet die Brunftzeit des Rehwildes?",
      a: ["April–Mai", "Juli–August", "Oktober–November"],
      correct: 1,
    },
    {
      q: "Wie nennt man das Männchen beim Rehwild?",
      a: ["Hirsch", "Bock", "Keiler"],
      correct: 1,
    },
    {
      q: "Wie lange ist die Tragezeit des Rehwildes (inkl. Keimruhe)?",
      a: ["ca. 5 Monate", "ca. 9,5 Monate"],
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
    <WildlifePortraitLayout slug="rehwild" title={"Rehwild (Capreolus capreolus)"} subtitle={"Rehbock, Ricke & Kitz"}>
      <div style={styles.wrap}>



        {/* ⭐ Bild aus /public */}
        <div style={styles.imageBox}>
          <WildlifePhoto slug="rehwild" />
        </div>

        {/* STECKBRIEF */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Kleine heimische Hirschart mit schmalem Vorderkörper und kräftigen Hinterläufen</li>
            <li>Besiedelt Wald-Feld-Mosaike, unterholzreiche Wälder und auch offene Agrarlandschaften</li>
            <li>Wiederkäuer; wählt bevorzugt leicht verdauliche Kräuter, Blätter, Knospen und junge Triebe</li>
            <li>Böcke verhalten sich im Sommer territorial</li>
            <li>Im Herbst und Winter häufig Gruppen, die Sprünge heißen</li>
            <li>Der Bock trägt ein jährlich erneuertes Gehörn; Endenzahl und Stärke sind keine sichere Altersuhr</li>
            <li>Schrecken klingt wie kurzes Bellen und kann von beiden Geschlechtern stammen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Brunft im Juli und August</li>
            <li>Anschließend embryonale Keimruhe bis in den Spätherbst</li>
            <li>Gesamte Tragzeit einschließlich Keimruhe etwa neuneinhalb Monate</li>
            <li>Setzzeit meist Mai bis Juni; gewöhnlich zwei Kitze</li>
            <li>Gehörn wird im Herbst abgeworfen und anschließend neu gebildet</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/084667/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/reh-capreolus-capreolus" target="_blank" rel="noopener noreferrer">DJV: Reh</a></p>
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
