import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Rotwild() {
  const quiz = [
    {
      q: "Wann brunftet das Rotwild?",
      a: ["Mai–Juni", "September–Oktober", "Januar–Februar"],
      correct: 1,
    },
    {
      q: "Besitzt Rotwild Grandeln?",
      a: ["Ja", "Nein"],
      correct: 0,
    },
    {
      q: "Wie lautet die Zahnformel?",
      a: [
        "I 0/3 · C 1/1 · P 3/3 · M 3/3 = 34",
        "I 3/3 · C 1/1 · P 4/4 · M 3/3 = 44",
      ],
      correct: 0,
    },
  ];

  const [selected, setSelected] = useState({});
  const [answered, setAnswered] = useState({});

  function choose(qIndex, aIndex) {
    setSelected((s) => ({ ...s, [qIndex]: aIndex }));
    setAnswered((s) => ({ ...s, [qIndex]: true }));
  }

  return (
    <WildlifePortraitLayout slug="rotwild" title={"Rotwild (Cervus elaphus)"} subtitle={"Rotwild – Hirsch, Tier & Kalb"}>
      <div style={styles.wrap}>



        {/* ⭐ Bild aus /public – funktioniert IMMER */}
        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/hirsch.jpg"
            alt="Rotwild Hirsch"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* --- STECKBRIEF --- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Große Hirschart; Hirsche sind meist schwerer als weibliche Tiere</li>
            <li>Lebensräume reichen von der Küste bis ins Gebirge; heute häufig große Waldgebiete</li>
            <li>Wiederkäuer: Gräser, Kräuter, Triebe und Rinde</li>
            <li>Meist getrennte Hirsch- und Kahlwildrudel; zum Kahlwild gehören weibliche Tiere und Jungtiere</li>
            <li>Sommerdecke rotbraun, Winterdecke graubraun</li>
            <li>Nur Hirsche tragen normalerweise ein Geweih</li>
            <li>Grandeln sind die zurückgebildeten oberen Eckzähne</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Hauptbrunft im September und Oktober</li>
            <li>Setzzeit meist Mai bis Juni, gewöhnlich ein Kalb</li>
            <li>Hirsche werfen ihr Geweih im späten Winter oder Frühjahr ab</li>
            <li>Das neue Geweih wächst bis zum Sommer unter Bast</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Hirsche können etwa 250 kg, weibliche Tiere etwa 170 kg erreichen</li>
            <li>Die Schulterhöhe liegt häufig ungefähr zwischen 120 und 150 cm</li>
            <li>Hirsch, Alttier und Kalb sind wichtige Geschlechts- und Altersbezeichnungen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 1/1 · P 3/3 · M 3/3 = 34</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Zahnabnutzung liefert nur eine ungefähre Altersschätzung</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/087879/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/rothirsch-cervus-elaphus" target="_blank" rel="noopener noreferrer">DJV: Rothirsch</a> · <a href="https://www.researchgate.net/publication/225782588_Supernumerary_incisiform_tooth_in_a_red_deer_Cervus_elaphus_L" target="_blank" rel="noopener noreferrer">Kierdorf et al.: Rothirschgebiss</a></p>
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
  main: { background: "#faf8f1", padding: "40px 20px", minHeight: "100vh" },
  wrap: { maxWidth: "900px", margin: "0 auto" },
  title: { fontSize: "42px", fontWeight: 800, marginBottom: "6px" },
  subtitle: { fontSize: "19px", marginBottom: "26px", color: "#5a5a5a" },
  imageBox: { borderRadius: "14px", overflow: "hidden", marginBottom: "32px" },
  image: { width: "100%", height: "auto" },
  section: { marginBottom: "36px" },
  sectionTitle: { fontSize: "26px", marginBottom: "14px" },
  list: { paddingLeft: "22px", lineHeight: "1.7", fontSize: "17px" },
  quizBlock: {
    marginBottom: "26px",
    padding: "16px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2d9c9",
  },
  quizQuestion: { fontSize: "18px", marginBottom: "12px", fontWeight: 600 },
  quizButton: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
    textAlign: "left",
    cursor: "pointer",
  },
};
