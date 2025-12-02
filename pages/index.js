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

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
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

          {/* OBERSTE BUTTONS – FREISCHALTEN / LOGIN / WHATSAPP / INSTAGRAM */}
          <div style={styles.btnRow}>

            <Link href="/preise" style={styles.btnPrimary}>
              Jetzt freischalten
            </Link>

            <Link href={`/login?next=/`} style={styles.btnGhost}>
              Login
            </Link>

            {/* 🟡 WHATSAPP ICON GOLD */}
            <a
              href="https://whatsapp.com/channel/0029VbBQe6jD8SDpuh6q2y2v"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.iconButton}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="#111"
                style={{ display: "block" }}
              >
                <path d="M12 2C6.5 2 2 6.3 2 11.7c0 2.1.7 4 2 5.6L2 22l4.9-1.9c1.5.8 3.2 1.2 5 1.2 5.5 0 10-4.3 10-9.7S17.5 2 12 2zm4.6 13.8c-.2.6-1.1 1.1-1.5 1.2-.4.1-.9.1-1.5-.1-.3-.1-.7-.2-1.2-.5-2.1-1-3.4-2.8-3.6-3-.2-.3-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .4.3.1.3.5 1.3.6 1.4.1.1.1.2 0 .4-.1.2-.2.3-.3.5-.1.1-.2.2-.3.3-.1.1-.2.2-.1.4.1.2.5.8 1.1 1.3.8.7 1.4.9 1.6 1 .2.1.3.1.4 0 .1-.1.5-.6.6-.8.1-.2.3-.2.4-.1.2.1 1.3.6 1.5.7.2.1.3.1.4.2.1.1.1.6-.1 1.2z"/>
              </svg>
            </a>

            {/* 🟡 INSTAGRAM ICON GOLD */}
            <a
              href="https://instagram.com/jagdlatein"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.iconButton}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="#111"
                style={{ display: "block" }}
              >
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.4.5.6.3 1 .6 1.5 1.1.5.5.8.9 1.1 1.5.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.4-.3.6-.6 1-1.1 1.5-.5.5-.9.8-1.5 1.1-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.4-.5-.6-.3-1-.6-1.5-1.1-.5-.5-.8-.9-1.1-1.5-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.4.3-.6.6-1 1.1-1.5.5-.5.9-.8 1.5-1.1.5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2zm0 3.3a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm7.1-.5a1.5 1.5 0 1 0-3.1 0 1.5 1.5 0 0 0 3.1 0z"/>
              </svg>
            </a>

          </div>

          {/* UNTERE KLEINERE GOLD-BUTTONS */}
          <div style={styles.linkColumn}>
            <Link href="/kurse" style={styles.linkButton}>Kurse</Link>
            <Link href="/quiz" style={styles.linkButton}>Quiz</Link>
            <Link href="/glossar" style={styles.linkButton}>Glossar</Link>
            <Link href="/ebook" style={styles.linkButton}>E-Book</Link>
            <Link href="/jagdbuch" style={styles.linkButton}>Jagdbuch</Link>
            <Link href="/jagdpraxis" style={styles.linkButton}>Jagdpraxis</Link>
            <Link href="/jagdrecht" style={styles.linkButton}>Jagdrecht</Link>
          </div>

          {/* LOGOUT BUTTON */}
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
    alignItems: "center",
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

  /* GOLDENE ICON BUTTONS */
  iconButton: {
    background: "#caa53b",
    border: "2px solid #b89532",
    padding: "12px 14px",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
    width: 52,
    height: 52,
    boxShadow: "0 3px 6px rgba(0,0,0,0.18)",
  },

  /* GOLD-BUTTONS UNTEN */
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
    padding: "10px 22px",
    borderRadius: 12,
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 16,
    display: "block",
    width: "100%",
    maxWidth: 220,
    margin: "0 auto",
  },

  /* LOGOUT BUTTON */
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
