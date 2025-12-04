import { useState } from "react";
import Image from "next/image";

export default function Feldhase() {
  const quiz = [
    {
      q: "Welche Fellfarbe haben die Löffel des Feldhasen an der Spitze?",
      a: ["Komplett weiß", "Schwarz", "Dunkelbraun gesprenkelt"],
      correct: 1,
    },
    {
      q: "Zu welcher Jungtierform zählt der Junghase?",
      a: ["Nesthocker", "Nestflüchter", "Dauernestflüchter"],
      correct: 2,
    },
    {
      q: "Wie bewegt sich der Feldhase bei Gefahr?",
      a: [
        "Langer, gerader Sprint",
        "Zickzack/Haken schlagen",
        "Springt auf Bäume"
      ],
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

        <h1 style={styles.title}>Feldhase (Lepus europaeus)</h1>
        <p style={styles.subtitle}>Typisches Niederwild des Offenlandes</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/feldhase.jpg"
            alt="Feldhase"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 3–6 kg</li>
            <li>Körperlänge: 50–70 cm</li>
            <li>Lebensraum: Feldfluren, Wiesen, Heckenbereiche</li>
            <li>Nahrung: Kräuter, Gräser, Feldfrüchte, Rinde</li>
            <li>Einzelgänger</li>
            <li>Ruheplatz: <strong>Sasse</strong> (flache Bodenmulde)</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li><strong>Löffelspitzen schwarz</strong> → wichtiges Erkennungsmerkmal</li>
            <li>Lange Hinterläufe</li>
            <li>Rötlich-graues Fell</li>
            <li>Langer Körper, hohe Fluchtgeschwindigkeit</li>
            <li>Fährte: V-förmig, Hinterläufe deutlich länger abgedrückt</li>
            <li>Losung: rundlich-oval, hellbraun bis dunkel</li>
          </ul>
        </section>

        {/* SPRINGEN & FLUCHT */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Flucht- & Bewegungsverhalten</h2>
          <ul style={styles.list}>
            <li>Typisch: <strong>Haken schlagen</strong> zur Verwirrung von Feinden</li>
            <li>Sehr schnelle Sprints über kurze Distanzen</li>
            <li>Verharrt reglos in der Sasse bei Gefahr</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Rammelzeit: Januar–September</li>
            <li>3–4 Würfe pro Jahr möglich</li>
            <li>Wurfgröße: 1–4 Junge</li>
            <li>Jungtiere: <strong>Dauernestflüchter</strong></li>
            <li>Gebären in freier Deckung, nicht im Bau</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>EBHS (Europäische Hasenseuche)</li>
            <li>Tularämie</li>
            <li>Kokzidien</li>
            <li>Räude (selten)</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 2/1 · C 0/0 · P 3/2 · M 3/3 = 28</li>
            <li>Typisches Nagerähnliches Gebiss, aber kein Nagetier!</li>
            <li>Ständig nachwachsende Schneidezähne</li>
          </ul>
        </section>

        {/* UNTERSCHIED ZUM KANINCHEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zum Wildkaninchen</h2>
          <ul style={styles.list}>
            <li>Hase → Einzelgänger · Kaninchen → Kolonie</li>
            <li>Hase → Sasse · Kaninchen → Bau</li>
            <li>Junghase → Dauernestflüchter · Kaninchen → Nesthocker</li>
            <li>Hase → längere Läufe & Ohren</li>
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
