import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import Image from "next/image";

export default function Biber() {
  const quiz = [
    {
      q: "Wie heißt der typische Schwanz des Bibers?",
      a: ["Rundschwanz", "Kelle", "Bürste"],
      correct: 1,
    },
    {
      q: "Was ist ein klassisches Erkennungsmerkmal eines Bibers?",
      a: [
        "Schwarze Ohrpinsel",
        "Flacher, breiter Schwanz",
        "Komplett weißes Winterfell"
      ],
      correct: 1,
    },
    {
      q: "Was ist beim Umgang mit dem Biber in Deutschland zu beachten?",
      a: ["Ein Vorkommen berechtigt zum eigenmächtigen Fang","Grundstückseigentümer dürfen immer selbst eingreifen","Artenschutz beachten; Eingriffe benötigen die erforderliche behördliche Grundlage"],
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
    <WildlifePortraitLayout slug="biber" title={"Biber (Castor fiber)"} subtitle={"Streng geschützt · Landschaftsgestalter"}>
      <div style={styles.wrap}>




        <div style={styles.imageBox}>
          <Image
            src="/wildkunde/biber.jpg"
            alt="Biber"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Großes, an Gewässer gebundenes Nagetier</li>
            <li>Breiter, abgeflachter Schwanz heißt Kelle</li>
            <li>Orangerote Schneidezähne</li>
            <li>Lebt an stehenden und fließenden Gewässern mit geeigneter Ufervegetation</li>
            <li>Überwiegend dämmerungs- und nachtaktiv</li>
            <li>Pflanzenfresser: Kräuter, Blätter, Zweige und Rinde</li>
            <li>Gräbt Uferbaue oder errichtet Burgen aus Ästen</li>
            <li>Baut dort Dämme, wo dies zur Sicherung des Wasserstands nötig ist; nicht jede Ansiedlung hat einen Damm</li>
            <li>Nageaktivität und Wasserstau schaffen neue Lebensräume und können zugleich Nutzungskonflikte verursachen</li>
            <li>Eingriffe benötigen die jeweils erforderliche artenschutzrechtliche Grundlage</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Lebt in Familienrevieren mit Paar und Jungtieren</li>
            <li>Junge kommen meist Ende Mai bis Anfang Juni zur Welt</li>
            <li>Jungtiere verbleiben häufig bis zum Alter von zwei Jahren im elterlichen Revier</li>
            <li>Für den Winter werden unter anderem Äste unter Wasser bevorratet</li>
            <li>Wintervorrat und geeignetes Ufergehölz sind für den Lebensraum wichtig</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 1/1 · C 0/0 · P 1/1 · M 3/3 = 20</li>
            <li>Formel für das typische vollständige bleibende Gebiss; individuelle Zahnverluste sind möglich</li>
            <li>Schneidezähne wachsen kontinuierlich nach</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.bfn.de/artenportraits/castor-fiber" target="_blank" rel="noopener noreferrer">Bundesamt für Naturschutz: Artprofil</a> · <a href="https://environnement.public.lu/dam-assets/fr/conserv_nature/publications/2022/anf-europaische-biber-web.pdf" target="_blank" rel="noopener noreferrer">Naturverwaltung Luxemburg: Europäischer Biber</a></p>
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
