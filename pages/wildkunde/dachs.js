import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Dachs() {
  const quiz = [
    {
      q: "Wann ist der Dachs am aktivsten?",
      a: ["Tagsüber", "In der Dämmerung und nachts", "Mittags"],
      correct: 1,
    },
    {
      q: "Wie heißt die Wohnkammer im Dachsbau?",
      a: ["Horst","Kessel","Sasse"],
      correct: 1,
    },
    {
      q: "Wie lautet die Zahnformel des Dachses?",
      a: ["I 3/3 · C 1/1 · P 4/4 · M 1/2", "I 3/3 · C 1/1 · P 4/3 · M 2/2", "I 2/2 · C 1/1 · P 3/3 · M 3/3"],
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
    <WildlifePortraitLayout slug="dachs" title={"Dachs (Meles meles)"} subtitle={"Dachs – Meistergräber"}>
      <div style={styles.wrap}>




        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/dachs.jpg"
            alt="Dachs"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Marderartiger Allesfresser mit schwarz-weißer Gesichtszeichnung</li>
            <li>Gedrungener Körper, kurze kräftige Beine und kurze Rute</li>
            <li>Kopf-Rumpf-Länge ungefähr 60 bis 90 cm; Gewicht schwankt saisonal</li>
            <li>Nutzt Wälder, Feldgehölze und strukturreiche Landschaften</li>
            <li>Nahrung unter anderem Regenwürmer, Insekten, Früchte, Getreide und Kleinsäuger</li>
            <li>Baue besitzen Röhren und Wohnkammern, die Kessel heißen</li>
            <li>Lebt je nach Lebensraum und Nahrungsangebot in sozialen Gruppen</li>
            <li>Überwiegend dämmerungs- und nachtaktiv</li>
            <li>Winterruhe kann bei mildem Wetter unterbrochen werden; kein tiefer Winterschlaf</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarungen sind über weite Teile des Jahres möglich; regionale Schwerpunkte unterscheiden sich</li>
            <li>Verzögerte Einnistung der befruchteten Eizelle, auch Keimruhe genannt</li>
            <li>Junge werden häufig Februar bis März geboren</li>
            <li>Wurfgröße variabel, häufig zwei bis drei Junge</li>
            <li>Jungtiere können länger im Familienverband verbleiben</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Kräftige Grabkrallen und schwarz-weiße Kopfzeichnung</li>
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
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/101575/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://animaldiversity.org/accounts/Meles_meles/" target="_blank" rel="noopener noreferrer">University of Michigan: Dachsbiologie und Gebiss</a> · <a href="https://www.baysf.de/fileadmin/user_upload/news/BaySF_Magazin10_Waldjagd.pdf" target="_blank" rel="noopener noreferrer">Bayerische Staatsforsten: Waldjagd und Fachbegriffe</a></p>
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
