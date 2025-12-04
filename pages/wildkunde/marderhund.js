import { useState } from "react";
import Image from "next/image";

export default function Marderhund() {
  const quiz = [
    {
      q: "Woher stammt der Marderhund ursprünglich?",
      a: ["Südamerika", "Asien", "Afrika"],
      correct: 1,
    },
    {
      q: "Wie verhält sich der Marderhund im Winter?",
      a: ["Hält Winterruhe", "Wandert in den Süden", "Bleibt durchgehend aktiv"],
      correct: 0,
    },
    {
      q: "Wie viele Zähne hat der Marderhund?",
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

        <h1 style={styles.title}>Marderhund (Nyctereutes procyonoides)</h1>
        <p style={styles.subtitle}>Neozon · Allesfresser</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/marderhund.jpg"
            alt="Marderhund"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Ursprung: Ostasien</li>
            <li>In Europa etabliert durch frühere Pelztierzuchten</li>
            <li>Gewicht: 4–10 kg</li>
            <li>Körperlänge: 50–70 cm · Schwanz 15–25 cm</li>
            <li>Nahrung: Früchte, Insekten, Eier, Kleintiere, Aas</li>
            <li>Geringe Fluchtdistanz · häufig langsam und trollend</li>
            <li>Hervorragender Geruchssinn</li>
          </ul>
        </section>

        {/* LEBENSWEISE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensweise</h2>
          <ul style={styles.list}>
            <li>Nachtaktiv</li>
            <li>Sehr standorttreu</li>
            <li>Lebt häufig in Fuchs- oder Dachsbaue</li>
            <li>Hält Winterruhe (einziger Canide!)</li>
            <li>Monogam lebend → Paare bleiben oft lebenslang zusammen</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Februar–März</li>
            <li>Tragzeit: ca. 60 Tage</li>
            <li>Wurfzeit: April–Mai</li>
            <li>Wurfgröße: 4–8 Jungtiere</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Typische schwarze Gesichtsmaske ähnlich Waschbär</li>
            <li>Langhaariges, buschiges Fell</li>
            <li>Laufstil: trollend, schwerfällig</li>
            <li>Fährte: 4–5 cm, fünf Zehen sichtbar (wie Hund, aber kleiner)</li>
            <li>Losung: sehr variabel durch allesfressende Ernährung</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe (häufig)</li>
            <li>Tollwut (in einigen Regionen Europas Nachweise)</li>
            <li>Räude</li>
            <li>Trichinen (wichtig für Lebensmittelhygiene!)</li>
            <li>Fuchsbandwurm</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 2/2 = 40</li>
            <li>Allesfressergebiss</li>
            <li>Starke Molaren zum Zermahlen pflanzlicher Nahrung</li>
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
