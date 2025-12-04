import { useState } from "react";
import Image from "next/image";

export default function Iltis() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für den Iltis?",
      a: [
        "Starker Moschusgeruch",
        "Gelber Kehlfleck",
        "Runderer Kopf als beim Steinmarder"
      ],
      correct: 0,
    },
    {
      q: "Wo lebt der Iltis bevorzugt?",
      a: [
        "Dichte Hochwälder",
        "Feuchte Lebensräume wie Auen, Sümpfe, Bachläufe",
        "Trockene Gebirge"
      ],
      correct: 1,
    },
    {
      q: "Wie lautet die Zahnformel des Iltis?",
      a: [
        "I 3/3 · C 1/1 · P 4/4 · M 2/2 = 40",
        "I 3/3 · C 1/1 · P 3/3 · M 1/2 = 34",
        "I 3/3 · C 1/1 · P 4/3 · M 2/1 = 38"
      ],
      correct: 0,
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

        <h1 style={styles.title}>Iltis (Mustela putorius)</h1>
        <p style={styles.subtitle}>Stinkmarder · Feuchtgebiets-Raubwild</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/iltis.jpg"
            alt="Iltis"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Gewicht: 0,7–1,5 kg</li>
            <li>Körperlänge: 35–45 cm</li>
            <li>Lebensraum: Feuchtgebiete, Bachläufe, Auwälder</li>
            <li>Nahrung: Amphibien, Mäuse, Vögel, Eier, Insekten</li>
            <li>Typischer, starker Moschusgeruch → wichtiges Kennzeichen!</li>
            <li>Art der Wieselartigen</li>
            <li>Guter Schwimmer</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Dunkles Gesicht mit heller Maske</li>
            <li>Dunkelbraunes Fell, im Sommer heller</li>
            <li>Rundlicher Kopf · kurze Beine</li>
            <li>Starker Geruch aus Analdrüsen</li>
            <li>Losung: 6–12 cm, gedreht, spitz auslaufend, stechender Geruch</li>
            <li>Fährte: 2–3 cm, längliche Fußform</li>
          </ul>
        </section>

        {/* UNTERSCHIED ZUM AMERIKANISCHEN MINK */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschied zum Mink (Amerikanischer Nerz)</h2>
          <ul style={styles.list}>
            <li>Mink fast schwarz, Iltis braun → wichtig!</li>
            <li>Mink ohne helle Gesichtsmaske</li>
            <li>Iltis deutlich stärkerer Geruch</li>
            <li>Mink häufiger in tiefem Wasser jagend</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: März–April</li>
            <li>Tragzeit: ca. 40 Tage</li>
            <li>Wurfzeit: Mai</li>
            <li>Wurfgröße: 4–7 Junge</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Staupe</li>
            <li>Räude</li>
            <li>Fuchsbandwurm</li>
          </ul>
        </section>

        {/* GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss & Zähne</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 2/2 = 40</li>
            <li>Typisches Gebiss der Musteliden</li>
            <li>Ausgeprägte Reißzähne</li>
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
