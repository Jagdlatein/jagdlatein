// pages/login.js
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();

  // next kann string | string[] sein
  const nextUrl =
    (Array.isArray(router.query.next) ? router.query.next[0] : router.query.next) ||
    "/";

  // Falls nicht bezahlt: nach Login direkt zur Zahlung schicken.
  // Optional konfigurierbar über NEXT_PUBLIC_PAYMENT_URL (z.B. "/preise#paypal-subscribe-preise" oder kompletter https-Link)
  const PAYMENT_URL =
    process.env.NEXT_PUBLIC_PAYMENT_URL || "/preise#paypal-subscribe-preise";

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

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

      // Fehlermeldung → KEIN Redirect
      if (!data || data.success === false) {
        setMsg(data?.message || "Diese E-Mail ist nicht registriert.");
        setLoading(false);
        return;
      }

      // Login OK
      setMsg("Erfolgreich eingeloggt – Weiterleitung …");

      setTimeout(() => {
        // Wenn noch nicht bezahlt (und kein Admin): direkt zur Zahlung
        if (data && data.admin !== true && data.paid !== true) {
          // nextUrl als Rücksprung merken (optional)
          const base = String(PAYMENT_URL);
          const next = encodeURIComponent(String(nextUrl));

          // Query sauber vor einem evtl. Hash einfügen
          const hashIndex = base.indexOf("#");
          const hasHash = hashIndex >= 0;
          const beforeHash = hasHash ? base.slice(0, hashIndex) : base;
          const afterHash = hasHash ? base.slice(hashIndex) : "";

          const sep = beforeHash.includes("?") ? "&" : "?";
          window.location.href = `${beforeHash}${sep}next=${next}${afterHash}`;
          return;
        }

        // Full Reload → Middleware sieht Cookies sofort
        window.location.href = String(nextUrl);
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
        <div style={styles.card}>
          <h1 style={styles.title}>Willkommen zurück</h1>
          <p style={styles.subtitle}>Melde dich mit deiner E-Mail an</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Wird geprüft…" : "Einloggen"}
            </button>
          </form>

          {msg && <div style={styles.alert}>{msg}</div>}

          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>

          <a href="/" style={styles.backLink}>
            ← Zurück zur Startseite
          </a>
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
    padding: 20,
    background: "linear-gradient(180deg,#faf8f1,#efe7d5)",
  },
  card: {
    background: "#fff",
    padding: "36px 30px",
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Georgia, serif",
    color: "#1f2b23",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6c6458",
    marginBottom: 28,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #cfc7b6",
    fontSize: 16,
    background: "#faf8f1",
  },
  button: {
    background: "#caa53b",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    color: "#111",
    transition: "0.2s",
  },
  alert: {
    marginTop: 18,
    background: "#fff4e5",
    padding: "12px 14px",
    borderRadius: 12,
    fontSize: 15,
    color: "#8a5a1f",
    border: "1px solid #f1d2a8",
  },
  logoutBtn: {
    marginTop: 22,
    padding: "10px 16px",
    background: "#fff",
    border: "2px solid #caa53b",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: "#1f2b23",
    cursor: "pointer",
  },
  backLink: {
    display: "block",
    marginTop: 18,
    fontSize: 15,
    color: "#1f2b23",
    textDecoration: "underline",
  },
};
