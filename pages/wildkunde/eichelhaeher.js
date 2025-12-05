import { useState } from "react";
import Image from "next/image";

export default function Eichelhaeher() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für den Eichelhäher?",
      a: [
        "Komplett schwarzes Gefieder",
        "Blauer Flügelspiegel",
        "Langer schwarzer Stoß"
      ],
      correct: 1,
    },
    {
      q: "Warum nennt man den Eichelhäher 'Polizei des Waldes'?",
      a: [
        "Weil er andere Vögel bewacht",
        "Weil er laut vor Gefahren warnt",
        "Weil er territoriale Streitkräfte bildet"
      ],
      correct: 1,
    },
    {
      q: "Welche ökologische Bedeutung hat der Eichelhäher?",
      a: [
        "Keine besondere Rolle",
        "Er frisst ausschließlich Früchte",
        "Er verbreitet Eicheln und hilft bei der Waldverjüngung"
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

        <h1 style={styles.title}>Eichelhäher (Garrulus glandarius)</h1>
        <p style={styles.subtitle}>
          Blauer Flügelspiegel · Polizei des Waldes · Lauter Warnruf · Verbreitet Eicheln
        </p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/eichelhaeher.jpg"
            alt="Eichelhäher"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Auffälliger Rabenvogel der Wälder</li>
            <li>Lebensraum: Laub- & Mischwälder, Parks, Gärten</li>
            <li>Sehr scheu im Wald, aber in Städten vertrauter</li>
            <li>Wichtig für die Verbreitung von Eicheln</li>
            <li>Ruft laut und warnt → „Polizei des Waldes“</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>

          <ul style={styles.list}>
            <li>Beiger Körper, schwarzer Schnurrbartstreif</li>
            <li>Leuchtend blauer Flügelspiegel (schwarz gebändert)</li>
            <li>Weiße und schwarze Partien im Flügel</li>
            <li>Schwarzer Schwanz</li>
            <li>Sehr lauter Warnruf: „rätsch-rätsch“</li>
          </ul>

        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Brutzeit: April–Juni</li>
            <li>Nest meist in Bäumen, gut getarnt</li>
            <li>Gelege: 4–6 Eier</li>
            <li>Starke Brutpflege durch beide Eltern</li>
          </ul>
        </section>

        {/* NAHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Eicheln (auch als Wintervorrat versteckt)</li>
            <li>Nüsse, Früchte, Beeren</li>
            <li>Insekten, Larven</li>
            <li>Kleintiere, Eier, Jungvögel</li>
            <li>Sehr vielseitiger Allesfresser</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>Extrem aufmerksam und wachsam</li>
            <li>Warnt laut vor Personen, Jägern & Raubwild</li>
            <li>Versteckt Eicheln → ermöglicht natürliche Waldverjüngung</li>
            <li>Sehr intelligent & lernfähig</li>
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
