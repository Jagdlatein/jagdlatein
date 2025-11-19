// pages/login.js
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const nextUrl = router.query.next || "/"; // Seite nach Login

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------------------
  // LOGIN FUNKTION
  // -------------------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    if (!email.includes("@")) {
      setMsg("Bitte gültige E-Mail eingeben.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setMsg(data.message || "Login fehlgeschlagen.");
        setLoading(false);
        return;
      }

      setMsg("Erfolgreich eingeloggt – Weiterleitung …");

      setTimeout(() => {
        router.push(nextUrl);
      }, 600);
    } catch (err) {
      setMsg("Server nicht erreichbar. Bitte später erneut versuchen.");
    }

    setLoading(false);
  }

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <>
      <Head>
        <title>Login – Jagdlatein</title>
      </Head>

      <main style={styles.main}>
        <div style={styles.box}>

          <h1 style={styles.title}>Login</h1>
          <p style={styles.subtitle}>Melde dich an, um fortzufahren</p>

          {/* LOGIN FORMULAR */}
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Wird geprüft…" : "Einloggen"}
            </button>
          </form>

          {msg && <p style={styles.msg}>{msg}</p>}

          {/* ZURÜCK ZUR STARTSEITE */}
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a href="/" style={styles.backLink}>← Zurück zur Startseite</a>
          </div>

        </div>
      </main>
    </>
  );
}

// ------------------------------------------------------
// UI STYLES — moderner, klarer, Startseiten-Stil
// ------------------------------------------------------
const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg,#faf8f1,#f4efe3)",
    padding: 20,
  },
  box: {
    background: "rgba(255,255,255,0.95)",
    padding: "32px 28px",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    border: "1px solid #e9e1cd",
  },
  title: {
    fontSize: 34,
    marginBottom: 8,
    textAlign: "center",
    color: "#1f2b23",
    fontFamily: "Georgia, serif",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6c6458",
    marginBottom: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #c9c3b8",
    fontSize: 16,
  },
  button: {
    background: "#caa53b",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    color: "#111",
  },
  msg: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 15,
  },
  backLink: {
    fontSize: 16,
    color: "#1f2b23",
    textDecoration: "underline",
  },
};
