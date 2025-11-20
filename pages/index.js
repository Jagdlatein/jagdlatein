// pages/index.js
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const s = !!getCookie("jl_session");
    setLoggedIn(s);
  }, []);

  // FUNKTIONIERENDER LOGOUT
  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((name) => {
      document.cookie = `${name}=; Path=/; Max-Age=0`;
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=None; Secure`;
    });

    window.location.replace("/");
  }

  return (
    <>
      <Head>
        <title>Jagdlatein – Lernplattform für Jäger</title>
      </Head>

      <main style={styles.main}>
        <div style={styles.wrap}>

          {/* TITEL */}
          <h1 style={styles.title}>Jagdlatein</h1>

          <p style={styles.sub}>
            Lernen für Jagdschein und Praxis in Deutschland, Österreich &amp; Schweiz
          </p>

          {/* OBERSTE BUTTONS */}
          <div style={styles.btnRow}>
            <Link href="/preise" style={styles.btnPrimary}>
              Jetzt freischalten
            </Link>
            <Link href={`/login?next=/`} style={styles.btnGhost}>
              Login
            </Link>
          </div>

          {/* UNTERE BUTTON-LISTE — KLEINER, GOLD */}
          <div style={styles.linkColumn}>
            <Link href="/kurse" style={styles.linkButton}>Kurse</Link>
            <Link href="/quiz" style={styles.linkButton}>Quiz</Link>
            <Link href="/glossar" style={styles.linkButton}>Glossar</Link>
            <Link href="/ebook" style={styles.linkButton}>E-Book</Link>
          </div>

          {/* LOGOUT BUTTON UNTEN */}
          {loggedIn && (
            <button onClick={logout} style={styles.logoutButton}>
              Logout
            </button>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    background: "linear-gradient(180deg,#faf8f1,#f4efe3)",
    padding: "45px 16px 40px",
    minHeight: "100vh",
  },
  wrap: {
    maxWidth: 860,
    margin: "0 auto",
  },
  title: {
    fontSize: 44,
    fontWeight: 800,
    margin: "0 0 14px",
    lineHeight: 1.1,
    color: "#1f2b23",
  },
  sub: {
    fontSize: 19,
    color: "#4b4b4b",
    maxWidth: 600,
    margin: "0 0 26px",
  },

  /* OBERSTE BUTTONS */
  btnRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 26,
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

  /* UNTERE KLEINERE GOLD-BUTTONS */
  linkColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    textAlign: "center",
    marginTop: 20,
  },

  linkButton: {
    background: "#caa53b",
    color: "#111",
    padding: "10px 22px",   // kleiner
    borderRadius: 12,       // kleiner
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 16,           // kleiner
    display: "block",
    width: "100%",
    maxWidth: 220,
    margin: "0 auto",
  },

  /* LOGOUT BUTTON UNTEN */
  logoutButton: {
    background: "#fff",
    border: "2px solid #caa53b",
    padding: "10px 20px",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    color: "#1f2b23",
    cursor: "pointer",
    display: "block",
    width: "100%",
    maxWidth: 220,
    margin: "18px auto 0 auto",
    textAlign: "center",
  },
};
