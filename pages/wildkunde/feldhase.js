import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Feldhase() {
  const quiz = [
    {
      q: "Welche Fellfarbe haben die Löffel des Feldhasen an der Spitze?",
      a: ["Komplett weiß", "Schwarz", "Dunkelbraun gesprenkelt"],
      correct: 1,
    },
    {
      q: "Wie sind Junghasen bei der Geburt entwickelt?",
      a: ["Nackt und blind","Behaart und sehfähig","Sie schlüpfen aus Eiern"],
      correct: 1,
    },
    {
      q: "Wie bewegt sich der Feldhase bei Gefahr?",
      a: [
        "Langer, gerader Sprint",
        "Zickzack/Haken schlagen",
        "Springt auf Bäume"
      ],
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
    <WildlifePortraitLayout slug="feldhase" title={"Feldhase (Lepus europaeus)"} subtitle={"Typisches Niederwild des Offenlandes"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/feldhase.jpg"
            alt="Feldhase"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Hasenartiger, kein Nagetier</li>
            <li>Kopf-Rumpf-Länge etwa 50 bis 70 cm; Gewicht variiert nach Region und Alter</li>
            <li>Lange Ohren, Löffel genannt, mit dunklen Spitzen</li>
            <li>Kräftige Hinterläufe ermöglichen schnelle Flucht mit Hakenschlagen</li>
            <li>Lebt besonders in offener, strukturreicher Agrarlandschaft; kommt auch in anderen Landschaften vor</li>
            <li>Nahrung: Kräuter, Gräser, Kulturpflanzen, Knospen und Triebe</li>
            <li>Ruht in einer flachen Erdmulde, der Sasse</li>
            <li>Bei Gefahr zunächst oft regungslos geduckt, dann schnelle Flucht</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Fortpflanzungsperiode erstreckt sich über Frühjahr und Sommer; Beginn und Ende variieren</li>
            <li>Mehrere Würfe pro Jahr möglich</li>
            <li>Junge werden behaart und mit offenen Augen geboren</li>
            <li>Häsin setzt die Jungen oberirdisch, nicht in einem Kaninchenbau</li>
            <li>Häsin und Rammler sind die Geschlechtsbezeichnungen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Löffellänge häufig ungefähr 12 bis 14 cm</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 2/1 · C 0/0 · P 3/2 · M 3/3 = 28</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Schneidezähne wachsen kontinuierlich nach</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/102456/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/feldhase-lepus-europaeus" target="_blank" rel="noopener noreferrer">DJV: Feldhase</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
