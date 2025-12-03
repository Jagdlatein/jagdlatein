import Image from "next/image";

export default function Rotwild() {
  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        {/* TITELBLOCK */}
        <h1 style={styles.title}>Rotwild (Cervus elaphus)</h1>
        <p style={styles.subtitle}>Rotwild – Hirsch, Tier & Kalb</p>

        {/* BILD */}
        <div style={styles.imageBox}>
          <Image
            src="https://images.unsplash.com/photo-1602526216034-b3dfd0f559eb?auto=format&fit=crop&w=1600&q=80"
            alt="Rotwild Hirsch"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ABSCHNITTE */}
        {/* ALLGEMEINES */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Größtes heimisches Schalenwild</li>
            <li>Gewicht: Hirsch 120–220 kg · Tier 70–120 kg</li>
            <li>Körperlänge 170–240 cm · Schulterhöhe 110–140 cm</li>
            <li>
              Lebensraum: Wälder, Gebirge, weitläufige Waldlandschaften,
              Rotwildgebiete
            </li>
            <li>Nahrung: Gräser, Kräuter, Knospen, Blätter, Rinde, Eicheln, Bucheckern</li>
            <li>Sozialstruktur: Rudel · Leittier = erfahrenes Alttier</li>
            <li>Brunftzeit: September – Oktober</li>
            <li>Setzzeit: Mai – Juni (Alttiere setzen 1 Kalb)</li>
            <li>Feinddruck: Wolf, Luchs, Mensch</li>
          </ul>
        </section>

        {/* ZÄHNE & GEBISS */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zähne &amp; Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Grandeln im Oberkiefer vorhanden (rudimentäre Eckzähne)</li>
            <li>Molaren weisen deutliche Altersabnutzung auf</li>
            <li>Kälber → vollständiges Milchgebiss</li>
            <li>Ab ca. 13–15 Monaten → Zahnwechsel abgeschlossen</li>
            <li>Altersschätzung: Kaufläche, Zahnkronenabrieb, Schliff</li>
          </ul>
        </section>

        {/* ERKENNUNG */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung & Merkmale</h2>
          <ul style={styles.list}>
            <li>Hirsch mit starkem Stangengeweih (bis 16 Enden und mehr)</li>
            <li>Spiegel gelblich-weiß, langgezogen</li>
            <li>Sommerfell rotbraun · Winterfell graubraun</li>
            <li>Kälber gefleckt (Sommertarnung)</li>
            <li>Losung: olivenförmig, dunkel, typisches „Rotwildbild“</li>
            <li>Fährte: 6–8 cm · kräftig · tiefer Abdruck durch hohes Gewicht</li>
          </ul>
        </section>

        {/* VERHALTEN */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Verhalten</h2>
          <ul style={styles.list}>
            <li>dämmerungs- und nachtaktiv</li>
            <li>Rudelbildung mit strenger Sozialhierarchie</li>
            <li>Hirsche im Sommer oft in „Hirschrudeln“</li>
            <li>Brunft: Röhren, Kämpfe, Suhlen, Imponiergehabe</li>
            <li>Winterstrategien: Energie sparen, geringere Aktivität</li>
            <li>Hirsche fegen das Geweih im Frühling</li>
          </ul>
        </section>

        {/* GEWEIH */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Geweihentwicklung</h2>
          <ul style={styles.list}>
            <li>1. Kopf (jährig): Spießer</li>
            <li>2.–5. Kopf: zunehmende Endenzahl, Masse, Krone</li>
            <li>ab 6.–12. Kopf: Höchstentwicklung möglich</li>
            <li>Kälber & Tiere → kein Geweih</li>
            <li>Abwurf: Februar/März · Neubildung unter Bast</li>
          </ul>
        </section>

        {/* QUIZ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quizfragen</h2>
          <ul style={styles.list}>
            <li>Wann beginnt die Brunftzeit des Rotwilds?</li>
            <li>Wie lautet die Zahnformel?</li>
            <li>Welche Aufgabe hat das Leittier?</li>
            <li>Wie unterscheidet man Hirsch – Tier – Kalb?</li>
            <li>Was sind Grandeln?</li>
          </ul>
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
    display: "block",
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
};
