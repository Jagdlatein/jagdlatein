import Image from "next/image";

export default function Rotwild() {
  return (
    <main style={styles.main}>
      <div style={styles.wrap}>

        {/* TITELBLOCK */}
        <h1 style={styles.title}>Rotwild (Cervus elaphus)</h1>
        <p style={styles.subtitle}>Rotwild Hirsch</p>

        {/* BILD */}
        <div style={styles.imageBox}>
          <Image
            src="https://images.unsplash.com/photo-1602526216034-b3dfd0f559eb"
            alt="Rotwild Hirsch"
            width={1200}
            height={800}
            style={styles.image}
          />
        </div>

        {/* ABSCHNITTE */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Allgemeines</h2>
          <ul style={styles.list}>
            <li>Größtes heimisches Schalenwild</li>
            <li>Gewicht: Hirsch 120–220 kg, Tier 70–120 kg</li>
            <li>Lebensraum: Mittelgebirge, Alpen, große Waldgebiete</li>
            <li>Nahrung: Gräser, Kräuter, Rinde</li>
            <li>Brunftzeit: September / Oktober</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Zähne &amp; Gebiss</h2>
          <ul style={styles.list}>
            <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
            <li>Grandeln im Oberkiefer vorhanden</li>
            <li>Altersschätzung über Abnutzung der Molaren</li>
            <li>Kälber → Milchgebiss</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Erkennung</h2>
          <ul style={styles.list}>
            <li>Hirsch mit kräftigem Geweih</li>
            <li>Spiegel gelblich-weiß</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quizfragen</h2>
          <ul style={styles.list}>
            <li>Wann brunftet das Rotwild?</li>
            <li>Besitzt Rotwild Grandeln?</li>
            <li>Wie lautet die Zahnformel?</li>
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

  /* TITEL */
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

  /* BILD */
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

  /* ABSCHNITTE */
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
