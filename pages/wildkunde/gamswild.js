import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Gamswild() {
  const quiz = [
    {
      q: "Wann brunftet das Gamswild?",
      a: ["September", "November", "Januar"],
      correct: 1,
    },
    {
      q: "Wie nennt man das typische Horn des Gamsbocks?",
      a: ["Schaufel", "Spirale", "Krucke"],
      correct: 2,
    },
    {
      q: "Wie lange ist die Tragzeit beim Gamswild?",
      a: ["ca. 5 Monate", "ca. 6 Monate"],
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
    <WildlifePortraitLayout slug="gamswild" title={"Gamswild (Rupicapra rupicapra)"} subtitle={"Bock · Geiß · Kitz"}>
      <div style={styles.wrap}>




        {/* Bild */}
        <div style={styles.imageBox}>
          <WildlifePhoto slug="gamswild" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Ziegenverwandter Hornträger in europäischen Gebirgen</li>
            <li>Nutzt alpine Matten, Fels- und Krummholzbereiche sowie Bergwälder</li>
            <li>Überwiegend tagaktiv und sehr trittsicher</li>
            <li>Nahrung: Gräser, Kräuter, Knospen und Zwergsträucher</li>
            <li>Geißen und Kitze leben in Rudeln; Böcke häufig einzeln oder in kleinen Gruppen</li>
            <li>Beide Geschlechter tragen Hörner, die Krucken heißen</li>
            <li>Krucken sind nach hinten gehakelt und werden nicht jährlich abgeworfen</li>
            <li>Sommerfell heller, Winterfell überwiegend dunkel</li>
            <li>Typisch ist der dunkle Zügelstreifen von der Schnauze über das Auge</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Hauptbrunft im November</li>
            <li>Tragzeit ungefähr sechs Monate</li>
            <li>Setzzeit gewöhnlich Mai bis Juni, meist ein Kitz</li>
            <li>Hornwachstum bildet Jahresabschnitte; Altersansprache erfordert sorgfältige Beurteilung</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Zahnabnutzung liefert nur eine ungefähre Altersschätzung</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/085402/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://nationalpark.ch/flora-und-fauna/gaemse/" target="_blank" rel="noopener noreferrer">Nationalpark: Gämse</a> · <a href="https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Gaemse.pdf" target="_blank" rel="noopener noreferrer">Nationalpark: Fokus Gämse (Tragzeit)</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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

  // QUIZ STYLES
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
