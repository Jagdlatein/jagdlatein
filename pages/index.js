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

  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) => {
      document.cookie = `${n}=; Path=/; Max-Age=0; SameSite=None; Secure`;
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

          {/* BUTTONS */}
          <div style={styles.btnRow}>
            <Link href="/preise" style={styles.btnPrimary}>
              Jetzt freischalten
            </Link>
            <Link href="/login" style={styles.btnGhost}>
              Login
            </Link>
          </div>

          {/* UNTERE LINKS – UNTEREINANDER DEUTLICH SICHTBAR */}
          <div style={styles.linkColumn}>
            <Link href="/kurse" style={styles.linkItem}>Kurse</Link>
            <Link href="/quiz" style={styles.linkItem}>Quiz</Link>
            <Link href="/glossar" style={styles.linkItem}>Glossar</Link>
            <Link href="/ebook" style={styles.linkItem}>E-Book</Link>

            {loggedIn && (
              <button
                type="button"
                onClick={logout}
                style={{
                  ...styles.linkItem,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            )}
          </div>
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
  btnRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 28,
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

  /* NEUE SPALTEN-LINKS */
  linkColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    textAlign: "center",
    marginTop: 12,
  },

  linkItem: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1f2b23",
    textDecoration: "none",
  },
};
