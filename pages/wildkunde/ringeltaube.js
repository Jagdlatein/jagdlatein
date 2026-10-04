import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Ringeltaube() {
  const quiz = [
    {
      q: "Welches Merkmal ist typisch für erwachsene Ringeltauben?",
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
    <WildlifePortraitLayout slug="ringeltaube" title={"Ringeltaube (Columba palumbus)"} subtitle={"\r\n          Größte heimische Taube · Weißer Halsfleck · Weiße Flügelbinde · Wichtiges Federwild\r\n        "}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="ringeltaube" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Große heimische Wildtaube</li>
            <li>Erwachsene mit weißen Halsflecken und weißem Flügelband</li>
            <li>Jungvögeln fehlt der deutliche weiße Halsfleck zunächst</li>
            <li>Überwiegend graublaues Gefieder mit rötlicher Brust</li>
            <li>Nutzt Wälder, Feldgehölze, Parks und Siedlungsbereiche</li>
            <li>Nahrung überwiegend Samen, Früchte, Knospen und grüne Pflanzenteile</li>
            <li>Außerhalb der Brutzeit gesellig</li>
            <li>Zugverhalten variiert; viele mitteleuropäische Vögel sind Teilzieher</li>
            <li>Typischer mehrsilbiger gurrender Reviergesang</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Mehrere Jahresbruten möglich</li>
            <li>Schlichtes Zweignest meist in Bäumen oder Gebüschen</li>
            <li>Gelege gewöhnlich zwei Eier</li>
            <li>Beide Eltern beteiligen sich an Brut und Aufzucht</li>
            <li>Junge sind Nesthocker</li>
            <li>Eltern füttern zunächst nährstoffreiche Kropfmilch</li>
            <li>Brutzeit kann bis in den Spätsommer reichen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/099167/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.wald.rlp.de/wald/voegel/ringeltaube" target="_blank" rel="noopener noreferrer">Landesforsten Rheinland-Pfalz: Ringeltaube</a> · <a href="https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/ringeltaube-columba-palumbus" target="_blank" rel="noopener noreferrer">DJV: Ringeltaube</a></p>
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
