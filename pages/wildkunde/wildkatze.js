import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Wildkatze() {
  const quiz = [
    {
      q: "Welche Merkmalskombination ist ein Hinweis auf eine Wildkatze?",
      a: [
        "Schlanker Schwanz",
        "Buschiger Schwanz mit dunklen Ringen und stumpfer dunkler Spitze",
        "Dreifarbige Fellmusterung"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage gilt zur Wildkatze in Deutschland?",
      a: ["Regulär ganzjährig jagdbar","Streng geschützte Art; keine reguläre Bejagung","Fellzeichnung allein berechtigt zur Bejagung"],
      correct: 1,
    },
    {
      q: "Wo lebt die Wildkatze bevorzugt?",
      a: [
        "Offene Agrarlandschaft",
        "Nadelwälder ohne Deckung",
        "Laub- und Mischwälder mit viel Deckung"
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
    <WildlifePortraitLayout slug="wildkatze" title={"Wildkatze (Felis silvestris)"} subtitle={"Streng geschützt · heimliches Waldtier"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="wildkatze" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Europäische Wildkatze: scheue Katzenart strukturreicher Landschaften</li>
            <li>Nutzt Wälder mit Deckung und Totholz; jagt auch an Waldrändern, Lichtungen und Wiesen</li>
            <li>Außerhalb der Paarungszeit meist einzeln</li>
            <li>Hauptnahrung sind kleine Säugetiere, besonders Mäuse</li>
            <li>Buschiger Schwanz mit abgesetzten Ringen und stumpfem dunklem Ende ist ein Hinweis</li>
            <li>Getigerte Hauskatzen können sehr ähnlich aussehen</li>
            <li>Fellzeichnung, Größe und einzelne Spuren sind kein sicherer Zugehörigkeitsnachweis</li>
            <li>Monitoring kann genetische Untersuchung von Haaren einschließen</li>
            <li>Verwechslungen vermeiden; keine eigenmächtige Bejagung</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarungszeit hauptsächlich Januar bis März</li>
            <li>Tragzeit ungefähr 63 bis 69 Tage</li>
            <li>Meist ein Wurf pro Jahr; Zahl der Jungen variiert</li>
            <li>Geschützte Wurfplätze in Höhlen, Wurzeltellern oder dichter Deckung</li>
            <li>Mutter versorgt die Jungen über mehrere Monate</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Männchen sind durchschnittlich etwas größer als Weibchen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 3/2 · M 1/1 = 30</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/102627/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.bfn.de/artenportraits/felis-silvestris" target="_blank" rel="noopener noreferrer">BfN: Wildkatze und Schutzstatus</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
