import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Kanadagans() {
  const quiz = [
    {
      q: "Woran erkennt man die Kanadagans eindeutig?",
      a: [
        "Komplett weißer Kopf",
        "Schwarzer Kopf und Hals mit weißem Kinnband",
        "Roter Schnabel und blaue Beine"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Die Kanadagans ist ein heimischer Brutvogel",
        "Die Kanadagans ist ein Neozoon aus Nordamerika",
        "Die Kanadagans kommt nur im Hochgebirge vor"
      ],
      correct: 1,
    },
    {
      q: "Welche bevorzugte Nahrung hat die Kanadagans?",
      a: [
        "Muscheln und Schnecken",
        "Fische als Hauptnahrung",
        "Gräser, Kräuter, Wasserpflanzen"
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
    <WildlifePortraitLayout slug="kanadagans" title={"Kanadagans (Branta canadensis)"} subtitle={"\r\n          Neozoon aus Nordamerika · Markantes weißes Kinnband · Große, kräftige Gans\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/kanadagans.jpg"
            alt="Kanadagans"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Große Gans mit ursprünglichem Verbreitungsgebiet in Nordamerika</li>
            <li>In Europa durch Ansiedlungen etabliert</li>
            <li>Schwarzer Kopf und Hals mit weißem Kinnband</li>
            <li>Schnabel und Füße schwarz, Körper überwiegend braun-grau</li>
            <li>Geschlechter ähnlich gefärbt</li>
            <li>Nutzt Gewässer mit offenen Nahrungsflächen, auch Stadtparks</li>
            <li>Nahrung überwiegend Gräser, Kräuter, Wasserpflanzen und Getreide</li>
            <li>Fliegt häufig in Keilformation</li>
            <li>Mitteleuropäische Populationen sind oft ganzjährig anwesend</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Langjährige Paarbindung häufig</li>
            <li>Brut vorwiegend im Frühjahr</li>
            <li>Gelegegröße variabel, häufig fünf bis sechs Eier</li>
            <li>Ganter bewacht Partnerin und Familienbereich</li>
            <li>Junge sind Nestflüchter und werden von den Eltern geführt</li>
            <li>Familien können bis zum folgenden Frühjahr zusammenbleiben</li>
            <li>Besonders zur Brutzeit territoriales Verhalten möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/087928/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
