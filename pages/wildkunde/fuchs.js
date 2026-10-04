import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { useState } from "react";
import WildlifePhoto from "../../components/WildlifePhoto";

export default function Fuchs() {
  const quiz = [
    {
      q: "Wann liegt überwiegend die Ranzzeit des Fuchses?",
      a: ["Dezember–Februar", "Mai–Juni", "September"],
      correct: 0,
    },
    {
      q: "Welche Merkmale können bei Fuchslosung auftreten, ohne allein die Art zu beweisen?",
      a: [
        "Länglich, mit Haar- oder Knochenresten",
        "Rund und trocken",
        "Flüssig und dunkelbraun"
      ],
      correct: 0,
    },
    {
      q: "Wie viele Zähne hat der Fuchs?",
      a: ["30", "38", "42"],
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
    <WildlifePortraitLayout slug="fuchs" title={"Fuchs (Vulpes vulpes)"} subtitle={"Rüde · Fähe · Welpen"}>
      <div style={styles.wrap}>




        {/* Bild */}
        <div style={styles.imageBox}>
          <WildlifePhoto slug="fuchs" />
        </div>

        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Lebensraum, Merkmale und Nahrung</h2>
          <ul style={styles.list}>
            <li>Hundeartiger Beutegreifer mit sehr breitem Lebensraumspektrum</li>
            <li>Kommt in Wald, offener Kulturlandschaft und Siedlungen vor</li>
            <li>Überwiegend dämmerungs- und nachtaktiv</li>
            <li>Allesfresser: Mäuse, weitere Kleintiere, Wirbellose, Aas und Früchte</li>
            <li>Rötliche Oberseite und helle Unterseite; Fellfarbe variiert</li>
            <li>Buschiger Schwanz heißt Lunte; eine helle Schwanzspitze wird Blume genannt</li>
            <li>Gräbt eigene Baue und nutzt auch Dachsbaue</li>
            <li>Geruchs- und Gehörsinn sind sehr gut entwickelt</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fortpflanzung und Jahresverlauf</h2>
          <ul style={styles.list}>
            <li>Ranz hauptsächlich Dezember bis Februar</li>
            <li>Tragzeit knapp acht Wochen</li>
            <li>Welpen kommen überwiegend im März und April zur Welt</li>
            <li>Wurfgröße variabel, häufig vier bis sechs Welpen</li>
            <li>Fähe ist das Weibchen, Rüde das Männchen</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gesundheit und Nachweise</h2>
          <ul style={styles.list}>
            <li>Fuchsbandwurm und Räude können vorkommen; keine Häufigkeit allein aus dem Erscheinungsbild ableiten</li>
            <li>Deutschland gilt seit 2008 als frei von terrestrischer Tollwut; Fledermaus-Lyssaviren kommen weiterhin vor</li>
            <li>Losung kann langgezogen, gedreht und mit Nahrungsresten durchsetzt sein; Form allein beweist die Art nicht</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Vertiefung und Abgrenzung</h2>
          <ul style={styles.list}>
            <li>Welpen werden meist ungefähr zwei Monate gesäugt</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Spuren als Hinweise</h2>
          <ul style={styles.list}>
            <li>Losung kann länglich und zugespitzt sein; oft sind Haare, Kerne oder andere Nahrungsreste sichtbar</li>
            <li>Ähnliche Losung kann von anderen Arten stammen; ein einzelnes Merkmal beweist die Art nicht</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Gesundheit und Hygiene</h2>
          <ul style={styles.list}>
            <li>Räude wird durch Milben ausgelöst und kann Juckreiz und Haarverlust verursachen; Haarverlust allein ist keine Diagnose</li>
            <li>Füchse können Endwirte des Kleinen Fuchsbandwurms sein; sichtbare Gesundheit schließt Parasiten nicht aus</li>
            <li>Deutschland gilt seit 2008 als frei von klassischer terrestrischer Tollwut; Fledermaus-Lyssaviren und Importfälle bleiben möglich</li>
            <li>Verdächtige Wildtiere und Kot nicht ungeschützt anfassen; bei möglichem Tollwutkontakt ärztlich abklären lassen</li>
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
          <p style={styles.subtitle}>Biologiequellen (geprüft am 4. Oktober 2026): <a href="https://www.wildtierportal.bayern.de/wildtiere_bayern/085227/index.php" target="_blank" rel="noopener noreferrer">Wildtierportal Bayern: Biologie</a> · <a href="https://www.rki.de/SharedDocs/FAQs/DE/Tollwut/FAQ_Liste.html?nn=16907352" target="_blank" rel="noopener noreferrer">RKI: Tollwut</a> · <a href="https://jagdverband.it/fuchs-2/" target="_blank" rel="noopener noreferrer">Südtiroler Jagdverband: Fuchsmerkmale</a> · <a href="https://fuchsratgeber.ch/u6.html" target="_blank" rel="noopener noreferrer">SWILD/INFOX: Fuchslosung erkennen</a> · <a href="https://www.fli.de/de/aktuelles/kurznachrichten/neues-einzelansicht/aktuelles-zur-tollwut-in-deutschland/" target="_blank" rel="noopener noreferrer">FLI: Tollwut in Deutschland, 20. Februar 2026</a> · <a href="https://www.rki.de/DE/Aktuelles/Publikationen/Epidemiologisches-Bulletin/2026/27_26.pdf?__blob=publicationFile&amp;v=3" target="_blank" rel="noopener noreferrer">RKI: Tollwut, Epidemiologisches Bulletin 27/2026</a> · <a href="https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf" target="_blank" rel="noopener noreferrer">Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)</a></p>
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
