import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Eichhoernchen() {
  const quiz = [
    {
      q: "Wie nennt man das Nest des Eichhörnchens?",
      a: ["Horst", "Kobel", "Burg"],
      correct: 1,
    },
    {
      q: "Welche typischen Merkmale hat das Eichhörnchen?",
      a: [
        "Buschiger Schwanz und Pinselohren",
        "Schwimmhäute an den Hinterfüßen",
        "Flacher Biberschwanz"
      ],
      correct: 0,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Alle Eichhörnchen sind rot gefärbt",
        "Eichhörnchen haben viele Farbvarianten",
        "Eichhörnchen leben ausschließlich am Boden"
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
    <WildlifePortraitLayout slug="eichhoernchen" title={"Eichhörnchen (Sciurus vulgaris)"} subtitle={"Kletterkünstler · Nahrungssammler · Kulturfolger"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="eichhoernchen" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Heimisches Nagetier der Wälder, Feldgehölze und Parks</li>
            <li>Kopf-Rumpf-Länge ungefähr 20 bis 25 cm</li>
            <li>Oberseite von rot bis schwarzbraun; Unterseite hell</li>
            <li>Buschiger Schwanz und im Winter oft ausgeprägte Ohrpinsel</li>
            <li>Guter Kletterer</li>
            <li>Tagaktiv; kein echter Winterschlaf</li>
            <li>Überwiegend einzeln, Kontakt unter anderem zur Paarung</li>
            <li>Nahrung: Baumsamen, Nüsse, Knospen, Pilze, Früchte und gelegentlich tierische Kost</li>
            <li>Versteckt Vorräte an mehreren Stellen und trägt dadurch zur Samenverbreitung bei</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nester heißen Kobel und werden beispielsweise in Astgabeln angelegt</li>
            <li>Nutzt häufig mehrere Ruhe- und Schlafplätze</li>
            <li>Fortpflanzung hängt stark vom Nahrungsangebot ab</li>
            <li>Paarung kann in günstigen Jahren bereits im Januar beginnen</li>
            <li>Junge sind Nesthocker und wachsen im gepolsterten Wurfkobel auf</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Schwanz häufig ungefähr 16 bis 20 cm lang</li>
            <li>Ein Wurf umfasst häufig etwa fünf Junge, kann aber kleiner oder größer sein</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 2/1 · M 3/3 = 22</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Schneidezähne wachsen kontinuierlich nach</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://lwf.bayern.de/waldschutz/kleinsaeuger/064070/index.php" target="_blank" rel="noopener noreferrer">Bayerische Landesanstalt für Wald und Forstwirtschaft</a> · <a href="https://www.science.smith.edu/departments/Biology/VHAYSSEN/msi/pdf/769_Sciurus_vulgaris.pdf" target="_blank" rel="noopener noreferrer">Mammalian Species: Sciurus vulgaris</a></p>
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
