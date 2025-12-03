// pages/wildkunde/index.js

export default function WildkundeIndex() {
  const kategorien = [
    {
      title: "Schalenwild",
      items: [
        { name: "Rotwild", slug: "rotwild" },
        { name: "Damwild", slug: "damwild" },
        { name: "Rehwild", slug: "rehwild" },
        { name: "Schwarzwild", slug: "schwarzwild" },
        { name: "Muffelwild", slug: "muffelwild" },
        { name: "Gamswild", slug: "gamswild" },
        { name: "Steinwild", slug: "steinwild" },
        { name: "Sikawild", slug: "sikawild" },
      ],
    },

    {
      title: "Raubwild",
      items: [
        { name: "Fuchs", slug: "fuchs" },
        { name: "Dachs", slug: "dachs" },
        { name: "Waschbär", slug: "waschbaer" },
        { name: "Marderhund", slug: "marderhund" },
        { name: "Steinmarder", slug: "steinmarder" },
        { name: "Baummarder", slug: "baummarder" },
        { name: "Iltis", slug: "iltis" },
        { name: "Hermelin", slug: "hermelin" },
        { name: "Mauswiesel", slug: "mauswiesel" },
        { name: "Wildkatze", slug: "wildkatze" },
        { name: "Luchs", slug: "luchs" },
      ],
    },

    {
      title: "Niederwild (Hase, Kaninchen, Nagetiere)",
      items: [
        { name: "Feldhase", slug: "feldhase" },
        { name: "Schneehase", slug: "schneehase" },
        { name: "Wildkaninchen", slug: "wildkaninchen" },
        { name: "Nutria", slug: "nutria" },
        { name: "Bisam", slug: "bisam" },
        { name: "Biber", slug: "biber" },
        { name: "Eichhörnchen", slug: "eichhoernchen" },
      ],
    },

    {
      title: "Federwild – Hühner- & Raufußhühner",
      items: [
        { name: "Fasan", slug: "fasan" },
        { name: "Rebhuhn", slug: "rebhuhn" },
        { name: "Birkhuhn", slug: "birkhuhn" },
        { name: "Auerhuhn", slug: "auerhuhn" },
        { name: "Schneehuhn", slug: "schneehuhn" },
      ],
    },

    {
      title: "Federwild – Enten",
      items: [
        { name: "Stockente", slug: "stockente" },
        { name: "Krickente", slug: "krickente" },
        { name: "Pfeifente", slug: "pfeifente" },
        { name: "Spießente", slug: "spiessente" },
        { name: "Tafelente", slug: "tafelente" },
        { name: "Reiherente", slug: "reiherente" },
      ],
    },

    {
      title: "Federwild – Gänse",
      items: [
        { name: "Graugans", slug: "graugans" },
        { name: "Kanadagans", slug: "kanadagans" },
        { name: "Nilgans", slug: "nilgans" },
      ],
    },

    {
      title: "Federwild – Krähen & Tauben",
      items: [
        { name: "Rabenkrähe", slug: "rabenkraehe" },
        { name: "Nebelkrähe", slug: "nebelkraehe" },
        { name: "Elster", slug: "elster" },
        { name: "Eichelhäher", slug: "eichelhaeher" },
        { name: "Ringeltaube", slug: "ringeltaube" },
        { name: "Türkentaube", slug: "tuerkentaube" },
        { name: "Hohltaube", slug: "hohltaube" },
      ],
    },
  ];

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>
        
        <h1 style={styles.title}>Wildkunde – Alle jagdbaren Wildarten</h1>
        <p style={styles.sub}>
          Übersicht über alle jagdbaren Wildarten in Deutschland, Österreich und der Schweiz.
        </p>

        {kategorien.map((kat) => (
          <section key={kat.title} style={styles.categoryBox}>
            <h2 style={styles.categoryTitle}>{kat.title}</h2>

            <ul style={styles.list}>
              {kat.items.map((art) => (
                <li key={art.slug}>
                  <a
                    href={`/wildkunde/${art.slug}`}
                    style={styles.link}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "#f1eadb")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = "transparent")
                    }
                  >
                    {art.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
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
    marginBottom: "10px",
    color: "#1f2b23",
  },
  sub: {
    fontSize: "19px",
    marginBottom: "30px",
    color: "#4b4b4b",
  },

  categoryBox: {
    background: "#fff",
    borderRadius: "14px",
    padding: "22px 26px",
    marginBottom: "28px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    border: "1px solid #e2d9c9",
  },

  categoryTitle: {
    fontSize: "26px",
    marginBottom: "12px",
    color: "#1f2b23",
    borderBottom: "2px solid #caa53b",
    paddingBottom: "6px",
    display: "inline-block",
  },

  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  link: {
    fontSize: "18px",
    color: "#1f2b23",
    textDecoration: "none",
    padding: "8px 6px",
    borderRadius: "8px",
    transition: "0.2s",
  },
};
