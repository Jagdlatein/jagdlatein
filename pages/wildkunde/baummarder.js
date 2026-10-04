import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Baummarder() {
  const quiz = [
    {
      q: "Was ist das wichtigste Erkennungsmerkmal des Baummarders?",
      a: [
        "Weißer, gegabelter Kehlfleck",
        "Gelblicher, ovaler Kehlfleck",
        "Völlig fehlender Kehlfleck"
      ],
      correct: 1,
    },
    {
      q: "Welchen Lebensraum bevorzugt der Baummarder?",
      a: [
        "Städte und Siedlungen",
        "Offene Feldfluren",
        "Waldreiche, naturnahe Gebiete"
      ],
      correct: 2,
    },
    {
      q: "Wie viele Zähne besitzt der Baummarder?",
      a: ["36", "38", "40"],
      correct: 1,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((x) => ({ ...x, [qi]: ai }));
    setAnswered((x) => ({ ...x, [qi]: true }));
  }

  return (
    <WildlifePortraitLayout slug="baummarder" title={"Baummarder (Martes martes)"} subtitle={"Waldmarder · Indikator für gesunde Wälder"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="baummarder" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Marderartiger, auch Edelmarder genannt</li>
            <li>Bevorzugt strukturreiche Wälder und ältere Baumbestände</li>
            <li>Überwiegend dämmerungs- und nachtaktiver Einzelgänger</li>
            <li>Guter Kletterer; nutzt Baumhöhlen, Kobel und andere geschützte Ruheplätze</li>
            <li>Kastanien- bis dunkelbraunes Fell und buschiger Schwanz</li>
            <li>Kehlfleck meist gelblich; Form und Farbe können variieren</li>
            <li>Dunkle Nase ist ein weiteres Merkmal gegenüber dem Steinmarder</li>
            <li>Nahrung: Kleinsäuger, Insekten, Vögel, Eier, Aas und Früchte</li>
            <li>Ein einzelner Kehlfleck oder eine Spur erlaubt keine unfehlbare Artbestimmung</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Ranz hauptsächlich Juli bis August</li>
            <li>Nach der Paarung folgt Keimruhe</li>
            <li>Eigentliche Embryonalentwicklung setzt erst im folgenden Frühjahr ein</li>
            <li>Geburten meist März bis April; Wurfgröße variabel</li>
            <li>Jungtiere wachsen in einem geschützten Versteck auf</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 1/2 = 38</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/100914/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/baummarder-martes-martes" target="_blank" rel="noopener noreferrer">DJV: Baummarder</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
