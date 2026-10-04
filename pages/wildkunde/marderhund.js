import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
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
      a: ["Kann in strengen Wintern Winterruhe halten","Wandert stets in den Süden","Bleibt bei jedem Winterwetter durchgehend aktiv"],
      correct: 0,
    },
    {
      q: "Wie viele Zähne hat der Marderhund?",
      a: ["38", "40", "42"],
      correct: 2,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qi, ai) {
    setSelected((x) => ({ ...x, [qi]: ai }));
    setAnswered((x) => ({ ...x, [qi]: true }));
  }

  return (
    <WildlifePortraitLayout slug="marderhund" title={"Marderhund (Nyctereutes procyonoides)"} subtitle={"Neozon · Allesfresser"}>
      <div style={styles.wrap}>




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
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Hundeartiger mit ursprünglichem Verbreitungsgebiet in Ostasien</li>
            <li>Europäische Bestände gehen unter anderem auf Aussetzungen zur Pelznutzung in Osteuropa zurück</li>
            <li>Kopf-Rumpf-Länge ungefähr 50 bis 70 cm</li>
            <li>Gewicht schwankt saisonal, häufig etwa 3 bis 12 kg</li>
            <li>Langhaariges Fell und dunkle Gesichtszeichnung; Rute ohne Waschbär-Ringelung</li>
            <li>Bevorzugt feuchte, deckungsreiche und strukturreiche Landschaften</li>
            <li>Überwiegend nachtaktiv</li>
            <li>Allesfresser mit tierischer und pflanzlicher Nahrung sowie Aas</li>
            <li>Nutzt häufig Fuchs- und Dachsbaue</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Ranz hauptsächlich Februar bis April</li>
            <li>Tragzeit ungefähr acht Wochen</li>
            <li>Wurfgröße variabel, häufig fünf bis sieben Welpen</li>
            <li>Beide Eltern können die Jungen versorgen</li>
            <li>Paare bleiben oft über längere Zeit zusammen</li>
            <li>Bei strengen Wintern Winterruhe möglich; bei mildem Wetter häufig weiter aktiv</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 3/3 · C 1/1 · P 4/4 · M 2/3 = 42</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/223538/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.mdpi.com/2076-2615/13/15/2437" target="_blank" rel="noopener noreferrer">Anatomische Studie: Marderhundgebiss (2023)</a></p>
          <p>Zeiten und Größen sind typische Richtwerte und können regional oder individuell abweichen. Eine Artbeschreibung ersetzt keine Prüfung der örtlichen Jagd- und Schutzbestimmungen.</p>
          <h2 style={styles.sectionTitle}>Quiz</h2>

          {quiz.map((q, qi) => (
            <div key={qi} style={styles.quizBlock}>
              <p style={styles.quizQuestion}>{q.q}</p>
              {answered[qi] && (
                <p role="status">
                  {selected[qi] === q.correct ? "Richtig." : "Noch nicht richtig."}
                  {" "}Die richtige Antwort lautet: {q.a[q.correct]}
                </p>
              )}

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
                    disabled={Boolean(answered[qi])}
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
    </WildlifePortraitLayout>
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
