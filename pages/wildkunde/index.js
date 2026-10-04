import { wildlifeCategories } from "../../lib/wildlife-catalog";
// pages/wildkunde/index.js
import LearningDiscovery from "../../components/LearningDiscovery";

export default function WildkundeIndex() {
  const kategorien = wildlifeCategories;

  return (
    <main style={styles.main}>
      <div style={styles.wrap}>
        
        <h1 style={styles.title}>Wildkunde – Artenübersicht</h1>
        <p style={styles.sub}>
          Arten und ihre Merkmale kennenlernen. Schutzstatus und Bejagbarkeit werden
          für Deutschland, Österreich und die Schweiz jeweils örtlich geprüft.
        </p>
        <LearningDiscovery category="Wildkunde" title="Wildtiere und ihren Jahreslauf verstehen" />

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
