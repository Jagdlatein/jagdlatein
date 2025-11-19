// pages/login.js
import { useEffect, useState } from "react";
import Head from "next/head";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const messageFromURL = params.get("msg");
    if (messageFromURL) {
      setMsg(messageFromURL);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    if (!email.includes("@")) {
      setMsg("Bitte eine gültige E-Mail eingeben.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data.message || "Login fehlgeschlagen.");
        setLoading(false);
        return;
      }

      setMsg("Login erfolgreich! Weiterleitung…");

      setTimeout(() => {
        window.location.href = data.redirect || "/";
      }, 800);
    } catch (error) {
      setMsg("Verbindungsfehler. Bitte später erneut versuchen.");
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

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="E-Mail eingeben"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Wird geprüft…" : "Login"}
            </button>
          </form>

          {msg && (
            <p style={styles.msg}>
              {msg}
            </p>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(180deg,#faf8f1,#f4efe3)",
    padding: 20,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    padding: "28px 24px",
    borderRadius: 16,
    boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    marginBottom: 20,
    fontFamily: "Georgia, serif",
    color: "#1f2b23",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    padding: "14px 18px",
    fontSize: 18,
    fontWeight: 700,
    background: "#caa53b",
    color: "#111",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
  },
  msg: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 15,
  },
};
