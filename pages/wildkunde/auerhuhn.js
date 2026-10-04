import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Auerhuhn() {
  const quiz = [
    {
      q: "Wie nennt man das Männchen des Auerhuhns?",
      a: ["Gockel", "Auerhahn", "Spielhahn"],
      correct: 1,
    },
    {
      q: "Was ist typisch für die Balz des Auerhahns?",
      a: ["Balz ausschließlich auf dem Wasser","Balzgesang, zuerst oft auf dem Baum und später am Boden","Es gibt keinen Balzgesang"],
      correct: 1,
    },
    {
      q: "Welche Aussage ist korrekt?",
      a: [
        "Auerhennen sind auffällig bunt",
        "Auerhennen sind braun getarnt",
        "Auerhennen haben sichelförmige Schwanzfedern"
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
    <WildlifePortraitLayout slug="auerhuhn" title={"Auerhuhn (Tetrao urogallus)"} subtitle={"Großvogel des Bergwaldes · Balzkönig · Selten"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/auerhuhn.jpg"
            alt="Auerhuhn"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ===================================== */}
        {/* ALLGEMEINES */}
        {/* ===================================== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Großes Raufußhuhn lichter, strukturreicher Nadel- und Mischwälder</li>
            <li>Sehr störungsempfindlich</li>
            <li>Auerhahn ist deutlich größer als die braun getarnte Auerhenne</li>
            <li>Hahn mit breiten, fächerartig aufstellbaren Schwanzfedern</li>
            <li>Rote Hautpartien über den Augen heißen Rosen</li>
            <li>Erwachsene Vögel fressen vorwiegend Pflanzen</li>
            <li>Im Winter sind Nadelbaum-Nadeln wichtige Nahrung</li>
            <li>Beersträucher bieten Blätter, Triebe und Früchte</li>
            <li>Küken benötigen besonders in den ersten Lebenswochen viele Insekten</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Balz vor allem im Frühjahr, regional ab März bis Mai</li>
            <li>Balzgesang beginnt häufig auf Bäumen; später balzen Hähne auch am Boden</li>
            <li>Mehrere Hähne können einen gemeinsamen Balzplatz nutzen</li>
            <li>Henne legt ein Bodennest an und übernimmt Brut und Aufzucht</li>
            <li>Gelegegröße variabel, häufig ungefähr sieben bis acht Eier</li>
            <li>Küken sind Nestflüchter und werden von der Henne gewärmt</li>
            <li>Balzplätze, Gelege und Jungvögel vor Störungen schützen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Henne mit rostbrauner, weitgehend ungebänderter Brust; Birkhenne dort stärker gebändert</li>
            <li>Balzgesang besteht aus aufeinanderfolgenden Lauten</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/096750/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
