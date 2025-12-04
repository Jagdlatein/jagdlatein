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
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 35–45 cm</li>
            <li>Gewicht: 1–2 kg</li>
            <li>Lebensraum: Steppen, Wiesen, Parks, Waldränder</li>
            <li>Sehr soziale Art, lebt in Kolonien</li>
            <li>Tagaktiv und dämmerungsaktiv</li>
          </ul>
        </section>

        {/* BAU-LEBEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Bau & Sozialstruktur</h2>
          <ul style={styles.list}>
            <li>Bauen große unterirdische Röhrensysteme (Kaninchenbau)</li>
            <li>Familiengruppen mit strenger Rangordnung</li>
            <li>Mehrere Eingänge, Fluchtgänge, Wurfhöhlen</li>
            <li>Kotplätze → für Reviermarkierung</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Kürzere Ohren</strong> als der Feldhase</li>
            <li>Kürzere Hinterläufe → weniger Sprungkraft</li>
            <li>Losung: kleine, trockene Kügelchen</li>
            <li>Fellfarbe: grau-braun, unauffällig</li>
            <li>Bewegung: hoppelt, keine langen Sprints</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Februar–August</li>
            <li>3–6 Würfe pro Jahr</li>
            <li>Wurfgröße: 3–6 Junge</li>
            <li>Jungtiere: <strong>Nesthocker</strong></li>
            <li>Geburt in tiefer Wurfhöhle mit Fell gepolstert</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gräser, Kräuter, Feldfrüchte</li>
            <li>Rinde, junge Triebe</li>
            <li>Sehr gute Verwerter → hoher Reproduktionsdruck</li>
          </ul>
        </section>

        {/* SCHÄDEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Wildschäden</h2>
          <ul style={styles.list}>
            <li>Schäden an landwirtschaftlichen Kulturen</li>
            <li>Unterhöhlung von Böschungen</li>
            <li>Verschmutzung von Wiesen (Parasitenrisiko)</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Myxomatose</li>
            <li>RHD (Rabbit Hemorrhagic Disease)</li>
            <li>Parasiten: Würmer, Haarlinge</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 2/1 · C 0/0 · P 3/2 · M 3/3 = 28</li>
            <li>Ständig nachwachsende Nagezähne</li>
            <li>Unterkiefer breiter als beim Feldhasen</li>
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
