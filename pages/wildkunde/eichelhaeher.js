import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Eichelhaeher() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für den Eichelhäher?",
      a: [
        "Komplett schwarzes Gefieder",
        "Blauer Flügelspiegel",
        "Langer schwarzer Stoß"
      ],
      correct: 1,
    },
    {
      q: "Warum nennt man den Eichelhäher 'Polizei des Waldes'?",
      a: [
        "Weil er andere Vögel bewacht",
        "Weil er laut vor Gefahren warnt",
        "Weil er territoriale Streitkräfte bildet"
      ],
      correct: 1,
    },
    {
      q: "Welche ökologische Bedeutung hat der Eichelhäher?",
      a: [
        "Keine besondere Rolle",
        "Er frisst ausschließlich Früchte",
        "Er verbreitet Eicheln und hilft bei der Waldverjüngung"
      ],
      correct: 2,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((s) => ({ ...s, [qi]: ai }));
    setAnswered((s) => ({ ...s, [qi]: true }));
  }

  return (
    <WildlifePortraitLayout slug="eichelhaeher" title={"Eichelhäher (Garrulus glandarius)"} subtitle={"\r\n          Blauer Flügelspiegel · Polizei des Waldes · Lauter Warnruf · Verbreitet Eicheln\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="eichelhaeher" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Rabenvogel mit beigebraunem Gefieder</li>
            <li>Auffällige blau-schwarz gebänderte Flügelfedern</li>
            <li>Weißer Bürzel und dunkle Schwanzfedern im Flug sichtbar</li>
            <li>Nutzt verschiedene Wälder, Parkanlagen und Siedlungsbereiche</li>
            <li>Lautes Rätschen kann vor Störungen warnen; daher die Bezeichnung Wächter des Waldes</li>
            <li>Versteckt besonders Eicheln und andere Baumsamen als Vorräte</li>
            <li>Nicht wieder genutzte Samen können keimen und zur Waldverjüngung beitragen</li>
            <li>Nahrung: Baumsamen und weitere pflanzliche sowie tierische Bestandteile</li>
            <li>Geschlechter im Gefieder ähnlich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest in dichtem Geäst, häufig in Bäumen</li>
            <li>Brutbeginn oft im April; regionale Unterschiede</li>
            <li>Gelegegröße variabel, häufig ungefähr fünf Eier</li>
            <li>Brutdauer ungefähr 16 bis 19 Tage</li>
            <li>Beide Eltern versorgen die Jungen</li>
            <li>Jungvögel werden nach dem Ausfliegen noch weiter geführt</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/100839/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
    color: "#1f2b23",
  },
  subtitle: {
    fontSize: "19px",
    marginBottom: "26px",
    color: "#555",
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
