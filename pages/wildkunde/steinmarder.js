import { useState } from "react";
import Image from "next/image";

export default function Steinmarder() {
  const quiz = [
    {
      q: "Woran erkennt man den Steinmarder eindeutig?",
      a: [
        "Gelblichen Kehlfleck",
        "Weißen, gegabelten Kehlfleck",
        "Feuerrotes Fell"
      ],
      correct: 1,
    },
    {
      q: "Wo lebt der Steinmarder bevorzugt?",
      a: [
        "Tiefe Wälder fernab des Menschen",
        "Siedlungsbereiche, Ställe, Dachböden",
        "Nur Hochgebirge"
      ],
      correct: 1,
    },
    {
      q: "Wie viele Zähne hat der Steinmarder?",
      a: ["36", "38", "40"],
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
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Steinmarder (Martes foina)</h1>
        <p style={styles.subtitle}>Kulturfolger · Allesfresser</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/steinmarder.jpg"
            alt="Steinmarder"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 1,5–2,5 kg</li>
            <li>Körperlänge: 40–55 cm</li>
            <li>Lebensraum: Siedlungen, Dörfer, Ställe, Heuschober, Autos</li>
            <li>Sehr guter Kletterer</li>
            <li>Nahrung: Mäuse, Vögel, Eier, Obst, Aas</li>
            <li>Starker Kulturfolger – Nähe zum Menschen typisch</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Weißer, geteilter Kehlfleck → wichtigstes Merkmal!</li>
            <li>Ohren weiß gerandet</li>
            <li>Fell graubraun</li>
            <li>Buschiger Schwanz, aber kürzer als beim Baummarder</li>
            <li>Fährte: 3–4 cm, oft „Doppeldruck“ sichtbar</li>
            <li>Losung: länglich, gedreht, oft mit Früchten und Haaren</li>
          </ul>
        </section>

        {/* UNTERSCHIEDE ZUM BAUMMARDER */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zum Baummarder</h2>
          <ul style={styles.list}>
            <li>Steinmarder: weißer Kehlfleck (gespalten)</li>
            <li>Baummarder: gelblicher Kehlfleck (oval)</li>
            <li>Steinmarder: urban, kulturfolgend</li>
            <li>Baummarder: waldbewohnend</li>
            <li>Steinmarder: Kopf flacher, Schnauze schmaler</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Juli–August</li>
            <li>Keimruhe → effektiver Wurf im März</li>
            <li>Wurfgröße: 3–5 Jungtiere</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe (sehr häufig)</li>
            <li>Tollwut (regional möglich)</li>
            <li>Räude</li>
            <li>Fuchsbandwurm</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 1/2 = 38</li>
            <li>Typisches Raubtiergebiss</li>
            <li>Starke Reißzähne</li>
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
