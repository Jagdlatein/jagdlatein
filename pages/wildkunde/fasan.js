import { useState } from "react";
import Image from "next/image";

export default function Fasan() {
  const quiz = [
    {
      q: "Wie nennt man den männlichen Fasan?",
      a: ["Henne", "Hahn", "Gockel"],
      correct: 1,
    },
    {
      q: "Wo hält sich der Fasan bevorzugt auf?",
      a: [
        "Dichte Wälder",
        "Offenes Feld mit Hecken und Deckung",
        "Hochgebirge"
      ],
      correct: 1,
    },
    {
      q: "Welche Aussage ist richtig?",
      a: [
        "Fasanen sind Bodenbrüter",
        "Fasanen brüten auf Bäumen",
        "Fasanen brüten in Erdhöhlen"
      ],
      correct: 0,
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
        
        <h1 style={styles.title}>Fasan (Phasianus colchicus)</h1>
        <p style={styles.subtitle}>Bodenbrüter · Kulturfolger · Niederwild</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/fasan.jpg"
            alt="Fasan"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Herkunft: Asien, seit Jahrhunderten in Europa eingebürgert</li>
            <li>Körperlänge: Hahn bis 90 cm (mit langem Stoß)</li>
            <li>Gewicht: 1,1–1,7 kg</li>
            <li>Lebensraum: Feldflur, Hecken, Feldgehölze, Waldränder</li>
            <li>Bodenbrüter → sehr störungsanfällig</li>
            <li>Wärmeliebend · dichte Deckung notwendig</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Hahn:</strong> bunt gefärbt, grün-metallischer Kopf, rote Rosen</li>
            <li><strong>Henne:</strong> braun gemustert, sehr gute Tarnung</li>
            <li>Typischer langer, spitzer Stoß (Schwanzfedern)</li>
            <li>Flucht: kurzer schneller Aufflug, dann Gleitflug</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Tagaktiv</li>
            <li>Männchen lautstark, Balzrufe im Frühjahr</li>
            <li>Hühnerartige Flucht → erst laufen, dann auffliegen</li>
            <li>Leben in kleinen Trupps („Sprünge“)</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: April–Mai</li>
            <li>Gelege: 8–15 Eier</li>
            <li>Brutdauer: ca. 24 Tage</li>
            <li>Junge: Nestflüchter, folgen der Henne sofort</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Pflanzlich: Körner, Samen, Beeren, Knospen</li>
            <li>Tierisch: Insekten, Larven, Schnecken</li>
            <li>Junge benötigen Eiweiß → Insekten wichtig!</li>
          </ul>
        </section>

        {/* HEGE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Hege & Bedeutung</h2>
          <ul style={styles.list}>
            <li>Braucht Deckung: Buntbrachen, Hecken, Saumbiotope</li>
            <li>Stark abhängig vom Wetter im Frühjahr</li>
            <li>Prädatoren: Fuchs, Marder, Habicht</li>
            <li>Wichtig für Niederwildjagd und Landschaftspflege</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Kokzidien</li>
            <li>Wurmbefall</li>
            <li>Newcastle-Krankheit (Geflügelkrankheit)</li>
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
