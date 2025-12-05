import { useState } from "react";
import Image from "next/image";

export default function Ringeltaube() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für die Ringeltaube?",
      a: [
        "Schwarzer Kopf und grauer Körper",
        "Weißer Halsfleck und weiße Flügelbinde",
        "Auffälliger blauer Flügelspiegel"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Ringeltauben sind die kleinsten heimischen Tauben",
        "Ringeltauben sind die größten heimischen Wildtauben",
        "Ringeltauben leben ausschließlich im Gebirge"
      ],
      correct: 1,
    },
    {
      q: "Womit ernährt sich die Ringeltaube hauptsächlich?",
      a: [
        "Aas und kleine Säugetiere",
        "Getreide, Samen, Bucheckern, Knospen",
        "Fische und Insektenlarven"
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

        <h1 style={styles.title}>Ringeltaube (Columba palumbus)</h1>
        <p style={styles.subtitle}>
          Größte heimische Taube · Weißer Halsfleck · Weiße Flügelbinde · Wichtiges Federwild
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/ringeltaube.jpg"
            alt="Ringeltaube"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Größte heimische Taube</li>
            <li>Sehr häufig in Städten, Wäldern, Parks, Agrarlandschaften</li>
            <li>Wichtige jagdbare Art (stark verbreitet)</li>
            <li>Charakteristischer Ruf: „gu-gu-gu-gugúu“</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <ul style={styles.list}>
            <li>Graublaues Gefieder</li>
            <li>Weiße Flügelbinde (im Flug sehr auffällig)</li>
            <li>Weißer Halsfleck beidseitig</li>
            <li>Rosa Brust</li>
            <li>Gelber Schnabel</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: März–August</li>
            <li>Mehrere Jahresbruten möglich</li>
            <li>Nest sehr schlicht, meist in Bäumen oder Hecken</li>
            <li>Gelege: 2 weiße Eier</li>
            <li>Eltern füttern „Kropfmilch“ → wichtig in Prüfungen!</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Getreide, Samen, Bucheckern, Eicheln</li>
            <li>Knospen und Grünpflanzen</li>
            <li>Raps, Mais, Weizen → teilweise Schaden auf Feldern</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Oft in Schwärmen, besonders im Winter</li>
            <li>Standvogel bis Teilzieher</li>
            <li>Sehr gutes Flugvermögen</li>
            <li>Vertraut in Städten</li>
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
