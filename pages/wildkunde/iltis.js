import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Iltis() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für den Iltis?",
      a: [
        "Starker Moschusgeruch",
        "Gelber Kehlfleck",
        "Runderer Kopf als beim Steinmarder"
      ],
      correct: 0,
    },
    {
      q: "Wo lebt der Iltis bevorzugt?",
      a: [
        "Dichte Hochwälder",
        "Feuchte Lebensräume wie Auen, Sümpfe, Bachläufe",
        "Trockene Gebirge"
      ],
      correct: 1,
    },
    {
      q: "Wie lautet die Zahnformel des Iltis?",
      a: ["I 3/3 · C 1/1 · P 3/3 · M 1/2 = 34","I 3/3 · C 1/1 · P 4/4 · M 2/2 = 40","I 3/3 · C 1/1 · P 4/4 · M 2/3 = 42"],
      correct: 0,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((x) => ({ ...x, [qi]: ai }));
    setAnswered((x) => ({ ...x, [qi]: true }));
  }

  return (
    <WildlifePortraitLayout slug="iltis" title={"Iltis (Mustela putorius)"} subtitle={"Stinkmarder · Feuchtgebiets-Raubwild"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/iltis.jpg"
            alt="Iltis"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Marderartiger mit dunklem Fell und kontrastreicher heller Gesichtszeichnung</li>
            <li>Gelbliche Unterwolle scheint durch die dunklen Deckhaare</li>
            <li>Kopf-Rumpf-Länge häufig ungefähr 35 bis 45 cm</li>
            <li>Nutzt strukturreiche Waldränder, Hecken, Feldfluren und bewachsene Gewässerufer</li>
            <li>Überwiegend dämmerungs- und nachtaktiv</li>
            <li>Nahrung vor allem Amphibien und Kleinsäuger; Zusammensetzung hängt vom Lebensraum ab</li>
            <li>Stark riechendes Sekret aus Analdrüsen dient unter anderem der Abwehr und Markierung</li>
            <li>Geschützte Tagesverstecke beispielsweise in Holz- oder Reisighaufen</li>
            <li>Gesichtsmaske ist ein Hinweis gegenüber dem Mink; Farbe oder Geruch allein beweisen die Art nicht</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarungszeit überwiegend im Frühjahr bis Frühsommer</li>
            <li>Tragzeit ungefähr 40 bis 42 Tage</li>
            <li>Geburten meist Mai bis Juni</li>
            <li>Wurfgröße variabel, häufig vier bis acht Junge</li>
            <li>Junge sind Nesthocker und öffnen die Augen erst nach mehreren Wochen</li>
            <li>Bei Verlust des ersten Wurfs ist ein Ersatzwurf möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 3/3 · M 1/2 = 34</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/101494/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.sciencedirect.com/science/article/abs/pii/S0021997520300190" target="_blank" rel="noopener noreferrer">Anatomische Studie zum Iltisgebiss (2020)</a></p>
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
