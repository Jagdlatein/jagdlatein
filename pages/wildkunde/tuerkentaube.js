import { useState } from "react";
import Image from "next/image";

export default function Tuerkentaube() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für die Türkentaube?",
      a: [
        "Weiße Flügelbinde",
        "Schwarzer Nackenring",
        "Blauer Flügelspiegel"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Türkentauben kamen als Kulturfolger aus dem Osten nach Europa",
        "Türkentauben leben nur im Wald",
        "Türkentauben sind die größte Taubenart"
      ],
      correct: 0,
    },
    {
      q: "Wovon ernährt sich die Türkentaube hauptsächlich?",
      a: [
        "Kleinsäuger und Insekten",
        "Samen, Getreide, Knospen",
        "Aas und Früchte"
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

        <h1 style={styles.title}>Türkentaube (Streptopelia decaocto)</h1>
        <p style={styles.subtitle}>
          Kulturfolger · Schwarzer Nackenring · Heller Körper · Typischer „gu-gu-gu“ Ruf
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/tuerkentaube.jpg"
            alt="Türkentaube"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Schlanke, beigegraue Taube</li>
            <li>Erwachsene mit schwarzem, vorne offenem Nackenring</li>
            <li>Jungvögeln fehlt der deutliche Ring zunächst</li>
            <li>Kleiner als die Ringeltaube</li>
            <li>Typischer Kulturfolger in Dörfern, Gärten und Städten</li>
            <li>Ausbreitung in Europa verstärkt seit den 1930er Jahren</li>
            <li>Nahrung überwiegend Getreide und andere Samen, auch weitere Pflanzenteile</li>
            <li>Meist Standvogel</li>
            <li>Charakteristischer dreisilbiger Gesang</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Territoriales Verhalten während der Brutzeit</li>
            <li>Nest auf Bäumen oder geeigneten Gebäudestrukturen</li>
            <li>Gelege gewöhnlich zwei Eier</li>
            <li>Mehrere Bruten im Jahr möglich</li>
            <li>Bei mildem Wetter auch außerhalb der üblichen Frühjahr-Sommer-Brutzeit</li>
            <li>Junge sind Nesthocker und werden zunächst mit Kropfmilch versorgt</li>
            <li>Außerhalb der Brutzeit häufig gesellig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.birdlife.at/voegel/tuerkentaube/" target="_blank" rel="noopener noreferrer">BirdLife Österreich: Artprofil</a> · <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/100452/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Türkentaube</a> · <a href="https://www.wald.rlp.de/wald/voegel/ringeltaube" target="_blank" rel="noopener noreferrer">Landesforsten Rheinland-Pfalz: Taubenbiologie und Kropfmilch</a></p>
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
