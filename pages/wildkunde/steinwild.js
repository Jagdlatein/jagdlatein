import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Steinwild() {
  const quiz = [
    {
      q: "Wann brunftet das Steinwild?",
      a: ["August–September", "Dezember–Januar", "April–Mai"],
      correct: 1,
    },
    {
      q: "Wie nennt man die Hörner des Steinwildes?",
      a: ["Schaufeln","Hörner","Geweihstangen"],
      correct: 1,
    },
    {
      q: "Wann setzt die Steinwild-Geiß üblicherweise?",
      a: ["Überwiegend im Juni", "September", "Dezember"],
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
    <WildlifePortraitLayout slug="steinwild" title={"Steinwild (Capra ibex)"} subtitle={"Steinbock · Geiß · Kitz"}>
      <div style={styles.wrap}>




        {/* Bild */}
        <div style={styles.imageBox}>
          <WildlifePhoto slug="steinwild" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Alpensteinbock: Hornträger und Spezialist felsiger Hochgebirgslebensräume</li>
            <li>Nutzt alpine Matten, felsige Hänge und saisonal unterschiedliche Höhenlagen</li>
            <li>Sehr guter Kletterer</li>
            <li>Nahrung: Gräser und Kräuter; im Winter auch weitere verfügbare Pflanzenteile</li>
            <li>Böcke sind erheblich massiger als Geißen</li>
            <li>Bockhörner können etwa einen Meter lang werden</li>
            <li>Beide Geschlechter tragen Hörner; jene der Geißen sind deutlich kleiner</li>
            <li>Böcke und Geißen mit Jungtieren leben überwiegend in getrennten Rudeln</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Brunft hauptsächlich Dezember bis Januar</li>
            <li>Tragzeit ungefähr sechs Monate</li>
            <li>Kitze werden überwiegend im Juni geboren</li>
            <li>Meist ein Kitz, Zwillinge selten</li>
            <li>Hörner wachsen über viele Jahre; Jahresringe sind von Schmuckknoten zu unterscheiden</li>
            <li>Bei Geißen erschweren enge Jahresringe die Altersansprache</li>
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
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://nationalpark.ch/flora-und-fauna/steinbock/" target="_blank" rel="noopener noreferrer">Schweizerischer Nationalpark: Artprofil</a> · <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/143521/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Steinwild</a> · <a href="https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Steinbock.pdf" target="_blank" rel="noopener noreferrer">Nationalpark: Fokus Steinbock</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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

  // QUIZ
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
