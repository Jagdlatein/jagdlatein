// pages/login.js
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const nextUrl = router.query.next || "/";

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------
  // 🔥 KORREKTER LOGOUT — über API (löscht HttpOnly Cookies)
  // ---------------------------------------------------
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

  // ---------------------------------------------------
  // LOGIN FUNKTION
  // ---------------------------------------------------
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

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Wird geprüft…" : "Einloggen"}
            </button>
          </form>

          {/* MELDUNG */}
          {msg && <p style={styles.msg}>{msg}</p>}

          {/* LOGOUT BUTTON */}
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>

          {/* ZURÜCK */}
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <a href="/" style={styles.backLink}>← Zurück zur Startseite</a>
          </div>

        </div>
      </main>
    </>
  );
}

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
    background: "white",
    padding: "32px 28px",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
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
  logoutBtn: {
    marginTop: 24,
    padding: "10px 20px",
    background: "#fff",
    border: "2px solid #caa53b",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    color: "#1f2b23",
    cursor: "pointer",
    display: "block",
    width: "100%",
    maxWidth: 220,
    marginLeft: "auto",
    marginRight: "auto",
  },
  backLink: {
    fontSize: 16,
    color: "#1f2b23",
    textDecoration: "underline",
  },
};
