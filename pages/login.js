// pages/login.js
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return setMsg("Bitte E-Mail eingeben");

    const r = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: clean }),
    });

    const data = await r.json();
    console.log("LOGIN RESULT:", data);

    if (data.ok && data.hasAccess) {
      localStorage.setItem("jl_email", clean);
      window.location.href = "/quiz";
    } else {
      setMsg("Kein Zugang gefunden. Zahlung korrekt abgeschlossen?");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      <p>Gib die E-Mail ein, mit der du bezahlt hast.</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1rem" }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#e6c45e",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Einloggen
        </button>
      </form>

      {msg && <p style={{ marginTop: "1rem", color: "red" }}>{msg}</p>}
    </div>
  );
}
