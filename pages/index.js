// pages/index.js
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Jagdlatein – Lernplattform für Jäger</title>
      </Head>

      <main style={styles.main}>
        <div style={styles.wrap}>

          <h1 style={styles.title}>Jagdlatein</h1>

          <p style={styles.sub}>
            Lernen für Jagdschein und Praxis in Deutschland, Österreich & Schweiz
          </p>

          <div style={styles.btnRow}>
            <Link href="/preise" style={styles.btnPrimary}>
              Jetzt freischalten
            </Link>


            <Link href="/login" style={styles.btnGhost}>
              Login
            </Link>
          </div>

         <div style={styles.links}>
  <Link href="/quiz">Quiz</Link> ·{" "}
  <Link href="/glossar">Glossar</Link> ·{" "}
 <Link href="/logout">Logout</Link>
</div>


        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    background: "linear-gradient(180deg,#faf8f1,#f4efe3)",
    padding: "45px 16px 80px",
    minHeight: "100vh",
  },
  wrap: { maxWidth: 860, margin: "0 auto" },
  title: {
    fontSize: 44,
    fontWeight: 800,
    margin: "0 0 14px",
    lineHeight: 1.1,
    color: "#1a1a1a",
  },
  sub: {
    fontSize: 19,
    color: "#4b4b4b",
    maxWidth: 600,
    margin: "0 0 26px",
  },
  btnRow: { display: "flex", gap: 14, flexWrap: "wrap" },

  // NEUER E-BOOK BUTTON (gleiches Format wie andere)
  btnBook: {
    background: "#2b6e3e",
    color: "white",
    padding: "14px 26px",
    borderRadius: 14,
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 17,
  },

  btnPrimary: {
    background: "#caa53b",
    color: "#111",
    padding: "14px 26px",
    borderRadius: 14,
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 17,
  },
  btnGhost: {
    background: "#fff",
    border: "2px solid #ddd",
    color: "#111",
    padding: "14px 26px",
    borderRadius: 14,
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 17,
  },
  links: {
    marginTop: 26,
    fontSize: 16,
    color: "#555",
  },
};

