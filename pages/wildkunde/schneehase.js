import { useState } from "react";
import Image from "next/image";

export default function Schneehase() {
  const quiz = [
    {
      q: "Welche Fellfarbe trägt der Schneehase im Winter?",
      a: ["Graubraun", "Komplett weiß", "Dunkel gesprenkelt"],
      correct: 1,
    },
    {
      q: "Wo lebt der Schneehase bevorzugt?",
      a: ["Wälder im Tiefland", "Offene Feldflur", "Hochlagen der Alpen und Mittelgebirge"],
      correct: 2,
    },
    {
      q: "Welche Aussage trifft zu?",
      a: [
        "Schneehase ist größer als Feldhase",
        "Schneehase ist kleiner und kompakter",
        "Schneehase lebt ausschließlich im Bau"
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

        <h1 style={styles.title}>Schneehase (Lepus timidus)</h1>
        <p style={styles.subtitle}>An kalte Bergregionen angepasst</p>

        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/schneehase.jpg"
            alt="Schneehase"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Körperlänge: 45–60 cm</li>
            <li>Gewicht: 2–4 kg (kleiner als Feldhase)</li>
            <li>Lebensraum: Alpen, Mittelgebirge, Tundra-ähnliche Zonen</li>
            <li>Sehr gute Tarnung durch saisonalen Fellwechsel</li>
            <li>Einzelgänger</li>
            <li>Ruheplatz: Mulde, ähnlich der Sasse</li>
          </ul>
        </section>

        {/* FELLWECHSEL */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fellwechsel & Anpassung</h2>
          <ul style={styles.list}>
            <li><strong>Sommer:</strong> graubraun, gesprenkelt</li>
            <li><strong>Winter:</strong> komplett weiß (Schneekamouflage)</li>
            <li>Ohren („Löffel“) kürzer, aber mit schwarzer Spitze</li>
            <li>Fellwechsel ausgelöst durch Tageslichtlänge, nicht Temperatur</li>
          </ul>
        </section>

        {/* ERNÄHRUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Nahrung</h2>
          <ul style={styles.list}>
            <li>Gräser, Kräuter, Knospen, Zweige</li>
            <li>Im Winter: Rinde, Moos, Heidekraut</li>
            <li>Sehr genügsam, an karge Regionen angepasst</li>
          </ul>
        </section>

        {/* FORTPFLANZUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung</h2>
          <ul style={styles.list}>
            <li>Paarungszeit: Februar–Juli</li>
            <li>2–3 Würfe pro Jahr</li>
            <li>Wurfgröße: 1–3 Junge</li>
            <li>Junghasen: <strong>Dauernestflüchter</strong></li>
          </ul>
        </section>

        {/* FÄHRTE & LOSUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fährte & Losung</h2>
          <ul style={styles.list}>
            <li>Fährte kleiner und runder als beim Feldhasen</li>
            <li>Hinterlaufabdruck ca. 6–7 cm</li>
            <li>Losung: kleiner, rundlicher</li>
          </ul>
        </section>

        {/* KRANKHEITEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Krankheiten</h2>
          <ul style={styles.list}>
            <li>Tularämie</li>
            <li>Kokzidiose</li>
            <li>EBHS (Hasenseuche) – selten</li>
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
