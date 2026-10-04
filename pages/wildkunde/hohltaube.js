import { useState } from "react";
import Image from "next/image";

export default function Hohltaube() {
  const quiz = [
    {
      q: "Wichtigstes Erkennungsmerkmal der Hohltaube?",
      a: [
        "Weißer Halsfleck",
        "Kein weißer Halsfleck und kleiner als eine erwachsene Ringeltaube",
        "Blauer Flügelspiegel"
      ],
      correct: 1,
    },
    {
      q: "Wo brütet die Hohltaube?",
      a: [
        "Bodenbrüter",
        "Gebäudebrüter",
        "Baumhöhlen & Spechthöhlen"
      ],
      correct: 2,
    },
    {
      q: "Welche Nahrung bevorzugt die Hohltaube?",
      a: [
        "Aas und Kleintiere",
        "Samen, Getreide, Bucheckern",
        "Fische und Insektenlarven"
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
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Hohltaube (Columba oenas)</h1>
        <p style={styles.subtitle}>
          Zierliche Taube · Kein Halsfleck · Höhlenbrüter · Wichtig in der Prüfung!
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/hohltaube.jpg"
            alt="Hohltaube"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Heimische Wildtaube ohne die weißen Halsflecken erwachsener Ringeltauben</li>
            <li>Graublaues Gefieder mit grünlich schimmernden Halsseiten</li>
            <li>Kleiner als die Ringeltaube</li>
            <li>Benötigt Höhlen für die Brut, häufig alte Schwarzspechthöhlen</li>
            <li>Nutzt Wälder mit alten Bäumen, aber auch Parkanlagen und Alleen</li>
            <li>Nahrungssuche häufig in offener Landschaft</li>
            <li>Frisst Samen, Früchte und weitere Pflanzenteile</li>
            <li>In Mitteleuropa überwiegend Zugvogel; Zugverhalten regional verschieden</li>
            <li>Dumpfer, oft zweisilbiger Gesang</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest in Baumhöhlen, geeigneten Nistkästen oder anderen Höhlungen</li>
            <li>Gelege gewöhnlich zwei Eier</li>
            <li>Mehrere Jahresbruten möglich</li>
            <li>Beide Eltern übernehmen Brut und Aufzucht</li>
            <li>Junge sind Nesthocker</li>
            <li>Eltern füttern zunächst Kropfmilch</li>
            <li>Erhalt geeigneter Höhlenbäume verbessert das Brutplatzangebot</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Dunkle Flügelzeichnungen, aber kein weißes Flügelband wie bei der Ringeltaube</li>
            <li>Nestlingszeit variiert ungefähr zwischen 18 und 30 Tagen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/099087/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.wald.rlp.de/wald/voegel/ringeltaube" target="_blank" rel="noopener noreferrer">Landesforsten Rheinland-Pfalz: Taubenbiologie und Kropfmilch</a></p>
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
    </main>
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
