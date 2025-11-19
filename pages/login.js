// pages/login.js
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const nextUrl = router.query.next || "/"; // Ziel nach Login

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------------------
  // LOGOUT FUNKTION (NEU)
  // ------------------------------
  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) => {
      document.cookie = `${n}=; Path=/; Max-Age=0; SameSite=None; Secure`;
    });
    window.location.replace("/");
  }

  // ------------------------------
  // LOGIN FUNKTION
  // ------------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    if (!email.includes("@")) {
      setMsg("Bitte eine gültige E-Mail eingeben.");
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

      setMsg("Erfolgreich eingeloggt. Weiterleitung …");

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

          {/* LOGIN FORMULAR */}
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Wird geprüft…" : "Einloggen"}
            </button>
          </form>

          {/* MELDUNGEN */}
          {msg && <p style={styles.msg}>{msg}</p>}

          {/* LOGOUT BUTTON (NEU) */}
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={logout}
              style={styles.logoutButton}
            >
              Logout
            </button>
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
    padding: "30px 26px",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    textAlign: "center",
    color: "#1f2b23",
    fontFamily: "Georgia, serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #ccc",
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
    marginTop: 16,
    fontSize: 15,
  },

  // ------------------------------
  // LOGOUT BUTTON STYLE (NEU)
  // ------------------------------
  logoutButton: {
    background: "#fff",
    border: "2px solid #caa53b",
    padding: "10px 20px",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    color: "#1f2b23",
    cursor: "pointer",
  },
};
