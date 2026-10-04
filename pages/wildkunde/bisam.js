import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Bisam() {
  const quiz = [
    {
      q: "Welches Merkmal unterscheidet den Bisam eindeutig von der Nutria?",
      a: [
        "Orangerote Zähne",
        "Seitlich abgeflachter Schwanz",
        "Sehr großes Körpergewicht"
      ],
      correct: 1,
    },
    {
      q: "Welches Körpergewicht erreicht ein Bisam ungefähr?",
      a: ["1–2 kg", "5–9 kg", "10–15 kg"],
      correct: 0,
    },
    {
      q: "Wo lebt der Bisam bevorzugt?",
      a: [
        "Trockene Wälder",
        "Flüsse, Seen und Röhrichtzonen",
        "Alpine Hochlagen"
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
    <WildlifePortraitLayout slug="bisam" title={"Bisam (Ondatra zibethicus)"} subtitle={"Kleines Wassernagetier · leicht mit Nutria zu verwechseln"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <WildlifePhoto slug="bisam" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Große Wühlmaus mit ursprünglichem Verbreitungsgebiet in Nordamerika</li>
            <li>Kopf-Rumpf-Länge bis etwa 40 cm; Gewicht bis ungefähr 2 kg</li>
            <li>Nackter, seitlich abgeplatteter Schwanz von ungefähr 20 bis 25 cm</li>
            <li>Gedrungener Körper mit kurzem Kopf</li>
            <li>Fellfarbe variiert von dunkel bis zu helleren Brauntönen</li>
            <li>Schwimmborsten an den Zehen unterstützen die Fortbewegung im Wasser</li>
            <li>Kleiner als Biber und Nutria</li>
            <li>Nahrung vor allem Wasser- und Uferpflanzen, zeitweise auch Muscheln, Krebse und Amphibien</li>
            <li>Artbestimmung schwimmender Tiere kann schwierig sein</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum und Management</h2>
          <ul style={styles.list}>
            <li>Besiedelt geeignete Gewässerufer und Feuchtgebiete</li>
            <li>Baue und Fraßaktivität können Uferstrukturen und Vegetation beeinflussen</li>
            <li>Management invasiver Arten richtet sich nach den örtlichen rechtlichen Voraussetzungen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 0/0 · M 3/3 = 16</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Schneidezähne wachsen kontinuierlich nach</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://lfu.brandenburg.de/lfu/de/aufgaben/natur/artenschutz/invasive-arten/steckbriefe/bisam/" target="_blank" rel="noopener noreferrer">Landesamt für Umwelt Brandenburg</a> · <a href="https://www.bfn.de/sites/default/files/2025-07/EU-VO-Art-19_MMB-Ondatra-zibethicus_Version-2019-05.pdf" target="_blank" rel="noopener noreferrer">BfN: Bisam, Management- und Maßnahmenblatt</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
