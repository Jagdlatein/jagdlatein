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
    <main style={styles.main}>
      <div style={styles.wrap}>

        <h1 style={styles.title}>Krickente (Anas crecca)</h1>
        <p style={styles.subtitle}>
          Kleinste Ente Europas · Rastvogel · Gründelente
        </p>

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
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Kleinste Ente Europas (30–35 cm)</li>
            <li>Leicht, äußerst wendig im Flug</li>
            <li>Kommt als Brut-, Zug- und Wintergast vor</li>
            <li>Lebensraum: Flachwasser, Seen, Flussauen, Feuchtgebiete</li>
            <li>Sehr sozial → bildet große Schwärme im Winter</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <h3>Erpel</h3>
          <ul style={styles.list}>
            <li>Kastanienbrauner Kopf</li>
            <li>Smargdgrüner Augenstreifen bis zum Nacken</li>
            <li>Grauer Körper</li>
            <li>Gelblich-weißes Unterschwanzfeld</li>
          </ul>

          <h3>Ente</h3>
          <ul style={styles.list}>
            <li>Stark getarnt, braun gemustert</li>
            <li>Kleiner, kompakter Körperbau</li>
            <li>Dezenter Augenstreif</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: April–Juni</li>
            <li>Nest: gut versteckte Bodenbruten</li>
            <li>Gelege: 8–11 Eier</li>
            <li>Küken: Nestflüchter, sehr schnell mobil</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gründelt im Flachwasser</li>
            <li>Frisst Samen, Insektenlarven, kleine Krebse</li>
            <li>Küken benötigen tierisches Eiweiß</li>
          </ul>
        </section>

        {/* ZUGVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zugverhalten</h2>
          <ul style={styles.list}>
            <li>Teilziehender Wasser- & Watvogel</li>
            <li>Viele überwintern in Mittel- und Westeuropa</li>
            <li>Sehr schnelle, dichte Schwarmflüge</li>
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
