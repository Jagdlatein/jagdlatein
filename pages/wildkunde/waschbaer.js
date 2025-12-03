import { useState } from "react";
import Image from "next/image";

export default function Waschbaer() {
  const quiz = [
    {
      q: "Woher stammt der Waschbär ursprünglich?",
      a: ["Europa", "Nordamerika", "Sibirien"],
      correct: 1,
    },
    {
      q: "Woran erkennt man den Waschbären besonders gut?",
      a: ["Schwarze Maske im Gesicht", "Langer weißer Bart", "Gelbe Streifen an den Flanken"],
      correct: 0,
    },
    {
      q: "Wie viele Zähne hat der Waschbär?",
      a: ["38", "40", "42"],
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

        <h1 style={styles.title}>Waschbär (Procyon lotor)</h1>
        <p style={styles.subtitle}>Neozon · Allesfresser</p>

        {/* Bild */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/waschbaer.jpg"
            alt="Waschbär"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Ursprung: Nordamerika</li>
            <li>Seit 20. Jahrhundert in Europa eingebürgert</li>
            <li>Gewicht: 4–10 kg, im Herbst bis über 12 kg</li>
            <li>Körperlänge: 60–95 cm</li>
            <li>Lebensraum: Wälder, Siedlungen, Dachböden, Stadtparks</li>
            <li>Sehr geschickte Vorderpfoten – Türgriffe, Behälter, Mülltonnen</li>
            <li>Nachtaktiv</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Allesfresser: Früchte, Nüsse, Eier, Jungvögel</li>
            <li>Kleinsäuger, Insekten, Amphibien</li>
            <li>Menschliche Abfälle → große Anpassungsfähigkeit</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Februar–März</li>
            <li>Tragzeit: ca. 65 Tage</li>
            <li>Wurfzeit: April–Mai</li>
            <li>Wurfgröße: 3–5 Junge</li>
            <li>Geburtsort: Baumhöhlen, Dachböden, Scheunen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Typische schwarze Gesichtsmaske</li>
            <li>Buschiger Ringelschwanz</li>
            <li>Graubraunes Fell</li>
            <li>Fährte: fünf Zehen mit „Menschenhand“-Form</li>
            <li>Losung: wurstartig, häufig mit Fruchtkernen</li>
            <li>Kletterfähig → Bäume, Dachrinnen, Schornsteine</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe</li>
            <li>Tollwut (selten)</li>
            <li>Spulwürmer (Baylisascaris procyonis)</li>
            <li>Trichinen</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 2/2 = 40</li>
            <li>Allesfressergebiss → vielseitig</li>
            <li>Breite Molaren zum Zerkleinern von Pflanzenmaterial</li>
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
