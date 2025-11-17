import { useState } from "react";
import Head from "next/head";
import styles from "../styles/Login.module.css";
import { setCookie } from "../utils/cookies";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkAccess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data?.hasAccess) {
        // -----------------------------
        // COOKIES SETZEN (wie bisher)
        // -----------------------------
        setCookie("jl_session", "1");
        setCookie("jl_paid", "1");
        setCookie("jl_email", encodeURIComponent(email));

        // -----------------------------
        // LOCALSTORAGE SETZEN (Variante A – FIX)
        // -----------------------------
        if (typeof window !== "undefined") {
          localStorage.setItem("jagdlatein_email", email);
          localStorage.setItem("jagdlatein_access", "true");
        }

        setMsg("Erfolg: Zugang aktiv – bitte warten …");

        // Weiterleiten
        setTimeout(() => {
          window.location.href = "/quiz";
        }, 500);

      } else {
        setMsg("Fehler: Kein Zugang gefunden");
      }

    } catch (err) {
      setMsg("Serverfehler – bitte später erneut versuchen");
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login – Jagdlatein</title>
      </Head>

      <div className={styles.container}>
        <h1>Zugang prüfen</h1>

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="E-Mail eingeben"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Prüfe…" : "Login"}
          </button>

        </form>

        {msg && <p className={styles.message}>{msg}</p>}
      </div>
    </>
  );
        }
