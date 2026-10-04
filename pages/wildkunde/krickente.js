import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Krickente() {
  const quiz = [
    {
      q: "Was ist typisch für den Erpel der Krickente?",
      a: [
        "Weißer Ring um den Hals",
        "Grüner Augenstreifen im kastanienbraunen Kopf",
        "Schwarze Schwanzlocke"
      ],
      correct: 1,
    },
    {
      q: "Wie groß ist die Krickente?",
      a: [
        "Größte Ente Mitteleuropas",
        "Mittlere Gründelente",
        "Kleinste Ente Europas"
      ],
      correct: 2,
    },
    {
      q: "Wie ernährt sich die Krickente?",
      a: [
        "Nur Fisch",
        "Gründelt nach Samen, Pflanzenresten, Kleintieren",
        "Jagt Mäuse und Insekten im Flug"
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
    <WildlifePortraitLayout slug="krickente" title={"Krickente (Anas crecca)"} subtitle={"\r\n          Kleinste Ente Europas · Rastvogel · Gründelente\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/krickente.jpg"
            alt="Krickente"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Kleinste europäische Ente</li>
            <li>Gründelente kleiner, flacher Gewässer mit Deckung</li>
            <li>Erpel im Prachtkleid mit kastanienbraunem Kopf und grünem Augenstreifen</li>
            <li>Ente braun gemustert und unauffälliger</li>
            <li>Grüner Flügelspiegel bei beiden Geschlechtern</li>
            <li>Kann fast senkrecht von der Wasseroberfläche starten</li>
            <li>Nahrung: Samen und kleine wirbellose Tiere, jahreszeitlich unterschiedlich</li>
            <li>In Mitteleuropa Brutvogel, Durchzügler und Wintergast</li>
            <li>Erpel ruft hell und pfeifend</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Nest am Boden in dichter Vegetation</li>
            <li>Gelegegröße variabel, häufig acht bis elf Eier</li>
            <li>Brutdauer ungefähr 21 bis 23 Tage</li>
            <li>Küken sind Nestflüchter</li>
            <li>Ente übernimmt die Führung der Jungen</li>
            <li>Junge fressen vorwiegend tierische Kost</li>
            <li>Während der Schwingenmauser zeitweise flugunfähig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Küken fressen anfangs besonders wirbellose Tiere</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/213492/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a></p>
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
