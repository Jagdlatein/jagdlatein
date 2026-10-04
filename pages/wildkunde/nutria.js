import { useState } from "react";
import Image from "next/image";

export default function Nutria() {
  const quiz = [
    {
      q: "Welche Zahnfärbung ist bei erwachsenen Nutrias typisch, ohne allein die Art zu beweisen?",
      a: [
        "Schwarze Ohren",
        "Orangerote Nagezähne",
        "Geflecktes Fell"
      ],
      correct: 1,
    },
    {
      q: "Wie unterscheidet sich die Nutria vom Biber?",
      a: [
        "Nutria hat einen runden Schwanz, Biber einen breiten flachen",
        "Nutria ist doppelt so groß",
        "Beide haben den gleichen Schwanz"
      ],
      correct: 0,
    },
    {
      q: "Welche Auswirkungen können Nutrias an Gewässern haben?",
      a: [
        "Harmlos, keine Auswirkungen",
        "Ihre Grabaktivität kann Ufer und Dämme beeinträchtigen",
        "Lebt nur in Hochgebirgen"
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

        <h1 style={styles.title}>Nutria (Myocastor coypus)</h1>
        <p style={styles.subtitle}>Neozoon · Verwechslungsgefahr mit Biber</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/nutria.jpg"
            alt="Nutria"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Nagetiere mit ursprünglichem Verbreitungsgebiet in Südamerika</li>
            <li>Europäische Bestände gehen unter anderem auf entlaufene oder freigelassene Pelztiere zurück</li>
            <li>Runder, beschuppter und wenig behaarter Schwanz, im Unterschied zur Biberkelle</li>
            <li>Orange Schneidezähne und auffällige helle Barthaare</li>
            <li>Schwimmhäute an den Hinterfüßen</li>
            <li>Nutzt stehende und langsam fließende Gewässer mit vegetationsreichen Ufern</li>
            <li>Gräbt Erdbauten in Uferböschungen</li>
            <li>Ernährt sich überwiegend von Wasser- und Uferpflanzen; nutzt auch Feldfrüchte</li>
            <li>Kann Ufer unterhöhlen und Vegetationsschäden verursachen</li>
            <li>Strenge Winter können die Sterblichkeit erhöhen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Fortpflanzung ganzjährig möglich</li>
            <li>Tragzeit ungefähr 128 bis 135 Tage</li>
            <li>Mehrere Würfe pro Jahr möglich</li>
            <li>Wurfgröße variabel, häufig fünf bis sieben Junge</li>
            <li>Junge werden behaart und sehfähig geboren und können bald laufen und schwimmen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 1/1 · M 3/3 = 20</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Schneidezähne wachsen kontinuierlich nach</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/218365/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
