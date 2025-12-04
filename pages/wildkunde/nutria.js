import { useState } from "react";
import Image from "next/image";

export default function Nutria() {
  const quiz = [
    {
      q: "Was ist das auffälligste Erkennungsmerkmal der Nutria?",
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
      q: "Welche Rolle spielt die Nutria in der Landschaft?",
      a: [
        "Harmlos, keine Auswirkungen",
        "Verursacht Schäden an Ufern & Dämmen",
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
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 5–9 kg</li>
            <li>Körperlänge: 40–65 cm</li>
            <li>Schwanz: rund, bis 45 cm (wichtigstes Unterscheidungsmerkmal zum Biber)</li>
            <li>Lebensraum: Flüsse, Kanäle, Teiche, Feuchtgebiete</li>
            <li>Fremdländische Art aus Südamerika → Neozoon</li>
            <li>Meisterschwimmer dank Schwimmhäuten an den Hinterbeinen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Orangerote Schneidezähne</strong> – eindeutiges Merkmal</li>
            <li>Langes, braunes Fell</li>
            <li>Runder, nackter Schwanz</li>
            <li>Schwimmhäute an den Hinterfüßen</li>
            <li>Schmaler Kopf im Vergleich zum Biber</li>
          </ul>
        </section>

        {/* NACHWEIS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nachweis & Spuren</h2>
          <ul style={styles.list}>
            <li>Fährte: ähnlich Biber, aber kleiner</li>
            <li>Gangsysteme an Ufern</li>
            <li>Nagespuren an Pflanzen</li>
            <li>Losung: länglich, oliv- bis dunkelbraun</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: ganzjährig möglich</li>
            <li>Tragzeit: 130–140 Tage</li>
            <li>Wurfgröße: 4–6 Junge</li>
            <li>Jungtiere: Nestflüchter</li>
            <li>Sehr reproduktiv → Populationsanstieg schnell</li>
          </ul>
        </section>

        {/* WILDSCHÄDEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Schäden & Probleme</h2>
          <ul style={styles.list}>
            <li>Zerstörung von Uferstrukturen</li>
            <li>Unterhöhlen von Dämmen</li>
            <li>Ernte- & Vegetationsschäden</li>
            <li>Übertragung von Parasiten & Krankheiten (Giardien)</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 1/1 · M 3/3 = 20</li>
            <li><strong>Schneidezähne orange gefärbt</strong></li>
            <li>Kräftige Backenzähne für Pflanzenkost</li>
          </ul>
        </section>

        {/* QUIZ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quiz</h2>

          {quiz.map((q, qi) => (
            <div key={qi} style={styles.quizBlock}>
              <p style={styles.quizQuestion}>{q.q}</p>

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
