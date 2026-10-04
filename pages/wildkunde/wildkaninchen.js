import { useState } from "react";
import Image from "next/image";

export default function Wildkaninchen() {
  const quiz = [
    {
      q: "Welche Jungtierform hat das Wildkaninchen?",
      a: ["Nestflüchter", "Nesthocker", "Dauernestflüchter"],
      correct: 1,
    },
    {
      q: "Wo lebt das Wildkaninchen typischerweise?",
      a: [
        "Einzeln in Sassen",
        "Unterirdisch im Bau in Kolonien",
        "In Baumhöhlen"
      ],
      correct: 1,
    },
    {
      q: "Welches Merkmal unterscheidet Kaninchen vom Feldhasen am deutlichsten?",
      a: [
        "Längere Ohren als der Feldhase",
        "Kürzere Ohren und Hinterläufe",
        "Fehlende Losung"
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

        <h1 style={styles.title}>Wildkaninchen (Oryctolagus cuniculus)</h1>
        <p style={styles.subtitle}>Gesellig, grabend, weit verbreitet</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/wildkaninchen.jpg"
            alt="Wildkaninchen"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Hasenartiger mit kurzen Ohren und gedrungenerer Gestalt als der Feldhase</li>
            <li>Kopf-Rumpf-Länge etwa 35 bis 45 cm; Gewicht häufig ungefähr 1,3 bis 2,2 kg</li>
            <li>Lebt gesellig in Kolonien mit unterirdischen Bauen</li>
            <li>Bevorzugt grabfähige, eher trockene Böden in strukturreichen Landschaften, Parks und Siedlungsbereichen</li>
            <li>Meidet dauerhaft nasse Böden und große geschlossene Waldgebiete</li>
            <li>Vorwiegend dämmerungsaktiv; an störungsarmen Orten auch tagsüber</li>
            <li>Nahrung: Gräser, Kräuter, Feldfrüchte, Knospen, Triebe und Rinde</li>
            <li>Warnt andere Kaninchen durch Klopfen mit den Hinterläufen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Mehrere Würfe pro Jahr; Zahl und Größe variieren mit den Lebensbedingungen</li>
            <li>Häufig ungefähr drei bis fünf Würfe mit vier bis sechs Jungen</li>
            <li>Jungtiere sind zunächst nackte und blinde Nesthocker</li>
            <li>Geburt in einem geschützten, gepolsterten Teil des Baus</li>
            <li>Myxomatose und RHD können erhebliche Bestandseinbrüche verursachen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Löffel häufig ungefähr sechs bis acht Zentimeter lang</li>
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
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/140874/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildkaninchen-oryctolagus-cuniculus" target="_blank" rel="noopener noreferrer">DJV: Wildkaninchen</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
