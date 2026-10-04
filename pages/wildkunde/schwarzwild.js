import { useState } from "react";
import Image from "next/image";

export default function Schwarzwild() {
  const quiz = [
    {
      q: "Wie nennt man das weibliche Stück beim Schwarzwild?",
      a: ["Rickel", "Bache", "Geiß"],
      correct: 1,
    },
    {
      q: "Wie lange ist die Tragzeit beim Schwarzwild?",
      a: ["ca. 5 Monate", "3 Monate + 3 Wochen + 3 Tage"],
      correct: 1,
    },
    {
      q: "Welche Besonderheit hat das Gebiss des Keilers?",
      a: ["Schaufeln", "Haderer und Gewehre (Hauer)"],
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
        <h1 style={styles.title}>Schwarzwild (Sus scrofa)</h1>
        <p style={styles.subtitle}>Keiler · Bache · Frischlinge</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/schwarzwild.jpg"
            alt="Schwarzwild"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* Allgemeines */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Wildschwein: anpassungsfähiger Allesfresser in Wald, Feldflur und weiteren Lebensräumen</li>
            <li>Nahrung überwiegend pflanzlich, ergänzt durch Wirbellose, kleine Wirbeltiere und Aas</li>
            <li>Vorwiegend dämmerungs- und nachtaktiv, abhängig von Störungen auch tagsüber</li>
            <li>Frischlinge haben in den ersten Monaten gelblich-braune Längsstreifen</li>
            <li>Bachen und Jungtiere leben in Rotten; erwachsene Keiler häufig einzeln</li>
            <li>Keiler: Haderer im Oberkiefer; Gewehre (Hauer) im Unterkiefer</li>
            <li>Gute Geruchs- und Gehörleistung</li>
            <li>Wühlschäden können Wiesen und landwirtschaftliche Kulturen betreffen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Paarung und Geburt sind grundsätzlich ganzjährig möglich</li>
            <li>Hauptfortpflanzung liegt häufig im Herbst und Winter, mit Geburten im Frühjahr</li>
            <li>Tragzeit durchschnittlich etwa 115 Tage; Merkspruch: drei Monate, drei Wochen, drei Tage</li>
            <li>Wurfgröße hängt unter anderem von Alter und Ernährungszustand ab</li>
            <li>Bache baut zur Geburt einen Wurfkessel</li>
            <li>Überläufer sind Tiere im zweiten Lebensjahr</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Die Rauschzeit liegt häufig zwischen Oktober und Dezember; junge Tiere können außerhalb dieser Hauptphase frischen</li>
            <li>Suhlen dienen unter anderem der Abkühlung und Körperpflege</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 3/3 = 44</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/084682/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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

  // QUIZ
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
