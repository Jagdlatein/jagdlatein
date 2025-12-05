import { useState } from "react";
import Image from "next/image";

export default function Kanadagans() {
  const quiz = [
    {
      q: "Woran erkennt man die Kanadagans eindeutig?",
      a: [
        "Komplett weißer Kopf",
        "Schwarzer Kopf und Hals mit weißem Kinnband",
        "Roter Schnabel und blaue Beine"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Die Kanadagans ist ein heimischer Brutvogel",
        "Die Kanadagans ist ein Neozoon aus Nordamerika",
        "Die Kanadagans kommt nur im Hochgebirge vor"
      ],
      correct: 1,
    },
    {
      q: "Welche bevorzugte Nahrung hat die Kanadagans?",
      a: [
        "Muscheln und Schnecken",
        "Fische als Hauptnahrung",
        "Gräser, Kräuter, Wasserpflanzen"
      ],
      correct: 2,
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

        <h1 style={styles.title}>Kanadagans (Branta canadensis)</h1>
        <p style={styles.subtitle}>
          Neozoon aus Nordamerika · Markantes weißes Kinnband · Große, kräftige Gans
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/kanadagans.jpg"
            alt="Kanadagans"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Große, stark verbreitete Neozoen-Art</li>
            <li>Ursprünglich aus Nordamerika</li>
            <li>Lebensraum: Seen, Stadtparks, Flüsse, Feuchtgebiete</li>
            <li>Sehr anpassungsfähig und standorttreu</li>
            <li>Oft in großen, teils aggressiven Gruppen</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <ul style={styles.list}>
            <li>Schwarzer Kopf und schwarzer langer Hals</li>
            <li>Typisches weißes „Kinnband“ (Backenfleck)</li>
            <li>Braun-grauer Körper</li>
            <li>Hellere Brust und Bauch</li>
            <li>Im Flug ruhiger, kraftvoller Schlag</li>
          </ul>

        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–Mai</li>
            <li>Nest: Bodenbrüter, häufig in Ufernähe oder Inseln</li>
            <li>Gelege: 4–7 Eier</li>
            <li>Partnerbindung oft lebenslang</li>
            <li>Küken sehr früh mobil, folgen Eltern sofort</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gräser, Kräuter, junge Triebe</li>
            <li>Ackerflächen (Getreide, Raps)</li>
            <li>Wasserpflanzen</li>
          </ul>
        </section>

        {/* ZUGVERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zugverhalten</h2>
          <ul style={styles.list}>
            <li>Standvogel bis Teilzieher</li>
            <li>Stadtpopulationen oft ganzjährig ortstreu</li>
            <li>Manchmal V-Formation ähnlich der Graugans</li>
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
