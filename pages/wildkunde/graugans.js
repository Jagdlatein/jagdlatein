import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Graugans() {
  const quiz = [
    {
      q: "Welche Schnabelfärbung ist für Graugänse typisch?",
      a: ["Einheitlich schwarz", "Rosarot bis orange", "Leuchtend blau"],
      correct: 1,
    },
    {
      q: "Was ist typisch für den Flug der Graugans?",
      a: [
        "Unruhiger Zickzackflug",
        "Gleichmäßiger Kraftflug in V-Formation",
        "Rüttelflug wie ein Turmfalke"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Viele europäische Hausgänse stammen von der Graugans ab",
        "Graugänse sind reine Hochgebirgsvögel",
        "Graugänse brüten ausschließlich in Baumhöhlen"
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
    <WildlifePortraitLayout slug="graugans" title={"Graugans (Anser anser)"} subtitle={"\r\n          Größte heimische Wildgans · Stammform der Hausgans · Charakteristische V-Formation\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="graugans" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Große Gans mit graubraunem Gefieder und kräftigem Schnabel</li>
            <li>Schnabel rosarot bis orange, Beine rosafarben</li>
            <li>Geschlechter ähnlich gefärbt</li>
            <li>Lebt an Seen, Teichen und anderen geeigneten Gewässern mit offenen Nahrungsflächen</li>
            <li>Nahrung überwiegend Gräser, Kräuter, Wasserpflanzen und Kulturpflanzen</li>
            <li>Häufig gesellig in Familien und größeren Gruppen</li>
            <li>Lautes, mehrsilbiges Gänserufen</li>
            <li>Längere Strecken oft in V- oder Keilformation</li>
            <li>Zugverhalten variiert; manche mitteleuropäische Populationen bleiben ganzjährig</li>
            <li>Viele europäische Hausgänse gehen auf die Graugans zurück</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarbindung häufig langjährig; nach Partnerverlust kann eine neue Paarung erfolgen</li>
            <li>Brut überwiegend im Frühjahr</li>
            <li>Gelegegröße variabel, häufig vier bis neun Eier</li>
            <li>Gössel sind Nestflüchter und bleiben längere Zeit im Familienverband</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
            <li>Deckungsreiche Gewässer sind während Aufzucht und Mauser besonders wichtig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Jungvögel können nach etwa zwei Monaten fliegen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/085417/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.birdlife.at/voegel/graugans/" target="_blank" rel="noopener noreferrer">BirdLife Österreich: Graugans</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/graugans-anser-anser" target="_blank" rel="noopener noreferrer">Deutscher Jagdverband: Graugans</a></p>
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
